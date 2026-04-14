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
