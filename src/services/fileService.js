import fs from "fs";
import path from "path";
import wav from "wav";
import * as DB from "../services/db.js";
import {log, logError} from "../utils/logger.js";
import {Lame} from "node-lame";

export const AUDIO_DIR = path.join(path.dirname(''), 'book_audios/');
export const BLOCK_DIR = path.join(path.dirname(''), 'book_blocks/');

const TEXT_DIR = path.join(path.dirname(''), 'book_files/texts/');
const BOOK_NAME = process.env.BOOK_NAME;
const MAX_BLOCK_SIZE = process.env.MAX_BLOCK_SIZE;

const currentPath = process.env.PATH;
const lamePath = process.env.LAME_PATH;
process.env.PATH = `${currentPath};${lamePath}`;

export function getBlockPath(bookName, blockNumber) {
    return path.join(BLOCK_DIR, bookName + '/' + String(blockNumber).padStart(3, '0') + '.txt');
}

export function getBlockAudioPath(bookName, blockNumber) {
    return path.join(AUDIO_DIR, bookName + '/' + String(blockNumber).padStart(3, '0') + '.wav');
}

function normalizeWhitespace(text) {
    let t = text.replace(/\r\n?/g, "\n");
    t = t.replace(/\n{3,}/g, "\n\n");
    t = t.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
    t = t
        .split("\n\n")
        .map(s => s.replace(/[ \t]{2,}/g, " ").trim())
        .join("\n\n");

    return t.trim();
}

function splitTextBySentences(text, maxChunkSize) {
    const abbreviations = [
        "т.д.", "т.п.", "и т.д.", "и т.п.",
        "г.", "ул.", "д.", "стр.", "рис.",
        "им.", "см.", "пр.", "с.", "№"
    ];

    const sentences = [];
    let current = "";

    for (let i = 0; i < text.length; i++) {
        current += text[i];

        if (/[.!?]/.test(text[i])) {
            const tail = current.slice(-10).toLowerCase();
            const matchedAbbr = abbreviations.some(abbr => tail.endsWith(abbr));

            if (!matchedAbbr) {
                sentences.push(current.trim());
                current = "";
            }
        }
    }

    if (current.trim()) {
        sentences.push(current.trim());
    }

    const chunks = [];
    let chunk = "";

    for (const s of sentences) {
        if ((chunk + " " + s).length > maxChunkSize) {
            chunks.push(chunk.trim());
            chunk = s;
        } else {
            chunk += " " + s;
        }
    }

    if (chunk.trim()) chunks.push(chunk.trim());

    return chunks;
}

export async function splitFileIntoBlocks() {
    const textFile = TEXT_DIR + BOOK_NAME + ".txt";

    let text = fs.readFileSync(textFile, "utf8");
    text = normalizeWhitespace(text);

    const blocks = splitTextBySentences(text, MAX_BLOCK_SIZE);
    const dirPath = BLOCK_DIR + BOOK_NAME + '/';

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    blocks.forEach((block, index) => {
        const blockIndex = index + 1;
        const blockFilePath = getBlockPath(BOOK_NAME, blockIndex);

        fs.writeFileSync(blockFilePath, block, "utf8");
        const blockId = DB.addBlock(BOOK_NAME, blockIndex, block.length);

        log(`Inserted ID: ${blockId} | ${blockFilePath} | (${block.length} chars)`);
    });
}

export async function saveAudioFile(
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

async function saveMp3File(filePath) {
    const encoder = new Lame({
        output: filePath.replace('.wav', '.mp3'),
        bitrate: 96,
        scale: 6,
    }).setFile(filePath);

    encoder.encode()
        .then(() => {
            log(`${filePath} successfully converted to MP3!`);
        })
        .catch((error) => {
            logError(`Error: ${filePath} | during MP3 encoding: ` + error);
        });
}

export async function convertMp3files() {
    const dirName = AUDIO_DIR + BOOK_NAME;
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