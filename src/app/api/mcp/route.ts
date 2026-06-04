import { NextRequest } from "next/server";
import { verifyBearer } from "@/lib/mcp/auth";
import { dispatch } from "@/lib/mcp/dispatch";
import { TOOLS } from "@/lib/mcp/tools";
import { rpcError, JSONRPC_ERROR, type JsonRpcRequest } from "@/lib/mcp/jsonrpc";

export const dynamic = "force-dynamic";

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json", "WWW-Authenticate": "Bearer" },
  });
}

export async function POST(req: NextRequest) {
  if (!verifyBearer(req.headers.get("authorization"), process.env.MCP_TOKEN)) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json(rpcError(null, JSONRPC_ERROR.ParseError, "JSON 파싱 실패"), { status: 400 });
  }

  // 배치(array) / 단일 모두 지원
  const requests = Array.isArray(body) ? body : [body];
  const responses = [];
  for (const r of requests) {
    const res = await dispatch(r as JsonRpcRequest, TOOLS);
    if (res !== null) responses.push(res); // notification은 응답 생략
  }

  // 모두 notification이면 202
  if (responses.length === 0) return new Response(null, { status: 202 });

  const payload = Array.isArray(body) ? responses : responses[0];
  return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
}

// stateless 서버: SSE 스트림(GET)은 지원하지 않음
export async function GET() {
  return new Response("Method Not Allowed", { status: 405 });
}
