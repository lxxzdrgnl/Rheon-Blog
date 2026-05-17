"use server";

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GitHubImportResult {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  techStack: string[];
  content: string;
  repoUrl: string;
}

export async function importFromGitHub(repoUrl: string): Promise<GitHubImportResult> {
  // URL에서 owner/repo 추출
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("올바른 GitHub URL이 아닙니다.");
  const [, owner, repo] = match;

  // README 원문 가져오기
  const readmeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
    headers: { Accept: "application/vnd.github.v3.raw" },
    next: { revalidate: 0 },
  });
  if (!readmeRes.ok) throw new Error("README를 가져올 수 없습니다.");
  const readme = await readmeRes.text();

  // GPT로 구조화된 데이터 추출
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a project metadata extractor. Given a GitHub README, extract structured project information.
Return ONLY valid JSON with this exact structure:
{
  "title": "프로젝트 한국어 제목 (README에서 h1 또는 첫 줄 기반)",
  "titleEn": "English project title",
  "description": "한국어 한줄 소개 (1-2문장)",
  "descriptionEn": "English one-line description (1-2 sentences)",
  "techStack": ["Tech1", "Tech2", ...]
}

Rules:
- title: README의 첫 h1 제목을 사용. 한국어면 그대로, 영어면 한국어로도 작성
- titleEn: 영어 제목
- description: 프로젝트가 무엇인지 1-2문장으로 요약 (한국어)
- descriptionEn: Same in English
- techStack: README에 명시된 기술스택을 배열로 추출. 버전 번호 포함 (예: "Spring Boot 3.2.5", "Java 21")`,
      },
      { role: "user", content: readme },
    ],
    response_format: { type: "json_object" },
  });

  const parsed = JSON.parse(response.choices[0].message.content || "{}");

  return {
    title: parsed.title || repo,
    titleEn: parsed.titleEn || repo,
    description: parsed.description || "",
    descriptionEn: parsed.descriptionEn || "",
    techStack: parsed.techStack || [],
    content: readme,
    repoUrl: `https://github.com/${owner}/${repo}`,
  };
}
