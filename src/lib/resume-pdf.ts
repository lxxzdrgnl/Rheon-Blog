export type ResumeLocale = "ko" | "en";

export const MAX_RESUME_PDF_BYTES = 10 * 1024 * 1024;

/** 클라이언트가 보낸 mimeType은 위조 가능하므로 실제 바이트로 판별한다. */
export function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 4 && buf.subarray(0, 4).toString("ascii") === "%PDF";
}

export function resumePdfSettingKey(locale: ResumeLocale): string {
  return `resume_pdf_${locale}`;
}

export function validateResumePdf(
  buf: Buffer,
  contentType: string,
): { ok: true } | { ok: false; error: string } {
  const type = contentType.split(";")[0].trim().toLowerCase();
  if (type !== "application/pdf") {
    return { ok: false, error: "PDF 파일만 업로드할 수 있습니다." };
  }
  if (!isPdfBuffer(buf)) {
    return { ok: false, error: "PDF 파일만 업로드할 수 있습니다. (파일 내용이 PDF가 아닙니다)" };
  }
  if (buf.length > MAX_RESUME_PDF_BYTES) {
    return { ok: false, error: "이력서 PDF는 10MB 이하여야 합니다." };
  }
  return { ok: true };
}
