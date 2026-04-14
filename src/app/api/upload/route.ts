import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/minio";
import { verifyAccessToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  if (!token || !verifyAccessToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadImage(buffer, file.name, file.type);

  return NextResponse.json({ url });
}
