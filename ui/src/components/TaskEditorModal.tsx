import { useEffect, useId, useMemo, useRef, type Dispatch, type SetStateAction } from 'react';

import type { AgentProfile, TaskBoardItem, TaskPriority } from '../../../src/shared/types.ts';
import {
  PRIORITY_OPTIONS,
  draftToTaskInput,
  priorityLabel,
  taskToDraft,
  validateTaskDraft,
  type TaskEditorDraft,
} from './mission-support.ts';

export function TaskEditorModal(props: {
  open: boolean;
  task: TaskBoardItem | null;
  draft: TaskEditorDraft;
  setDraft: Dispatch<SetStateAction<TaskEditorDraft>>;
  agentProfiles: AgentProfile[];
  busy: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const baselineDraft = useMemo(() => taskToDraft(props.task), [props.task]);
  const isDirty =
    JSON.stringify(draftToTaskInput(props.draft))
    !== JSON.stringify(draftToTaskInput(baselineDraft));
  const validationMessage = validateTaskDraft(props.draft);

  const requestClose = () => {
    if (props.busy) {
      return;
    }

    if (isDirty && !window.confirm('編集中の内容を破棄して閉じますか？')) {
      return;
    }

    props.onClose();
  };

  useEffect(() => {
    if (!props.open) {
      return;
    }

    restoreFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    window.setTimeout(() => {
      titleInputRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [props.open, isDirty, props.busy]);

  if (!props.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-6 py-10">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <div id={titleId} className="text-lg font-semibold text-slate-100">
              {props.task ? `${props.task.id} を編集` : '新しいタスクを作成'}
            </div>
            <div id={descriptionId} className="mt-1 text-sm text-slate-400">
              AI に渡す作業単位をここで整えます。
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:border-slate-700 hover:bg-slate-900"
          >
            閉じる
          </button>
        </div>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">タスク名</label>
            <input
              ref={titleInputRef}
              value={props.draft.title}
              onChange={(event) => props.setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
              placeholder="例: WebPanel の初期画面を最小化する"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">やること</label>
            <textarea
              value={props.draft.summary}
              onChange={(event) => props.setDraft((current) => ({ ...current, summary: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
              placeholder="何を実装・修正するかを短く書いてください"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">優先度</label>
            <select
              value={props.draft.priority}
              onChange={(event) => props.setDraft((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {priorityLabel(priority)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">担当 agent</label>
            <select
              value={props.draft.agentId}
              onChange={(event) => props.setDraft((current) => ({ ...current, agentId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
            >
              <option value="">既定の agent</option>
              {props.agentProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label || profile.id}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">完了条件</label>
            <textarea
              value={props.draft.acceptanceCriteriaText}
              onChange={(event) => props.setDraft((current) => ({ ...current, acceptanceCriteriaText: event.target.value }))}
              rows={5}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
              placeholder="- 何ができれば完了か&#10;- どう確認するか"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">補足メモ</label>
            <textarea
              value={props.draft.notes}
              onChange={(event) => props.setDraft((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
              placeholder="補足条件や注意点があれば入力"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">ブロック理由</label>
            <textarea
              value={props.draft.blockedReason}
              onChange={(event) => props.setDraft((current) => ({ ...current, blockedReason: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
              placeholder="空ならそのまま実行できます"
            />
          </div>
        </div>

        <div className="border-t border-slate-800 px-6 py-4">
          {validationMessage ? (
            <div className="rounded-2xl border border-amber-800 bg-amber-950/50 px-4 py-3 text-sm text-amber-100">
              {validationMessage}
            </div>
          ) : (
            <div className="text-sm text-slate-400">
              タスク名に加えて、やることか完了条件のどちらかは入れてください。
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-5">
          <button
            type="button"
            onClick={requestClose}
            className="rounded-xl border border-slate-800 px-4 py-2 text-sm text-slate-300 hover:border-slate-700 hover:bg-slate-900"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={props.onSave}
            disabled={props.busy || validationMessage !== null}
            className="rounded-xl border border-sky-700 bg-sky-950 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {props.busy ? '保存中...' : props.task ? '更新する' : '作成する'}
          </button>
        </div>
      </div>
    </div>
  );
}
