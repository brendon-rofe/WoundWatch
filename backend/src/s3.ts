import { S3Client } from "@aws-sdk/client-s3";

const requiredEnv = ["AWS_S3_BUCKET", "AWS_REGION"] as const;

const missing = requiredEnv.filter((name) => !process.env[name]);
if (missing.length > 0) {
  throw new Error(
    `Missing required AWS env vars: ${missing.join(
      ", "
    )}. Set them before starting the server.`
  );
}

const bucket = process.env.AWS_S3_BUCKET!;
const region = process.env.AWS_REGION!;
const keyPrefix = process.env.AWS_S3_KEY_PREFIX ?? "";

let client: S3Client | undefined;

export const s3Config = {
  bucket,
  region,
  keyPrefix:
    keyPrefix.endsWith("/") || keyPrefix === "" ? keyPrefix : `${keyPrefix}/`,
};

export const getS3Client = (): S3Client => {
  if (!client) {
    client = new S3Client({
      region,
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              sessionToken: process.env.AWS_SESSION_TOKEN,
            }
          : undefined,
    });
  }
  return client;
};

