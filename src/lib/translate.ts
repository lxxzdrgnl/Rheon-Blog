import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = "gpt-4o-mini";

export type TranslateMessage = { role: "system" | "user"; content: string };

const FULL_SYSTEM =
  "You are a translator. Translate the following Korean text to English. " +
  "Preserve all markdown formatting, code blocks, and links exactly as they are. " +
  "Only translate the natural language text. Return only the translated text.";

const TITLE_SYSTEM =
  "Translate the following Korean title to English. Return only the translated title, nothing else.";

const SELECTION_SYSTEM =
  "Translate ONLY the Korean text between >>> and <<< to English. " +
  "Surrounding text is context only. Preserve markdown. " +
  "Return ONLY the translation, no markers, no explanation.";

export function fullTextMessages(text: string): TranslateMessage[] {
  return [
    { role: "system", content: FULL_SYSTEM },
    { role: "user", content: text },
  ];
}

export function titleMessages(title: string): TranslateMessage[] {
  return [
    { role: "system", content: TITLE_SYSTEM },
    { role: "user", content: title },
  ];
}

export function selectionMessages(koreanContent: string, selectedKorean: string): TranslateMessage[] {
  // 선택 부분 주변 한국어 문맥 추출 (짧게)
  const idx = koreanContent.indexOf(selectedKorean);
  const before = idx >= 0 ? koreanContent.slice(Math.max(0, idx - 150), idx) : "";
  const after = idx >= 0 ? koreanContent.slice(idx + selectedKorean.length, idx + selectedKorean.length + 150) : "";
  return [
    { role: "system", content: SELECTION_SYSTEM },
    { role: "user", content: `${before}>>>${selectedKorean}<<<${after}` },
  ];
}

// 스트리밍 번역 — /api/translate 라우트 핸들러용.
// 토큰을 받는 대로 흘려보내 nginx proxy_read_timeout(읽기 간 유휴 타임아웃)이
// 긴 글에서 60초를 넘겨 끊기는 문제를 방지한다.
export function translateStream(messages: TranslateMessage[]) {
  return openai.chat.completions.create({ model: MODEL, messages, stream: true });
}

// 비스트리밍 번역 — 짧은 필드(이력서 등) 서버액션용.
async function translateOnce(messages: TranslateMessage[]): Promise<string> {
  const response = await openai.chat.completions.create({ model: MODEL, messages });
  return response.choices[0]?.message?.content ?? "";
}

export async function translateToEnglish(text: string): Promise<string> {
  return (await translateOnce(fullTextMessages(text))) || text;
}

export async function translateTitle(title: string): Promise<string> {
  return (await translateOnce(titleMessages(title))) || title;
}
