function isBadgeUrl(url: string): boolean {
  return url.includes("img.shields.io");
}

// HTML 속성 컨텍스트용 이스케이프(따옴표 탈출 방지).
const escAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 위험 프로토콜(javascript:/vbscript:/data:) URL은 "#"으로 무력화.
const safeUrl = (u: string) => (/^\s*(?:javascript|vbscript|data):/i.test(u) ? "#" : u.trim());

/**
 * 생성된/원본 HTML에서 활성 콘텐츠를 제거하는 경량 정화기(RSS content:encoded용).
 * 본문이 운영자 작성이라 위험도는 낮지만, 피드 리더에서 실행되는 것을 막는 방어심층.
 * 정규식 기반이라 완전하진 않으나 script/이벤트핸들러/위험 프로토콜은 차단한다.
 */
function sanitizeFeedHtml(html: string): string {
  return html
    // 위험 태그 블록(여는~닫는) 제거
    .replace(/<(script|style|iframe|object|embed|noscript)\b[\s\S]*?<\/\1\s*>/gi, "")
    // 잔여 위험 태그(짝 안 맞거나 자기닫힘) 제거
    .replace(/<\/?(?:script|style|iframe|object|embed|noscript|link|meta|base|form)\b[^>]*>/gi, "")
    // on* 이벤트 핸들러 속성 제거
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    // href/src 내 위험 프로토콜 무력화
    .replace(/((?:href|src)\s*=\s*")\s*(?:javascript|vbscript|data):[^"]*(")/gi, "$1#$2")
    .replace(/((?:href|src)\s*=\s*')\s*(?:javascript|vbscript|data):[^']*(')/gi, "$1#$2");
}

/** 의존성 없는 경량 마크다운→HTML 변환(RSS content:encoded용). 출력은 sanitizeFeedHtml로 정화. */
export function markdownToHtml(md: string | null): string {
  if (!md) return "";
  const escCode = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    s
      .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (_m, a, u) => `<img src="${escAttr(safeUrl(u))}" alt="${escAttr(a)}" />`)
      .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (_m, t, u) => `<a href="${escAttr(safeUrl(u))}">${t}</a>`)
      .replace(/`([^`]+)`/g, (_m, c) => `<code>${escCode(c)}</code>`)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  const isBlockStart = (l: string) => /^(#{1,6}\s|```|>\s?|\s*[-*+]\s|\s*\d+\.\s|\s*<)/.test(l);
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++;
      out.push(`<pre><code>${escCode(buf.join("\n"))}</code></pre>`);
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { const n = h[1].length; out.push(`<h${n}>${inline(h[2])}</h${n}>`); i++; continue; }
    if (/^(\s*[-*_]){3,}\s*$/.test(line)) { out.push("<hr />"); i++; continue; }
    if (/^>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      out.push(`<blockquote>${inline(buf.join(" "))}</blockquote>`);
      continue;
    }
    if (/\|/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(lines[i + 1])) {
      const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /\|/.test(lines[i]) && lines[i].trim() !== "") { rows.push(cells(lines[i])); i++; }
      const thead = `<tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr>`;
      const tbody = rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("");
      out.push(`<table>${thead}${tbody}</table>`);
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*[-*+]\s+/, "")); i++; }
      out.push(`<ul>${buf.map((b) => `<li>${inline(b)}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { buf.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
      out.push(`<ol>${buf.map((b) => `<li>${inline(b)}</li>`).join("")}</ol>`);
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    if (/^\s*</.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim() !== "" && /^\s*</.test(lines[i])) { buf.push(lines[i]); i++; }
      out.push(buf.join("\n"));
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !isBlockStart(lines[i])) { buf.push(lines[i]); i++; }
    if (buf.length) out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return sanitizeFeedHtml(out.join("\n"));
}

