import fs from "fs";
import xml2js from "xml2js";
import path from "path";
import {convert} from "html-to-text";
import { log } from "../utils/logger.js";

export const BOOK_NAME = process.env.BOOK_NAME;
export const FB2_DIR = path.join(path.dirname(''), 'book_files/fb2/');
export const TEXT_DIR = path.join(path.dirname(''), 'book_files/texts/');

function stripHtmlTags(htmlString) {
    return convert(htmlString);
}

function extractFB2Text(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            const parser = new xml2js.Parser();

            parser.parseString(data, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }

                const body = result['FictionBook']['body'];
                let textContent = '';

                //console.log(JSON.stringify(body));

                if (body && body[0]['section']) {
                    body[0]['section'].forEach(section => {
                        console.log(JSON.stringify(section, null, 2));
                        console.log('-----------------------');
                        if (section['p']) {
                            section['p'].forEach(paragraph => {
                                textContent += paragraph + '\n\n';
                            });
                        }
                    });
                }

                resolve(textContent);
            });
        });
    });
}

export async function extractFB2() {
    const bookText = await extractFB2Text(FB2_DIR + BOOK_NAME + '.fb2');
    const bookFile = TEXT_DIR + BOOK_NAME + ".txt";

    fs.writeFileSync(bookFile, bookText, "utf8");

    log('Convert completed: ' + bookFile);
}
