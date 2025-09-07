import { extractEpub } from "../services/epubService.js";
import { logError } from "../utils/logger.js";
import path from "path";

const SRC_FILE = process.env.SRC_FILE;

export async function runConvert() {
    try {
        const extension = path.extname(SRC_FILE).toLowerCase();

        switch (extension) {
            case '.epub':
                await extractEpub(SRC_FILE);
                break;

            case '.fb2':
                //await extractFB2();
                //break;

            default:
                throw new Error(`Unsupported file extension: ${extension}`);
        }
    } catch (e) {
        logError("Error: " + e.message);
    }
}
