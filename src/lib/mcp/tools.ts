import { z } from "zod";
import { getPosts, getPostBySlug, getPostById, getPostRaw, getPostTags, savePost, deletePost } from "@/actions/posts";
import {
  getPortfolios, getPortfolioBySlug, getPortfolioById, getPortfolioRaw,
  createPortfolio, updatePortfolio, deletePortfolio,
  updatePostProjects, getProjectsForPost, getPortfolioPosts,
} from "@/actions/portfolios";
import {
  getExperiences, createExperience, updateExperience, deleteExperience,
  getEducation, createEducation, updateEducation, deleteEducation,
  getSkills, createSkill, updateSkill, deleteSkill,
  getActivities, createActivity, updateActivity, deleteActivity,
  getSocialLinks, createSocialLink, updateSocialLink, deleteSocialLink,
} from "@/actions/resume";
import { getTags, createTag } from "@/actions/tags";
import { getAllSeries, createSeries } from "@/actions/series";
import { getCategoriesWithCount, createCategory } from "@/actions/categories";
import { resolveTags, resolveSeries } from "@/lib/mcp/taxonomy";
import { buildPostFormData, buildPortfolioFormData } from "@/lib/mcp/formdata";
import { uploadImage } from "@/lib/minio";

export interface ToolDef {
  name: string;
  description: string;
  schema: z.ZodType;
  handler: (args: unknown) => Promise<unknown>;
}

const postBody = {
  title: z.string(),
  content: z.string(),
  categoryId: z.number().int(),
  slug: z.string().optional(),
  thumbnail: z.string().optional(),
  publish: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  series: z.string().optional(),
  seriesOrder: z.number().int().optional(),
  projectIds: z.array(z.number().int()).optional(),
  titleEn: z.string().optional(),
  contentEn: z.string().optional(),
  showTitleOnThumbnail: z.boolean().optional(),
};
const portfolioBody = {
  title: z.string(),
  description: z.string(),
  titleEn: z.string().optional(),
  descriptionEn: z.string().optional(),
  content: z.string().optional(),
  contentEn: z.string().optional(),
  techStack: z.string(),
  link: z.string().optional(),
  icon: z.string().optional(),
  thumbnail: z.string().optional(),
  inProgress: z.boolean().optional().describe("아직 만들고 있는 프로젝트면 true — 목록·상세에 진행중 뱃지가 붙는다"),
  isTeam: z.boolean().optional().describe("팀 프로젝트면 true. false면 members는 무시되고 비워진다"),
  members: z
    .string()
    .optional()
    .describe(
      '팀원 JSON 배열 문자열. [{"name","nameEn?","github?","role","roleEn?","isMe?"}] — role은 자유 서술이고, 본인 행은 {"isMe":true,"name":"","role":"..."}처럼 이름·github를 비워 둔다(프로필에서 자동으로 채움)',
    ),
  postIds: z.array(z.number().int()).optional(),
};

const RESUME_SCHEMAS = {
  experience: z.object({ company: z.string(), companyEn: z.string().optional(), role: z.string(), roleEn: z.string().optional(), description: z.string().optional(), descriptionEn: z.string().optional(), startDate: z.string(), endDate: z.string().optional() }),
  activity: z.object({ title: z.string(), titleEn: z.string().optional(), organization: z.string(), organizationEn: z.string().optional(), date: z.string(), description: z.string().optional(), descriptionEn: z.string().optional(), link: z.string().optional() }),
  skill: z.object({ name: z.string(), category: z.string(), categoryEn: z.string().optional() }),
  education: z.object({ school: z.string(), schoolEn: z.string().optional(), degree: z.string().optional(), degreeEn: z.string().optional(), field: z.string().optional(), fieldEn: z.string().optional(), startDate: z.string(), endDate: z.string().optional(), description: z.string().optional(), descriptionEn: z.string().optional() }),
  social: z.object({ platform: z.string(), url: z.string() }),
} as const;
type ResumeType = keyof typeof RESUME_SCHEMAS;

// 분류 체계는 name/nameEn(notNull)을 요구하므로 type별로 명시 검증한다.
// (태그·시리즈를 이름만으로 자동 생성하고 싶으면 create_post의 tags/series를 쓰면 됨.)
const TAXONOMY_SCHEMAS = {
  category: z.object({ name: z.string(), nameEn: z.string(), parentId: z.number().int().optional() }),
  tag: z.object({ name: z.string(), nameEn: z.string() }),
  series: z.object({ title: z.string(), titleEn: z.string().optional(), description: z.string().optional(), descriptionEn: z.string().optional() }),
} as const;
type TaxonomyType = keyof typeof TAXONOMY_SCHEMAS;

