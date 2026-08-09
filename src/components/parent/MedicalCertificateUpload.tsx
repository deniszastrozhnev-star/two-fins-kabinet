"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { uploadMedicalCertificateAction } from "@/lib/actions/medical-actions";
import { compressImageClientSide } from "@/lib/imageClient";
import { Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export function MedicalCertificateUpload() {
  const [state, formAction, isActionPending] = useActionState(
    uploadMedicalCertificateAction,
    undefined,
  );
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
    const file = fd.get("certificate");
    if (file instanceof File && file.size > 0) {
      setIsPreparing(true);
      const prepared = await compressImageClientSide(file);
      setIsPreparing(false);
      if (prepared.size > MAX_UPLOAD_BYTES) {
        setPrepError(
          "Файл слишком большой даже после сжатия. Сфотографируйте справку при хорошем освещении, или пришлите скриншот вместо фото.",
        );
        return;
      }
      fd.set("certificate", prepared);
    }
    formAction(fd);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <input
          type="file"
          name="certificate"
          accept="image/*,application/pdf"
          required
          className="text-sm text-brand-text/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-text hover:file:bg-white/15"
        />
        <p className="mt-1 text-xs text-brand-text/50">
          Справка от педиатра — фото или PDF
        </p>
      </div>
      <div>
        <Label htmlFor="validUntil">Анализы действительны до</Label>
        <Input id="validUntil" name="validUntil" type="date" required />
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
          {isPreparing ? "Готовим фото…" : pending ? "Сохраняем…" : "Прикрепить справку"}
        </Button>
      </div>
    </form>
  );
}
