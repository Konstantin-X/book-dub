import Database from "better-sqlite3";
import path from "path";

const DB_FILE = path.resolve('blocks.db');
const db = new Database(DB_FILE);

export function addApiKey(name, apiKey) {
    const stmt = db.prepare(`
        INSERT INTO api_keys (name, value, uses)
        VALUES (?, ?, 0)
    `);

    const info = stmt.run(name, apiKey);

    return info.lastInsertRowid;
}

export function getApiKey() {
    return db.prepare("SELECT value FROM api_keys WHERE uses < ? LIMIT 1").get(MAX_USES_PER_DAY);
}

export function updateApiKeyUses(apiKey) {
    db.prepare(`UPDATE api_keys SET uses = uses + 1, updated_at = CURRENT_TIMESTAMP WHERE value = ?`).run(apiKey);
}

export function addBlock(title, number, blockLength) {
    const logs = [
        {"time": new Date(), "text": "Create block length: " + blockLength},
    ];

    const stmt = db.prepare(`
        INSERT INTO blocks (title, number, status, length, logs)
        VALUES (?, ?, 'new', ?, ?)
    `);

    const info = stmt.run(title, number, blockLength, JSON.stringify(logs));

    return info.lastInsertRowid;
}

export function getBlocks() {
    return db.prepare("SELECT * FROM blocks").all();
}

export function getBlock(id) {
    return db.prepare("SELECT * FROM blocks WHERE id = ? LIMIT 1").get(id);
}

export function getNextBlock() {
    return db.prepare("SELECT * FROM blocks WHERE status IN ('new', 'error') ORDER BY id LIMIT 1").get();
}

export function blockDone(id, logLine = null) {
    return updateBlock(id, 'done', logLine);
}

export function blockDoneWithError(id, logLine = null) {
    return updateBlock(id, 'error', logLine ? logLine : 'ERROR: exit with error');
}

export function blockError(id, logLine = null) {
    return updateBlock(id, 'process', 'ERROR: ' + logLine);
}

export function blockInfo(id, logLine = null) {
    return updateBlock(id, 'process', logLine);
}

export function updateBlock(id, status, logLine = null) {
    const block = getBlock(id);
    let blockLogs = JSON.parse(block.logs);
    blockLogs.push({"time": new Date(), "text": logLine});

    return db
        .prepare(`UPDATE blocks SET status = ?, logs = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(status, JSON.stringify(blockLogs), id);
}

export function init() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS blocks
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT NOT NULL,
            number     INTEGER NOT NULL,
            length     INTEGER DEFAULT 0,
            status     TEXT CHECK (status IN ('new', 'process', 'error', 'done')) NOT NULL DEFAULT 'new',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT NULL,
            logs       TEXT
        )`);

    db.exec(`
        CREATE TABLE IF NOT EXISTS api_keys
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            name       TEXT NOT NULL,
            value      TEXT NOT NULL,
            uses       INTEGER  DEFAULT 0,
            updated_at DATETIME DEFAULT NULL
        )`);

    return db;
}

init();