async function createPostFromInput(input: z.infer<z.ZodObject<typeof postBody>>) {
  const tagIds = input.tags?.length ? await resolveTags(input.tags) : [];
  const seriesId = input.series ? (await resolveSeries(input.series)) ?? undefined : undefined;
  const fd = buildPostFormData({
    title: input.title, content: input.content, categoryId: input.categoryId,
    slug: input.slug, thumbnail: input.thumbnail, publish: input.publish, isPrivate: input.isPrivate,
    tagIds, seriesId, seriesOrder: input.seriesOrder, titleEn: input.titleEn, contentEn: input.contentEn,
    showTitleOnThumbnail: input.showTitleOnThumbnail,
  });
  const { postId, slug } = await savePost(fd);
  if (input.projectIds) await updatePostProjects(postId, input.projectIds);
  return { postId, slug };
}

// 부분수정(PATCH): 입력에 들어온 필드만 덮어쓰고, 빠진 필드·연결(시리즈·태그·프로젝트)은 현재값을 보존한다.
// undefined = 보존, null/빈배열 = 해제.
type PostUpdateInput = Partial<z.infer<z.ZodObject<typeof postBody>>> & { id: number; series?: string | null };
async function updatePostFromInput(input: PostUpdateInput) {
  const current = await getPostRaw(input.id);
  if (!current) throw new Error(`글 id=${input.id}을(를) 찾을 수 없습니다.`);

  const tagIds =
    input.tags !== undefined
      ? input.tags.length
        ? await resolveTags(input.tags)
        : []
      : (await getPostTags(input.id)).map((t) => t.id);

  let seriesId: number | undefined;
  if (input.series !== undefined) {
    seriesId = input.series ? (await resolveSeries(input.series)) ?? undefined : undefined; // null/"" → 해제
  } else {
    seriesId = current.seriesId ?? undefined;
  }

  const projectIds =
    input.projectIds !== undefined ? input.projectIds : (await getProjectsForPost(input.id)).map((p) => p.id);

  const fd = buildPostFormData({
    id: input.id,
    title: input.title ?? current.title,
    content: input.content ?? current.content,
    categoryId: input.categoryId ?? current.categoryId,
    slug: input.slug ?? current.slug,
    thumbnail: input.thumbnail ?? current.thumbnail ?? undefined,
    tagIds,
    seriesId,
    seriesOrder: input.seriesOrder ?? current.seriesOrder ?? undefined,
    thumbnailTextLength: current.thumbnailTextLength ?? undefined,
    thumbnailTextLengthEn: current.thumbnailTextLengthEn ?? undefined,
    showTitleOnThumbnail: input.showTitleOnThumbnail ?? current.showTitleOnThumbnail,
    publish: input.publish ?? current.isPublished,
    isPrivate: input.isPrivate ?? current.isPrivate,
    titleEn: input.titleEn ?? current.titleEn ?? undefined,
    contentEn: input.contentEn ?? current.contentEn ?? undefined,
  });
  const { postId, slug } = await savePost(fd);
  await updatePostProjects(postId, projectIds);
  return { postId, slug };
}

// 부분수정(PATCH) for 프로젝트: 빠진 필드·연결(postIds·techStack)은 현재값 보존.
type PortfolioUpdateInput = Partial<z.infer<z.ZodObject<typeof portfolioBody>>> & { id: number };
async function updatePortfolioFromInput(input: PortfolioUpdateInput) {
  const current = await getPortfolioRaw(input.id);
  if (!current) throw new Error(`프로젝트 id=${input.id}을(를) 찾을 수 없습니다.`);

  const postIds =
    input.postIds !== undefined ? input.postIds : (await getPortfolioPosts(input.id)).map((p) => p.id);
  const techStack =
    input.techStack !== undefined
      ? input.techStack
      : (JSON.parse(current.techStack || "[]") as string[]).join(", ");

  const fd = buildPortfolioFormData({
    id: input.id,
    title: input.title ?? current.title,
    description: input.description ?? current.description,
    titleEn: input.titleEn ?? current.titleEn ?? undefined,
    descriptionEn: input.descriptionEn ?? current.descriptionEn ?? undefined,
    content: input.content ?? current.content ?? undefined,
    contentEn: input.contentEn ?? current.contentEn ?? undefined,
    techStack,
    link: input.link ?? current.link ?? undefined,
    icon: input.icon ?? current.icon ?? undefined,
    thumbnail: input.thumbnail ?? current.thumbnail ?? undefined,
    inProgress: input.inProgress ?? current.inProgress,
    isTeam: input.isTeam ?? current.isTeam,
    members: input.members ?? current.members ?? undefined,
    postIds,
  });
  await updatePortfolio(fd);
  return { updated: true };
}

