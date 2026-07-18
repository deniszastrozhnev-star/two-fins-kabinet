import type {
  AttendanceStatus,
  EventType,
  GroupLevel,
  TrainerRole,
} from "@prisma/client";

export const LEVEL_LABELS: Record<GroupLevel, string> = {
  NOVICE: "Новичок",
  CONFIDENT: "Уверенный пловец",
  SPORT: "Спортивный уровень",
  TEAM: "Сборная школы",
};

export const LEVEL_ORDER: GroupLevel[] = ["NOVICE", "CONFIDENT", "SPORT", "TEAM"];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Пришёл",
  ABSENT: "Не пришёл",
  WORKOFF: "Отработка",
  EXTRA: "Допзанятие",
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  NEWS: "Новость",
  GATHERING: "Сбор",
  COMPETITION: "Соревнование",
};

export const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

export const TRAINER_ROLE_LABELS: Record<TrainerRole, string> = {
  HEAD: "Главный тренер",
  TRAINER: "Тренер",
};
