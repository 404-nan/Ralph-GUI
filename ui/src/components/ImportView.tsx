import type { ImportedTaskDraft, TaskImportPreview, TaskPriority } from '../../../src/shared/types.ts';
import { Alert, Card, EmptyState } from './PanelPrimitives.tsx';
import {
  joinMultilineList,
  parseMultilineList,
  PRIORITY_OPTIONS,
  priorityLabel,
} from './mission-support.ts';

export function ImportView(props: {
  importText: string;
  importPreview: TaskImportPreview | null;
  reviewDrafts: ImportedTaskDraft[];
  busyPreview: boolean;
  busyCommit: boolean;
  onChangeImportText: (value: string) => void;
  onPreview: () => void;
  onCommit: () => void;
  onChangeDraft: (index: number, patch: Partial<ImportedTaskDraft>) => void;
  onUnselectDuplicates: () => void;
  onApplySplitSuggestions: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
      <Card
        title="1. 仕様を貼る"
        subtitle="仕様書、見出し一覧、JSON のどれでも貼れます。編集すると下書きは作り直しになります。"
        actions={(
          <button
            type="button"
            onClick={props.onPreview}
            disabled={!props.importText.trim() || props.busyPreview}
            className="rounded-xl border border-sky-700 bg-sky-950 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            下書きを作る
          </button>
        )}
      >
        <textarea
          value={props.importText}
          onChange={(event) => props.onChangeImportText(event.target.value)}
          rows={24}
          className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-700"
          placeholder="ここに仕様書やタスク一覧を貼り付けます"
        />
      </Card>

      <Card
        title="2. 確認して追加する"
        subtitle={
          props.importPreview
            ? `${props.reviewDrafts.length} 件の下書きを作成しました`
            : 'まず下書きを作ってから、内容を確認して追加します。'
        }
        actions={(
          <button
            type="button"
            onClick={props.onCommit}
            disabled={!props.importPreview || props.busyCommit}
            className="rounded-xl border border-emerald-700 bg-emerald-950 px-3 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            選んだものを追加
          </button>
        )}
      >
        {props.importPreview ? (
          <div className="space-y-5">
            {props.importPreview.duplicateGroups.length > 0 && (
              <div className="space-y-3">
                <Alert
                  tone="warning"
                  title="重複候補があります"
                  message={props.importPreview.duplicateGroups.map((group) => `${group.title} (#${group.indexes.map((index) => index + 1).join(', ')})`).join(' / ')}
                />
                <button
                  type="button"
                  onClick={props.onUnselectDuplicates}
                  className="rounded-xl border border-amber-700 bg-amber-950 px-3 py-2 text-sm font-medium text-amber-100 hover:bg-amber-900"
                >
                  後ろの重複候補を外す
                </button>
              </div>
            )}

            {props.importPreview.splitSuggestions.length > 0 && (
              <div className="space-y-3">
                <Alert
                  tone="info"
                  title="長い項目は分割できます"
                  message={props.importPreview.splitSuggestions.map((suggestion) => `#${suggestion.index + 1} -> ${suggestion.suggestions.map((item) => item.title).join(', ')}`).join(' / ')}
                />
                <button
                  type="button"
                  onClick={props.onApplySplitSuggestions}
                  className="rounded-xl border border-sky-700 bg-sky-950 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-900"
                >
                  分割案を下書きへ反映
                </button>
              </div>
            )}

            {props.importPreview.truncated && (
              <Alert
                tone="warning"
                title="一部だけ表示しています"
                message="候補が多いため、下書き表示を途中で切っています。必要なら仕様を分けて取り込んでください。"
              />
            )}

            <div className="space-y-4">
              {props.reviewDrafts.map((draft, index) => (
                <div key={`${index}-${draft.title}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={draft.selected !== false}
                        onChange={(event) => props.onChangeDraft(index, { selected: event.target.checked })}
                      />
                      下書き {index + 1}
                    </label>
                    <select
                      value={draft.priority}
                      onChange={(event) => props.onChangeDraft(index, { priority: event.target.value as TaskPriority })}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                    >
                      {PRIORITY_OPTIONS.map((priority) => (
                        <option key={priority} value={priority}>
                          {priorityLabel(priority)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <input
                      value={draft.title}
                      onChange={(event) => props.onChangeDraft(index, { title: event.target.value })}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                    />
                    <textarea
                      value={draft.summary}
                      onChange={(event) => props.onChangeDraft(index, { summary: event.target.value })}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                      placeholder="この task で何をするか"
                    />
                    <textarea
                      value={joinMultilineList(draft.acceptanceCriteria)}
                      onChange={(event) => props.onChangeDraft(index, { acceptanceCriteria: parseMultilineList(event.target.value) })}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                      placeholder="完了条件"
                    />
                    <textarea
                      value={draft.notes ?? ''}
                      onChange={(event) => props.onChangeDraft(index, { notes: event.target.value })}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                      placeholder="補足メモ"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="まだ下書きはありません" detail="仕様を貼って「下書きを作る」を押すと、ここで確認できます。" />
        )}
      </Card>
    </div>
  );
}
