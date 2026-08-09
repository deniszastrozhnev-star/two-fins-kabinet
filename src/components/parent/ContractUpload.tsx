"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { uploadContractAction } from "@/lib/actions/contract-actions";
import { compressImageClientSide } from "@/lib/imageClient";
import { Button } from "@/components/ui/Button";

// Чуть с запасом ниже жёсткого лимита тела запроса Vercel Serverless
// Functions (~4.5 МБ) — после сжатия фото почти всегда укладывается, а PDF
// (который клиентски не сжать) хотя бы получает понятную ошибку вместо
// падения страницы с 413.
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function ContractUpload() {
  const [state, formAction, isActionPending] = useActionState(uploadContractAction, undefined);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepError, setPrepError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const pending = isPreparing || isActionPending;

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPrepError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("contract");
    if (file instanceof File && file.size > 0) {
      setIsPreparing(true);
      const prepared = await compressImageClientSide(file);
      setIsPreparing(false);
      if (prepared.size > MAX_UPLOAD_BYTES) {
        setPrepError(
          "Файл слишком большой даже после сжатия. Сфотографируйте договор при хорошем освещении без лишнего фона, или уменьшите разрешение/качество фото перед загрузкой.",
        );
        return;
      }
      fd.set("contract", prepared);
    }
    formAction(fd);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <input
          type="file"
          name="contract"
          accept="image/*,application/pdf"
          required
          className="text-sm text-brand-text/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-text hover:file:bg-white/15"
        />
        <p className="mt-1 text-xs text-brand-text/50">
          Подписанный договор — фото или PDF
        </p>
      </div>
      {(prepError || state?.error) && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {prepError ?? state?.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          {state.success}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {isPreparing ? "Готовим фото…" : pending ? "Сохраняем…" : "Загрузить подписанный договор"}
        </Button>
      </div>
    </form>
  );
}
