import { useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import type { DecisionView, BlockerRecord } from '../../../src/shared/types.ts';
import { apiClient } from '../api/client.ts';
import { fRelative } from '../lib/format.ts';

interface DecisionPanelProps {
  decisions: DecisionView[];
  blockers: BlockerRecord[];
  onAction: () => void;
}

export function DecisionPanel({ decisions, blockers, onAction }: DecisionPanelProps) {
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  if (decisions.length === 0 && blockers.length === 0) return null;

  const submitAnswer = async (questionId: string, answer: string) => {
    setSubmitting(questionId);
    try {
      await apiClient.submitAnswer(questionId, answer);
      onAction();
    } catch (e) { console.error(e); }
    finally { setSubmitting(null); }
  };

  return (
    <div className="space-y-3">
      {decisions.map(d => (
        <div key={d.id} className="border border-amber-300/50 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 rounded-lg p-4">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{d.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{d.id} · {fRelative(d.createdAt)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {d.choices.filter(c => c.kind === 'answer').map(c => (
              <button
                key={c.id}
                disabled={submitting === d.id}
                onClick={() => submitAnswer(d.id, c.answer!)}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-50"
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              placeholder="自由に回答..."
              value={customAnswers[d.id] || ''}
              onChange={e => setCustomAnswers(prev => ({ ...prev, [d.id]: e.target.value }))}
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              disabled={!customAnswers[d.id]?.trim() || submitting === d.id}
              onClick={() => { submitAnswer(d.id, customAnswers[d.id]!); setCustomAnswers(prev => ({ ...prev, [d.id]: '' })); }}
              className="px-2 py-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 disabled:opacity-50"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      ))}

      {blockers.map(b => (
        <div key={b.id} className="border border-rose-300/50 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{b.text}</p>
              <p className="text-xs text-slate-400 mt-1">Blocker {b.id} · {fRelative(b.createdAt)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
