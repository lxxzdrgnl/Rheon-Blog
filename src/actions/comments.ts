"use server";

import { db } from "@/db";
import { comments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function getComments(postId: number) {
  return db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(comments.createdAt)
    .all();
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
