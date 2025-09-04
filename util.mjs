import 'dotenv/config';
import fs from "fs";
import path from "path";
import wav from "wav";

const now = new Date();
const dateStr = now.toISOString().split("T")[0];
const LOG_FILE = path.join(path.dirname(''), 'logs/' + dateStr +'.txt');

export const AUDIO_DIR = path.join(path.dirname(''), 'book_audios');
export const BLOCK_DIR = path.join(path.dirname(''), 'book_blocks');

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function getBookBlockPath(bookName, blockNumber) {
    return path.join(BLOCK_DIR, bookName + '/' + String(blockNumber).padStart(3, '0') + '.txt');
}

export function getBookBlockAudioPath(bookName, blockNumber) {
    return path.join(AUDIO_DIR, bookName + '/' + String(blockNumber).padStart(3, '0') + '.wav');
}

export function getNextBlockNumber() {
    const inFiles = fs.readdirSync(BLOCK_DIR).filter(f => f.endsWith(".txt")).sort();

    for (const inFile of inFiles) {
        const base = path.basename(inFile, ".txt");
        const outFile = path.join(AUDIO_DIR, base + ".wav");

        if (!fs.existsSync(outFile)) {
            return base;
        }
    }

    return null;
}

export function log(message) {
    const timeStr = new Date().toLocaleTimeString("ru-RU", {hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"});
    let messageStr = message;

    if (typeof message === "object") {
        messageStr = JSON.stringify(message, null, 2);
        console.log(' - JSON: ');
        console.log(message);
        console.log(' ------------------------------------------- JSON');
    }

    let logMessage = `[${timeStr}]: ${messageStr}`;

    if (messageStr.includes('--- EMPTY LINE ---')) {
        logMessage = '';
    }

    console.log(logMessage);

    fs.appendFile(LOG_FILE, logMessage + "\n", (err) => {
        if (err) {
            console.error('Write log-file failed:', err);
        }
    });
}

export async function saveWaveFile(
    filePath,
    pcmData,
    channels = 1,
    rate = 24000,
    sampleWidth = 2,
) {
    const audioBuffer = Buffer.from(pcmData, 'base64');
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    return new Promise((resolve, reject) => {
        const writer = new wav.FileWriter(filePath, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        writer.on('finish', resolve);
        writer.on('error', reject);

        writer.write(audioBuffer);
        writer.end();
    });
}