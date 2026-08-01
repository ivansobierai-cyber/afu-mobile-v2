import {
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type S3StorageConfig = {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  forcePathStyle: boolean;
};

function firstEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) return v;
  }
  return undefined;
}

/** Presença de envs (sem valores) — debug deploy Railway. */
export function getS3EnvPresence(): {
  bucket: boolean;
  accessKey: boolean;
  secret: boolean;
  endpoint: boolean;
} {
  return {
    bucket: Boolean(
      firstEnv(
        "STORAGE_S3_BUCKET",
        "S3_BUCKET",
        "AWS_S3_BUCKET",
        "R2_BUCKET",
        "BUCKET_NAME",
        "CLOUDFLARE_R2_BUCKET",
      ),
    ),
    accessKey: Boolean(
      firstEnv("STORAGE_S3_ACCESS_KEY_ID", "AWS_ACCESS_KEY_ID", "R2_ACCESS_KEY_ID"),
    ),
    secret: Boolean(
      firstEnv(
        "STORAGE_S3_SECRET_ACCESS_KEY",
        "AWS_SECRET_ACCESS_KEY",
        "R2_SECRET_ACCESS_KEY",
      ),
    ),
    endpoint: Boolean(
      firstEnv("STORAGE_S3_ENDPOINT", "AWS_ENDPOINT_URL", "S3_ENDPOINT", "R2_ENDPOINT"),
    ),
  };
}

export function getS3StorageConfig(): S3StorageConfig | null {
  const bucket = firstEnv(
    "STORAGE_S3_BUCKET",
    "S3_BUCKET",
    "AWS_S3_BUCKET",
    "R2_BUCKET",
    "BUCKET_NAME",
    "CLOUDFLARE_R2_BUCKET",
  );
  const accessKeyId = firstEnv(
    "STORAGE_S3_ACCESS_KEY_ID",
    "AWS_ACCESS_KEY_ID",
    "R2_ACCESS_KEY_ID",
  );
  const secretAccessKey = firstEnv(
    "STORAGE_S3_SECRET_ACCESS_KEY",
    "AWS_SECRET_ACCESS_KEY",
    "R2_SECRET_ACCESS_KEY",
  );
  if (!bucket || !accessKeyId || !secretAccessKey) return null;
  const endpoint = firstEnv(
    "STORAGE_S3_ENDPOINT",
    "AWS_ENDPOINT_URL",
    "S3_ENDPOINT",
    "R2_ENDPOINT",
  );
  return {
    bucket,
    region: process.env.STORAGE_S3_REGION?.trim() || "auto",
    endpoint: endpoint || undefined,
    accessKeyId,
    secretAccessKey,
    forcePathStyle:
      process.env.STORAGE_S3_FORCE_PATH_STYLE === "1" ||
      process.env.STORAGE_S3_FORCE_PATH_STYLE === "true" ||
      Boolean(endpoint),
  };
}

export function isS3StorageConfigured(): boolean {
  return getS3StorageConfig() !== null;
}

function createS3Client(cfg: S3StorageConfig): S3Client {
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: cfg.forcePathStyle,
  });
}

export async function s3PutObject(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType: string,
): Promise<void> {
  const cfg = getS3StorageConfig();
  if (!cfg) throw new Error("S3 storage not configured");
  const body =
    typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  const client = createS3Client(cfg);
  await client.send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function s3GetSignedDownloadUrl(key: string, expiresInSec = 300): Promise<string> {
  const cfg = getS3StorageConfig();
  if (!cfg) throw new Error("S3 storage not configured");
  const client = createS3Client(cfg);
  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: cfg.bucket, Key: key }),
    { expiresIn: expiresInSec },
  );
}

export async function probeS3StorageBucket(): Promise<{ ok: boolean; detail?: string }> {
  const cfg = getS3StorageConfig();
  if (!cfg) return { ok: false, detail: "STORAGE_S3_* ausentes" };
  try {
    const client = createS3Client(cfg);
    await client.send(new HeadBucketCommand({ Bucket: cfg.bucket }));
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}
