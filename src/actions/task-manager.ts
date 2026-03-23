import { createHash } from 'node:crypto';

import { buildOrchestrationSnapshot } from '../orchestration/model.ts';
import type { AppConfig } from '../config.ts';
import { nextSequentialId } from '../shared/id.ts';
import { nowIso } from '../shared/time.ts';
import type {
  BlockerRecord,
  ImportedTaskDraft,
  PromptInjectionItem,
  QuestionRecord,
  StoredTaskStatus,
  TaskBoardItem,
  TaskImportPreview,
  TaskPriority,
  TaskRecord,
} from '../shared/types.ts';
import { FileStateStore } from '../state/store.ts';
import { loadTaskSeeds } from '../tasks/catalog.ts';
import { parseTasksFromSpecText } from '../tasks/importer.ts';

export interface TaskDraftInput {
  title?: string;
  summary?: string;
  priority?: TaskPriority;
  acceptanceCriteria?: string[];
  notes?: string;
  blockedReason?: string;
  agentId?: string;
}

interface ParsedTaskMarker {
  id: string;
  title: string;
  status: StoredTaskStatus;
}

function orderTasks(tasks: TaskRecord[]): TaskRecord[] {
  return [...tasks].sort((left, right) => {
    const orderDelta = left.sortIndex - right.sortIndex;
    if (orderDelta !== 0) {
      return orderDelta;
    }
    return left.id.localeCompare(right.id);
  });
}

function resequenceTasks(tasks: TaskRecord[]): void {
  tasks.forEach((task, index) => {
    task.sortIndex = index + 1;
  });
}

function normalizeTaskStatus(value?: string): StoredTaskStatus {
  if (value === 'completed' || value === 'done') {
    return 'completed';
  }
  if (value === 'blocked') {
    return 'blocked';
  }
  return 'pending';
}

function createImportPreviewToken(specText: string): string {
  return createHash('sha256').update(specText, 'utf8').digest('hex');
}

function withPreviewToken(specText: string, preview: Omit<TaskImportPreview, 'previewToken'>): TaskImportPreview {
  return {
    ...preview,
    previewToken: createImportPreviewToken(specText),
  };
}

export function parseTaskMarker(content: string): ParsedTaskMarker | null {
  const parts = content
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return null;
  }

  if (parts.length === 1) {
    return { id: parts[0], title: parts[0], status: 'pending' };
  }

  if (parts.length === 2) {
    return { id: parts[0], title: parts[1], status: 'pending' };
  }

  return {
    id: parts[0],
    status: normalizeTaskStatus(parts[1].toLowerCase()),
    title: parts.slice(2).join(' | '),
  };
}

export interface ActionActor {
  source: string;
}

export type AppendEventFn = (
  type: string,
  level: 'info' | 'warning' | 'error',
  message: string,
  data?: Record<string, unknown>,
) => Promise<void>;

/**
 * Task CRUD / catalog sync / import / reorder
 */
export class TaskManager {
  readonly store: FileStateStore;
  readonly config: AppConfig;
  private readonly appendEvent: AppendEventFn;

  constructor(store: FileStateStore, config: AppConfig, appendEvent: AppendEventFn) {
    this.store = store;
    this.config = config;
    this.appendEvent = appendEvent;
  }

  synchronizeTaskCatalog(): TaskRecord[] {
    const timestamp = nowIso();
    const existingTasks = this.store.readTasks();
    const seeds = loadTaskSeeds(this.config);

    if (seeds.length === 0) {
      return existingTasks;
    }

    const existingById = new Map(existingTasks.map((task) => [task.id, task]));
    const seedIds = new Set(seeds.map((seed) => seed.id));

    const merged: TaskRecord[] = seeds.map((seed) => {
      const existing = existingById.get(seed.id);
      const nextStatus =
        seed.status === 'completed'
          ? 'completed'
          : existing?.status === 'completed'
            ? 'completed'
            : existing?.status === 'blocked'
              ? 'blocked'
              : 'pending';
      const nextTitle = existing?.titleOverride ?? seed.title;
      const nextSummary = existing?.summaryOverride ?? seed.summary;
      const nextNotes = existing?.notes ?? seed.notes;

      return {
        id: seed.id,
        title: nextTitle,
        summary: nextSummary,
        priority: existing?.priority ?? seed.priority,
        sortIndex: existing?.sortIndex ?? seed.sortIndex,
        status: nextStatus,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt:
          existing &&
          existing.title === nextTitle &&
          existing.summary === nextSummary &&
          existing.notes === nextNotes &&
          existing.status === nextStatus
            ? existing.updatedAt
            : timestamp,
        source: existing?.source ?? seed.source,
        acceptanceCriteria: existing?.acceptanceCriteria?.length
          ? existing.acceptanceCriteria
          : seed.acceptanceCriteria,
        notes: nextNotes,
        blockedReason: existing?.blockedReason,
        titleOverride: existing?.titleOverride,
        summaryOverride: existing?.summaryOverride,
        agentId: existing?.agentId,
        completedAt: nextStatus === 'completed' ? existing?.completedAt ?? timestamp : undefined,
      };
    });

    const manualTasks = existingTasks.filter((task) => !seedIds.has(task.id));
    const catalog = orderTasks([...merged, ...manualTasks]);
    if (JSON.stringify(catalog) !== JSON.stringify(existingTasks)) {
      this.store.writeTasks(catalog);
    }
    return catalog;
  }

