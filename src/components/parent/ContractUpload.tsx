"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";
import { uploadContractAction } from "@/lib/actions/contract-actions";
import { compressImageClientSide } from "@/lib/imageClient";
import { Button } from "@/components/ui/Button";

// Страницы договора грузятся напрямую в Vercel Blob с клиента (в обход
// serverless-лимита тела запроса ~4.5 МБ, который бьёт по одиночным чекам/
// справкам) — поэтому лимит здесь заметно выше, а не занижен под тот же
// потолок. Клиентское сжатие всё равно держит итоговый объём разумным.
const MAX_PAGE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;

export function ContractUpload() {
  const [state, formAction, isActionPending] = useActionState(uploadContractAction, undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pending = isUploading || isActionPending;

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setUploadError(null);
    setProgressText(null);

    const input = e.currentTarget.elements.namedItem("contract") as HTMLInputElement | null;
    const files = input?.files ? Array.from(input.files) : [];
    if (files.length === 0) {
      setUploadError("Выберите хотя бы одну страницу договора");
      return;
    }

    setIsUploading(true);
    try {
      const prepared: File[] = [];
      for (const file of files) {
        prepared.push(
          file.type.startsWith("image/") ? await compressImageClientSide(file) : file,
        );
      }

      const totalSize = prepared.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > MAX_TOTAL_BYTES || prepared.some((f) => f.size > MAX_PAGE_BYTES)) {
        setUploadError(
          "Файлы слишком большие даже после сжатия. Сфотографируйте страницы при хорошем освещении без лишнего фона, или уменьшите их число.",
        );
        return;
      }

      const pages: { url: string; contentType: string }[] = [];
      for (let i = 0; i < prepared.length; i++) {
        setProgressText(
          prepared.length > 1 ? `Загружаем страницу ${i + 1} из ${prepared.length}…` : "Загружаем…",
        );
        const file = prepared[i];
        const blob = await upload(`contract-pages/${Date.now()}-${i}-${file.name}`, file, {
          access: "private",
          handleUploadUrl: "/api/contracts/upload-token",
          contentType: file.type,
        });
        pages.push({ url: blob.url, contentType: file.type });
      }

      setProgressText(prepared.length > 1 ? "Собираем PDF…" : "Сохраняем…");
      const fd = new FormData();
      fd.set("pages", JSON.stringify(pages));
      formAction(fd);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Не удалось загрузить страницы, попробуйте ещё раз",
      );
    } finally {
      setIsUploading(false);
      setProgressText(null);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <input
          type="file"
          name="contract"
          accept="image/*,application/pdf"
          multiple
          required
          className="text-sm text-brand-text/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-text hover:file:bg-white/15"
        />
        <p className="mt-1 text-xs text-brand-text/50">
          Подписанный договор — выберите сразу все страницы (по фото на
          страницу), они соберутся в один PDF-файл
        </p>
      </div>
      {(uploadError || state?.error) && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {uploadError ?? state?.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          {state.success}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {progressText ?? (pending ? "Сохраняем…" : "Загрузить подписанный договор")}
        </Button>
      </div>
    </form>
  );
}
