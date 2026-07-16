import { describe, it, expect } from "vitest";
import {
  isPdfBuffer,
  resumePdfSettingKey,
  validateResumePdf,
  MAX_RESUME_PDF_BYTES,
} from "@/lib/resume-pdf";

const pdfBuf = (size = 1024) => {
  const buf = Buffer.alloc(size, 0);
  buf.write("%PDF-1.7", 0, "ascii");
  return buf;
};
const pngBuf = () => Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("isPdfBuffer", () => {
  it("%PDF 헤더면 true", () => {
    expect(isPdfBuffer(pdfBuf())).toBe(true);
  });
  it("PNG 헤더면 false", () => {
    expect(isPdfBuffer(pngBuf())).toBe(false);
  });
  it("4바이트 미만이면 false", () => {
    expect(isPdfBuffer(Buffer.from("%PD", "ascii"))).toBe(false);
  });
});

describe("resumePdfSettingKey", () => {
  it("locale별 settings 키를 만든다", () => {
    expect(resumePdfSettingKey("ko")).toBe("resume_pdf_ko");
    expect(resumePdfSettingKey("en")).toBe("resume_pdf_en");
  });
});

describe("validateResumePdf", () => {
  it("application/pdf + %PDF 헤더 + 크기 이내면 통과", () => {
    expect(validateResumePdf(pdfBuf(), "application/pdf")).toEqual({ ok: true });
  });

  it("contentType이 PDF가 아니면 거부", () => {
    const r = validateResumePdf(pdfBuf(), "image/png");
    expect(r.ok).toBe(false);
  });

  it("charset 등 파라미터가 붙은 contentType도 통과", () => {
    expect(validateResumePdf(pdfBuf(), "application/pdf; charset=binary")).toEqual({ ok: true });
  });

  it("contentType은 PDF지만 내용이 PDF가 아니면 거부 (매직바이트 우선)", () => {
    const r = validateResumePdf(pngBuf(), "application/pdf");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("PDF");
  });

  it("정확히 상한이면 통과", () => {
    expect(validateResumePdf(pdfBuf(MAX_RESUME_PDF_BYTES), "application/pdf")).toEqual({ ok: true });
  });

  it("상한 + 1바이트면 거부", () => {
    const r = validateResumePdf(pdfBuf(MAX_RESUME_PDF_BYTES + 1), "application/pdf");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("10MB");
  });

  it("빈 버퍼면 거부", () => {
    const r = validateResumePdf(Buffer.alloc(0), "application/pdf");
    expect(r.ok).toBe(false);
  });
});
