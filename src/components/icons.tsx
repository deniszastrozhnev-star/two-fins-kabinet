type IconProps = { className?: string };

const base = "1.75";

export function TrainerIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 13V9" strokeLinecap="round" />
      <path d="M9 2h6" strokeLinecap="round" />
      <path d="M12 2v2" strokeLinecap="round" />
      <path d="M18.5 5.5l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ParentIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="9" cy="7" r="3" />
      <path d="M4 20c0-3 2.2-5 5-5s5 2 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="10.5" r="2" />
      <path d="M15 20c0-2.2 1.5-3.7 3-3.7s3 1.5 3 3.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AthleteIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="16.5" cy="4.5" r="1.4" />
      <path d="M8.5 8.5l3.7-2 2.8 2-1.8 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 12.5c1.4 1.4 2.8 1.4 4.2 0s2.8-1.4 4.2 0 2.8 1.4 4.2 0 2.8-1.4 4.2 0" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.5 17.5c1.4 1.4 2.8 1.4 4.2 0s2.8-1.4 4.2 0 2.8 1.4 4.2 0 2.8-1.4 4.2 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RegisterIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" strokeLinecap="round" />
      <path d="M12 11v6M9 14h6" strokeLinecap="round" />
    </svg>
  );
}

export function InstallIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M12 6v7M9.2 10.2L12 13l2.8-2.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 19h2" strokeLinecap="round" />
    </svg>
  );
}

/* Иконки для сетки навигации кабинетов (тренер/родитель/спортсмен). */

export function AttendanceIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M8 3v3M16 3v3" strokeLinecap="round" />
      <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChildrenIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="8.5" cy="7.5" r="3" />
      <circle cx="16" cy="9" r="2.3" />
      <path d="M3 20c0-3 2.4-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 20c0-2.4 1.6-4 3.7-4s3.8 1.6 3.8 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GroupsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <path d="M12 3l9 5-9 5-9-5 9-5z" strokeLinejoin="round" />
      <path d="M3 13l9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WorkoffIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" strokeLinecap="round" />
      <path d="M18 4v4h-4M6 20v-4h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LevelTaskIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function NewsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <path d="M3 10v4h3l5 4V6l-5 4H3z" strokeLinejoin="round" />
      <path d="M15 9a3 3 0 010 6M18 6a7 7 0 010 12" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <path d="M6 10a6 6 0 1112 0c0 3.5 1 5 2 6H4c1-1 2-2.5 2-6z" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 004 0" strokeLinecap="round" />
    </svg>
  );
}

export function PersonalTrainingIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="9" cy="7" r="3" />
      <path d="M4 20c0-3 2.2-5 5-5s5 2 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 4l1 2 2 .3-1.5 1.4.4 2.1-1.9-1-1.9 1 .4-2.1L16.9 6.3 18 4z" strokeLinejoin="round" />
    </svg>
  );
}

export function TrophyIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9.5 13.5L8 21l4-2 4 2-1.5-7.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path
        d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ReportIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

export function ColdIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <path d="M12 2v20M4 7l16 10M20 7L4 17" strokeLinecap="round" />
    </svg>
  );
}

export function MetricsIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <path d="M4 20V10M10 20V4M16 20v-7M3 20h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TeamIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="8" cy="9" r="3" />
      <circle cx="16" cy="9" r="3" />
      <path
        d="M2 20c0-3 2.5-5 6-5s6 2 6 5M10 20c0-3 2.5-5 6-5s6 2 6 5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PaymentIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" strokeLinecap="round" />
    </svg>
  );
}

export function MedicalIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M7 12h10" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M8 3v3M16 3v3" strokeLinecap="round" />
    </svg>
  );
}

export function DiaryIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <path
        d="M12 6c-2-1.5-5-2-8-1v13c3-1 6-.5 8 1 2-1.5 5-2 8-1V5c-3-1-6-.5-8 1z"
        strokeLinejoin="round"
      />
      <path d="M12 6v13" />
    </svg>
  );
}

export function RatingIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <path d="M4 21v-6h4v6M10 21V9h4v12M16 21v-9h4v9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StoriesIcon({ className = "" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={base} className={className}>
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}
