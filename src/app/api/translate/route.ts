import { NextRequest } from "next/server";
import {
  fullTextMessages,
  titleMessages,
  selectionMessages,
  translateStream,
  type TranslateMessage,
} from "@/lib/translate";

// 인증은 middleware.ts 가 /api/* 에 대해 처리한다(미로그인 시 401).
export async function POST(req: NextRequest) {
  let body: {
    kind?: string;
    text?: string;
    content?: string;
    selected?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("잘못된 요청 형식입니다.", { status: 400 });
  }

  const { kind } = body;
  let messages: TranslateMessage[];
  switch (kind) {
    case "title":
      if (!body.text?.trim()) return new Response("번역할 텍스트가 없습니다.", { status: 400 });
      messages = titleMessages(body.text);
      break;
    case "content":
      if (!body.text?.trim()) return new Response("번역할 텍스트가 없습니다.", { status: 400 });
      messages = fullTextMessages(body.text);
      break;
    case "selection":
      if (!body.content || !body.selected) return new Response("선택 영역 정보가 없습니다.", { status: 400 });
      messages = selectionMessages(body.content, body.selected);
      break;
    default:
      return new Response(`알 수 없는 번역 종류: ${kind}`, { status: 400 });
  }

  // 스트림 생성 단계에서 발생하는 에러(인증/쿼터/400 등)는 본문 전송 전에
  // 정상 HTTP 상태코드로 돌려준다.
  let aiStream: Awaited<ReturnType<typeof translateStream>>;
  try {
    aiStream = await translateStream(messages);
  } catch (err) {
    console.error(`[translate] OpenAI 요청 실패 (kind=${kind}):`, err);
    const detail = err instanceof Error ? err.message : "OpenAI 요청 실패";
    return new Response(`번역 API 호출 실패: ${detail}`, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of aiStream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        // 본문 전송이 시작된 뒤의 에러 — 상태코드는 못 바꾸므로 스트림을 끊고 로깅.
        console.error(`[translate] 스트림 중단 (kind=${kind}):`, err);
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      // nginx 등 리버스 프록시의 응답 버퍼링을 끈다(스트리밍 즉시 전달).
      "X-Accel-Buffering": "no",
    },
  });
}