// 읽기 도구가 연결 정보를 함께 돌려주도록 보강 — 라운드트립 보존을 위해.
async function enrichPost<T extends { id: number; seriesId: number | null } | null | undefined>(post: T) {
  if (!post) return post;
  const [postTagList, projects, allSeries] = await Promise.all([
    getPostTags(post.id),
    getProjectsForPost(post.id),
    getAllSeries(),
  ]);
  const series = post.seriesId != null ? allSeries.find((s) => s.id === post.seriesId) : null;
  return {
    ...post,
    tags: postTagList.map((t) => t.name),
    projectIds: projects.map((p) => p.id),
    seriesName: series ? series.title : null,
  };
}

async function enrichPortfolio<T extends { id: number } | null | undefined>(portfolio: T) {
  if (!portfolio) return portfolio;
  const linked = await getPortfolioPosts(portfolio.id);
  return { ...portfolio, postIds: linked.map((p) => p.id) };
}

const RESUME_OPS = {
  experience: { list: getExperiences, create: createExperience, update: updateExperience, del: deleteExperience },
  activity: { list: getActivities, create: createActivity, update: updateActivity, del: deleteActivity },
  skill: { list: getSkills, create: createSkill, update: updateSkill, del: deleteSkill },
  education: { list: getEducation, create: createEducation, update: updateEducation, del: deleteEducation },
  social: { list: getSocialLinks, create: createSocialLink, update: updateSocialLink, del: deleteSocialLink },
} as const;

