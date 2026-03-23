import type {
  RuntimeSettings,
  TaskBoardItem,
  TaskPriority,
} from '../../../src/shared/types.ts';
import { ApiClientError, type TaskInput } from '../api/client.ts';

export type View = 'mission' | 'tasks' | 'import' | 'setup' | 'timeline' | 'notes';

export interface TaskEditorDraft {
  title: string;
  summary: string;
  priority: TaskPriority;
  acceptanceCriteriaText: string;
  notes: string;
  blockedReason: string;
  agentId: string;
}

export interface SettingsDraft {
  taskName: string;
  maxIterations: number;
  idleSeconds: number;
  mode: RuntimeSettings['mode'];
  agentCommand: string;
  agentCwd: string;
  promptFile: string;
  promptBody: string;
  discordNotifyChannelId: string;
  agentProfiles: RuntimeSettings['agentProfiles'];
}

export const PRIORITY_OPTIONS: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

export function formatDateTime(iso?: string): string {
  if (!iso) {
    return '-';
  }

  try {
    return new Date(iso).toLocaleString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) {
    return '-';
  }

  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) {
      return 'たった今';
    }
    if (diff < 3_600_000) {
      return `${Math.floor(diff / 60_000)}分前`;
    }
    if (diff < 86_400_000) {
      return `${Math.floor(diff / 3_600_000)}時間前`;
    }
    return `${Math.floor(diff / 86_400_000)}日前`;
  } catch {
    return iso;
  }
}

export function runStateLabel(value: string): string {
  return ({
    idle: 'Idle',
    ready: 'Ready',
    running: 'Running',
    paused: 'Paused',
    blocked: 'Blocked',
    needs_review: 'Needs review',
    completed: 'Completed',
    aborted: 'Aborted',
    failed: 'Failed',
  } as Record<string, string>)[value] ?? value;
}

export function priorityLabel(value: TaskPriority): string {
  return ({
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  } as Record<TaskPriority, string>)[value];
}

export function laneLabel(value: TaskBoardItem['displayStatus']): string {
  return ({
    current: 'Current',
    next: 'Next',
    blocked: 'Blocked',
    done: 'Done',
  } as Record<string, string>)[value] ?? value;
}

export function runStateTone(value: string): string {
  return ({
    idle: 'border-slate-700 bg-slate-900 text-slate-100',
    ready: 'border-sky-700 bg-sky-950/70 text-sky-100',
    running: 'border-emerald-700 bg-emerald-950/70 text-emerald-100',
    paused: 'border-amber-700 bg-amber-950/70 text-amber-100',
    blocked: 'border-amber-700 bg-amber-950/70 text-amber-100',
    needs_review: 'border-amber-700 bg-amber-950/70 text-amber-100',
    completed: 'border-emerald-700 bg-emerald-950/70 text-emerald-100',
    aborted: 'border-rose-700 bg-rose-950/70 text-rose-100',
    failed: 'border-rose-700 bg-rose-950/70 text-rose-100',
  } as Record<string, string>)[value] ?? 'border-slate-700 bg-slate-900 text-slate-100';
}

export function priorityTone(value: TaskPriority): string {
  return ({
    critical: 'border-rose-700 bg-rose-950/70 text-rose-100',
    high: 'border-amber-700 bg-amber-950/70 text-amber-100',
    medium: 'border-sky-700 bg-sky-950/70 text-sky-100',
    low: 'border-slate-700 bg-slate-900 text-slate-100',
  } as Record<TaskPriority, string>)[value];
}

export function laneTone(value: TaskBoardItem['displayStatus']): string {
  return ({
    current: 'border-sky-700 bg-sky-950/70 text-sky-100',
    next: 'border-slate-700 bg-slate-900 text-slate-100',
    blocked: 'border-amber-700 bg-amber-950/70 text-amber-100',
    done: 'border-emerald-700 bg-emerald-950/70 text-emerald-100',
  } as Record<string, string>)[value] ?? 'border-slate-700 bg-slate-900 text-slate-100';
}

export function parseMultilineList(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

export function joinMultilineList(value: string[] | undefined): string {
  return (value ?? []).join('\n');
}

export function blankTaskDraft(): TaskEditorDraft {
  return {
    title: '',
    summary: '',
    priority: 'medium',
    acceptanceCriteriaText: '',
    notes: '',
    blockedReason: '',
    agentId: '',
  };
}

export function taskToDraft(task?: TaskBoardItem | null): TaskEditorDraft {
  if (!task) {
    return blankTaskDraft();
  }

  return {
    title: task.title,
    summary: task.summary,
    priority: task.priority,
    acceptanceCriteriaText: joinMultilineList(task.acceptanceCriteria),
    notes: task.notes ?? '',
    blockedReason: task.blockedReason ?? '',
    agentId: task.agentId ?? '',
  };
}

export function draftToTaskInput(draft: TaskEditorDraft): TaskInput {
  return {
    title: draft.title.trim(),
    summary: draft.summary.trim(),
    priority: draft.priority,
    acceptanceCriteria: parseMultilineList(draft.acceptanceCriteriaText),
    notes: draft.notes.trim() || undefined,
    blockedReason: draft.blockedReason.trim() || undefined,
    agentId: draft.agentId.trim() || undefined,
  };
}

export function validateTaskDraft(draft: TaskEditorDraft): string | null {
  if (!draft.title.trim()) {
    return 'タスク名を入力してください。';
  }

  const hasSummary = draft.summary.trim().length > 0;
  const hasAcceptanceCriteria = parseMultilineList(draft.acceptanceCriteriaText).length > 0;
  if (!hasSummary && !hasAcceptanceCriteria) {
    return 'やることの説明か完了条件のどちらかは入れてください。';
  }

  return null;
}

export function settingsToDraft(settings: RuntimeSettings): SettingsDraft {
  return {
    taskName: settings.taskName,
    maxIterations: settings.maxIterations,
    idleSeconds: settings.idleSeconds,
    mode: settings.mode,
    agentCommand: settings.agentCommand,
    agentCwd: settings.agentCwd,
    promptFile: settings.promptFile,
    promptBody: settings.promptBody,
    discordNotifyChannelId: settings.discordNotifyChannelId,
    agentProfiles: settings.agentProfiles ?? [],
  };
}

export function validateSettingsDraft(draft: SettingsDraft): string | null {
  if (!draft.taskName.trim()) {
    return 'タスク名を入力してください。';
  }

  if (!draft.agentCwd.trim()) {
    return 'workspace を入力してください。';
  }

  if (draft.mode === 'command' && !draft.agentCommand.trim()) {
    return '通常実行では agent command が必要です。';
  }

  if (!draft.promptBody.trim() && !draft.promptFile.trim()) {
    return 'prompt file か prompt override のどちらかを入力してください。';
  }

  return null;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed.';
}