/** 마크다운에서 서식을 걷어내고 본문 앞부분을 발췌(미리보기)로 만든다. */
/** 마크다운 → 평문(공백 정규화). 발췌·스니펫·검색 표시 공용. */
export function stripMarkdown(markdown: string | null): string {
  if (!markdown) return "";
  return markdown
    .replace(/```[\s\S]*?```/g, " ")        // 코드블록
    .replace(/`[^`]*`/g, " ")               // 인라인 코드
    .replace(/!\[.*?\]\(.*?\)/g, " ")       // 이미지
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")  // 링크 → 텍스트만
    .replace(/<[^>]+>/g, " ")               // HTML 태그
    .replace(/^#{1,6}\s+/gm, " ")           // 헤딩 마커
    .replace(/^\s*[>\-*+]\s+/gm, " ")       // 인용/리스트 마커
    .replace(/[*_~#>|]/g, " ")              // 잔여 기호
    .replace(/\s+/g, " ")
    .trim();
}

export function excerptFromMarkdown(markdown: string | null, maxLen = 150): string {
  const text = stripMarkdown(markdown);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

/**
 * 본문이 헤딩으로 시작하면 그 첫 헤딩 다음의 본문부터 발췌한다 (목록 카드 미리보기용).
 * 헤딩으로 시작하지 않으면 처음부터. 헤딩 뒤 본문이 비면 전체에서 폴백.
 */
export function excerptAfterFirstHeading(markdown: string | null, maxLen = 160): string {
  if (!markdown) return "";
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++; // 선행 빈 줄
  const startLine = i < lines.length && /^#{1,6}\s+/.test(lines[i].trim()) ? i + 1 : 0;
  const text = stripMarkdown(lines.slice(startLine).join("\n"));
  if (!text) return excerptFromMarkdown(markdown, maxLen);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
}

/**
 * 스니펫용 strip — `stripMarkdown`과 달리 코드블록/인라인 코드의 **텍스트는 보존**한다.
 * 검색(searchPosts)은 원본 마크다운을 LIKE 매칭하므로, 코드 안에 있는 검색어도
 * 스니펫에서 찾아 보여줄 수 있어야 "왜 매칭됐는지"가 드러난다.
 */
function stripMarkdownKeepCode(markdown: string | null): string {
  if (!markdown) return "";
  return markdown
    .replace(/```[a-zA-Z0-9_-]*\n?/g, " ") // 코드펜스 라인만 제거, 코드 본문은 유지
    .replace(/`([^`]*)`/g, "$1")            // 인라인 코드 → 텍스트 유지
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[([^\]]*)\]\(.*?\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/^\s*[>\-*+]\s+/gm, " ")
    .replace(/[*_~#>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 검색어가 본문에 처음 등장하는 위치 주변을 잘라 평문 스니펫으로 반환 (구글 설명줄처럼).
 * 본문에 검색어가 없으면 null. 대소문자 무시.
 */
export function snippetFromMarkdown(markdown: string | null, query: string): string | null {
  const text = stripMarkdownKeepCode(markdown);
  if (!text || !query) return null;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return null;

  // 매칭어를 스니펫 "앞쪽"에 둔다 — line-clamp(2줄)에 잘려 강조가 안 보이는 걸 방지.
  // 앞 컨텍스트는 짧게, 뒤를 길게.
  const LEAD = 24;
  const TRAIL = 150;
  let start = Math.max(0, idx - LEAD);
  let end = Math.min(text.length, idx + query.length + TRAIL);
  // 단어 중간에서 잘리지 않게 가까운 공백으로 살짝 당김
  if (start > 0) {
    const sp = text.indexOf(" ", start);
    if (sp !== -1 && sp < idx) start = sp + 1;
  }
  if (end < text.length) {
    const sp = text.lastIndexOf(" ", end);
    if (sp > idx + query.length) end = sp;
  }
  return (start > 0 ? "… " : "") + text.slice(start, end).trim() + (end < text.length ? " …" : "");
}

export function extractImageUrls(markdown: string): string[] {
  const urls: string[] = [];
  const mdRegex = /!\[.*?\]\((.*?)\)/g;
  const imgRegex = /<img[^>]+src=["'](.*?)["'][^>]*>/g;
  let match;
  while ((match = mdRegex.exec(markdown)) !== null) {
    if (!isBadgeUrl(match[1])) urls.push(match[1]);
  }
  while ((match = imgRegex.exec(markdown)) !== null) {
    if (!isBadgeUrl(match[1])) urls.push(match[1]);
  }
  return [...new Set(urls)];
}

export function getOrphanedImages(
  oldContent: string,
  newContent: string,
  oldThumbnail: string | null,
  newThumbnail: string | null
): string[] {
  const oldUrls = new Set([
    ...extractImageUrls(oldContent),
    ...(oldThumbnail ? [oldThumbnail] : []),
  ]);
  const newUrls = new Set([
    ...extractImageUrls(newContent),
    ...(newThumbnail ? [newThumbnail] : []),
  ]);
  return [...oldUrls].filter((url) => !newUrls.has(url));
}
