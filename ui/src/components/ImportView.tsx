import type { ImportedTaskDraft, TaskImportPreview, TaskPriority } from '../../../src/shared/types.ts';
import { Card, EmptyState, Alert } from './PanelPrimitives.tsx';
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
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      <Card
        title="Spec Import"
        subtitle="Large specs are previewed, split, and deduped before they become runnable tasks."
        actions={(
          <div className="flex gap-2">
            <button
              type="button"
              onClick={props.onPreview}
              disabled={!props.importText.trim() || props.busyPreview}
              className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-700 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Preview
            </button>
            <button
              type="button"
              onClick={props.onCommit}
              disabled={!props.importPreview || props.busyCommit}
              className="rounded-xl border border-sky-700 bg-sky-950 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Import selected
            </button>
          </div>
        )}
      >
        <textarea
          value={props.importText}
          onChange={(event) => props.onChangeImportText(event.target.value)}
          rows={26}
          className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-700"
          placeholder="Paste a spec, heading list, or JSON backlog here."
        />
      </Card>

      <Card
        title="Preview"
        subtitle={
          props.importPreview
            ? `format=${props.importPreview.format} • drafts=${props.reviewDrafts.length} • duplicates=${props.importPreview.duplicateGroups.length} • splits=${props.importPreview.splitSuggestions.length}`
            : 'Preview first, then review drafts before importing.'
        }
      >
        {props.importPreview ? (
          <div className="space-y-5">
            {props.importPreview.duplicateGroups.length > 0 && (
              <Alert
                tone="warning"
                title="重複候補があります"
                message={props.importPreview.duplicateGroups.map((group) => `${group.title} (#${group.indexes.map((index) => index + 1).join(', ')})`).join(' / ')}
              />
            )}

            {props.importPreview.splitSuggestions.length > 0 && (
              <Alert
                tone="info"
                title="長い項目に split suggestion があります"
                message={props.importPreview.splitSuggestions.map((suggestion) => `#${suggestion.index + 1} -> ${suggestion.suggestions.map((item) => item.title).join(', ')}`).join(' / ')}
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
                      Draft #{index + 1}
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
                    />
                    <textarea
                      value={joinMultilineList(draft.acceptanceCriteria)}
                      onChange={(event) => props.onChangeDraft(index, { acceptanceCriteria: parseMultilineList(event.target.value) })}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                      placeholder="Acceptance criteria"
                    />
                    <textarea
                      value={draft.notes ?? ''}
                      onChange={(event) => props.onChangeDraft(index, { notes: event.target.value })}
                      rows={3}
                      className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                      placeholder="Notes"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="Preview is empty" detail="spec を貼り付けて Preview を実行すると、draft / duplicates / split suggestions をここで確認できます。" />
        )}
      </Card>
    </div>
  );
}
