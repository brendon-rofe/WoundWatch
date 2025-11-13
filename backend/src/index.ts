import express from "express";
import type { Request } from "express";
import crypto from "node:crypto";
import multer from "multer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getS3Client, s3Config } from "./s3";

const app = express();
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.get("/health", (_req, res) => res.json({ ok: true }));

type MulterRequest = Request & { file?: Express.Multer.File };

app.post("/images", upload.single("image"), async (req, res, next) => {
  try {
    const { file } = req as MulterRequest;

    if (!file) {
      return res.status(400).json({ message: "Missing file field `image`." });
    }

    const { buffer, mimetype, originalname } = file;
    const id = crypto.randomUUID();
    const extension = originalname.split(".").pop() ?? "bin";
    const key = `${s3Config.keyPrefix}${id}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: s3Config.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });

    await getS3Client().send(command);

    const url = `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;

    res.status(201).json({ key, url });
  } catch (error) {
    next(error);
  }
});

app.listen(process.env.PORT ?? 3000, () => {
  console.log(`API listening on http://localhost:${process.env.PORT ?? 3000}`);
});
