import axios from 'axios';
import fs from 'fs';
import {log} from './util.mjs'
import 'dotenv/config';

const API_URL = 'https://generativelanguage.googleapis.com/v1beta';
const API_KEY = process.env.GOOGLE_API_KEY;
const BATCH_NAME = 'BatchJob-001';

async function createBatch() {
    const fileBody = fs.readFileSync('requests.jsonl', 'utf-8');


    const batchRequest = {
        displayName: BATCH_NAME,
        inputConfig: {
            gcsSource: { uri: "gs://your-bucket/requests.jsonl" }
        }
    };

    const config = {headers: { 'x-goog-api-key': API_KEY, 'Content-Type': 'application/json' }};

    const resp = await axios.post(API_URL + '/models/gemini-2.5-flash:batchGenerateContent', batchRequest, config);

    return resp.data.name; // вида batches/{batchId}
}

async function main() {
    await createBatch();

}
await main();