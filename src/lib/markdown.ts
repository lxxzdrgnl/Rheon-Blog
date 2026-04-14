function isBadgeUrl(url: string): boolean {
  return url.includes("img.shields.io");
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
