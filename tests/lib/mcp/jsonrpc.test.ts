import { describe, it, expect } from "vitest";
import { rpcResult, rpcError, JSONRPC_ERROR } from "@/lib/mcp/jsonrpc";

describe("jsonrpc helpers", () => {
  it("rpcResult는 jsonrpc/id/result를 담는다", () => {
    expect(rpcResult(1, { ok: true })).toEqual({ jsonrpc: "2.0", id: 1, result: { ok: true } });
  });
  it("rpcError는 code/message를 담는다", () => {
    expect(rpcError(2, JSONRPC_ERROR.MethodNotFound, "nope")).toEqual({
      jsonrpc: "2.0",
      id: 2,
      error: { code: -32601, message: "nope" },
    });
  });
  it("id가 null이어도 그대로 둔다", () => {
    expect(rpcResult(null, {}).id).toBe(null);
  });
});
