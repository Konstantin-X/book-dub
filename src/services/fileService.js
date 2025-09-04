import fs from "fs/promises";
import path from "path";

export async function splitFileIntoChunks(txtFile, outDir, size) {
    const text = await fs.readFile(txtFile, "utf8");
    const chunks = [];
    let index = 1;

    for (let i = 0; i < text.length; i += size) {
        const chunk = text.slice(i, i + size);
        const filename = path.join(outDir, `chunk_${index}.txt`);
        await fs.writeFile(filename, chunk, "utf8");
        chunks.push({ filename, length: chunk.length });
        index++;
    }

    return chunks;
}
