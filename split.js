import 'dotenv/config';
import fs from "fs";
import * as DB from './util_db.mjs'
import * as UTIL from './util.mjs'

const MAX_BLOCK_SIZE = process.env.MAX_BLOCK_SIZE;
const BOOK_FILE = process.env.BOOK_FILE;
const BOOK_NAME = process.env.BOOK_NAME;

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

function makeBookBlocks() {
    let text = fs.readFileSync(BOOK_FILE, 'utf8');
    text = normalizeWhitespace(text);

    const blocks = splitTextBySentences(text, MAX_BLOCK_SIZE);

    blocks.forEach((block, index) => {
        const blockIndex = index + 1;
        const blockFilePath = UTIL.getBookBlockPath(BOOK_NAME, blockIndex);

        fs.writeFileSync(blockFilePath, block, "utf8");
        const blockId = DB.addBookBlock(BOOK_NAME, blockIndex, block.length);

        console.log(`Inserted ID: ${blockId} | ${blockFilePath} | (${block.length} chars)`);
    });
}

makeBookBlocks();