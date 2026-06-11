import { PostCard } from "@/components/blog/PostCard";
import { SeriesCard } from "@/components/blog/SeriesCard";
import { ProjectCard } from "@/components/blog/ProjectCard";
import { searchPosts, searchPortfolios, searchSeries } from "@/actions/search";
import { getCategories } from "@/actions/categories";
import { getAllPostTags } from "@/actions/posts";
import { SearchBar } from "@/components/ui/SearchBar";
import { snippetFromMarkdown, excerptFromMarkdown } from "@/lib/markdown";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const en = locale === "en";
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [postResults, projectResults, seriesResults, allCategories, postTagsMap] = query
    ? await Promise.all([
        searchPosts(query, locale),
        searchPortfolios(query, locale),
        searchSeries(query, locale),
        getCategories(),
        getAllPostTags(),
      ])
    : [[], [], [], [], {} as Record<number, { name: string; nameEn: string }[]>];

  const ql = query.toLowerCase();
  const tagMatches = (t: { name: string; nameEn: string }) =>
    t.name.toLowerCase().includes(ql) || t.nameEn.toLowerCase().includes(ql);

  const postCards = postResults.map((post) => {
    const cat = allCategories.find((c) => c.id === post.categoryId);
    const body = (en ? post.contentEn : post.content) ?? "";
    // 본문(현재 언어)에 검색어가 있으면 그 주변 스니펫(코드블록 포함),
    // 없으면(제목/태그만 매칭) 본문 앞부분 발췌로 폴백.
    const snippet = snippetFromMarkdown(body, query) ?? excerptFromMarkdown(body, 120);
    // 매칭된 태그를 앞으로 — slice(0,3)에 밀려 숨지 않도록 (정렬은 안정적)
    const tags = [...(postTagsMap[post.id] || [])].sort(
      (a, b) => Number(tagMatches(b)) - Number(tagMatches(a)),
    );
    return {
      ...post,
      categoryName: cat?.name || "",
      categoryNameEn: cat?.nameEn || "",
      tags,
      snippet,
    };
  });

  const total = postResults.length + projectResults.length + seriesResults.length;

  return (
    <div className="page-container py-10">
      {/* ── Header ── */}
      <header className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight break-words">
          {query ? (
            en ? (
              <>Results for <span className="text-accent">{query}</span></>
            ) : (
              <><span className="text-accent">{query}</span> 검색 결과</>
            )
          ) : en ? (
            "Search"
          ) : (
            "검색"
          )}
        </h1>
        {query && (
          <p className="mt-1.5 text-sm text-text-secondary tabular-nums">
            {en ? `${total} ${total === 1 ? "result" : "results"}` : `결과 ${total}개`}
          </p>
        )}
      </header>

      <div className="mt-5 max-w-xl animate-fade-in animate-delay-1">
        <SearchBar size="lg" defaultValue={query} autoFocus={!query} />
        {!query && (
          <p className="mt-3 text-sm text-text-tertiary">
            {en ? "Search across posts, projects, and series." : "글 · 프로젝트 · 시리즈를 한 번에 찾아보세요."}
          </p>
        )}
      </div>

      {/* ── Results ── */}
      {query &&
        (total > 0 ? (
          <div className="mt-7 space-y-9">
            {postCards.length > 0 && (
              <ResultSection label={en ? "Posts" : "글"} count={postCards.length} delay="animate-delay-2">
                {postCards.map((post) => (
                  <PostCard key={post.id} {...post} highlight={query} />
                ))}
              </ResultSection>
            )}
            {seriesResults.length > 0 && (
              <ResultSection label={en ? "Series" : "시리즈"} count={seriesResults.length} delay="animate-delay-2">
                {seriesResults.map((s) => (
                  <SeriesCard key={s.id} {...s} highlight={query} />
                ))}
              </ResultSection>
            )}
            {projectResults.length > 0 && (
              <ResultSection label={en ? "Projects" : "프로젝트"} count={projectResults.length} delay="animate-delay-3">
                {projectResults.map((p) => {
                  const ptitle = (en ? p.titleEn : p.title) ?? "";
                  const pdesc = (en ? p.descriptionEn : p.description) ?? "";
                  // 제목·설명에 검색어가 없으면(본문에서 매칭) 본문 스니펫을 보여줘 매칭 이유를 드러냄
                  const inMeta = `${ptitle} ${pdesc}`.toLowerCase().includes(ql);
                  const psnippet = inMeta ? null : snippetFromMarkdown(en ? p.contentEn : p.content, query);
                  return <ProjectCard key={p.id} project={p} locale={locale} highlight={query} snippet={psnippet} />;
                })}
              </ResultSection>
            )}
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center text-center animate-fade-in animate-delay-2">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-bg-card">
              <svg className="w-6 h-6 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 3l18 18M10.5 6.2A6.5 6.5 0 0116.8 13.5m-1.9 2.6a6.5 6.5 0 01-8.9-8.9M21 21l-4.35-4.35" />
              </svg>
            </div>
            <p className="mt-5 text-lg font-semibold text-text-primary">
              {en ? "No results found" : "검색 결과가 없습니다"}
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-secondary">
              {en
                ? `Nothing matched "${query}". Try a different keyword.`
                : `"${query}"와(과) 일치하는 결과가 없어요. 다른 키워드로 검색해 보세요.`}
            </p>
          </div>
        ))}
    </div>
  );
}

/** 홈 "최근 포스트" 섹션과 동일한 라벨 + 그리드(gap-5) 스타일 */
function ResultSection({
  label,
  count,
  delay,
  children,
}: {
  label: string;
  count: number;
  delay?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`animate-fade-in ${delay ?? ""}`}>
      <div className="flex items-baseline gap-2 mb-4 pb-2 border-b border-border">
        <h2 className="text-base font-bold tracking-tight text-text-primary">{label}</h2>
        <span className="text-sm font-semibold text-accent tabular-nums">{count}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{children}</div>
    </section>
  );
}
