import { extractEpub } from "../services/epubService.js";
import { logError } from "../utils/logger.js";

export async function runConvert() {
    try {
        const extension = '.epub';

        switch (extension) {
            case '.epub':
                await extractEpub();
                break;

            case '.fb2':
                //await extractFB2();
                //break;

            default:
                throw new Error(`Unsupported file extension: ${extension}`);
        }
    } catch (e) {
        logError("Error: " + e.message);

        throw e;
    }
}
