import { ButtonHTMLAttributes, forwardRef } from "react";
import Link from "next/link";

const VARIANT_CLASSES = {
  primary:
    "bg-brand-cyan text-brand-base font-semibold hover:brightness-110 active:brightness-95",
  secondary:
    "bg-white/10 text-brand-text font-medium hover:bg-white/15 border border-white/15",
  danger:
    "bg-red-500/20 text-red-200 font-medium hover:bg-red-500/30 border border-red-500/30",
  ghost: "bg-transparent text-brand-text/80 font-medium hover:bg-white/10",
} as const;

const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3 text-base rounded-xl",
} as const;

type Variant = keyof typeof VARIANT_CLASSES;
type Size = keyof typeof SIZE_CLASSES;

const base =
  "inline-flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button(
  { className = "", variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  );
});

export function LinkButton({
  href,
  className = "",
  variant = "primary",
  size = "md",
  children,
}: {
  href: string;
  className?: string;
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${base} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
