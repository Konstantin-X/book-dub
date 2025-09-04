import dotenv from "dotenv";
import path from "path";

dotenv.config();

export const config = {
    inputEpub: process.env.INPUT_EPUB || "input.epub",
    outputTxt: process.env.OUTPUT_TXT || "output.txt",
    chunksDir: process.env.CHUNKS_DIR || "./chunks",
    chunkPattern: process.env.CHUNK_PATTERN || "chunk_{index}.txt",
    apiUrl: process.env.API_URL || "http://localhost:3000/api",
};
