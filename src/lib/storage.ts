import "server-only";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Замена @vercel/blob на S3-совместимое хранилище (Timeweb Cloud S3 или
 * любое другое S3-совместимое). Сигнатуры put/get/del намеренно повторяют
 * старый API @vercel/blob — весь код, который читал/писал файлы, менял
 * только импорт.
 *
 * "url", который возвращает put() и принимают get()/del() — это НЕ публичная
 * ссылка, а внутренний ключ объекта в бакете. Доступ к файлам всегда идёт
 * через приватные API-роуты (см. src/app/api/**\/route.ts), наружу ключ не
 * отдаётся, поэтому бакет может быть полностью приватным.
 */

const s3 = new S3Client({
  region: process.env.S3_REGION || "ru-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

type StreamingBody = {
  transformToWebStream(): ReadableStream;
};

export type PutResult = { url: string };
export type GetResult = {
  stream: ReadableStream;
  blob: { contentType: string | null };
  statusCode: number;
} | null;

export async function put(
  key: string,
  data: Buffer | Uint8Array,
  opts: { access?: "private" | "public"; contentType?: string } = {},
): Promise<PutResult> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: data,
      ContentType: opts.contentType,
    }),
  );
  return { url: key };
}

export async function get(
  key: string,
  _opts: { access?: "private" | "public" } = {},
): Promise<GetResult> {
  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    if (!result.Body) return null;
    const stream = (result.Body as unknown as StreamingBody).transformToWebStream();
    return {
      stream,
      blob: { contentType: result.ContentType ?? null },
      statusCode: 200,
    };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw err;
  }
}

export async function del(keys: string | string[]): Promise<void> {
  const list = Array.isArray(keys) ? keys : [keys];
  if (list.length === 0) return;
  if (list.length === 1) {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: list[0] }));
    return;
  }
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: list.map((Key) => ({ Key })) },
    }),
  );
}

/**
 * Страницы договора грузятся с клиента напрямую в бакет по presigned PUT —
 * в обход лимита тела серверного экшена. Ссылка живёт 5 минут, только для
 * одного конкретного ключа и content-type.
 */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 300,
): Promise<string> {
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}
