"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

export function EventSignupButton({ signedUp }: { signedUp: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={signedUp ? "secondary" : "primary"}
      size="sm"
      disabled={pending}
    >
      {pending ? "…" : signedUp ? "Отменить запись" : "Записаться"}
    </Button>
  );
}
