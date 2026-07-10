import {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={`mb-1.5 block text-sm font-medium text-brand-text/80 ${props.className ?? ""}`}
    />
  );
}

const controlClasses =
  "w-full rounded-xl border border-white/15 bg-brand-base/60 px-3.5 py-2.5 text-brand-text placeholder:text-brand-text/40 outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`${controlClasses} ${props.className ?? ""}`} />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`${controlClasses} ${props.className ?? ""}`}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${controlClasses} ${props.className ?? ""}`} />
  );
}

export function FieldGroup({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-brand-text/50">{hint}</p>}
    </div>
  );
}
