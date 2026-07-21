"use client";

import { useActionState, useRef, useEffect } from "react";
import { uploadStoryAction } from "@/lib/actions/athlete-profile-actions";
import { FieldGroup, Input } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";

export function StoryUploadModal({ onClose }: { onClose: () => void }) {
  const [state, formAction] = useActionState(uploadStoryAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-brand-base p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-heading text-lg font-bold">Новая история</h2>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <FieldGroup
            label="Фото или видео"
            htmlFor="storyMedia"
            hint="Видео — короткое, до 15-30 секунд"
          >
            <input
              id="storyMedia"
              name="media"
              type="file"
              accept="image/*,video/*"
              required
              className="block w-full text-sm text-brand-text/70 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-cyan/20 file:px-3 file:py-1.5 file:text-brand-cyan"
            />
          </FieldGroup>
          <FieldGroup label="Подпись" htmlFor="storyCaption" hint="Необязательно">
            <Input id="storyCaption" name="caption" maxLength={200} />
          </FieldGroup>
          {state?.error && (
            <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">
              {state.error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm text-brand-text/60 hover:bg-white/5"
            >
              Отмена
            </button>
            <SaveButton>Опубликовать</SaveButton>
          </div>
        </form>
      </div>
    </div>
  );
}
