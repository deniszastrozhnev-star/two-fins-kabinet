import type {
  AthleteRank,
  AttendanceStatus,
  EventType,
  GroupLevel,
  TrainerRole,
} from "@prisma/client";

export const LEVEL_LABELS: Record<GroupLevel, string> = {
  NOVICE: "Новичок",
  CONFIDENT: "Уверенный",
  SPORT: "Спорт группа",
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

export const ATHLETE_RANK_LABELS: Record<AthleteRank, string> = {
  YOUTH_3: "3 юношеский",
  YOUTH_2: "2 юношеский",
  YOUTH_1: "1 юношеский",
  ADULT_3: "3 взрослый",
  ADULT_2: "2 взрослый",
  ADULT_1: "1 взрослый",
  KMS: "КМС",
  MS: "МС",
  MSMK: "МСМК",
};

export const ATHLETE_RANK_COLORS: Record<AthleteRank, string> = {
  YOUTH_3: "#8A8A8A",
  YOUTH_2: "#4CAF50",
  YOUTH_1: "#2196F3",
  ADULT_3: "#3F51B5",
  ADULT_2: "#9C27B0",
  ADULT_1: "#E91E63",
  KMS: "#FF9800",
  MS: "#FFD700",
  MSMK: "#FF3D3D",
};

export const ATHLETE_RANK_ORDER: AthleteRank[] = [
  "YOUTH_3",
  "YOUTH_2",
  "YOUTH_1",
  "ADULT_3",
  "ADULT_2",
  "ADULT_1",
  "KMS",
  "MS",
  "MSMK",
];
