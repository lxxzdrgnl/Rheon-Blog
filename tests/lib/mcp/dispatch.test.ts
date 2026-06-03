import { describe, it, expect } from "vitest";
import { dispatch } from "@/lib/mcp/dispatch";
import type { ToolDef } from "@/lib/mcp/tools";
import { z } from "zod";

const fakeTools: ToolDef[] = [
  { name: "echo", description: "에코", schema: z.object({ msg: z.string() }), handler: async (a) => a },
  { name: "boom", description: "터짐", schema: z.object({}), handler: async () => { throw new Error("폭발"); } },
];

describe("dispatch", () => {
  it("initialize는 serverInfo와 capabilities를 반환", async () => {
    const res = await dispatch({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }, fakeTools);
    expect(res!.result.serverInfo.name).toBeDefined();
    expect(res!.result.capabilities.tools).toBeDefined();
  });
  it("tools/list는 inputSchema 포함 목록 반환", async () => {
    const res = await dispatch({ jsonrpc: "2.0", id: 2, method: "tools/list" }, fakeTools);
    expect(res!.result.tools).toHaveLength(2);
    expect(res!.result.tools[0]).toHaveProperty("inputSchema");
  });
  it("tools/call 정상 호출은 content 반환", async () => {
    const res = await dispatch({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "echo", arguments: { msg: "hi" } } }, fakeTools);
    expect(res!.result.content[0].text).toContain("hi");
    expect(res!.result.isError).toBeFalsy();
  });
  it("핸들러 에러는 isError content로 반환(프로토콜 에러 아님)", async () => {
    const res = await dispatch({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "boom", arguments: {} } }, fakeTools);
    expect(res!.result.isError).toBe(true);
    expect(res!.result.content[0].text).toContain("폭발");
  });
  it("잘못된 args는 isError content", async () => {
    const res = await dispatch({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "echo", arguments: {} } }, fakeTools);
    expect(res!.result.isError).toBe(true);
  });
  it("없는 메서드는 MethodNotFound 에러", async () => {
    const res = await dispatch({ jsonrpc: "2.0", id: 6, method: "nope" }, fakeTools);
    expect(res!.error.code).toBe(-32601);
  });
  it("notification(id 없음)은 null 반환(무응답)", async () => {
    const res = await dispatch({ jsonrpc: "2.0", method: "notifications/initialized" }, fakeTools);
    expect(res).toBeNull();
  });
});
