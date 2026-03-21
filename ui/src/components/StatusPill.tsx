import { lifecycleLabel, lifecycleColor } from '../lib/format.ts';

interface StatusPillProps {
  lifecycle: string;
  className?: string;
}

export function StatusPill({ lifecycle, className = '' }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      <span className={`w-2 h-2 rounded-full ${lifecycleColor(lifecycle)} ${lifecycle === 'running' ? 'animate-pulse' : ''}`} />
      <span className="text-slate-700 dark:text-slate-300">{lifecycleLabel(lifecycle)}</span>
    </span>
  );
}
