import { z } from "zod";
import { rpcResult, rpcError, JSONRPC_ERROR, type JsonRpcRequest } from "@/lib/mcp/jsonrpc";
import type { ToolDef } from "@/lib/mcp/tools";

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "rheon-blog", version: "1.0.0" };

/** JSON-RPC 2.0 응답 형태 (result / error 는 런타임에 한쪽만 존재). */
export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
  error: { code: number; message: string };
}

/** 단일 JSON-RPC 요청을 처리. notification이면 null(무응답). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function dispatch(req: JsonRpcRequest, tools: ToolDef[]): Promise<any | null> {
  const id = req.id ?? null;
  const isNotification = req.id === undefined;

  switch (req.method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: (req.params as { protocolVersion?: string } | undefined)?.protocolVersion ?? PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });

    case "notifications/initialized":
    case "notifications/cancelled":
      return null;

    case "ping":
      return rpcResult(id, {});

    case "tools/list":
      return rpcResult(id, {
        tools: tools.map((t) => ({
          name: t.name,
          description: t.description,
          inputSchema: z.toJSONSchema(t.schema),
        })),
      });

    case "tools/call": {
      const params = (req.params ?? {}) as { name?: string; arguments?: unknown };
      const tool = tools.find((t) => t.name === params.name);
      if (!tool) return rpcError(id, JSONRPC_ERROR.InvalidParams, `알 수 없는 툴: ${params.name}`);
      try {
        const args = tool.schema.parse(params.arguments ?? {});
        const result = await tool.handler(args);
        return rpcResult(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return rpcResult(id, { content: [{ type: "text", text: `에러: ${msg}` }], isError: true });
      }
    }

    default:
      if (isNotification) return null;
      return rpcError(id, JSONRPC_ERROR.MethodNotFound, `지원하지 않는 메서드: ${req.method}`);
  }
}
