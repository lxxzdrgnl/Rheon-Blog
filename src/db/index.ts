import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_PATH || "./data/blog.db";
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// FTS5 virtual table for full-text search
sqlite.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
    title, content, title_en, content_en,
    content='posts',
    content_rowid='id'
  );

  CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
    INSERT INTO posts_fts(rowid, title, content, title_en, content_en)
    VALUES (new.id, new.title, new.content, new.title_en, new.content_en);
  END;

  CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
    INSERT INTO posts_fts(posts_fts, rowid, title, content, title_en, content_en)
    VALUES ('delete', old.id, old.title, old.content, old.title_en, old.content_en);
  END;

  CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
    INSERT INTO posts_fts(posts_fts, rowid, title, content, title_en, content_en)
    VALUES ('delete', old.id, old.title, old.content, old.title_en, old.content_en);
    INSERT INTO posts_fts(rowid, title, content, title_en, content_en)
    VALUES (new.id, new.title, new.content, new.title_en, new.content_en);
  END;
`);
