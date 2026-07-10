export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
      <p className="font-heading text-lg text-brand-text">{title}</p>
      {description && (
        <p className="max-w-sm text-sm text-brand-text/60">{description}</p>
      )}
      {action}
    </div>
  );
}
