import { NavCard, type NavCardItem } from "@/components/shared/NavCard";

export function NavCardGrid({ items }: { items: NavCardItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <NavCard key={item.href} {...item} />
      ))}
    </div>
  );
}
