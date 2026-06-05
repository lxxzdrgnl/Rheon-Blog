function isBadgeUrl(url: string): boolean {
  return url.includes("img.shields.io");
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
