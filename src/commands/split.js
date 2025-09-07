import { splitFileIntoBlocks } from "../services/fileService.js";

export async function runSplit() {
    try {
        await splitFileIntoBlocks();
    } catch (err) {
        console.error("Error:", err.message);
    }
}
