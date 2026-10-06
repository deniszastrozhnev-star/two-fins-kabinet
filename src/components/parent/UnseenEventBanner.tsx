import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";

/** Превью новой непрочитанной новости прямо на первом экране — без перехода
 * можно понять, о чём речь, а "Читать полностью" ведёт в /parent/events,
 * которая же и отмечает её просмотренной (markEventsSeenAction). */
export function UnseenEventBanner({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const firstLine = description.split("\n").find((line) => line.trim().length > 0) ?? "";

  return (
    <Card className="border-brand-cyan/30 bg-brand-cyan/10">
      <CardBody>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-cyan">
          Новое в разделе «Новости»
        </p>
        <p className="mt-1.5 font-heading text-lg font-bold">{title}</p>
        {firstLine && (
          <p className="mt-1 line-clamp-1 text-sm text-brand-text/70">{firstLine}</p>
        )}
        <Link
          href="/parent/events"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-cyan hover:underline"
        >
          Читать полностью →
        </Link>
      </CardBody>
    </Card>
  );
}
