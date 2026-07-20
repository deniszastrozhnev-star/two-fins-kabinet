import type {
  AthleteRank,
  AttendanceStatus,
  EventType,
  FinDiscipline,
  Gender,
  GroupLevel,
  TimingType,
  TrainerRole,
} from "@prisma/client";

export const LEVEL_LABELS: Record<GroupLevel, string> = {
  NOVICE: "Новичок",
  CONFIDENT: "Уверенный",
  SPORT: "Спорт группа",
  TEAM: "Сборная школы",
};

export const LEVEL_ORDER: GroupLevel[] = ["NOVICE", "CONFIDENT", "SPORT", "TEAM"];

// Уровни спортсменов используют те же 3 значения, что и группы — но без "Сборной школы".
export const ATHLETE_LEVEL_ORDER: GroupLevel[] = ["NOVICE", "CONFIDENT", "SPORT"];

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

export const FIN_DISCIPLINE_LABELS: Record<FinDiscipline, string> = {
  APNEA50: "50 ныр.",
  M50: "50 м",
  M100: "100 м",
  M200: "200 м",
  M400: "400 м",
  M800: "800 м",
  M1500: "1500 м",
  UNDERWATER100: "100 п/п",
  UNDERWATER400: "400 п/п",
  CLASSIC50: "50 кл/п",
  CLASSIC100: "100 кл/п",
  CLASSIC200: "200 кл/п",
  CLASSIC400: "400 кл/п",
};

export const FIN_DISCIPLINE_ORDER: FinDiscipline[] = [
  "APNEA50",
  "M50",
  "M100",
  "M200",
  "M400",
  "M800",
  "M1500",
  "UNDERWATER100",
  "UNDERWATER400",
  "CLASSIC50",
  "CLASSIC100",
  "CLASSIC200",
  "CLASSIC400",
];

export const TIMING_LABELS: Record<TimingType, string> = {
  MANUAL: "Ручной",
  AUTO: "Авто",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Мужской",
  FEMALE: "Женский",
};
