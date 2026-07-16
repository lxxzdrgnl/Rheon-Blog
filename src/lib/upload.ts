export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    alert("이미지 업로드 실패");
    return "";
  }
  return (await res.json()).url || "";
}

export async function uploadResumePdfFile(file: File, locale: "ko" | "en"): Promise<string> {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("locale", locale);
  const res = await fetch("/api/upload/resume", { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    alert(body.error || "이력서 업로드 실패");
    return "";
  }
  return (await res.json()).url || "";
}
