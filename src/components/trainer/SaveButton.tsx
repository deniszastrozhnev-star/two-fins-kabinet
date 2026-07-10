"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

export function SaveButton({
  children = "Сохранить",
}: {
  children?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Сохраняем…" : children}
    </Button>
  );
}
