import type { EventRecord } from '../../../src/shared/types.ts';
import { fTime } from '../lib/format.ts';

interface TimelineProps {
  events: EventRecord[];
  thinkingText?: string;
}

const levelColor: Record<string, string> = {
  info: 'border-l-slate-300 dark:border-l-slate-600',
  warning: 'border-l-amber-400',
  error: 'border-l-rose-400',
};

export function Timeline({ events, thinkingText }: TimelineProps) {
  return (
    <div className="space-y-2">
      {thinkingText && (
        <div className="flex items-start gap-3 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-lg text-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse mt-1.5 flex-shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">{thinkingText}</span>
        </div>
      )}
      {events.map(event => (
        <div key={event.id} className={`border-l-4 ${levelColor[event.level] || levelColor.info} rounded-r-md pl-3 py-1.5 text-sm`}>
          <span className="text-xs text-slate-400 font-mono mr-2">{fTime(event.timestamp)}</span>
          <span className="text-slate-700 dark:text-slate-300">{event.message}</span>
        </div>
      ))}
      {events.length === 0 && !thinkingText && (
        <p className="text-xs text-slate-400 text-center py-8">イベントはまだありません</p>
      )}
    </div>
  );
}
