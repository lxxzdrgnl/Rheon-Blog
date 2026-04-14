import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function translateToEnglish(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a translator. Translate the following Korean text to English. " +
          "Preserve all markdown formatting, code blocks, and links exactly as they are. " +
          "Only translate the natural language text. Return only the translated text.",
      },
      { role: "user", content: text },
    ],
  });

  return response.choices[0].message.content || text;
}

export async function translatePartial(
  koreanContent: string,
  selectedKorean: string,
  existingEnglish: string,
): Promise<string> {
  // 선택 부분 주변 한국어 문맥 추출 (짧게)
  const idx = koreanContent.indexOf(selectedKorean);
  const before = koreanContent.slice(Math.max(0, idx - 150), idx);
  const after = koreanContent.slice(idx + selectedKorean.length, idx + selectedKorean.length + 150);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Translate ONLY the Korean text between >>> and <<< to English. " +
          "Surrounding text is context only. Preserve markdown. " +
          "Return ONLY the translation, no markers, no explanation.",
      },
      { role: "user", content: `${before}>>>${selectedKorean}<<<${after}` },
    ],
  });

  return (response.choices[0].message.content || selectedKorean).trim();
}

export async function translateTitle(title: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Translate the following Korean title to English. Return only the translated title, nothing else.",
      },
      { role: "user", content: title },
    ],
  });

  return response.choices[0].message.content || title;
}
