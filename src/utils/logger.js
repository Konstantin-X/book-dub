import chalk from "chalk";
import fs from "fs";
import path from "path";

const now = new Date();
const dateStr = now.toISOString().split("T")[0];
const LOG_FILE = path.join(path.dirname(''), 'logs/' + dateStr +'.txt');

export function log(message, level = "info") {
    const timeStr = new Date().toLocaleTimeString("ru-RU", {hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit"});
    let messageStr = message;

    if (typeof message === "object") {
        messageStr = JSON.stringify(message, null, 2);
        console.log(' - JSON: ');
        console.log(message);
        console.log(' ------------------------------------------- JSON');
    }

    switch (level) {
        case 'error':
            console.log(timeStr, chalk.red('[ERRO]'), messageStr);break;
        case 'warn':
            console.log(timeStr, chalk.yellow('[WARN]'), messageStr); break;
        default:
            console.log(timeStr, chalk.blue('[INFO]'), messageStr);
    }

    let logMessage = `[${timeStr}]: ${messageStr}`;

    fs.appendFileSync(LOG_FILE, logMessage + "\n", (err) => {
        if (err) {
            console.error('Write log-file failed:', err);
        }
    });
}

export function logError(message) {
    log(message, "error");
}