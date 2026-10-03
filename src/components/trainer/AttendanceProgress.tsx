"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AttendanceStatus } from "@prisma/client";

type StatusMap = Record<string, AttendanceStatus | null>;

type Ctx = {
  statuses: StatusMap;
  setStatus: (childId: string, status: AttendanceStatus | null) => void;
};

const AttendanceStatusContext = createContext<Ctx | null>(null);

/** Общее клиентское состояние отметок группы на экране посещаемости: пикеры
 * (AttendanceStatusPicker) пишут сюда при каждом клике, счётчик «Пришло: X из N»
 * читает отсюда — поэтому число обновляется мгновенно, без перезагрузки и
 * без сохранения формы. Начальные значения — уже сохранённые отметки (в том
 * числе детей, заблокированных другим тренером, у которых пикера нет). */
export function AttendanceStatusProvider({
  initial,
  children,
}: {
  initial: StatusMap;
  children: React.ReactNode;
}) {
  const [statuses, setStatuses] = useState<StatusMap>(initial);
  const setStatus = useCallback((childId: string, status: AttendanceStatus | null) => {
    setStatuses((prev) => ({ ...prev, [childId]: status }));
  }, []);
  const value = useMemo(() => ({ statuses, setStatus }), [statuses, setStatus]);
  return <AttendanceStatusContext.Provider value={value}>{children}</AttendanceStatusContext.Provider>;
}

export function useAttendanceStatuses(): Ctx | null {
  return useContext(AttendanceStatusContext);
}

export function AttendancePresentCounter() {
  const ctx = useAttendanceStatuses();
  if (!ctx) return null;
  const ids = Object.keys(ctx.statuses);
  const present = ids.filter((id) => ctx.statuses[id] === "PRESENT").length;
  return (
    <p className="mb-3 text-sm text-brand-text/70">
      Пришло:{" "}
      <span className="font-heading text-lg font-bold text-brand-text">
        {present} из {ids.length}
      </span>
    </p>
  );
}
