import Database from "better-sqlite3";
import path from "path";

const DB_FILE = path.resolve('./../../blocks.db');
const db = new Database(DB_FILE);

export function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS blocks
        (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            title      TEXT NOT NULL,
            block_id   INTEGER NOT NULL,
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
            api_key    TEXT NOT NULL,
            uses       INTEGER  DEFAULT 0,
            updated_at DATETIME DEFAULT NULL
        )`);

    return db;
}

export function insertChunk(db, { filename, content_length, status }) {
    const stmt = db.prepare(`
    INSERT INTO chunks (filename, content_length, status)
    VALUES (?, ?, ?)
  `);
    stmt.run(filename, content_length, status);
}

export function getNextChunk(db) {
    const stmt = db.prepare(`
    SELECT * FROM chunks WHERE status = 'new' OR status = 'process' ORDER BY id LIMIT 1
  `);
    return stmt.get();
}

export function updateStatus(db, id, status) {
    const stmt = db.prepare(`
    UPDATE chunks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
  `);
    stmt.run(status, id);
}
