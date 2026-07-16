import { basename } from "node:path";

export type ResumeLocale = "ko" | "en";

export const MAX_RESUME_PDF_BYTES = 10 * 1024 * 1024;

/** 클라이언트가 보낸 mimeType은 위조 가능하므로 실제 바이트로 판별한다. */
export function isPdfBuffer(buf: Buffer): boolean {
  return buf.length >= 4 && buf.subarray(0, 4).equals(Buffer.from("%PDF", "ascii"));
}

export function resumePdfSettingKey(locale: ResumeLocale): string {
  return `resume_pdf_${locale}`;
}

/**
 * RFC 5987 attr-char에는 `encodeURIComponent`가 이스케이프하지 않는
 * `'`, `(`, `)`, `*`가 빠져 있으므로 추가로 percent-encode 한다.
 */
function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(
    /[*'()]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * 이력서 PDF 다운로드용 Content-Disposition 헤더를 조립하는 순수 함수.
 * - ASCII 폴백(`filename=`)에서는 quoted-string을 깨는 `"`와 `\`를 모두 제거한다.
 * - 원본 파일명(`filename*=UTF-8''...`)은 RFC 5987에 맞게 percent-encode 한다.
 */
export function resumeContentDisposition(originalName: string): string {
  const base = basename(originalName || "resume.pdf") || "resume.pdf";
  const isAsciiPrintable = /^[\x20-\x7e]+$/.test(base);
  const fallbackName = (isAsciiPrintable ? base.replace(/["\\]/g, "") : "") || "resume.pdf";

  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeRfc5987(base)}`;
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
