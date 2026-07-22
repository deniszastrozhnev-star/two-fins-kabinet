"use client";

import { useActionState, useRef } from "react";
import { uploadTrainerAvatarAction } from "@/lib/actions/trainer-profile-actions";
import { Avatar } from "@/components/shared/Avatar";

export function TrainerAvatarUpload({
  name,
  url,
  size = 112,
}: {
  name: string;
  url: string | null;
  size?: number;
}) {
  const [state, formAction, isPending] = useActionState(uploadTrainerAvatarAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <form ref={formRef} action={formAction}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative rounded-full transition active:scale-95"
          aria-label="Изменить аватар"
        >
          <div className={isPending ? "opacity-50" : ""}>
            <Avatar name={name} url={url} size={size} />
          </div>
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 text-xs font-medium text-transparent transition group-hover:bg-black/40 group-hover:text-brand-text">
            {isPending ? "..." : "Изменить"}
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          name="avatar"
          accept="image/*"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </form>
      {state?.error && <p className="text-xs text-red-300">{state.error}</p>}
    </div>
  );
}
