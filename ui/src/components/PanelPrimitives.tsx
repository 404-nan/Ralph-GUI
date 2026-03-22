import type { ReactNode } from 'react';

export function Card(props: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-3xl border border-slate-800 bg-slate-950/75 ${props.className ?? ''}`}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4">
        <div>
          <div className="text-sm font-semibold text-slate-100">{props.title}</div>
          {props.subtitle && <div className="mt-1 text-sm text-slate-400">{props.subtitle}</div>}
        </div>
        {props.actions}
      </div>
      <div className="p-5">{props.children}</div>
    </section>
  );
}

export function EmptyState(props: { title: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/35 px-4 py-6 text-center">
      <div className="text-sm font-medium text-slate-200">{props.title}</div>
      <div className="mt-1 text-sm text-slate-500">{props.detail}</div>
    </div>
  );
}

export function Alert(props: {
  tone: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
}) {
  const classes = {
    error: 'border-rose-800 bg-rose-950/50 text-rose-100',
    warning: 'border-amber-800 bg-amber-950/50 text-amber-100',
    success: 'border-emerald-800 bg-emerald-950/50 text-emerald-100',
    info: 'border-sky-800 bg-sky-950/50 text-sky-100',
  } as const;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${classes[props.tone]}`}>
      <div className="text-sm font-semibold">{props.title}</div>
      <div className="mt-1 text-sm opacity-90">{props.message}</div>
    </div>
  );
}

export function Metric(props: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-100">{props.value}</div>
      {props.detail && <div className="mt-1 text-sm text-slate-400">{props.detail}</div>}
    </div>
  );
}

export function ToneBadge(props: { label: string; className: string }) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${props.className}`}>
      {props.label}
    </span>
  );
}
