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
