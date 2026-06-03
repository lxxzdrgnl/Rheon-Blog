export interface PostInput {
  id?: number;
  title: string;
  content: string;
  categoryId: number;
  slug?: string;
  thumbnail?: string;
  tagIds?: number[];
  seriesId?: number;
  seriesOrder?: number;
  thumbnailTextLength?: number;
  thumbnailTextLengthEn?: number;
  publish?: boolean;
  isPrivate?: boolean;
  titleEn?: string;
  contentEn?: string;
}

export interface PortfolioInput {
  id?: number;
  title: string;
  titleEn?: string;
  description: string;
  descriptionEn?: string;
  content?: string;
  contentEn?: string;
  techStack: string; // 콤마 구분 문자열 (createPortfolio가 split함)
  link?: string;
  icon?: string;
  thumbnail?: string;
  postIds?: number[];
}

function setIf(fd: FormData, key: string, v: string | number | undefined | null) {
  if (v !== undefined && v !== null) fd.set(key, String(v));
}

export function buildPostFormData(input: PostInput): FormData {
  const fd = new FormData();
  setIf(fd, "id", input.id);
  fd.set("title", input.title);
  fd.set("content", input.content);
  fd.set("categoryId", String(input.categoryId));
  setIf(fd, "slug", input.slug);
  setIf(fd, "thumbnail", input.thumbnail);
  fd.set("tagIds", JSON.stringify(input.tagIds ?? []));
  setIf(fd, "seriesId", input.seriesId);
  setIf(fd, "seriesOrder", input.seriesOrder);
  setIf(fd, "thumbnailTextLength", input.thumbnailTextLength);
  setIf(fd, "thumbnailTextLengthEn", input.thumbnailTextLengthEn);
  fd.set("publish", input.publish ? "true" : "false");
  fd.set("isPrivate", input.isPrivate ? "true" : "false");
  setIf(fd, "titleEn", input.titleEn);
  setIf(fd, "contentEn", input.contentEn);
  return fd;
}

export function buildPortfolioFormData(input: PortfolioInput): FormData {
  const fd = new FormData();
  setIf(fd, "id", input.id);
  fd.set("title", input.title);
  setIf(fd, "titleEn", input.titleEn);
  fd.set("description", input.description);
  setIf(fd, "descriptionEn", input.descriptionEn);
  setIf(fd, "content", input.content);
  setIf(fd, "contentEn", input.contentEn);
  fd.set("techStack", input.techStack);
  setIf(fd, "link", input.link);
  setIf(fd, "icon", input.icon);
  setIf(fd, "thumbnail", input.thumbnail);
  fd.set("postIds", JSON.stringify(input.postIds ?? []));
  return fd;
}
