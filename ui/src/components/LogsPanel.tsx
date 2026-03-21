interface LogsPanelProps {
  agentLogTail: string[];
}

export function LogsPanel({ agentLogTail }: LogsPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">エージェント出力</h3>
        <div className="bg-slate-900 dark:bg-black rounded-lg p-3 max-h-96 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
          {agentLogTail.length === 0 ? (
            <p className="text-slate-500">出力はまだありません</p>
          ) : (
            agentLogTail.map((line, i) => (
              <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
