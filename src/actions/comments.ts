"use server";

import { db } from "@/db";
import { comments, posts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/password";
import { verifyAccessToken } from "@/lib/auth";
import { getSetting } from "@/actions/settings";
import { SITE_URL } from "@/lib/locale";
import { notifyNewComment } from "@/lib/notify";

async function requireAdmin() {
  const token = (await cookies()).get("access_token")?.value;
  if (!token || !(await verifyAccessToken(token))) throw new Error("Unauthorized");
}

export async function getComments(postId: number) {
  return db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt)
    .all();
}

/** 관리자 대시보드용 — 전체 글에서 최근 댓글(글 제목·slug 포함). */
export async function getRecentComments(limit = 10) {
  return db
    .select({
      id: comments.id,
      nickname: comments.nickname,
      content: comments.content,
      createdAt: comments.createdAt,
      isDeleted: comments.isDeleted,
      isOwner: comments.isOwner,
      parentId: comments.parentId,
      postId: comments.postId,
      postTitle: posts.title,
      postSlug: posts.slug,
    })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .all();
}

/** 관리자 답글 — 운영자(블로그 주인)로 댓글에 답글. parentId는 최상위 부모로 정규화. */
export async function adminReply(input: { postId: number; commentId: number; content: string; slug: string }) {
  await requireAdmin();
  const { postId, commentId, content, slug } = input;
  if (!content.trim()) return { error: "내용을 입력하세요." };

  // 답글에 답글이면 그 부모(최상위)에 이어 붙인다(2단 평면 유지).
  const target = db.select().from(comments).where(eq(comments.id, commentId)).get();
  const parentId = target?.parentId ?? commentId;

  const nickname = ((await getSetting("resume_name")) as string) || "운영자";
  const placeholderPw = await hashPassword(randomUUID()); // 공개 비번삭제 불가(관리자만 삭제)

  db.insert(comments)
    .values({ postId, parentId, nickname, password: placeholderPw, content, isOwner: true })
    .run();

  revalidatePath(`/post/${slug}`);
  return { ok: true };
}

/** 관리자 삭제 — 비밀번호 없이 소프트 삭제(인증된 관리자만). */
export async function adminDeleteComment(commentId: number, slug: string) {
  await requireAdmin();
  db.update(comments).set({ isDeleted: true }).where(eq(comments.id, commentId)).run();
  revalidatePath(`/post/${slug}`);
  return { ok: true };
}

export async function createComment(formData: FormData) {
  const postId = Number(formData.get("postId"));
  const parentId = formData.get("parentId") ? Number(formData.get("parentId")) : null;
  const nickname = formData.get("nickname") as string;
  const password = formData.get("password") as string;
  const content = formData.get("content") as string;
  const slug = formData.get("slug") as string;

  const hashedPw = await hashPassword(password);

  db.insert(comments)
    .values({ postId, parentId, nickname, password: hashedPw, content })
    .run();

  // 운영자 디스코드 알림(설정 시). 실패해도 댓글 작성에 영향 없음.
  try {
    const post = db.select({ title: posts.title }).from(posts).where(eq(posts.id, postId)).get();
    await notifyNewComment({ nickname, content, parentId, postTitle: post?.title ?? slug, url: `${SITE_URL}/ko/post/${slug}` });
  } catch {}

  revalidatePath(`/post/${slug}`);
}

export async function deleteComment(formData: FormData) {
  const commentId = Number(formData.get("commentId"));
  const password = formData.get("password") as string;
  const slug = formData.get("slug") as string;

  const comment = db.select().from(comments).where(eq(comments.id, commentId)).get();
  if (!comment) return { error: "댓글을 찾을 수 없습니다." };

  const valid = await verifyPassword(password, comment.password);
  if (!valid) return { error: "비밀번호가 일치하지 않습니다." };

  db.update(comments)
    .set({ isDeleted: true })
    .where(eq(comments.id, commentId))
    .run();

  revalidatePath(`/post/${slug}`);
  return { ok: true };
}
