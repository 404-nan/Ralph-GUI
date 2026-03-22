import type { Dispatch, SetStateAction } from 'react';

import type { AgentProfile, TaskBoardItem, TaskPriority } from '../../../src/shared/types.ts';
import { PRIORITY_OPTIONS, priorityLabel, type TaskEditorDraft } from './mission-support.ts';

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
  if (!props.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-6 py-10" onClick={props.onClose}>
      <div
        className="max-h-full w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-800 bg-slate-950 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
          <div>
            <div className="text-lg font-semibold text-slate-100">
              {props.task ? `${props.task.id} を編集` : '新しい task を作成'}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              task を AI に投げる最小実行単位として定義します。
            </div>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:border-slate-700 hover:bg-slate-900"
          >
            閉じる
          </button>
        </div>

        <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Title</label>
            <input
              value={props.draft.title}
              onChange={(event) => props.setDraft((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Summary</label>
            <textarea
              value={props.draft.summary}
              onChange={(event) => props.setDraft((current) => ({ ...current, summary: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Priority</label>
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
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Agent</label>
            <select
              value={props.draft.agentId}
              onChange={(event) => props.setDraft((current) => ({ ...current, agentId: event.target.value }))}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
            >
              <option value="">Default agent</option>
              {props.agentProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.label || profile.id}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Acceptance Criteria</label>
            <textarea
              value={props.draft.acceptanceCriteriaText}
              onChange={(event) => props.setDraft((current) => ({ ...current, acceptanceCriteriaText: event.target.value }))}
              rows={5}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Notes</label>
            <textarea
              value={props.draft.notes}
              onChange={(event) => props.setDraft((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Blocked Reason</label>
            <textarea
              value={props.draft.blockedReason}
              onChange={(event) => props.setDraft((current) => ({ ...current, blockedReason: event.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
              placeholder="空なら runnable"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-5">
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-xl border border-slate-800 px-4 py-2 text-sm text-slate-300 hover:border-slate-700 hover:bg-slate-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={props.onSave}
            disabled={props.busy || !props.draft.title.trim()}
            className="rounded-xl border border-sky-700 bg-sky-950 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {props.busy ? '保存中...' : props.task ? 'Update task' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  );
}
