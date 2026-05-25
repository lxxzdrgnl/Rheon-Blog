/**
 * Additive-only production migrator (컨테이너 시작 시 실행).
 *
 * schema-snapshot.json(빌드 시 스키마에서 자동 생성)을 읽어, 실제 DB에 없는
 * 컬럼/테이블을 "추가만" 한다. 절대 DROP / 재생성 / 타입변경을 하지 않으므로
 * 기존 데이터가 손실될 수 없다. 스키마가 진실의 원천이라 다음 변경도 자동 반영된다.
 *
 * 안전장치:
 *  - 컬럼 추가는 nullable(또는 DEFAULT 있을 때만 제약) → 기존 행에서 실패하지 않음
 *  - 어떤 단계가 실패해도 예외를 삼키고 앱은 정상 시작(데이터 위험 없음)
 */
const Database = require("better-sqlite3");
const fs = require("node:fs");
const path = require("node:path");

const dbPath = process.env.DATABASE_PATH || "./data/blog.db";

function lit(v) {
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function createTableSql(table, cols) {
  const defs = cols.map((c) => {
    let s = `\`${c.name}\` ${c.type}`;
    if (c.primary) s += c.autoIncrement ? " PRIMARY KEY AUTOINCREMENT" : " PRIMARY KEY";
    if (c.notNull) s += " NOT NULL";
    if (c.default !== undefined) s += ` DEFAULT ${lit(c.default)}`;
    return s;
  });
  return `CREATE TABLE IF NOT EXISTS \`${table}\` (${defs.join(", ")})`;
}

function addColumnSql(table, c) {
  // ADD COLUMN: 기존 행 안전을 위해 DEFAULT 없으면 NOT NULL 생략(nullable).
  let s = `ALTER TABLE \`${table}\` ADD COLUMN \`${c.name}\` ${c.type}`;
  if (c.default !== undefined) {
    if (c.notNull) s += " NOT NULL";
    s += ` DEFAULT ${lit(c.default)}`;
  }
  return s;
}

function run() {
  const snapFile = path.join(process.cwd(), "schema-snapshot.json");
  if (!fs.existsSync(snapFile)) {
    console.error("[migrate] schema-snapshot.json not found — skip");
    return;
  }
  const snap = JSON.parse(fs.readFileSync(snapFile, "utf8"));
  const db = new Database(dbPath);
  let changes = 0;
  try {
    for (const [table, cols] of Object.entries(snap)) {
      const existing = db.prepare(`PRAGMA table_info(\`${table}\`)`).all().map((r) => r.name);
      if (existing.length === 0) {
        try {
          db.prepare(createTableSql(table, cols)).run();
          changes++;
          console.log(`[migrate] + table ${table}`);
        } catch (e) {
          console.error(`[migrate] create ${table} failed (skip):`, e.message);
        }
        continue;
      }
      for (const c of cols) {
        if (existing.includes(c.name)) continue;
        try {
          db.prepare(addColumnSql(table, c)).run();
          changes++;
          console.log(`[migrate] + ${table}.${c.name}`);
        } catch (e) {
          console.error(`[migrate] add ${table}.${c.name} failed (skip):`, e.message);
        }
      }
    }
    console.log(`[migrate] done — ${changes} additive change(s), no data dropped`);
  } finally {
    db.close();
  }
}

try {
  run();
} catch (e) {
  console.error("[migrate] unexpected error (starting app anyway):", e && e.message);
}
