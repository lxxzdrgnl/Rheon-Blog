import { NextRequest, NextResponse } from "next/server";
import { incrementViewCount } from "@/actions/posts";

// KST 기준 오늘 날짜 (YYYY-MM-DD)
function todayKST() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

const MAX_SLUGS = 60;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const today = todayKST();

  // 쿠키 "YYYY-MM-DD|slug1|slug2|...". 네이버식 자정 리셋 — KST 날짜가 바뀌면 본 목록 초기화.
  // (Today=site_views도 KST 달력일 기준이라 dedup과 정확히 일치)
  const [day, ...rest] = (request.cookies.get("viewed_posts")?.value || "").split("|");
  const seenToday = day === today ? rest.filter(Boolean) : [];

  if (seenToday.includes(slug)) {
    return NextResponse.json({ counted: false });
  }

  await incrementViewCount(slug);

  const nextSeen = [...seenToday, slug].slice(-MAX_SLUGS);
  const response = NextResponse.json({ counted: true });
  response.cookies.set("viewed_posts", [today, ...nextSeen].join("|"), {
    maxAge: 60 * 60 * 30, // 30h — 날짜 체크로 자정 리셋
    path: "/",
    httpOnly: false,
  });

  return response;
}
