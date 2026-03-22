import type { DashboardData } from '../../../src/shared/types.ts';
import { Card, EmptyState } from './PanelPrimitives.tsx';
import { formatRelativeTime } from './mission-support.ts';

export function TimelineView(props: { dashboard: DashboardData }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card title="Recent Events" subtitle="Timeline is secondary. Use it to inspect context after the primary dashboard.">
        {props.dashboard.recentEvents.length > 0 ? (
          <div className="space-y-3">
            {props.dashboard.recentEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-100">{event.message}</div>
                    <div className="mt-1 text-xs text-slate-500">{event.type}</div>
                  </div>
                  <div className="text-xs text-slate-500">{formatRelativeTime(event.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Event timeline はまだ空です" detail="run が始まるとここにイベントが積まれます。" />
        )}
      </Card>

      <Card title="Agent Log Tail" subtitle="Recent raw outputs for deeper debugging.">
        {props.dashboard.agentLogTail.length > 0 ? (
          <div className="space-y-2">
            {props.dashboard.agentLogTail.map((line, index) => (
              <div key={`${index}-${line}`} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-300">
                {line}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Agent log は空です" detail="まだ実行されていないか、出力が保存されていません。" />
        )}
      </Card>
    </div>
  );
}
