import { z } from "zod";
import { getPosts, getPostBySlug, getPostById, savePost, deletePost } from "@/actions/posts";
import {
  getPortfolios, getPortfolioBySlug, getPortfolioById,
  createPortfolio, updatePortfolio, deletePortfolio, updatePostProjects,
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

async function savePostFromInput(input: z.infer<z.ZodObject<typeof postBody>> & { id?: number }) {
  const tagIds = input.tags?.length ? await resolveTags(input.tags) : [];
  const seriesId = input.series ? (await resolveSeries(input.series)) ?? undefined : undefined;
  const fd = buildPostFormData({
    id: input.id, title: input.title, content: input.content, categoryId: input.categoryId,
    slug: input.slug, thumbnail: input.thumbnail, publish: input.publish, isPrivate: input.isPrivate,
    tagIds, seriesId, seriesOrder: input.seriesOrder, titleEn: input.titleEn, contentEn: input.contentEn,
  });
  const { postId, slug } = await savePost(fd);
  if (input.projectIds) await updatePostProjects(postId, input.projectIds);
  return { postId, slug };
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
  { name: "get_post", description: "slug 또는 id로 단일 글 조회.",
    schema: z.object({ slug: z.string().optional(), id: z.number().int().optional() }),
    handler: async (a) => { const { slug, id } = a as { slug?: string; id?: number }; if (slug) return getPostBySlug(slug); if (id != null) return getPostById(id); throw new Error("slug 또는 id가 필요합니다."); } },
  { name: "create_post", description: "새 블로그 글 작성. tags/series는 이름으로 주면 없을 때 자동 생성. projectIds로 프로젝트 연결.",
    schema: z.object(postBody),
    handler: async (a) => savePostFromInput(a as never) },
  { name: "update_post", description: "기존 글 수정. id 필수. 나머지는 create_post와 동일.",
    schema: z.object({ id: z.number().int(), ...postBody }),
    handler: async (a) => savePostFromInput(a as never) },
  { name: "delete_post", description: "id로 글 삭제(연결 이미지도 정리).",
    schema: z.object({ id: z.number().int() }),
    handler: async (a) => { await deletePost((a as { id: number }).id); return { deleted: true }; } },

  { name: "list_portfolios", description: "프로젝트(포트폴리오) 목록 조회.",
    schema: z.object({}), handler: async () => getPortfolios() },
  { name: "get_portfolio", description: "slug 또는 id로 단일 프로젝트 조회.",
    schema: z.object({ slug: z.string().optional(), id: z.number().int().optional() }),
    handler: async (a) => { const { slug, id } = a as { slug?: string; id?: number }; if (slug) return getPortfolioBySlug(slug); if (id != null) return getPortfolioById(id); throw new Error("slug 또는 id가 필요합니다."); } },
  { name: "create_portfolio", description: "새 프로젝트 작성. techStack은 콤마구분 문자열. postIds로 관련 글 연결.",
    schema: z.object(portfolioBody),
    handler: async (a) => { await createPortfolio(buildPortfolioFormData(a as never)); return { created: true }; } },
  { name: "update_portfolio", description: "기존 프로젝트 수정. id 필수.",
    schema: z.object({ id: z.number().int(), ...portfolioBody }),
    handler: async (a) => { await updatePortfolio(buildPortfolioFormData(a as never)); return { updated: true }; } },
  { name: "delete_portfolio", description: "id로 프로젝트 삭제.",
    schema: z.object({ id: z.number().int() }),
    handler: async (a) => { await deletePortfolio((a as { id: number }).id); return { deleted: true }; } },

  { name: "resume_list", description: "경력/활동/스킬/학력/소셜링크 목록 조회.",
    schema: z.object({ type: z.enum(["experience", "activity", "skill", "education", "social"]) }),
    handler: async (a) => RESUME_OPS[(a as { type: ResumeType }).type].list() },
  { name: "resume_create", description: "경력/활동/스킬/학력/소셜링크 생성. type별 data 필드가 다름.",
    schema: z.object({ type: z.enum(["experience", "activity", "skill", "education", "social"]), data: z.record(z.string(), z.unknown()) }),
    handler: async (a) => { const { type, data } = a as { type: ResumeType; data: unknown }; const parsed = RESUME_SCHEMAS[type].parse(data); await (RESUME_OPS[type].create as (d: unknown) => Promise<void>)(parsed); return { created: true }; } },
  { name: "resume_update", description: "경력 등 항목 수정. type/id 필수.",
    schema: z.object({ type: z.enum(["experience", "activity", "skill", "education", "social"]), id: z.number().int(), data: z.record(z.string(), z.unknown()) }),
    handler: async (a) => { const { type, id, data } = a as { type: ResumeType; id: number; data: unknown }; const parsed = RESUME_SCHEMAS[type].parse(data); await (RESUME_OPS[type].update as (id: number, d: unknown) => Promise<void>)(id, parsed); return { updated: true }; } },
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
];

export const TOOL_MAP = new Map(TOOLS.map((t) => [t.name, t]));
