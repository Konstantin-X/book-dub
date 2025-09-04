import Database from 'better-sqlite3';

const MAX_USES_PER_DAY = 15;

const db = new Database('./books.db');

export function addApiKey(name, apiKey) {
    const stmt = db.prepare(`
        INSERT INTO api_keys (name, api_key, uses)
        VALUES (?, ?, 0)
    `);

    const info = stmt.run(name, apiKey);

    return info.lastInsertRowid;
}

export function getApiKey() {
    return db.prepare("SELECT api_key FROM api_keys WHERE uses < ? LIMIT 1").get(MAX_USES_PER_DAY);
}

export function updateApiKeyUses(apiKey) {
    db.prepare(`UPDATE api_keys SET uses = uses + 1, updated_at = CURRENT_TIMESTAMP WHERE api_key = ?`).run(apiKey);
}

export function addBookBlock(title, blockId, blockLength) {
    const logs = [
        {"time": new Date(), "text": "Create block length: " + blockLength},
    ];

    const stmt = db.prepare(`
        INSERT INTO books (title, block_id, status, length, logs)
        VALUES (?, ?, 'new', ?, ?)
    `);

    const info = stmt.run(title, blockId, blockLength, JSON.stringify(logs));

    return info.lastInsertRowid;
}

export function getBooks() {
    return db.prepare("SELECT * FROM books").all();
}

export function getBookBlock(id) {
    return db.prepare("SELECT * FROM books WHERE id = ? LIMIT 1").get(id);
}

export function getNextBookBlock() {
    return db.prepare("SELECT * FROM books WHERE status IN ('new', 'error') ORDER BY id LIMIT 1").get();
}

export function blockDone(id, logLine = null) {
    return updateBookBlock(id, 'done', logLine);
}

export function blockDoneWithError(id, logLine = null) {
    return updateBookBlock(id, 'error', logLine ? logLine : 'ERROR: exit with error');
}

export function blockError(id, logLine = null) {
    return updateBookBlock(id, 'process', 'ERROR: ' + logLine);
}

export function blockInfo(id, logLine = null) {
    return updateBookBlock(id, 'process', logLine);
}

export function updateBookBlock(id, status, logLine = null) {
    const block = getBookBlock(id);
    let blockLogs = JSON.parse(block.logs);
    blockLogs.push({"time": new Date(), "text": logLine});

    return db
        .prepare(`UPDATE books SET status = ?, logs = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(status, JSON.stringify(blockLogs), id);
}

export function updateBookBlock2(id, status, logLine = null) {
    const newLogLine = {"time": new Date(), "text": logLine};

    const stmt = db.prepare(`
        UPDATE books
        SET status = ?, logs = json_insert(logs, '$[#]', ?), updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
    `);

    return stmt.run(status, JSON.stringify(newLogLine), id);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    block_id INTEGER NOT NULL,
    length INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('new','process','error','done')) NOT NULL DEFAULT 'new',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL,
    logs TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS api_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    uses INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT NULL
  )
`);