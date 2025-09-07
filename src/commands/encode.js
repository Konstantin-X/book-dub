import {convertMp3files} from "../services/fileService.js";
import {logError} from "../utils/logger.js";

export async function runEncode() {
    try {
        await convertMp3files();
    } catch (e) {
        logError("Error: ", e.message);
    }
}