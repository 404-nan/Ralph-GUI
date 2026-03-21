import { PanelLeftClose, PanelLeftOpen, ListTodo, Bot } from 'lucide-react';
import type { TaskBoardItem, AgentProfile } from '../../../src/shared/types.ts';
import { taskStatusColor } from '../lib/format.ts';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  tasks: TaskBoardItem[];
  agentProfiles?: AgentProfile[];
  activeTaskId: string | null;
  onSelectTask: (id: string) => void;
}

export function Sidebar({ isOpen, onToggle, tasks, agentProfiles = [], activeTaskId, onSelectTask }: SidebarProps) {
  const groups = {
    active: tasks.filter(t => t.displayStatus === 'active'),
    queued: tasks.filter(t => t.displayStatus === 'queued'),
    blocked: tasks.filter(t => t.displayStatus === 'blocked'),
    completed: tasks.filter(t => t.displayStatus === 'completed'),
  };

  const profileMap = new Map(agentProfiles.map(p => [p.id, p]));

  if (!isOpen) {
    return (
      <div className="w-12 border-r border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#16171d] flex flex-col items-center py-3 flex-shrink-0">
        <button onClick={onToggle} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">
          <PanelLeftOpen size={18} />
        </button>
      </div>
    );
  }

  const renderGroup = (label: string, items: TaskBoardItem[]) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-3">
        <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">{label}</div>
        {items.map(task => {
          const agent = task.agentId ? profileMap.get(task.agentId) : undefined;
          return (
            <button
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                task.id === activeTaskId
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${taskStatusColor(task.displayStatus)}`} />
                <span className="truncate flex-1">{task.title}</span>
                {agent && (
                  <span className="flex-shrink-0 text-[9px] text-violet-500 dark:text-violet-400" title={agent.label}>
                    <Bot size={11} />
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <aside className="w-60 border-r border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#16171d] flex flex-col flex-shrink-0">
      <div className="h-12 flex items-center justify-between px-3 border-b border-slate-200 dark:border-[#2e303a]">
        <div className="font-semibold text-sm flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <ListTodo size={16} className="text-indigo-500" />
          <span>Tasks</span>
          <span className="text-xs text-slate-400 font-normal">{tasks.length}</span>
        </div>
        <button onClick={onToggle} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
          <PanelLeftClose size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {renderGroup('進行中', groups.active)}
        {renderGroup('待機中', groups.queued)}
        {renderGroup('ブロック', groups.blocked)}
        {renderGroup('完了', groups.completed)}
        {tasks.length === 0 && (
          <div className="px-3 py-8 text-xs text-slate-400 text-center">Task がありません</div>
        )}
      </div>
    </aside>
  );
}
