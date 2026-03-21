import { useState } from 'react';
import { Check, RotateCcw, ChevronUp, ChevronDown, Plus, Pencil } from 'lucide-react';
import type { TaskBoardItem } from '../../../src/shared/types.ts';
import { apiClient } from '../api/client.ts';
import { taskStatusLabel, taskStatusColor } from '../lib/format.ts';
import { TaskForm } from './TaskForm.tsx';

interface TaskBoardProps {
  tasks: TaskBoardItem[];
  onAction: () => void;
  onImport: () => void;
}

export function TaskBoard({ tasks, onAction, onImport }: TaskBoardProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskBoardItem | null>(null);

  const active = tasks.filter(t => t.displayStatus === 'active');
  const queued = tasks.filter(t => t.displayStatus === 'queued' || t.displayStatus === 'blocked');
  const done = tasks.filter(t => t.displayStatus === 'completed');

  const wrap = (fn: () => Promise<unknown>) => async () => { try { await fn(); onAction(); } catch (e) { console.error(e); } };

  const renderCard = (task: TaskBoardItem) => (
    <div key={task.id} className="bg-white dark:bg-[#1a1b22] border border-slate-200 dark:border-[#2e303a] rounded-lg p-3 group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${taskStatusColor(task.displayStatus)}`} />
            <span className="text-xs text-slate-400 font-mono">{task.id}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">{taskStatusLabel(task.displayStatus)}</span>
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{task.title}</p>
          {task.summary && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.summary}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {task.displayStatus !== 'completed' && (
            <button onClick={wrap(() => apiClient.completeTask(task.id))} title="完了にする" className="p-1 text-slate-400 hover:text-emerald-500 rounded"><Check size={14} /></button>
          )}
          {task.displayStatus === 'completed' && (
            <button onClick={wrap(() => apiClient.reopenTask(task.id))} title="未完了に戻す" className="p-1 text-slate-400 hover:text-indigo-500 rounded"><RotateCcw size={14} /></button>
          )}
          {task.displayStatus !== 'completed' && (
            <>
              <button onClick={wrap(() => apiClient.moveTask(task.id, 'front'))} title="先頭へ" className="p-1 text-slate-400 hover:text-indigo-500 rounded"><ChevronUp size={14} /></button>
              <button onClick={wrap(() => apiClient.moveTask(task.id, 'back'))} title="後ろへ" className="p-1 text-slate-400 hover:text-indigo-500 rounded"><ChevronDown size={14} /></button>
            </>
          )}
          <button onClick={() => setEditingTask(task)} title="編集" className="p-1 text-slate-400 hover:text-indigo-500 rounded"><Pencil size={14} /></button>
        </div>
      </div>
    </div>
  );

  const renderColumn = (title: string, items: TaskBoardItem[], accent: string) => (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${accent}`} />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
        <span className="text-xs text-slate-400">{items.length}</span>
      </div>
      <div className="space-y-2">
        {items.map(renderCard)}
        {items.length === 0 && <p className="text-xs text-slate-400 text-center py-4">なし</p>}
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Task 一覧</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1.5">
            <Plus size={13} /> 追加
          </button>
          <button onClick={onImport} className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">
            一括インポート
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderColumn('進行中 / 待機中', [...active, ...queued], 'bg-indigo-500')}
        {renderColumn('完了', done, 'bg-emerald-500')}
      </div>

      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
          onSave={onAction}
        />
      )}
    </div>
  );
}
