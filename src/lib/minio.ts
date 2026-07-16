import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import { resumeContentDisposition } from "@/lib/resume-pdf";

function getS3Client() {
  return new S3Client({
    endpoint: `http${process.env.MINIO_USE_SSL === "true" ? "s" : ""}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY!,
      secretAccessKey: process.env.MINIO_SECRET_KEY!,
    },
    forcePathStyle: true,
  });
}

function getBucket() {
  return process.env.MINIO_BUCKET!;
}

export async function uploadImage(file: Buffer, originalName: string, contentType: string): Promise<string> {
  const ext = path.extname(originalName);
  const key = `images/${randomUUID()}${ext}`;
  const bucket = getBucket();

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
  }));

  return publicUrlFor(bucket, key);
}

/** MinIO 공개 URL 생성 — uploadImage와 동일 규칙. */
function publicUrlFor(bucket: string, key: string): string {
  if (process.env.MINIO_PUBLIC_URL) {
    return `${process.env.MINIO_PUBLIC_URL}/${bucket}/${key}`;
  }
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT;
  return `${protocol}://${publicEndpoint}:${process.env.MINIO_PORT}/${bucket}/${key}`;
}

/**
 * 이력서 PDF를 업로드한다.
 * ContentDisposition: attachment 를 걸어 브라우저에서 열리지 않고 곧바로 다운로드되게 한다.
 */
export async function uploadResumePdf(file: Buffer, originalName: string): Promise<string> {
  const key = `resume/${randomUUID()}.pdf`;
  const bucket = getBucket();

  await getS3Client().send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file,
    ContentType: "application/pdf",
    // RFC 5987: 한글 파일명은 filename*로 전달하고, filename에는 ASCII 폴백을 둔다.
    ContentDisposition: resumeContentDisposition(originalName),
  }));

  return publicUrlFor(bucket, key);
}

export async function deleteImage(url: string): Promise<void> {
  const bucket = getBucket();
  const urlObj = new URL(url);
  // Handle both /bucket/key and /key formats
  const pathname = urlObj.pathname.startsWith(`/${bucket}/`)
    ? urlObj.pathname.replace(`/${bucket}/`, "")
    : urlObj.pathname.slice(1);

  await getS3Client().send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: pathname,
  }));
}

export async function deleteImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(deleteImage));
}

/**
 * Rewrites stored Minio URLs to use the current public endpoint.
 * Handles localhost:9000 → storage.rheon.kr or vice versa based on env.
 */
export function rewriteImageUrl(url: string): string;
export function rewriteImageUrl(url: string | null): string | null;
export function rewriteImageUrl(url: string | null): string | null {
  if (!url) return null;
  const bucket = process.env.MINIO_BUCKET || "blog";
  const pattern = new RegExp(`https?://[^/]+/${bucket}/`);
  if (!pattern.test(url)) return url;

  if (process.env.MINIO_PUBLIC_URL) {
    return url.replace(pattern, `${process.env.MINIO_PUBLIC_URL}/${bucket}/`);
  }
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT;
  return url.replace(pattern, `${protocol}://${publicEndpoint}:${process.env.MINIO_PORT}/${bucket}/`);
}

/**
 * Rewrites all Minio URLs found in a text content (e.g., markdown).
 */
export function rewriteContentUrls(content: string): string;
export function rewriteContentUrls(content: string | null): string | null;
export function rewriteContentUrls(content: string | null): string | null {
  if (!content) return null;
  const bucket = process.env.MINIO_BUCKET || "blog";
  const pattern = new RegExp(`https?://[^/]+/${bucket}/`, "g");

  if (process.env.MINIO_PUBLIC_URL) {
    return content.replace(pattern, `${process.env.MINIO_PUBLIC_URL}/${bucket}/`);
  }
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT;
  return content.replace(pattern, `${protocol}://${publicEndpoint}:${process.env.MINIO_PORT}/${bucket}/`);
}