  buildTaskRecord(tasks: TaskRecord[], input: TaskDraftInput, actor: ActionActor): TaskRecord {
    const title = input.title?.trim();
    if (!title) {
      throw new Error('Task 名を入力してください');
    }

    const nextIndex = tasks.reduce((max, task) => Math.max(max, task.sortIndex), 0) + 1;
    const timestamp = nowIso();
    const taskId = nextSequentialId(
      'T',
      tasks.map((task) => task.id).filter((id) => /^T-\d+$/.test(id)),
    );

    return {
      id: taskId,
      title,
      summary: input.summary?.trim() || title,
      priority: input.priority ?? 'medium',
      sortIndex: nextIndex,
      status: input.blockedReason?.trim() ? 'blocked' : 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      source: actor.source,
      acceptanceCriteria: (input.acceptanceCriteria ?? []).map((item) => item.trim()).filter(Boolean),
      notes: input.notes?.trim() || undefined,
      blockedReason: input.blockedReason?.trim() || undefined,
      agentId: input.agentId || undefined,
    };
  }

  async createTask(input: TaskDraftInput, actor: ActionActor): Promise<TaskRecord> {
    const tasks = this.synchronizeTaskCatalog();
    const record = this.buildTaskRecord(tasks, input, actor);
    tasks.push(record);
    this.store.writeTasks(orderTasks(tasks));
    await this.appendEvent('task.created', 'info', `${record.id}: ${record.title}`, {
      source: actor.source,
      taskId: record.id,
    });
    return record;
  }

  async previewTaskImport(specText: string): Promise<TaskImportPreview> {
    return withPreviewToken(specText, parseTasksFromSpecText(specText));
  }

  private importDrafts(
    tasks: TaskRecord[],
    drafts: ImportedTaskDraft[],
    actor: ActionActor,
  ): TaskRecord[] {
    return drafts
      .filter((draft) => draft.selected !== false)
      .map((draft) => {
        const record = this.buildTaskRecord(
          tasks,
          {
            title: draft.title,
            summary: draft.summary,
            priority: draft.priority,
            acceptanceCriteria: draft.acceptanceCriteria,
            notes: draft.notes,
          },
          actor,
        );
        tasks.push(record);
        return record;
      });
  }

  async importTasksFromSpec(
    specText: string,
    actor: ActionActor,
    reviewedDrafts?: ImportedTaskDraft[],
    previewToken?: string,
  ): Promise<{ preview: TaskImportPreview; tasks: TaskRecord[] }> {
    const preview = await this.previewTaskImport(specText);
    if (!previewToken?.trim()) {
      throw new Error('最新の preview から取り込んでください');
    }
    if (preview.previewToken !== previewToken) {
      throw new Error('仕様書が preview 時点から変わっています。もう一度 preview を作り直してください');
    }
    const drafts = reviewedDrafts ?? preview.drafts;
    if (drafts.length === 0 || drafts.every((draft) => draft.selected === false)) {
      throw new Error('Task に分解できる項目が見つかりませんでした');
    }

    const tasks = this.synchronizeTaskCatalog();
    const created = this.importDrafts(tasks, drafts, actor);

    this.store.writeTasks(orderTasks(tasks));

    const status = this.store.readStatus();
    status.currentStatusText = `${created.length} 件の Task draft を仕様書から追加しました`;
    status.thinkingText = status.currentStatusText;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    await this.appendEvent(
      'task.imported',
      'info',
      `${created.length} 件の Task draft を仕様書から追加しました`,
      {
        source: actor.source,
        count: created.length,
        format: preview.format,
        truncated: preview.truncated,
        duplicates: preview.duplicateGroups.length,
      },
    );

    return { preview, tasks: created };
  }

