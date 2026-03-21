import { useState } from 'react';
import { X, Bot } from 'lucide-react';
import type { TaskBoardItem, AgentProfile } from '../../../src/shared/types.ts';
import { apiClient } from '../api/client.ts';

interface TaskFormProps {
  task?: TaskBoardItem | null;
  agentProfiles?: AgentProfile[];
  onClose: () => void;
  onSave: () => void;
}

export function TaskForm({ task, agentProfiles = [], onClose, onSave }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [summary, setSummary] = useState(task?.summary || '');
  const [agentId, setAgentId] = useState(task?.agentId || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (task) {
        await apiClient.updateTask(task.id, { title, summary, agentId: agentId || undefined });
      } else {
        await apiClient.createTask(title, summary, agentId || undefined);
      }
      onSave();
      onClose();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 dark:bg-black/50" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{task ? 'Task を編集' : 'Task を追加'}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
        </div>
        <label className="block text-xs font-medium text-slate-500 mb-1">タイトル</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-3"
          autoFocus
        />
        <label className="block text-xs font-medium text-slate-500 mb-1">概要</label>
        <textarea
          value={summary}
          onChange={e => setSummary(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none mb-3"
        />

        {agentProfiles.length > 0 && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
              <Bot size={12} /> 担当エージェント
            </label>
            <select
              value={agentId}
              onChange={e => setAgentId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">既定 (デフォルト)</option>
              {agentProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.label || p.id}{p.description ? ` - ${p.description}` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            キャンセル
          </button>
          <button type="submit" disabled={!title.trim() || saving} className="px-4 py-2 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
