import {addApiKey} from "../services/db.js";

export function runSeed() {
    const apiKeys = [
        {"apiKey": process.env.GEMINI_API_KEY, "name": "key_0001"},
    ];

    apiKeys.forEach(item => {
        const id = addApiKey(item.name, item.apiKey);

        console.log(`Added id=${id}, apiKey=${item.apiKey}`);
    });
}