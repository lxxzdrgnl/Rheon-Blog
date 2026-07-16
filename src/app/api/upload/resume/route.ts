import { NextRequest, NextResponse } from "next/server";
import { saveResumePdf } from "@/actions/resume";

export async function POST(request: NextRequest) {
  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error("Failed to parse form data:", error);
    return NextResponse.json({ error: "요청 형식이 잘못되었습니다." }, { status: 400 });
  }

  try {
    const file = formData.get("file") as File | null;
    const locale = formData.get("locale");

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
    }
    if (locale !== "ko" && locale !== "en") {
      return NextResponse.json({ error: "locale은 ko 또는 en이어야 합니다." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await saveResumePdf(locale, buffer, file.name, file.type);

    return NextResponse.json({ url });
  } catch (error) {
    // 검증 실패는 사용자에게 보여줄 메시지를 담고 있다.
    const message = error instanceof Error ? error.message : "";
    if (message.includes("PDF") || message.includes("10MB")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Resume PDF upload error:", error);
    return NextResponse.json({ error: "업로드에 실패했습니다." }, { status: 500 });
  }
}
