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
