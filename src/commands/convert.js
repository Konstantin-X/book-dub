import { extractEpub } from "../services/epubService.js";
import { log } from "../utils/logger.js";

export async function runConvert(epubFile, outTxt) {
    try {
        await extractEpub(epubFile, outTxt);
        log(`Converted: ${epubFile} → ${outTxt}`);
    } catch (err) {
        console.error("Error:", err.message);
    }
}
