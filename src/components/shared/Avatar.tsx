export function Avatar({
  name,
  url,
  size,
  ringClassName,
  className = "",
}: {
  name: string;
  url: string | null;
  size: number;
  ringClassName?: string;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  const inner = (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full bg-brand-purple/40 font-heading font-bold text-brand-text ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );

  if (!ringClassName) return inner;

  return (
    <div className={`rounded-full p-[3px] ${ringClassName}`} style={{ width: size + 6, height: size + 6 }}>
      <div className="flex h-full w-full items-center justify-center rounded-full bg-brand-base">
        {inner}
      </div>
    </div>
  );
}
