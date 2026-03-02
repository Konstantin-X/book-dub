import 'dotenv/config';
import fs from "fs";
import path from "path";
import { Lame } from "node-lame";
import wav from "wav";

const now = new Date();
const dateStr = now.toISOString().split("T")[0];
const LOG_FILE = path.join(path.dirname(''), 'logs/' + dateStr +'.txt');

const currentPath = process.env.PATH;
const lamePath = process.env.LAME_PATH;
process.env.PATH = `${currentPath};${lamePath}`;

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
    //fs.writeFileSync('block64.txt', pcmData, "utf8");

    const audioBuffer = Buffer.from(pcmData, 'base64');
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    await new Promise((resolve, reject) => {
        const writer = new wav.FileWriter(filePath, {
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        writer.on('error', reject);
        writer.on('finish', resolve);

        writer.write(audioBuffer);
        writer.end();
    });

    //await saveMp3File(filePath);
}

export async function saveMp3File(filePath) {
    const encoder = new Lame({
        output: filePath.replace('.wav', '.mp3'),
        bitrate: 96,
        scale: 6,
    }).setFile(filePath);

    encoder.encode()
        .then(() => {
            log("PCM data successfully converted to MP3!");
        })
        .catch((error) => {
            log("Error: during MP3 encoding: " + error);
        });
}

async function convertMP3() {
    const dirName = 'book_audios/vnuk_petra-2';
    await fs.readdir(dirName, { withFileTypes: true }, (err, data) => {
        if (err) throw err;

        const wavFiles = data
            .filter(entry => entry.isFile() && entry.name.endsWith('.wav'))
            .map(entry => entry.name);

        wavFiles.forEach(fileName => {
            saveMp3File(dirName + '/' + fileName);
        });
    });
}

export async function saveMp3Buffer(filePath, pcmData) {
    const audioBuffer = Buffer.from(pcmData, 'base64');
    const dirPath = path.dirname(filePath);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    const encoder = new Lame({
        output: filePath,
        raw: true,
        quality: 0,
        //lowpass: 21,
        //"lowpass-width": 80,
        sfreq: 12,
        bitrate: 96,
        resample: 24,
        scale: 6,
    }).setBuffer(audioBuffer);

    encoder.encode()
        .then(() => {
            console.log("PCM data successfully converted to MP3!");
        })
        .catch((error) => {
            console.error("Error during MP3 encoding:", error);
        });
}

//await convertMP3();

async function saveWavFileRun(){
    const pcmData = fs.readFileSync('block64.txt', "utf8");

    await saveWaveFile('block64.wav', pcmData);
}

//await saveWavFileRun();