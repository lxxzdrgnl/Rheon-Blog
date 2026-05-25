/**
 * 빌드 시 실행 — drizzle 스키마에서 테이블/컬럼 정보를 추출해 schema-snapshot.json 으로 덤프.
 * 런타임 마이그레이터(migrate-prod.cjs)가 이 스냅샷을 보고 "없는 것만 추가"한다.
 * 스키마가 진실의 원천이므로 다음번 스키마 변경도 자동 반영된다.
 */
import { getTableConfig } from "drizzle-orm/sqlite-core";
import * as schema from "../src/db/schema";
import { writeFileSync } from "node:fs";

interface Col {
  name: string;
  type: string;
  notNull: boolean;
  primary: boolean;
  autoIncrement?: boolean;
  default?: string | number | boolean;
}

const out: Record<string, Col[]> = {};

for (const key of Object.keys(schema)) {
  let cfg;
  try {
    cfg = getTableConfig((schema as Record<string, unknown>)[key] as Parameters<typeof getTableConfig>[0]);
  } catch {
    continue; // not a table export
  }
  out[cfg.name] = cfg.columns.map((c) => {
    const col: Col = {
      name: c.name,
      type: c.getSQLType(),
      notNull: !!c.notNull,
      primary: !!c.primary,
    };
    const anyc = c as unknown as { autoIncrement?: boolean; default?: unknown };
    if (anyc.autoIncrement) col.autoIncrement = true;
    const d = anyc.default;
    if (typeof d === "string" || typeof d === "number" || typeof d === "boolean") {
      col.default = d;
    }
    return col;
  });
}

writeFileSync("schema-snapshot.json", JSON.stringify(out, null, 2));
console.log(`[dump] schema-snapshot.json written: ${Object.keys(out).length} tables`);
