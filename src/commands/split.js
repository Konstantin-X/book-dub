import { splitFileIntoChunks } from "../services/fileService.js";
import { initDb, insertChunk } from "../services/db.js";
import { log } from "../utils/logger.js";

export async function runSplit(txtFile, outDir) {
    try {
        const db = initDb();
        const chunks = await splitFileIntoChunks(txtFile, outDir, 1000);

        for (const chunk of chunks) {
            insertChunk(db, {
                filename: chunk.filename,
                content_length: chunk.length,
                status: "new",
            });
        }

        log(`Split done. Saved ${chunks.length} chunks into ${outDir}`);
    } catch (err) {
        console.error("Error:", err.message);
    }
}
