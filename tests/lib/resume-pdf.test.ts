import { describe, it, expect } from "vitest";
import {
  isPdfBuffer,
  resumePdfSettingKey,
  validateResumePdf,
  resumeContentDisposition,
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
  it("최상위 비트를 세운 위조 헤더(0xA5 0xD0 0xC4 0xC6)는 거부한다", () => {
    const forged = Buffer.from([0xa5, 0xd0, 0xc4, 0xc6, 0x00]);
    expect(isPdfBuffer(forged)).toBe(false);
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

  it("최상위 비트를 세운 위조 헤더(0xA5 0xD0 0xC4 0xC6)는 거부한다", () => {
    const forged = Buffer.from([0xa5, 0xd0, 0xc4, 0xc6, 0x00]);
    expect(validateResumePdf(forged, "application/pdf").ok).toBe(false);
  });
});

describe("resumeContentDisposition", () => {
  it("평범한 ASCII 이름은 그대로 폴백과 filename*에 사용된다", () => {
    expect(resumeContentDisposition("resume.pdf")).toBe(
      `attachment; filename="resume.pdf"; filename*=UTF-8''resume.pdf`,
    );
  });

  it("괄호·아포스트로피는 filename*에서 percent-encode 된다", () => {
    const header = resumeContentDisposition("Kim's_Resume(2026).pdf");
    expect(header).toContain("filename*=UTF-8''");
    const encoded = header.split("filename*=UTF-8''")[1];
    expect(encoded).toContain("%27"); // '
    expect(encoded).toContain("%28"); // (
    expect(encoded).toContain("%29"); // )
    expect(encoded).not.toMatch(/['()]/);
  });

  it("한글 이름은 ASCII 폴백이 resume.pdf, filename*는 percent-encoded UTF-8", () => {
    const header = resumeContentDisposition("이력서.pdf");
    expect(header).toContain(`filename="resume.pdf"`);
    expect(header).toContain(`filename*=UTF-8''${encodeURIComponent("이력서.pdf")}`);
  });

  it("백슬래시·큰따옴표가 든 이름은 폴백 filename에 raw \" 나 \\ 가 남지 않는다", () => {
    const header = resumeContentDisposition('weird\\"name".pdf');
    const fallbackMatch = header.match(/filename="([^]*?)";\s*filename\*=/);
    expect(fallbackMatch).not.toBeNull();
    const fallback = fallbackMatch![1];
    expect(fallback).not.toMatch(/["\\]/);
  });

  it("빈 문자열은 resume.pdf로 폴백한다", () => {
    const header = resumeContentDisposition("");
    expect(header).toBe(`attachment; filename="resume.pdf"; filename*=UTF-8''resume.pdf`);
  });

  it("경로가 들어와도 basename만 사용한다", () => {
    const header = resumeContentDisposition("/tmp/a/resume.pdf");
    expect(header).toBe(`attachment; filename="resume.pdf"; filename*=UTF-8''resume.pdf`);
  });
});
