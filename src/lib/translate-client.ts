// 클라이언트에서 /api/translate 스트리밍 응답을 소비하는 헬퍼.
// 토큰이 도착하는 대로 onProgress(누적 텍스트)로 콜백하고, 최종 전체 텍스트를 반환한다.
export async function streamTranslate(
  body: Record<string, unknown>,
  onProgress?: (full: string) => void,
): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || `요청 실패 (HTTP ${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
    onProgress?.(full);
  }
  full += decoder.decode();
  return full;
}
