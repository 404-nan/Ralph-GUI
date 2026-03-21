import { useState } from 'react';
import type { DashboardData, TaskBoardItem } from '../../../src/shared/types.ts';
import { DecisionPanel } from './DecisionPanel.tsx';
import { TaskBoard } from './TaskBoard.tsx';
import { InboxPanel } from './InboxPanel.tsx';
import { LogsPanel } from './LogsPanel.tsx';
import { SettingsPanel } from './SettingsPanel.tsx';
import { SpecImport } from './SpecImport.tsx';
import { Timeline } from './Timeline.tsx';
import { taskStatusLabel, taskStatusColor } from '../lib/format.ts';

interface TaskWorkspaceProps {
  dashboard: DashboardData;
  activeTask?: TaskBoardItem;
  onAction: () => void;
}

type Tab = 'workspace' | 'tasks' | 'inbox' | 'logs' | 'settings';

export function TaskWorkspace({ dashboard, activeTask, onAction }: TaskWorkspaceProps) {
  const [tab, setTab] = useState<Tab>('workspace');
  const [showImport, setShowImport] = useState(false);

  const tabBtn = (t: Tab, label: string, badge?: number) => (
    <button
      onClick={() => setTab(t)}
      className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
        tab === t
          ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400'
          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">{badge}</span>
      )}
    </button>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {activeTask && tab === 'workspace' && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-[#2e303a]">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full ${taskStatusColor(activeTask.displayStatus)}`} />
            <span className="text-xs text-slate-400 font-mono">{activeTask.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{taskStatusLabel(activeTask.displayStatus)}</span>
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{activeTask.title}</h2>
          {activeTask.summary && <p className="text-sm text-slate-500 mt-0.5">{activeTask.summary}</p>}
          {activeTask.acceptanceCriteria && activeTask.acceptanceCriteria.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">受入基準</span>
              <ul className="mt-1 space-y-0.5">
                {activeTask.acceptanceCriteria.map((c, i) => (
                  <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                    <span className="text-slate-300 mt-0.5">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center border-b border-slate-200 dark:border-[#2e303a] px-4 bg-white dark:bg-[#16171d]">
        {tabBtn('workspace', 'ワークスペース')}
        {tabBtn('tasks', 'Tasks', dashboard.taskBoard.length)}
        {tabBtn('inbox', 'Inbox', dashboard.promptInjectionQueue.length)}
        {tabBtn('logs', 'Logs')}
        {tabBtn('settings', '設定')}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'workspace' && (
          <div className="space-y-4">
            {dashboard.pendingDecisions.length > 0 && (
              <DecisionPanel decisions={dashboard.pendingDecisions} blockers={dashboard.blockers} onAction={onAction} />
            )}
            <Timeline events={dashboard.recentEvents} thinkingText={dashboard.status.thinkingText} />
          </div>
        )}
        {tab === 'tasks' && (
          showImport ? (
            <SpecImport embedded onClose={() => setShowImport(false)} onImportSuccess={() => { setShowImport(false); onAction(); }} />
          ) : (
            <TaskBoard tasks={dashboard.taskBoard} agentProfiles={dashboard.agentProfiles} onAction={onAction} onImport={() => setShowImport(true)} />
          )
        )}
        {tab === 'inbox' && (
          <InboxPanel answeredQuestions={dashboard.answeredQuestions} queue={dashboard.promptInjectionQueue} />
        )}
        {tab === 'logs' && (
          <LogsPanel agentLogTail={dashboard.agentLogTail} />
        )}
        {tab === 'settings' && (
          <SettingsPanel dashboard={dashboard} onAction={onAction} />
        )}
      </div>
    </div>
  );
}
