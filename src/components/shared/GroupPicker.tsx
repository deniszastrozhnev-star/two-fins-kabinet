import { computeCombinedPrice, type PricedGroup } from "@/lib/registrationTariffs";
import type { GroupLevel } from "@prisma/client";

export type ChildGroupOption = PricedGroup & {
  id: string;
  name: string;
  level: GroupLevel;
  time: string;
};

export { computeCombinedPrice };

/** Один пункт выбора группы — общий и для онлайн-записи, и для смены группы
 * тренером/родителем: название, бассейн, время, цена. */
export function GroupOption({
  group,
  name,
  checked,
  onChange,
}: {
  group: ChildGroupOption;
  name: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="relative flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-white/10 px-3.5 py-2.5 text-sm transition has-[:checked]:border-brand-cyan/50 has-[:checked]:bg-brand-cyan/10">
      <input
        type="radio"
        name={name}
        value={group.id}
        checked={checked}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      <span>
        <span className="font-medium">{group.name}</span>
        <span className="block text-xs text-brand-text/50">
          {group.pool} · {group.time}
        </span>
      </span>
      <span className="whitespace-nowrap font-semibold text-brand-cyan">
        {group.pricePerMonth != null ? `${group.pricePerMonth.toLocaleString("ru-RU")}₽` : "—"}
      </span>
    </label>
  );
}
