import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

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

  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT;
  return `${protocol}://${publicEndpoint}:${process.env.MINIO_PORT}/${bucket}/${key}`;
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
