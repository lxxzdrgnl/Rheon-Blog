"use server";

import { setAuthCookies, clearAuthCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const id = formData.get("id") as string;
  const password = formData.get("password") as string;

  if (id !== process.env.ADMIN_ID || password !== process.env.ADMIN_PASSWORD) {
    return { error: "아이디 또는 비밀번호가 일치하지 않습니다." };
  }

  await setAuthCookies(id);
  redirect("/my");
}

export async function logout() {
  await clearAuthCookies();
  redirect("/my/login");
}
