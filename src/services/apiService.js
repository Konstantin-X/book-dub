import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import * as DB from "../services/db.js";
import {log, logError} from "../utils/logger.js";
import { sleep } from "../utils/common.js";
import {getBlockPath, getBlockAudioPath, saveAudioFile } from "../services/fileService.js";

const PROMPT_PREFIX = 'Read aloud in a warm and friendly tone at 150% speed: ';

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

function failLog(errMsg, block = null) {
    if (block) {
        DB.blockError(block.id, errMsg);

        errMsg += ` | Id = ${block.id}`;
    }

    logError('!!! ERROR: ' + errMsg );
    logError('---------------------------------------------------------------------------');
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
    const inputFile = getBlockPath(block.title, block.number);
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
        contents: [{ parts: [{ text: PROMPT_PREFIX + text }] }],
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Orus'}}},
        },
    });

    successLog(block, response, text.length);

    const base64Data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    const fileName = getBlockAudioPath(block.title, block.number)
    await saveAudioFile(fileName, base64Data);
}

export async function fetchWithRetry(block, retries = 3) {
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

