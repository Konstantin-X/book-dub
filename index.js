import 'dotenv/config';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { log, sleep } from './util.mjs';
import * as DB from './util_db.mjs';
import * as UTIL from "./util.mjs";

const INPUT_PROMPT_PREFIX = 'Read aloud in a warm and friendly tone at 150% speed: ';

function failLog(errMsg, block = null) {
    if (block) {
        DB.blockError(block.id, errMsg);

        errMsg += ` | Id = ${block.id}`;
    }

    log('!!! ERROR: ' + errMsg );
    log('---------------------------------------------------------------------------');
}

function successLog(block, response, length) {
    log('---------------------------------------------------------------------------');
    log(`< BOOK: ${block.title} | Block: ${block.id} | Token: ...${process.env.GEMINI_API_KEY.slice(-10)}`);
    log(`  symbols:              ${length}`);
    log('  promptTokenCount:     ' + response.usageMetadata.promptTokenCount);
    log('  candidatesTokenCount: ' + response.usageMetadata.candidatesTokenCount);
    log('  totalTokenCount:      ' + response.usageMetadata.totalTokenCount);
    log('---------------------------------------------------------------------------');

    DB.blockInfo(block.id, 'promptTokenCount: ' + response.usageMetadata.promptTokenCount);
    DB.blockInfo(block.id, 'candidatesTokenCount: ' + response.usageMetadata.candidatesTokenCount);
    DB.blockInfo(block.id, 'totalTokenCount: ' + response.usageMetadata.totalTokenCount);
}

function parseErrorJSON(jsonString){
    try {
        const errObj = JSON.parse(jsonString);
        return `${errObj.error.details[0].violations[0].quotaId}: ${errObj.error.details[0].violations[0].quotaValue}`;
    } catch (e) {
        return jsonString;
    }
}

async function processTextForTTS(block) {
    const inputFile = UTIL.getBookBlockPath(block.title, block.block_id);
    const text = fs.readFileSync(inputFile, 'utf8');

    if (text.length === 0) {
        failLog('empty content', block);

        return;
    }

    log(`> BOOK: ${block.title} | Block: ${block.id} | Token: ...${process.env.GEMINI_API_KEY.slice(-10)}`);

    DB.updateApiKeyUses(process.env.GEMINI_API_KEY);

    const ai = new GoogleGenAI({httpOptions: {timeout: 360_000}});
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: INPUT_PROMPT_PREFIX + text }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Orus'}}},
        },
    });

    successLog(block, response, text.length);

    const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const fileName = UTIL.getBookBlockAudioPath(block.title, block.block_id)
    await UTIL.saveWaveFile(fileName, base64Data);
}

async function fetchWithRetry(block, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await processTextForTTS(block);

            return true;
        } catch (e) {
            const attemptStr = `[attempt ${i + 1}]`;

            console.error(`❌ Error on ID: ${block.id}, ${attemptStr}`);

            if (e.code === 'ENOENT') {
                failLog(`${attemptStr}: ${e.message}`, block);

                return true;
            }

            if (e.status === 429) {
                const errMsg = parseErrorJSON(e.message);
                failLog(`${attemptStr}: ${errMsg}`, block);

                return false;
            }

            if (e.status === 500) {
                console.log(e);
                const errMsg = parseErrorJSON(e.message);
                failLog(`${attemptStr}: ${errMsg}`, block);

                return true;
            }

            if (i === retries - 1) {
                failLog(`${attemptStr}: ${e.message}`, block);

                return false;
            }

            failLog(`${attemptStr}: ${e.message}`, block);

            await sleep(10000);
        }
    }
}

async function worker(workerId) {
    let isWork = true;

    log(`[Worker ${workerId}] spawn`);

    while (isWork) {
        const block = DB.getNextBookBlock();

        if (!block) {
            log('No more blocks to process');
            break;
        }

        DB.updateBookBlock(block.id, 'process' ,'process');

        log(`Worker ${workerId} > Block: ${block.id}`);

        try {
            isWork = await fetchWithRetry(block);

            if (isWork) {
                DB.blockDone(block.id, 'done');
            } else {
                DB.blockDoneWithError(block.id);
            }
        } catch (e) {
            log(`Worker ${workerId} > ERROR: Final fail for Id = ${block.id}`);

            DB.updateBookBlock(block.id, 'error', 'ERROR: ' + e.message);
        }
    }

    log(`[Worker ${workerId}] down`);
}

async function main() {
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

await main();