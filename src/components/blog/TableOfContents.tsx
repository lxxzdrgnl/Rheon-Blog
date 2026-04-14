"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";

interface TOCItem { id: string; text: string; level: number; }

export function TableOfContents() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const { t } = useI18n();

  useEffect(() => {
    const elements = document.querySelectorAll(".prose h1, .prose h2, .prose h3");
    const items: TOCItem[] = Array.from(elements).map((el) => {
      const id = el.textContent?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9가-힣-]/g, "") || "";
      el.id = id;
      return { id, text: el.textContent || "", level: Number(el.tagName[1]) };
    });
    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block fixed top-24 w-52" style={{ left: "calc(50% + var(--max-width-prose)/2 + 2rem)" }}>
      <p className="text-sm font-bold mb-3">{t("post.tableOfContents")}</p>
      <ul className="space-y-1.5 text-sm">
        {headings.map((heading) => (
          <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}>
            <a href={`#${heading.id}`} className={`block truncate transition-colors ${activeId === heading.id ? "text-accent font-medium" : "text-text-secondary hover:text-text-primary"}`}>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
