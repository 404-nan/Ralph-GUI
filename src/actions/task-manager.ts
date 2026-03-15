import { buildOrchestrationSnapshot } from '../orchestration/model.ts';
import type { AppConfig } from '../config.ts';
import { nextSequentialId } from '../shared/id.ts';
import { nowIso } from '../shared/time.ts';
import type {
  BlockerRecord,
  PromptInjectionItem,
  QuestionRecord,
  StoredTaskStatus,
  TaskBoardItem,
  TaskRecord,
} from '../shared/types.ts';
import { FileStateStore } from '../state/store.ts';
import { loadTaskSeeds } from '../tasks/catalog.ts';
import { parseTasksFromSpecText, type TaskImportPreview } from '../tasks/importer.ts';

export interface TaskDraftInput {
  title?: string;
  summary?: string;
  acceptanceCriteria?: string[];
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
        priority: seed.priority,
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
        acceptanceCriteria: seed.acceptanceCriteria,
        notes: nextNotes,
        titleOverride: existing?.titleOverride,
        summaryOverride: existing?.summaryOverride,
        completedAt: nextStatus === 'completed' ? existing?.completedAt ?? timestamp : undefined,
      };
    });

    const manualTasks = existingTasks.filter((task) => !seedIds.has(task.id));
    const catalog = [...merged, ...manualTasks];
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
      priority: 'high',
      sortIndex: nextIndex,
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
      source: actor.source,
      acceptanceCriteria: (input.acceptanceCriteria ?? []).map((item) => item.trim()).filter(Boolean),
    };
  }

  async createTask(input: TaskDraftInput, actor: ActionActor): Promise<TaskRecord> {
    const tasks = this.synchronizeTaskCatalog();
    const record = this.buildTaskRecord(tasks, input, actor);
    tasks.push(record);
    this.store.writeTasks(tasks);
    await this.appendEvent('task.created', 'info', `${record.id}: ${record.title}`, {
      source: actor.source,
      taskId: record.id,
    });
    return record;
  }

  async previewTaskImport(specText: string): Promise<TaskImportPreview> {
    return parseTasksFromSpecText(specText);
  }

  async importTasksFromSpec(
    specText: string,
    actor: ActionActor,
  ): Promise<{ preview: TaskImportPreview; tasks: TaskRecord[] }> {
    const preview = parseTasksFromSpecText(specText);
    if (preview.tasks.length === 0) {
      throw new Error('Task に分解できる項目が見つかりませんでした');
    }

    const tasks = this.synchronizeTaskCatalog();
    const created = preview.tasks.map((draft) => {
      const record = this.buildTaskRecord(tasks, draft, actor);
      tasks.push(record);
      return record;
    });

    this.store.writeTasks(tasks);

    const status = this.store.readStatus();
    status.currentStatusText = `${created.length} 件のTaskを仕様書から追加しました`;
    status.thinkingText = status.currentStatusText;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    await this.appendEvent(
      'task.imported',
      'info',
      `${created.length} 件のTaskを仕様書から追加しました`,
      {
        source: actor.source,
        count: created.length,
        format: preview.format,
        truncated: preview.truncated,
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
    task.updatedAt = nowIso();
    task.source = actor.source;

    this.store.writeTasks(tasks);
    await this.appendEvent('task.updated', 'info', `${task.id}: ${task.title}`, {
      source: actor.source,
      taskId: task.id,
    });
    return task;
  }

  async completeTask(taskId: string, actor: ActionActor, extraContext?: {
    listPendingQuestions: () => QuestionRecord[];
    readBlockers: () => BlockerRecord[];
    listPromptInjectionQueue: () => PromptInjectionItem[];
  }): Promise<TaskRecord | null> {
    const tasks = this.synchronizeTaskCatalog();
    const task = tasks.find((item) => item.id === taskId);
    if (!task) {
      return null;
    }

    task.status = 'completed';
    task.completedAt = nowIso();
    task.updatedAt = task.completedAt;
    task.source = actor.source;
    this.store.writeTasks(tasks);

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
      : `${task.id} を完了しました。残りのTaskはありません`;
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
    task.completedAt = undefined;
    task.updatedAt = nowIso();
    task.source = actor.source;
    this.store.writeTasks(tasks);
    await this.appendEvent('task.reopened', 'warning', `${task.id}: ${task.title}`, {
      source: actor.source,
      taskId: task.id,
    });
    return task;
  }

  async moveTask(taskId: string, position: 'front' | 'back', actor: ActionActor): Promise<TaskRecord | null> {
    const tasks = this.synchronizeTaskCatalog();
    const ordered = orderTasks(tasks);
    const taskIndex = ordered.findIndex((item) => item.id === taskId);
    if (taskIndex === -1) {
      return null;
    }

    const [task] = ordered.splice(taskIndex, 1);
    ordered.splice(position === 'front' ? 0 : ordered.length, 0, task);
    resequenceTasks(ordered);
    task.updatedAt = nowIso();
    task.source = actor.source;
    this.store.writeTasks(ordered);

    const directionLabel = position === 'front' ? '最優先へ移動しました' : '後ろへ回しました';
    await this.appendEvent('task.reordered', 'info', `${task.id}: ${directionLabel}`, {
      source: actor.source,
      taskId: task.id,
      position,
    });

    const status = this.store.readStatus();
    status.currentStatusText =
      position === 'front'
        ? `${task.id} を最優先にしました`
        : `${task.id} を後ろへ回しました`;
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

    this.store.writeTasks(tasks);
    await this.appendEvent(
      'task.updated',
      'info',
      `${parsed.id}: ${parsed.status} / ${parsed.title}`,
      { taskId: parsed.id, taskStatus: parsed.status },
    );
  }

  findCurrentTask(taskBoard: TaskBoardItem[]): TaskBoardItem | undefined {
    return taskBoard.find((task) => task.displayStatus === 'active')
      ?? taskBoard.find((task) => task.displayStatus === 'queued');
  }

  findNextTask(taskBoard: TaskBoardItem[]): TaskBoardItem | undefined {
    const currentTask = this.findCurrentTask(taskBoard);
    if (!currentTask) {
      return undefined;
    }

    let seenCurrent = false;
    for (const task of taskBoard) {
      if (task.id === currentTask.id) {
        seenCurrent = true;
        continue;
      }
      if (seenCurrent && task.displayStatus !== 'completed') {
        return task;
      }
    }

    return undefined;
  }
}
