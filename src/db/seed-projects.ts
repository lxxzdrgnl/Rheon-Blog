import { db } from "./index";
import { portfolios } from "./schema";
import { eq } from "drizzle-orm";

// 기존에 넣은 요약 데이터 삭제
const slugsToDelete = ["lora-community", "sajuguri", "royalelog-api", "my-own-phoenix", "underline"];
for (const slug of slugsToDelete) {
  db.delete(portfolios).where(eq(portfolios.slug, slug)).run();
}
console.log("Deleted old summarized entries");

// GitHub API로 README 원문 가져오기
async function fetchReadme(repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/lxxzdrgnl/${repo}/readme`, {
    headers: { Accept: "application/vnd.github.v3.raw" },
  });
  if (!res.ok) throw new Error(`Failed to fetch README for ${repo}: ${res.status}`);
  return res.text();
}

async function main() {
  const repos = ["Lora-community", "SajuGuri", "RoyaleLog-api", "My-Own-Phoenix", "UnderLine"];
  const readmes = await Promise.all(repos.map(fetchReadme));

  const projects = [
    {
      title: "LoRA 모델 공유 플랫���",
      titleEn: "LoRA Community",
      slug: "lora-community",
      description: "만화/웹툰 캐릭터 LoRA 모델 학습, ���성, 공유를 위한 커뮤니티 플랫폼",
      descriptionEn: "Community platform for training, generating, and sharing LoRA models for manga/webtoon characters",
      techStack: JSON.stringify(["Spring Boot 3.5.7", "Java 17", "Gradle", "MySQL 8.0", "Redis 7.0", "Spring Security", "OAuth2", "JWT", "Swagger", "Docker Compose", "MinIO", "Vue.js 3", "TypeScript", "Pinia", "Vuetify", "FastAPI", "Modal GPU"]),
      link: JSON.stringify([
        { badge: "github", label: "GitHub", url: "https://github.com/lxxzdrgnl/Lora-community" },
        { badge: "demo", label: "Demo / Live", url: "https://blueming.rheon.kr/" },
      ]),
      thumbnail: null,
      content: readmes[0],
      contentEn: null,
    },
    {
      title: "사주구리",
      titleEn: "SajuGuri",
      slug: "sajuguri",
      description: "AI가 ���신의 사주(四柱)와 오늘의 고민을 함께 읽어드립���다",
      descriptionEn: "AI reads your Four Pillars of Destiny (Saju) along with today's concerns",
      techStack: JSON.stringify(["Python 3.10+", "TypeScript", "Vue.js 3", "Nuxt.js", "Pinia", "Tailwind CSS", "FastAPI", "LangChain", "OpenAI GPT-4o", "Gemini embedding-001", "ChromaDB", "PostgreSQL", "SQLAlchemy 2.0", "Docker"]),
      link: JSON.stringify([
        { badge: "github", label: "GitHub", url: "https://github.com/lxxzdrgnl/SajuGuri" },
        { badge: "demo", label: "Demo / Live", url: "https://sajuguri.rheon.kr/" },
      ]),
      thumbnail: null,
      content: readmes[1],
      contentEn: null,
    },
    {
      title: "RoyaleLog API",
      titleEn: "RoyaleLog API",
      slug: "royalelog-api",
      description: "���래시 로얄 배틀 로�� 수집 및 AI 승률 예측 API 서버",
      descriptionEn: "Clash Royale battle log collection and AI win-rate prediction API server",
      techStack: JSON.stringify(["Spring Boot 3.2.5", "Java 21", "Gradle", "PostgreSQL 16", "Redis 7.0", "Spring Batch", "Spring Data JPA", "MLflow", "Prometheus", "Micrometer", "Docker", "K3s", "Flyway", "Guava RateLimiter"]),
      link: JSON.stringify([
        { badge: "github", label: "GitHub", url: "https://github.com/lxxzdrgnl/RoyaleLog-api" },
      ]),
      thumbnail: null,
      content: readmes[2],
      contentEn: null,
    },
    {
      title: "My Own Phoenix",
      titleEn: "My Own Phoenix",
      slug: "my-own-phoenix",
      description: "LLM observability and evaluation platform — 트레이스 모니터링, 자동 평가, 데이터셋 관리",
      descriptionEn: "LLM observability and evaluation platform. Monitor traces, run automated evaluations, manage datasets, and collaborate on AI projects.",
      techStack: JSON.stringify(["Next.js 16", "TypeScript", "PostgreSQL", "Prisma 7", "Firebase Authentication", "Arize Phoenix", "Tailwind CSS", "Radix UI", "Highcharts", "Docker Compose", "GitHub Actions"]),
      link: JSON.stringify([
        { badge: "github", label: "GitHub", url: "https://github.com/lxxzdrgnl/My-Own-Phoenix" },
        { badge: "demo", label: "Demo / Live", url: "https://phoenix.rheon.kr/" },
      ]),
      thumbnail: null,
      content: readmes[3],
      contentEn: null,
    },
    {
      title: "UnderLine",
      titleEn: "UnderLine",
      slug: "underline",
      description: "AI 기반 가사 해��� 플랫폼 — 줄 단��� 번역, 슬랭 디코딩, 문���적 맥락 분석",
      descriptionEn: "AI-powered lyrics interpretation platform — line-by-line translation, slang decoding, cultural context analysis",
      techStack: JSON.stringify(["Next.js 16", "TypeScript", "PostgreSQL 16", "Prisma 7", "NextAuth.js v5", "OpenAI GPT-4o", "Genius API", "Spotify API", "Tailwind CSS v4", "Cheerio", "Vitest", "Docker Compose", "Nginx"]),
      link: JSON.stringify([
        { badge: "github", label: "GitHub", url: "https://github.com/lxxzdrgnl/UnderLine" },
        { badge: "demo", label: "Demo / Live", url: "https://underline.rheon.kr/" },
      ]),
      thumbnail: null,
      content: readmes[4],
      contentEn: null,
    },
  ];

  const existing = db.select().from(portfolios).all();
  const offset = existing.length;

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    db.insert(portfolios)
      .values({ ...p, sortOrder: offset + i })
      .onConflictDoNothing()
      .run();
  }

  console.log(`Seeded ${projects.length} projects with full README content (offset: ${offset})`);
}

main().catch(console.error);
