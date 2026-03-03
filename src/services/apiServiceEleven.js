import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import fs from "fs";
import {pipeline, Readable} from 'stream';
import { promisify } from 'util';
import * as DB from "../services/db.js";
import {log, logError} from "../utils/logger.js";
import { sleep } from "../utils/common.js";
import { getBlockPath, getBlockAudioPath } from "../services/fileService.js";

const streamPipeline = promisify(pipeline);

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;

const MODEL_ID = "eleven_flash_v2_5";
//const MODEL_ID = "eleven_turbo_v2_5";

const OUTPUT_FORMAT = "opus_48000_32";
//const OUTPUT_FORMAT = "opus_48000_128";
//const OUTPUT_FORMAT = "mp3_44100_32";
//const OUTPUT_FORMAT = "mp3_44100_128";

function successLog(block, length) {
    log('---------------------------------------------------------------------------');
    log(`< BOOK: ${block.title} | Block: ${block.id} | Token: ...${API_KEY.slice(-10)} | File: ${block.number}`);
    log(`  symbols:              ${length}`);
    log('---------------------------------------------------------------------------');

    DB.blockInfo(block.id, 'promptTokenCount: ' + length);
}

function failLog(errMsg, block = null) {
    if (block) {
        DB.blockError(block.id, errMsg);

        errMsg += ` | Id = ${block.id}`;
    }

    logError('!!! ERROR: ' + errMsg );
    logError('---------------------------------------------------------------------------');
}

async function processTextForTTS(block) {
    const inputFile = getBlockPath(block.title, block.number);
    const audioFile = getBlockAudioPath(block.title, block.number)
    const text = fs.readFileSync(inputFile, 'utf8');

    if (text.length === 0) {
        failLog('empty content', block);

        return;
    }

    log(`> BOOK: ${block.title} | Block: ${block.id} | Token: ...${API_KEY.slice(-10)} | File: ${block.number}`);

    DB.updateApiKeyUses(API_KEY);

    const client = new ElevenLabsClient();
    const response = await client.textToSpeech.convert(VOICE_ID, {
        outputFormat: OUTPUT_FORMAT,
        text: text,
        modelId: MODEL_ID,
        voice_settings: {speed: 1.5},
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    await streamPipeline(Readable.fromWeb(response.body), fs.createWriteStream(audioFile));

    successLog(block, text.length);
}

export async function fetchWithRetry(block, retries = 1) {
    for (let i = 0; i < retries; i++) {
        try {
            await processTextForTTS(block);

            //return true;
            return false;
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