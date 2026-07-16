/**
 * 인메모리 테스트 DB를 src/db/schema.ts에서 "직접" 유도한다.
 *
 * drizzle/*.sql 마이그레이션 폴더는 이 프로젝트에서 어디에도 적용되지 않는
 * generate 산출물이다(AGENTS.md 참고) — 실제 앱은 schema-snapshot.json 기반
 * scripts/migrate-prod.cjs로 additive-only 마이그레이션한다. 그래서 drizzle/를
 * migrate()에 넘기면 src/db/schema.ts와 어긋난 낡은 스냅샷을 CREATE TABLE 해버린다.
 *
 * schema-snapshot.json은 빌드 시 생성되는 .gitignore 대상이라 그것도 의존할 수 없다.
 * 대신 scripts/dump-schema.ts(getTableConfig로 컬럼 추출)와 scripts/migrate-prod.cjs
 * (createTableSql/lit로 컬럼 정의 → CREATE TABLE)가 하는 것과 똑같은 방식을, 런타임에
 * src/db/schema.ts의 테이블 export들로부터 직접 수행한다. 두 스크립트는 수정하지 않는다.
 *
 * FTS5 가상 테이블/트리거(posts_fts, posts_au 등)는 schema.ts에 정의되어 있지 않고
 * (별도 마이그레이션에서만 생성됨) 이 테스트들도 사용하지 않으므로 여기서는 만들지 않는다.
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import * as schema from "@/db/schema";

type Col = ReturnType<typeof getTableConfig>["columns"][number];

function lit(v: string | number | boolean) {
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function createTableSql(table: string, cols: Col[]) {
  const defs = cols.map((c) => {
    let s = `\`${c.name}\` ${c.getSQLType()}`;
    const anyc = c as unknown as { autoIncrement?: boolean; default?: unknown };
    if (c.primary) s += anyc.autoIncrement ? " PRIMARY KEY AUTOINCREMENT" : " PRIMARY KEY";
    if (c.notNull) s += " NOT NULL";
    const d = anyc.default;
    if (typeof d === "string" || typeof d === "number" || typeof d === "boolean") {
      s += ` DEFAULT ${lit(d)}`;
    }
    return s;
  });
  return `CREATE TABLE IF NOT EXISTS \`${table}\` (${defs.join(", ")})`;
}

export function createTestDb() {
  const sqlite = new Database(":memory:");
  for (const key of Object.keys(schema)) {
    let cfg;
    try {
      cfg = getTableConfig((schema as Record<string, unknown>)[key] as Parameters<typeof getTableConfig>[0]);
    } catch {
      continue; // table export가 아님
    }
    sqlite.exec(createTableSql(cfg.name, cfg.columns as Col[]));
  }
  return drizzle(sqlite, { schema });
}
