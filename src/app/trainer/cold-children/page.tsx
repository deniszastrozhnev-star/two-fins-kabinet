import { requireHeadTrainer } from "@/lib/auth";
import { getColdChildren } from "@/lib/coldChildren";
import { formatDateRu } from "@/lib/dates";
import {
  markChildSickAction,
  deleteChildAction,
  updateChildNoteAction,
} from "@/lib/actions/child-actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Field";
import { SaveButton } from "@/components/trainer/SaveButton";
import { Button } from "@/components/ui/Button";
import { ConfirmSubmitButton } from "@/components/trainer/ConfirmSubmitButton";

export default async function ColdChildrenPage() {
  await requireHeadTrainer();
  const children = await getColdChildren();

  return (
    <>
      <PageHeader
        title="Холодные дети"
        description="Не были на занятии или отработке 30+ дней — стоит позвонить и уточнить, что случилось"
      />

      {children.length === 0 ? (
        <EmptyState
          title="Холодных детей нет"
          description="Все активные ученики посещали занятия за последние 30 дней."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {children.map((c) => (
            <Card key={c.id}>
              <CardBody>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading font-bold">
                      {c.lastName} {c.firstName}
                    </p>
                    <p className="mt-0.5 text-sm text-brand-text/60">
                      {c.groupName ?? "Без группы"} ·{" "}
                      {c.lastAttendedAt
                        ? `последний раз был ${formatDateRu(c.lastAttendedAt)}`
                        : "никогда не был на занятии"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={markChildSickAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <Button type="submit" variant="secondary" size="sm">
                        Болеет
                      </Button>
                    </form>
                    <form action={deleteChildAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <ConfirmSubmitButton
                        confirmMessage={`Удалить ${c.lastName} ${c.firstName} из базы? Это действие нельзя отменить.`}
                      >
                        Удалить из базы
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>

                <form
                  action={updateChildNoteAction}
                  className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4"
                >
                  <input type="hidden" name="id" value={c.id} />
                  <label className="text-sm font-medium text-brand-text/80">
                    Заметка (что выяснилось при звонке)
                  </label>
                  <Textarea
                    name="note"
                    defaultValue={c.note ?? ""}
                    rows={2}
                    placeholder="Например: переехали, пауза до сентября, не берёт трубку…"
                  />
                  <div className="flex justify-end">
                    <SaveButton>Сохранить заметку</SaveButton>
                  </div>
                </form>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
