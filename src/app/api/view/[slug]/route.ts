import { NextRequest, NextResponse } from "next/server";
import { incrementViewCount } from "@/actions/posts";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Check cookie to prevent duplicate views
  const viewedPosts = request.cookies.get("viewed_posts")?.value || "";
  const viewedList = viewedPosts ? viewedPosts.split(",") : [];

  if (viewedList.includes(slug)) {
    return NextResponse.json({ counted: false });
  }

  await incrementViewCount(slug);

  // Add slug to viewed list, keep cookie for 24 hours
  viewedList.push(slug);
  const response = NextResponse.json({ counted: true });
  response.cookies.set("viewed_posts", viewedList.join(","), {
    maxAge: 24 * 60 * 60,
    path: "/",
    httpOnly: false,
  });

  return response;
}
