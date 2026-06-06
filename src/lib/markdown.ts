function isBadgeUrl(url: string): boolean {
  return url.includes("img.shields.io");
}

/** 의존성 없는 경량 마크다운→HTML 변환(RSS content:encoded용). 원본 HTML(img 등)은 그대로 통과. */
export function markdownToHtml(md: string | null): string {
  if (!md) return "";
  const escCode = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    s
      .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g, (_m, a, u) => `<img src="${u}" alt="${a}" />`)
      .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, (_m, t, u) => `<a href="${u}">${t}</a>`)
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
  return out.join("\n");
}

/** 마크다운에서 서식을 걷어내고 본문 앞부분을 발췌(미리보기)로 만든다. */
export function excerptFromMarkdown(markdown: string | null, maxLen = 150): string {
  if (!markdown) return "";
  const text = markdown
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
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "…";
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
