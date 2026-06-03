export type JsonRpcId = string | number | null;

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;       // notification이면 없음
  method: string;
  params?: unknown;
}

export const JSONRPC_ERROR = {
  ParseError: -32700,
  InvalidRequest: -32600,
  MethodNotFound: -32601,
  InvalidParams: -32602,
  InternalError: -32603,
} as const;

export function rpcResult(id: JsonRpcId, result: unknown) {
  return { jsonrpc: "2.0" as const, id, result };
}

export function rpcError(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id, error: { code, message } };
}

/** id가 없으면 notification → 응답을 보내지 않아야 한다. */
export function isNotification(req: JsonRpcRequest): boolean {
  return req.id === undefined;
}
