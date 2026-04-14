import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

const s3 = new S3Client({
  endpoint: `http${process.env.MINIO_USE_SSL === "true" ? "s" : ""}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET!;

export async function uploadImage(file: Buffer, originalName: string, contentType: string): Promise<string> {
  const ext = path.extname(originalName);
  const key = `images/${randomUUID()}${ext}`;

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
  }));

  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  return `${protocol}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET}/${key}`;
}

export async function deleteImage(url: string): Promise<void> {
  const urlObj = new URL(url);
  const key = urlObj.pathname.replace(`/${BUCKET}/`, "");

  await s3.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }));
}

export async function deleteImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map(deleteImage));
}
