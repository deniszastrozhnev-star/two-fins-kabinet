"use client";

import { useActionState, useRef, useEffect } from "react";
import { uploadReceiptAction } from "@/lib/actions/receipt-actions";
import { SaveButton } from "@/components/trainer/SaveButton";

export function ReceiptUploadForm() {
  const [state, formAction] = useActionState(uploadReceiptAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input
        type="file"
        name="receipt"
        accept="image/*"
        required
        className="text-sm text-brand-text/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-text hover:file:bg-white/15"
      />
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
        <SaveButton>Прикрепить чек об оплате</SaveButton>
      </div>
    </form>
  );
}
