import Parser_fb2 from "viva-parser-fb2";
import path from "path";
import {convert} from "html-to-text";
import fs from "fs";


// TODO: update for FB2
export const EPUB_FILE = process.env.EPUB_FILE;
export const TEXT_FILE = process.env.TEXT_FILE;
export const EPUB_DIR = path.join(path.dirname(''), 'book_files/epubs/');
export const TEXT_DIR = path.join(path.dirname(''), 'book_files/texts/');

function stripHtmlTagsWithDOMParser(htmlString) {
    return convert(htmlString);
}

function extractEpubText(filePath) {
    return new Promise((resolve, reject) => {
        const epub = new EPub(filePath);
        const textParts = [];

        epub.on('end', async () => {
            try {
                for (const chapter of epub.flow) {
                    const text = await new Promise((res, rej) => {
                        epub.getChapter(chapter.id, (error, chapterText) => {
                            if (error) rej(error);
                            else res(chapterText);
                        });
                    });

                    // Clean HTML tags
                    const cleanText = stripHtmlTagsWithDOMParser(text);
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

(async () => {
    try {
        const bookText = await extractEpubText(EPUB_DIR + EPUB_FILE);

        fs.writeFileSync(TEXT_DIR + TEXT_FILE, bookText + "\n", (err) => {
            if (err) {
                console.error('Write converted file failed:', err);
            }
        });

        console.log('Convert completed');
    } catch (error) {
        console.error('Error:', error);
    }
})();