export const TOOLS: ToolDef[] = [
  { name: "list_posts", description: "블로그 글 목록 조회. published/categoryId/limit/offset로 필터.",
    schema: z.object({ published: z.boolean().optional(), categoryId: z.number().int().optional(), limit: z.number().int().optional(), offset: z.number().int().optional() }),
    handler: async (a) => getPosts(a as Record<string, never>) },
  { name: "get_post", description: "slug 또는 id로 단일 글 조회. 응답에 연결 정보(tags·projectIds·seriesName) 포함.",
    schema: z.object({ slug: z.string().optional(), id: z.number().int().optional() }),
    handler: async (a) => { const { slug, id } = a as { slug?: string; id?: number }; if (slug) return enrichPost(await getPostBySlug(slug)); if (id != null) return enrichPost(await getPostById(id)); throw new Error("slug 또는 id가 필요합니다."); } },
  { name: "create_post", description: "새 블로그 글 작성. tags/series는 이름으로 주면 없을 때 자동 생성. projectIds로 프로젝트 연결.",
    schema: z.object(postBody),
    handler: async (a) => createPostFromInput(a as never) },
  { name: "update_post", description: "기존 글 부분수정(PATCH). id만 필수. 보낸 필드만 바뀌고 빠진 필드·연결(series·tags·projectIds)은 그대로 유지됨. 해제하려면 series:null, tags:[], projectIds:[]를 명시.",
    schema: z.object(postBody).partial().extend({ id: z.number().int(), series: z.string().nullable().optional() }),
    handler: async (a) => updatePostFromInput(a as never) },
  { name: "delete_post", description: "id로 글 삭제(연결 이미지도 정리).",
    schema: z.object({ id: z.number().int() }),
    handler: async (a) => { await deletePost((a as { id: number }).id); return { deleted: true }; } },

  { name: "list_portfolios", description: "프로젝트(포트폴리오) 목록 조회.",
    schema: z.object({}), handler: async () => getPortfolios() },
  { name: "get_portfolio", description: "slug 또는 id로 단일 프로젝트 조회. 응답에 연결된 postIds 포함.",
    schema: z.object({ slug: z.string().optional(), id: z.number().int().optional() }),
    handler: async (a) => { const { slug, id } = a as { slug?: string; id?: number }; if (slug) return enrichPortfolio(await getPortfolioBySlug(slug)); if (id != null) return enrichPortfolio(await getPortfolioById(id)); throw new Error("slug 또는 id가 필요합니다."); } },
  { name: "create_portfolio", description: "새 프로젝트 작성. techStack은 콤마구분 문자열. postIds로 관련 글 연결.",
    schema: z.object(portfolioBody),
    handler: async (a) => { await createPortfolio(buildPortfolioFormData(a as never)); return { created: true }; } },
  { name: "update_portfolio", description: "기존 프로젝트 부분수정(PATCH). id만 필수. 보낸 필드만 바뀌고 빠진 필드·연결(postIds·techStack)은 그대로 유지됨. 글 연결을 비우려면 postIds:[]를 명시.",
    schema: z.object(portfolioBody).partial().extend({ id: z.number().int() }),
    handler: async (a) => updatePortfolioFromInput(a as never) },
  { name: "delete_portfolio", description: "id로 프로젝트 삭제.",
    schema: z.object({ id: z.number().int() }),
    handler: async (a) => { await deletePortfolio((a as { id: number }).id); return { deleted: true }; } },

  { name: "resume_list", description: "경력/활동/스킬/학력/소셜링크 목록 조회.",
    schema: z.object({ type: z.enum(["experience", "activity", "skill", "education", "social"]) }),
    handler: async (a) => RESUME_OPS[(a as { type: ResumeType }).type].list() },
  { name: "resume_create", description: "경력/활동/스킬/학력/소셜링크 생성. type별 data 필드가 다름.",
    schema: z.object({ type: z.enum(["experience", "activity", "skill", "education", "social"]), data: z.record(z.string(), z.unknown()) }),
    handler: async (a) => { const { type, data } = a as { type: ResumeType; data: unknown }; const parsed = RESUME_SCHEMAS[type].parse(data); await (RESUME_OPS[type].create as (d: unknown) => Promise<void>)(parsed); return { created: true }; } },
  { name: "resume_update", description: "경력 등 항목 부분수정(PATCH). type/id 필수. 보낸 data 필드만 바뀌고 나머지는 그대로 유지됨.",
    schema: z.object({ type: z.enum(["experience", "activity", "skill", "education", "social"]), id: z.number().int(), data: z.record(z.string(), z.unknown()) }),
    handler: async (a) => { const { type, id, data } = a as { type: ResumeType; id: number; data: unknown }; const parsed = RESUME_SCHEMAS[type].partial().parse(data); if (Object.keys(parsed).length === 0) throw new Error("수정할 필드를 하나 이상 보내세요."); await (RESUME_OPS[type].update as (id: number, d: unknown) => Promise<void>)(id, parsed); return { updated: true }; } },
  { name: "resume_delete", description: "경력 등 항목 삭제. type/id 필수.",
    schema: z.object({ type: z.enum(["experience", "activity", "skill", "education", "social"]), id: z.number().int() }),
    handler: async (a) => { const { type, id } = a as { type: ResumeType; id: number }; await RESUME_OPS[type].del(id); return { deleted: true }; } },

  { name: "taxonomy_list", description: "카테고리/태그/시리즈 목록 조회(글·프로젝트 작성 시 참조용).",
    schema: z.object({ type: z.enum(["category", "tag", "series"]) }),
    handler: async (a) => { const t = (a as { type: string }).type; if (t === "category") return getCategoriesWithCount(); if (t === "tag") return getTags(); return getAllSeries(); } },
  { name: "taxonomy_create", description: "카테고리/태그/시리즈 생성. category/tag는 name·nameEn(영문명) 필수.",
    schema: z.object({ type: z.enum(["category", "tag", "series"]), data: z.record(z.string(), z.unknown()) }),
    handler: async (a) => {
      const { type, data } = a as { type: TaxonomyType; data: unknown };
      if (type === "category") {
        const d = TAXONOMY_SCHEMAS.category.parse(data);
        const fd = new FormData();
        fd.set("name", d.name); fd.set("nameEn", d.nameEn);
        if (d.parentId != null) fd.set("parentId", String(d.parentId));
        await createCategory(fd); return { created: true };
      }
      if (type === "tag") {
        const d = TAXONOMY_SCHEMAS.tag.parse(data);
        return createTag(d.name, d.nameEn);
      }
      const d = TAXONOMY_SCHEMAS.series.parse(data);
      return createSeries(d);
    } },

  { name: "upload_image", description: "이미지를 스토리지(MinIO)에 업로드하고 공개 URL을 반환. dataBase64는 데이터URI 접두어 없는 순수 base64. 반환된 url을 글/프로젝트 본문에 ![](url) 또는 <img src=\"url\">로 삽입한다.",
    schema: z.object({ filename: z.string(), mimeType: z.string(), dataBase64: z.string() }),
    handler: async (a) => {
      const { filename, mimeType, dataBase64 } = a as { filename: string; mimeType: string; dataBase64: string };
      const buffer = Buffer.from(dataBase64, "base64");
      const url = await uploadImage(buffer, filename, mimeType);
      return { url };
    } },
];

export const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));
