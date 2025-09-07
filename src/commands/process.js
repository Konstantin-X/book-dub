import * as DB from "../services/db.js";
import {fetchWithRetry} from "../services/apiService.js";
import {log, logError} from "../utils/logger.js";
import { sleep } from "../utils/common.js";

async function worker(workerId) {
    let isWork = true;

    log(`[Worker ${workerId}] spawn`);

    while (isWork) {
        const block = DB.getNextBlock();

        if (!block) {
            log('No more blocks to process');
            break;
        }

        DB.updateBlock(block.id, 'process' ,'process');

        log(`Worker ${workerId} > Block: ${block.id}`);

        try {
            isWork = await fetchWithRetry(block);

            if (isWork) {
                DB.blockDone(block.id, 'done');
            } else {
                DB.blockDoneWithError(block.id);
            }
        } catch (e) {
            logError(`Worker ${workerId} > ERROR: Final fail for Id = ${block.id}`);

            DB.updateBlock(block.id, 'error', 'ERROR: ' + e.message);
        }
    }

    log(`[Worker ${workerId}] down`, 'warn');
}

export async function runProcess() {
    const workersCount = process.env.MAX_WORKER_COUNT;
    const promises = [];

    for (let i = 0; i < workersCount; i++) {
        promises.push(worker(i));

        if (i < workersCount - 1) {
            log("⏳ Waiting 100 sec before next worker...");

            await sleep(100_000);
        }
    }

    await Promise.all(promises);

    log("✅ All workers finished");
}