  async updateTask(
    taskId: string,
    input: TaskDraftInput,
    actor: ActionActor,
  ): Promise<TaskRecord | null> {
    const tasks = this.synchronizeTaskCatalog();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return null;
    }

    const nextTitle = input.title?.trim();
    const nextSummary = input.summary?.trim();
    const seed = loadTaskSeeds(this.config).find((item) => item.id === taskId);
    if (nextTitle) {
      task.title = nextTitle;
      task.titleOverride = seed ? (nextTitle === seed.title ? undefined : nextTitle) : undefined;
    }
    if (nextSummary !== undefined) {
      const summary = nextSummary || task.title;
      task.summary = summary;
      task.summaryOverride = seed ? (summary === seed.summary ? undefined : summary) : undefined;
    }
    if (input.priority) {
      task.priority = input.priority;
    }
    if (input.acceptanceCriteria !== undefined) {
      task.acceptanceCriteria = input.acceptanceCriteria.map((item) => item.trim()).filter(Boolean);
    }
    if (input.notes !== undefined) {
      task.notes = input.notes.trim() || undefined;
    }
    if (input.blockedReason !== undefined) {
      task.blockedReason = input.blockedReason.trim() || undefined;
      task.status = task.blockedReason ? 'blocked' : task.status === 'blocked' ? 'pending' : task.status;
    }
    if (input.agentId !== undefined) {
      task.agentId = input.agentId || undefined;
    }
    task.updatedAt = nowIso();
    task.source = actor.source;

