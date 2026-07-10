export function AttendedToggle({
  childId,
  defaultChecked,
}: {
  childId: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-brand-text/60 has-[:checked]:border-brand-cyan/40 has-[:checked]:bg-brand-cyan/20 has-[:checked]:text-brand-cyan">
      <input
        type="checkbox"
        name="attended"
        value={childId}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-[color:var(--color-brand-cyan)]"
      />
      Пришёл на отработку
    </label>
  );
}
