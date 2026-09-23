"use server";

import { revalidatePath } from "next/cache";
import { put, get, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireParentChild } from "@/lib/auth";
import { buildContractPdf } from "@/lib/contractPdf";

export type ActionState = { error?: string; success?: string } | undefined;

type UploadedPage = { url: string; contentType: string };

const ALLOWED_PAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
]);

/**
 * Страницы договора родитель загружает по одной напрямую в Vercel Blob
 * (в обход лимита тела запроса serverless-функций) через ContractUpload.tsx —
 * сюда приходит уже готовый список временных blob-URL, в порядке выбора.
 * Экшен скачивает их, склеивает в один PDF (по странице на фото) и сохраняет
 * как единый ContractDocument; временные blob'ы страниц удаляются.
 */
export async function uploadContractAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const child = await requireParentChild();

  // Внешний предохранитель: что бы ни пошло не так ниже — родитель должен
  // увидеть понятную ошибку с возможностью повторить, а не падение страницы.
  try {
    return await doUploadContract(child, formData);
  } catch (err) {
    console.error("uploadContractAction: unexpected failure", err);
    return { error: "Не удалось сохранить договор, попробуйте ещё раз" };
  }
}

async function doUploadContract(
  child: { id: string; lastName: string; firstName: string },
  formData: FormData,
): Promise<ActionState> {
  let pages: UploadedPage[];
  try {
    pages = JSON.parse(String(formData.get("pages") ?? "[]"));
  } catch {
    return { error: "Не удалось прочитать список страниц" };
  }

  if (!Array.isArray(pages) || pages.length === 0) {
    return { error: "Выберите хотя бы одну страницу договора (фото или PDF)" };
  }
  if (pages.some((p) => !p?.url || !ALLOWED_PAGE_TYPES.has(p.contentType))) {
    return { error: "Поддерживаются только изображения (JPG, PNG) и PDF" };
  }

  let fetchedPages: { buffer: Buffer; contentType: string }[];
  try {
    fetchedPages = await Promise.all(
      pages.map(async (p) => {
        const result = await get(p.url, { access: "private" });
        if (!result || result.statusCode !== 200 || !result.stream) {
          throw new Error("не удалось скачать загруженную страницу");
        }
        const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
        return { buffer, contentType: p.contentType };
      }),
    );
  } catch {
    return { error: "Не удалось загрузить страницы договора, попробуйте ещё раз" };
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await buildContractPdf(fetchedPages);
  } catch (err) {
    console.error("uploadContractAction: buildContractPdf failed", err);
    return { error: "Не удалось собрать PDF из выбранных страниц" };
  }

  const safeName = `${child.lastName}-${child.firstName}`.replace(
    /[^a-zA-Zа-яА-ЯёЁ0-9_-]+/g,
    "_",
  );
  const key = `contracts/${safeName}/${Date.now()}.pdf`;

  try {
    const blob = await put(key, pdfBuffer, { access: "private", contentType: "application/pdf" });

    await prisma.contractDocument.create({
      data: { childId: child.id, fileUrl: blob.url, contentType: "application/pdf" },
    });
  } catch (err) {
    console.error("uploadContractAction: failed to save merged PDF", err);
    return { error: "Не удалось сохранить договор, попробуйте ещё раз" };
  }

  await del(pages.map((p) => p.url)).catch((err) => {
    console.error("uploadContractAction: failed to clean up temp page blobs", err);
  });

  revalidatePath("/trainer/children");
  revalidatePath(`/trainer/children/${child.id}`);
  revalidatePath("/parent", "layout");
  return { success: "Договор отправлен тренеру" };
}