    this.store.writeTasks(orderTasks(tasks));
    await this.appendEvent('task.updated', 'info', `${task.id}: ${task.title}`, {
      source: actor.source,
      taskId: task.id,
    });
    return task;
  }

  async completeTask(
    taskId: string,
    actor: ActionActor,
    extraContext?: {
      listPendingQuestions: () => QuestionRecord[];
      readBlockers: () => BlockerRecord[];
      listPromptInjectionQueue: () => PromptInjectionItem[];
    },
  ): Promise<TaskRecord | null> {
    const tasks = this.synchronizeTaskCatalog();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return null;
    }

    task.status = 'completed';
    task.blockedReason = undefined;
    task.completedAt = nowIso();
    task.updatedAt = task.completedAt;
    task.source = actor.source;
    this.store.writeTasks(orderTasks(tasks));

    let nextTask: TaskBoardItem | undefined;
    if (extraContext) {
      nextTask = this.findCurrentTask(buildOrchestrationSnapshot({
        status: this.store.readStatus(),
        tasks,
        pendingQuestions: extraContext.listPendingQuestions(),
        blockers: extraContext.readBlockers(),
        promptInjectionQueue: extraContext.listPromptInjectionQueue(),
      }).taskBoard);
    }

    const status = this.store.readStatus();
    status.currentStatusText = nextTask
      ? `${task.id} を完了しました。次は ${nextTask.id} に進みます`
      : `${task.id} を完了しました。残りの Task はありません`;
    status.thinkingText = status.currentStatusText;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    await this.appendEvent('task.completed', 'info', `${task.id}: ${task.title}`, {
      source: actor.source,
      taskId: task.id,
    });
    return task;
  }

  async reopenTask(taskId: string, actor: ActionActor): Promise<TaskRecord | null> {
    const tasks = this.synchronizeTaskCatalog();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return null;
    }

    task.status = 'pending';
    task.blockedReason = undefined;
    task.completedAt = undefined;
    task.updatedAt = nowIso();
    task.source = actor.source;
    this.store.writeTasks(orderTasks(tasks));
    await this.appendEvent('task.reopened', 'warning', `${task.id}: ${task.title}`, {
      source: actor.source,
      taskId: task.id,
    });
    return task;
  }

  async blockTask(
    taskId: string,
    reason: string,
    actor: ActionActor,
  ): Promise<TaskRecord | null> {
    const tasks = this.synchronizeTaskCatalog();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return null;
    }

    task.status = 'blocked';
    task.blockedReason = reason.trim() || 'Operator flagged this task as blocked.';
    task.updatedAt = nowIso();
    task.source = actor.source;
    this.store.writeTasks(orderTasks(tasks));

    await this.appendEvent('task.blocked', 'warning', `${task.id}: ${task.blockedReason}`, {
      source: actor.source,
      taskId: task.id,
    });
    return task;
  }

  async unblockTask(taskId: string, actor: ActionActor): Promise<TaskRecord | null> {
    const tasks = this.synchronizeTaskCatalog();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return null;
    }

    task.status = 'pending';
    task.blockedReason = undefined;
    task.updatedAt = nowIso();
    task.source = actor.source;
    this.store.writeTasks(orderTasks(tasks));

    await this.appendEvent('task.unblocked', 'info', `${task.id}: queue に戻しました`, {
      source: actor.source,
      taskId: task.id,
    });
    return task;
  }

  async moveTask(
    taskId: string,
    position: 'top' | 'up' | 'down' | 'bottom' | 'front' | 'back',
    actor: ActionActor,
  ): Promise<TaskRecord | null> {
    const tasks = this.synchronizeTaskCatalog();
    const ordered = orderTasks(tasks);
    const taskIndex = ordered.findIndex((item) => item.id === taskId);
    if (taskIndex === -1) {
      return null;
    }

    const [task] = ordered.splice(taskIndex, 1);
    switch (position) {
      case 'top':
      case 'front':
        ordered.splice(0, 0, task);
        break;
      case 'bottom':
      case 'back':
        ordered.push(task);
        break;
      case 'up':
        ordered.splice(Math.max(taskIndex - 1, 0), 0, task);
        break;
      case 'down':
        ordered.splice(Math.min(taskIndex + 1, ordered.length), 0, task);
        break;
    }

    resequenceTasks(ordered);
    task.updatedAt = nowIso();
    task.source = actor.source;
    this.store.writeTasks(ordered);

    const directionLabel = {
      top: '現在の focus へ移動しました',
      front: '現在の focus へ移動しました',
      up: '順番を 1 つ上げました',
      down: '順番を 1 つ下げました',
      bottom: 'queue の末尾へ移動しました',
      back: 'queue の末尾へ移動しました',
    }[position];

    await this.appendEvent('task.reordered', 'info', `${task.id}: ${directionLabel}`, {
      source: actor.source,
      taskId: task.id,
      position,
    });

    const status = this.store.readStatus();
    status.currentStatusText = `${task.id} の順番を更新しました`;
    status.thinkingText = status.currentStatusText;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    return task;
  }

  async recordTaskSignal(content: string, source: string = 'agent'): Promise<void> {
    const parsed = parseTaskMarker(content);
    if (!parsed) {
      await this.appendEvent('task.invalid', 'warning', `task marker を解釈できませんでした: ${content}`);
      return;
    }

    const tasks = this.synchronizeTaskCatalog();
    const timestamp = nowIso();
    const existing = tasks.find((task) => task.id === parsed.id);

    if (existing) {
      existing.title = parsed.title || existing.title;
      existing.summary = parsed.title || existing.summary;
      existing.status = parsed.status;
      if (parsed.status !== 'blocked') {
        existing.blockedReason = undefined;
      }
      existing.updatedAt = timestamp;
      existing.completedAt = parsed.status === 'completed' ? timestamp : undefined;
      existing.source = source;
    } else {
      tasks.push({
        id: parsed.id,
        title: parsed.title,
        summary: parsed.title,
        priority: 'medium',
        sortIndex: tasks.reduce((max, task) => Math.max(max, task.sortIndex), 0) + 1,
        status: parsed.status,
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: parsed.status === 'completed' ? timestamp : undefined,
        source,
        acceptanceCriteria: [],
      });
    }

    this.store.writeTasks(orderTasks(tasks));
    await this.appendEvent(
      'task.updated',
      'info',
      `${parsed.id}: ${parsed.status} / ${parsed.title}`,
      { taskId: parsed.id, taskStatus: parsed.status },
    );
  }

  findCurrentTask(taskBoard: TaskBoardItem[]): TaskBoardItem | undefined {
    return taskBoard.find((task) => task.displayStatus === 'current')
      ?? taskBoard.find((task) => task.displayStatus === 'next');
  }

  findNextTasks(taskBoard: TaskBoardItem[]): TaskBoardItem[] {
    return taskBoard.filter((task) => task.displayStatus === 'next');
  }

  findDoneTasks(taskBoard: TaskBoardItem[]): TaskBoardItem[] {
    return taskBoard.filter((task) => task.displayStatus === 'done');
  }
}
