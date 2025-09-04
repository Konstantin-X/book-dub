import fs from "fs/promises";
import Epub from "epub2";

export async function extractEpub(epubFile, outTxt) {
    const epub = new Epub(epubFile);
    await epub.parse();
    const text = epub.flow.map(ch => ch.content).join("\n\n");
    await fs.writeFile(outTxt, text, "utf8");
}
