import { db } from "./index";
import { portfolios } from "./schema";
import { eq } from "drizzle-orm";

async function fetchReadme(repo: string): Promise<string> {
  const res = await fetch(`https://api.github.com/repos/lxxzdrgnl/${repo}/readme`, {
    headers: { Accept: "application/vnd.github.v3.raw" },
  });
  if (!res.ok) throw new Error(`Failed: ${repo} ${res.status}`);
  return res.text();
}

async function main() {
  const [apiReadme, workerReadme, frontReadme] = await Promise.all([
    fetchReadme("RoyaleLog-api"),
    fetchReadme("RoyaleLog-worker"),
    fetchReadme("RoyaleLog-front"),
  ]);

  const combinedContent = [
    apiReadme,
    "\n\n---\n\n",
    workerReadme,
    "\n\n---\n\n",
    frontReadme,
  ].join("");

  const newLinks = JSON.stringify([
    { badge: "github", label: "API Server", url: "https://github.com/lxxzdrgnl/RoyaleLog-api" },
    { badge: "github", label: "ML Worker", url: "https://github.com/lxxzdrgnl/RoyaleLog-worker" },
    { badge: "github", label: "Frontend", url: "https://github.com/lxxzdrgnl/RoyaleLog-front" },
  ]);

  // techStack \uc5c5\ub370\uc774\ud2b8 (worker/front \uae30\uc220 \ucd94\uac00)
  const newTechStack = JSON.stringify([
    "Spring Boot 3.2.5", "Java 21", "Gradle", "PostgreSQL 16", "Redis 7.0",
    "Spring Batch", "Spring Data JPA", "MLflow", "Prometheus", "Micrometer",
    "Docker", "K3s", "Flyway", "Guava RateLimiter",
    "FastAPI", "Python 3.11", "LightGBM", "SQLAlchemy",
    "Vue.js 3.5", "TypeScript", "Vite", "Pinia",
  ]);

  db.update(portfolios)
    .set({
      link: newLinks,
      content: combinedContent,
      techStack: newTechStack,
    })
    .where(eq(portfolios.slug, "royalelog-api"))
    .run();

  console.log("Updated RoyaleLog with worker + front repos");
}

main().catch(console.error);
