"use client";

import { Button } from "@/components/ui/Button";

export function ConfirmSubmitButton({
  confirmMessage,
  children,
  variant = "danger",
}: {
  confirmMessage: string;
  children: React.ReactNode;
  variant?: "danger" | "secondary" | "primary" | "ghost";
}) {
  return (
    <Button
      type="submit"
      variant={variant}
      size="sm"
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Button>
  );
}
