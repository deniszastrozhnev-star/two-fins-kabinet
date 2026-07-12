"use client";

import { useActionState, useRef, useEffect } from "react";
import { uploadMedicalCertificateAction } from "@/lib/actions/medical-actions";
import { Input, Label } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";

export function MedicalCertificateUpload() {
  const [state, formAction] = useActionState(
    uploadMedicalCertificateAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
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
      {state?.error && (
        <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">
          {state.success}
        </p>
      )}
      <div>
        <SaveButton>Прикрепить справку</SaveButton>
      </div>
    </form>
  );
}
