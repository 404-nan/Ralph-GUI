import type { QuestionRecord, AnswerRecord, PromptInjectionItem } from '../../../src/shared/types.ts';
import { fTime } from '../lib/format.ts';

interface InboxPanelProps {
  answeredQuestions: Array<QuestionRecord & { answer?: AnswerRecord }>;
  queue: PromptInjectionItem[];
}

export function InboxPanel({ answeredQuestions, queue }: InboxPanelProps) {
  return (
    <div className="space-y-4">
      {queue.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">次ターンに投入予定</h3>
          <div className="space-y-2">
            {queue.map(item => (
              <div key={item.id} className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium">{item.kind === 'answer' ? '回答' : 'ノート'}</span>
                  <span className="text-xs text-slate-400">{item.label}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">回答済み ({answeredQuestions.length})</h3>
        {answeredQuestions.length === 0 && (
          <p className="text-xs text-slate-400 py-4 text-center">回答済みの質問はありません</p>
        )}
        <div className="space-y-2">
          {answeredQuestions.map(q => (
            <div key={q.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{q.text}</p>
              {q.answer && (
                <div className="mt-2 pl-3 border-l-2 border-emerald-400">
                  <p className="text-sm text-slate-800 dark:text-slate-200">{q.answer.answer}</p>
                  <p className="text-xs text-slate-400 mt-1">{fTime(q.answer.createdAt)} · {q.answer.source}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
