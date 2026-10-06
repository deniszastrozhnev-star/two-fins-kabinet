import { switchActiveChildAction } from "@/lib/actions/login-actions";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { PaymentStatus } from "@/lib/payment";
import type { MedicalStatus } from "@/lib/medical";

export type FamilyRow = {
  id: string;
  name: string;
  isActive: boolean;
  payment: PaymentStatus;
  medical: MedicalStatus;
  contractUploaded: boolean;
};

/** Сводка по всем детям семьи на первом экране — сразу видно, у кого что не
 * в порядке (оплата/справка/договор), без захода в карточку каждого. Клик по
 * неактивному ребёнку переключает на него кабинет. */
export function FamilySummaryCard({ rows }: { rows: FamilyRow[] }) {
  return (
    <Card>
      <CardBody>
        <h2 className="mb-3 font-heading text-lg font-bold">Дети в семье</h2>
        <ul className="flex flex-col divide-y divide-white/10">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
              <div className="flex items-center gap-2">
                {r.isActive ? (
                  <span className="text-sm font-semibold text-brand-cyan">{r.name}</span>
                ) : (
                  <form action={switchActiveChildAction}>
                    <input type="hidden" name="childId" value={r.id} />
                    <button
                      type="submit"
                      className="text-sm font-medium text-brand-text/80 underline decoration-dotted underline-offset-2 hover:text-brand-cyan"
                    >
                      {r.name}
                    </button>
                  </form>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={r.payment.tone === "green" ? "green" : "red"}>Оплата</Badge>
                <Badge tone={r.medical.tone === "green" ? "green" : "red"}>Справка</Badge>
                <Badge tone={r.contractUploaded ? "green" : "red"}>Договор</Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
