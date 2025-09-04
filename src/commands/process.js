import fs from "fs/promises";
import path from "path";
import { initDb, getNextChunk, updateStatus } from "../services/db.js";
import { sendToApi } from "../services/apiService.js";
import { log } from "../utils/logger.js";

export async function runProcess() {
    const db = initDb();
    const chunk = getNextChunk(db);

    if (!chunk) {
        log("No chunks to process");
        return;
    }

    try {
        updateStatus(db, chunk.id, "process");

        const content = await fs.readFile(chunk.filename, "utf8");
        const result = await sendToApi(content);

        const outFile = path.join(
            path.dirname(chunk.filename),
            `result_${path.basename(chunk.filename)}`
        );
        await fs.writeFile(outFile, result, "utf8");

        updateStatus(db, chunk.id, "done");
        log(`Processed chunk ${chunk.id}, saved to ${outFile}`);
    } catch (err) {
        updateStatus(db, chunk.id, "error");
        console.error(`Error processing chunk ${chunk.id}:`, err.message);
    }
}
