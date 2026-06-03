/**
 * Pluggable upload storage.
 *
 * UPLOAD_PROVIDER=local (default) writes to public/uploads.
 * UPLOAD_PROVIDER=s3 uploads to an S3-compatible bucket (AWS S3, R2, MinIO, etc.)
 * using operator-supplied env: S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID,
 * S3_SECRET_ACCESS_KEY, optional S3_ENDPOINT (for R2/MinIO) and S3_PUBLIC_URL.
 *
 * @aws-sdk/client-s3 is loaded dynamically so it is only required when S3 is used.
 */

import { writeFile } from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";

export async function storeUpload(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<{ url: string }> {
  const provider = process.env.UPLOAD_PROVIDER || "local";

  if (provider === "s3") {
    return storeOnS3(buffer, filename, contentType);
  }

  const filepath = path.join(process.cwd(), "public/uploads", filename);
  await writeFile(filepath, buffer);
  return { url: `/uploads/${filename}` };
}

async function storeOnS3(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<{ url: string }> {
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION || "us-east-1";
  if (!bucket) throw new Error("S3_BUCKET is required when UPLOAD_PROVIDER=s3");

  // Dynamic import — @aws-sdk/client-s3 is an optional dependency.
  const moduleName = "@aws-sdk/client-s3";
  const { S3Client, PutObjectCommand } = await import(/* webpackIgnore: true */ moduleName);

  const client = new S3Client({
    region,
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: !!process.env.S3_ENDPOINT, // needed for MinIO/R2
    credentials:
      process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          }
        : undefined, // fall back to instance/role credentials
  });

  const key = `uploads/${filename}`;
  await client.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }),
  );

  // Public URL: explicit S3_PUBLIC_URL (CDN) or the default S3/endpoint URL.
  const base =
    process.env.S3_PUBLIC_URL ||
    (process.env.S3_ENDPOINT
      ? `${process.env.S3_ENDPOINT.replace(/\/$/, "")}/${bucket}`
      : `https://${bucket}.s3.${region}.amazonaws.com`);

  logger.info({ module: "upload", provider: "s3", key }, "Uploaded object to S3");
  return { url: `${base}/${key}` };
}
