import fs from "fs";
import { EPub } from "epub2";
import path from "path";
import {convert} from "html-to-text";
import { log } from "../utils/logger.js";

export const EPUB_DIR = path.join(path.dirname(''), 'book_files/epubs/');
export const TEXT_DIR = path.join(path.dirname(''), 'book_files/texts/');

function stripHtmlTags(htmlString) {
    return convert(htmlString);
}

function extractEpubText(filePath) {
    return new Promise((resolve, reject) => {
        const epub = new EPub(filePath);
        const textParts = [];

        epub.on('end', async () => {
            try {
                for (const chapter of epub.flow) {
                    const html = await new Promise((res, rej) => {
                        epub.getChapter(chapter.id, (error, chapterText) => {
                            if (error) rej(error);
                            else res(chapterText);
                        });
                    });

                    const cleanText = stripHtmlTags(html);
                    textParts.push(cleanText);
                }

                const fullText = textParts.join('\n\n');

                resolve(fullText);
            } catch (error) {
                reject(error);
            }
        });

        epub.on('error', reject);
        epub.parse();
    });
}

export async function extractEpub(epubFile) {
    const bookText = await extractEpubText(EPUB_DIR + epubFile);
    const TEXT_FILE = TEXT_DIR + process.env.BOOK_NAME + ".txt";

    fs.writeFileSync(TEXT_FILE, bookText, "utf8");

    log('Convert completed: ' + TEXT_FILE);
}
