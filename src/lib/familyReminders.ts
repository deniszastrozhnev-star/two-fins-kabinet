import "server-only";
import { sendPushToFamily } from "@/lib/push";

export type FamilyReminderEntry = { title: string; body: string };

/** Один push на семью, даже если у нескольких детей одной семьи совпало
 * напоминание в один прогон (например, близнецы с одинаковой датой оплаты,
 * или ребёнку одновременно подошёл срок и оплаты, и справки). Один ребёнок —
 * шлём его собственный заголовок как есть; несколько — общий заголовок и все
 * тексты друг под другом (каждый уже называет ребёнка по имени). */
export async function sendCombinedFamilyPushes(
  entriesByPhone: Map<string, FamilyReminderEntry[]>,
  combinedTitle: string,
): Promise<void> {
  for (const [phone, entries] of entriesByPhone) {
    const payload =
      entries.length === 1
        ? { title: entries[0].title, body: entries[0].body, url: "/parent" }
        : { title: combinedTitle, body: entries.map((e) => e.body).join("\n"), url: "/parent" };

    await sendPushToFamily(phone, payload).catch((err) =>
      console.error("sendCombinedFamilyPushes: push failed", err),
    );
  }
}
