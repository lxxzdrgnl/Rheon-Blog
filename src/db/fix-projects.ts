import { db } from "./index";
import { portfolios } from "./schema";
import { eq } from "drizzle-orm";

const slugs = ["lora-community", "sajuguri", "royalelog-api", "my-own-phoenix", "underline"];
for (const slug of slugs) {
  db.delete(portfolios).where(eq(portfolios.slug, slug)).run();
}
console.log("Deleted corrupted entries");

async function fetchReadme(repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/lxxzdrgnl/${repo}/readme`, {
    headers: { Accept: "application/vnd.github.v3.raw" },
  });
  if (!res.ok) throw new Error(`Failed: ${repo} ${res.status}`);
  return res.text();
}

async function main() {
  const repos = ["Lora-community", "SajuGuri", "RoyaleLog-api", "My-Own-Phoenix", "UnderLine"];
  const readmes = await Promise.all(repos.map(fetchReadme));

  const projects = [
    {
      title: "\u004c\u006f\u0052\u0041 \ubaa8\ub378 \uacf5\uc720 \ud50c\ub7ab\ud3fc",
      titleEn: "LoRA Community",
      slug: "lora-community",
      description: "\ub9cc\ud654/\uc6f9\ud230 \uce90\ub9ad\ud130 LoRA \ubaa8\ub378 \ud559\uc2b5, \uc0dd\uc131, \uacf5\uc720\ub97c \uc704\ud55c \ucee4\ubba4\ub2c8\ud2f0 \ud50c\ub7ab\ud3fc",
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
      title: "\uc0ac\uc8fc\uad6c\ub9ac",
      titleEn: "SajuGuri",
      slug: "sajuguri",
      description: "AI\uac00 \ub2f9\uc2e0\uc758 \uc0ac\uc8fc(\u56db\u67f1)\uc640 \uc624\ub298\uc758 \uace0\ubbfc\uc744 \ud568\uaed8 \uc77d\uc5b4\ub4dc\ub9bd\ub2c8\ub2e4",
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
      description: "\ud074\ub798\uc2dc \ub85c\uc584 \ubc30\ud2c0 \ub85c\uadf8 \uc218\uc9d1 \ubc0f AI \uc2b9\ub960 \uc608\uce21 API \uc11c\ubc84",
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
      description: "LLM observability and evaluation platform \u2014 \ud2b8\ub808\uc774\uc2a4 \ubaa8\ub2c8\ud130\ub9c1, \uc790\ub3d9 \ud3c9\uac00, \ub370\uc774\ud130\uc14b \uad00\ub9ac",
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
      description: "AI \uae30\ubc18 \uac00\uc0ac \ud574\uc11d \ud50c\ub7ab\ud3fc \u2014 \uc904 \ub2e8\uc704 \ubc88\uc5ed, \uc2ac\ub7ad \ub514\ucf54\ub529, \ubb38\ud654\uc801 \ub9e5\ub77d \ubd84\uc11d",
      descriptionEn: "AI-powered lyrics interpretation platform \u2014 line-by-line translation, slang decoding, cultural context analysis",
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
    db.insert(portfolios)
      .values({ ...projects[i], sortOrder: offset + i })
      .onConflictDoNothing()
      .run();
  }

  console.log(`Re-seeded ${projects.length} projects (offset: ${offset})`);
}

main().catch(console.error);
