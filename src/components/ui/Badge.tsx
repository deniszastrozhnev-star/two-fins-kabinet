const TONE_CLASSES = {
  neutral: "bg-white/10 text-brand-text/80",
  cyan: "bg-brand-cyan/20 text-brand-cyan",
  violet: "bg-brand-violet/20 text-brand-violet",
  green: "bg-emerald-500/20 text-emerald-300",
  red: "bg-red-500/20 text-red-300",
  amber: "bg-amber-500/20 text-amber-300",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: keyof typeof TONE_CLASSES;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
