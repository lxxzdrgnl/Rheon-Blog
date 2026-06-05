import { redirect } from "next/navigation";

// 시리즈 관리는 콘텐츠 허브(/my/posts)의 탭으로 통합됨.
export default function SeriesPage() {
  redirect("/my/posts?tab=series");
}
