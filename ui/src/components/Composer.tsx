import { useState } from 'react';
import { Send, FileText, CheckSquare, MessageSquare } from 'lucide-react';
import { apiClient } from '../api/client.ts';
import type { DecisionView } from '../../../src/shared/types.ts';

interface ComposerProps {
  pendingDecisions?: DecisionView[];
  onAction: () => void;
}

const presets = [
  '方針優先で進めてください',
  '品質よりスピード重視で',
  'テストも書いてください',
  'コメントは最小限に',
];

export function Composer({ pendingDecisions = [], onAction }: ComposerProps) {
  const [mode, setMode] = useState<'note' | 'task' | 'decision'>('note');
  const [text, setText] = useState('');
  const [selectedDecisionId, setSelectedDecisionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (mode === 'note') {
        await apiClient.enqueueNote(text);
      } else if (mode === 'task') {
        const [title, ...rest] = text.split('\n');
        await apiClient.createTask(title, rest.join('\n'));
      } else if (mode === 'decision') {
        const qId = selectedDecisionId || pendingDecisions[0]?.id;
        if (qId) {
          await apiClient.submitAnswer(qId, text);
        } else {
          await apiClient.enqueueNote(`[Decision]: ${text}`);
        }
      }
      setText('');
      onAction();
    } catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const modeBtn = (m: typeof mode, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => setMode(m)}
      className={`px-3 py-1 rounded-md flex items-center gap-1.5 text-xs font-medium transition-colors ${
        mode === m
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
          : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-[#2e303a]'
      }`}
    >{icon}{label}</button>
  );

  return (
    <div className="border-t border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#16171d] p-3 flex-shrink-0">
      <div className="ring-1 ring-slate-200 dark:ring-[#2e303a] rounded-lg bg-white dark:bg-[#1a1b22] overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-shadow">
        <div className="flex items-center gap-1 px-3 pt-2">
          {modeBtn('note', <FileText size={13} />, 'Note')}
          {modeBtn('task', <CheckSquare size={13} />, 'Task')}
          {modeBtn('decision', <MessageSquare size={13} />, 'Decision')}
          {mode === 'decision' && pendingDecisions.length > 0 && (
            <select
              value={selectedDecisionId}
              onChange={e => setSelectedDecisionId(e.target.value)}
              className="ml-2 text-xs bg-transparent border border-slate-200 dark:border-slate-700 rounded px-2 py-0.5 text-slate-500"
            >
              {pendingDecisions.map(d => (
                <option key={d.id} value={d.id}>{d.id}: {d.title.slice(0, 40)}</option>
              ))}
            </select>
          )}
        </div>

        {mode === 'note' && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-2">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setText(p)}
                className="px-2 py-0.5 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 rounded hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 transition-colors"
              >{p}</button>
            ))}
          </div>
        )}

        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={
              mode === 'note' ? 'エージェントへの指示やメモを入力... (Cmd+Enter で送信)' :
              mode === 'task' ? '1行目がタイトル、2行目以降が概要... (Cmd+Enter で送信)' :
              '判断内容を入力... (Cmd+Enter で送信)'
            }
            className="w-full bg-transparent resize-none focus:outline-none px-3 py-2 text-sm min-h-[60px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            disabled={isSubmitting}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isSubmitting}
            className="absolute bottom-2 right-2 p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-30 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
