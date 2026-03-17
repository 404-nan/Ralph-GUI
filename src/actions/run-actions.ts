import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildOrchestrationSnapshot } from '../orchestration/model.ts';
import { assessConfig, type AppConfig } from '../config.ts';
import { parseStructuredMarkers } from '../parser/markers.ts';
import { composePromptWithInjections } from '../prompt/composer.ts';
import { createEventId, createRunId, nextSequentialId } from '../shared/id.ts';
import { toPortableDisplayPath } from '../shared/path.ts';
import { nowIso } from '../shared/time.ts';
import type {
  AnswerRecord,
  DashboardData,
  EventRecord,
  MarkerMatch,
  PromptInjectionItem,
  QuestionRecord,
  RuntimeSettings,
  RunStatus,
  RunMode,
  TaskBoardItem,
  TaskRecord,
} from '../shared/types.ts';
import { FileStateStore } from '../state/store.ts';
import type { TaskImportPreview } from '../tasks/importer.ts';
import {
  buildArtifacts,
  buildDashboardLayers,
  buildPendingDecisions,
  detectModelLabel,
} from './dashboard-view.ts';
import {
  TaskManager,
  parseTaskMarker,
  type ActionActor,
  type TaskDraftInput,
} from './task-manager.ts';

export type { ActionActor, TaskDraftInput } from './task-manager.ts';

export interface RuntimeSettingsInput {
  taskName?: string;
  agentCommand?: string;
  agentCwd?: string;
  promptFile?: string;
  promptBody?: string;
  discordNotifyChannelId?: string;
  maxIterations?: number;
  idleSeconds?: number;
  mode?: RunMode;
}

function renderOrchestrationSummary(
  taskBoard: DashboardData['taskBoard'],
  maxIntegration: number,
): string {
  const unfinished = taskBoard.filter((task) => task.displayStatus !== 'completed');
  const active = unfinished.filter((task) => task.displayStatus === 'active');
  const queued = unfinished.filter((task) => task.displayStatus === 'queued');
  const currentTask = active[0];
  const nextTask = queued[0];

  const sections = [
    '現在の orchestration snapshot:',
    `- MaxIntegration: ${maxIntegration}`,
    `- 進行中Task: ${active.length}`,
    `- 待機Task: ${queued.length}`,
  ];

  if (currentTask) {
    sections.push(`- 現在のTask: ${currentTask.id} / ${currentTask.title}`);
  }

  if (nextTask) {
    sections.push(`- 次のTask: ${nextTask.id} / ${nextTask.title}`);
  }

  if (active.length > 0) {
    sections.push('- いま進めるTask:');
    for (const task of active.slice(0, maxIntegration)) {
      sections.push(`  - ${task.id}: ${task.title}`);
    }
  }

  if (queued.length > 0) {
    sections.push('- 次に進めるTask:');
    for (const task of queued.slice(0, maxIntegration)) {
      sections.push(`  - ${task.id}: ${task.title}`);
    }
  }

  return sections.join('\n');
}

export class RunActions {
  readonly store: FileStateStore;
  readonly config: AppConfig;
  readonly tasks: TaskManager;

  constructor(store: FileStateStore, config: AppConfig) {
    this.store = store;
    this.config = config;
    this.tasks = new TaskManager(store, config, this.appendEvent.bind(this));
  }

  async getDashboardData(): Promise<DashboardData> {
    await this.importLocalInbox();

    const status = this.refreshStatusCounters();
    const settings = this.getRuntimeSettings();
    const canEditAgentCommand = this.canOverrideAgentCommand({ source: 'web' });
    const model = detectModelLabel(settings.agentCommand, settings.mode);
    const questions = this.store.readQuestions();
    const answers = this.store.readAnswers();
    const pendingQuestions = questions.filter((question) => question.status === 'pending');
    const pendingDecisions = buildPendingDecisions(pendingQuestions);
    const answeredQuestions = questions
      .filter((question) => question.status === 'answered')
      .map((question) => ({
        ...question,
        answer: answers.find((answer) => answer.id === question.answerId),
      }));
    const blockers = this.store.readBlockers().slice(-20).reverse();
    const promptInjectionQueue = this.listPromptInjectionQueue();
    const orchestration = buildOrchestrationSnapshot({
      status,
      tasks: this.tasks.synchronizeTaskCatalog(),
      pendingQuestions,
      blockers,
      promptInjectionQueue,
    });
    const currentTask = this.tasks.findCurrentTask(orchestration.taskBoard);
    const nextTask = this.tasks.findNextTask(orchestration.taskBoard);
    const recentEvents = (await this.store.listRecentEvents(40)).reverse();
    const artifacts = buildArtifacts(recentEvents).slice(0, 8);
    const diagnostics = assessConfig(this.config, settings).items.map((item) => ({
      key: item.key,
      level: item.level,
      message: item.message,
    }));

    return {
      status,
      settings,
      capabilities: {
        canEditAgentCommand,
      },
      currentTask,
      nextTask,
      pendingQuestions,
      pendingDecisions,
      answeredQuestions,
      blockers,
      promptInjectionQueue,
      recentEvents,
      artifacts,
      agentLogTail: (await this.store.readAgentOutputTail(80)).filter(Boolean),
      taskBoard: orchestration.taskBoard,
      thinkingFrames: orchestration.thinkingFrames,
      layers: buildDashboardLayers({
        config: this.config,
        settings,
        status,
        currentTask,
        nextTask,
        pendingDecisions,
        blockers,
        promptInjectionQueue,
        diagnostics,
        model,
        canEditAgentCommand,
      }),
    };
  }

  getStatus(): RunStatus {
    return this.refreshStatusCounters();
  }

  getRuntimeSettings(): RuntimeSettings {
    const settings = this.store.readSettings();
    this.applyRuntimeSettings(settings);
    return settings;
  }

  async updateRuntimeSettings(
    input: RuntimeSettingsInput,
    actor: ActionActor,
  ): Promise<RuntimeSettings> {
    const current = this.store.readSettings();
    const currentAgentCommand = current.agentCommand.trim();
    const nextTaskName = input.taskName?.trim();
    const nextAgentCommand = input.agentCommand?.trim();
    const nextAgentCwd = input.agentCwd?.trim();
    const nextPromptFile = input.promptFile?.trim();
    const nextDiscordNotifyChannelId = input.discordNotifyChannelId?.trim() ?? '';
    const wantsAgentCommandChange =
      nextAgentCommand !== undefined && nextAgentCommand !== currentAgentCommand;

    if (wantsAgentCommandChange && !this.canOverrideAgentCommand(actor)) {
      throw new Error('agentCommand は起動時設定に固定されています。CLI または環境変数で変更してください');
    }

    const next: RuntimeSettings = {
      ...current,
      taskName: nextTaskName ? nextTaskName : current.taskName,
      agentCommand: nextAgentCommand ? nextAgentCommand : current.agentCommand,
      agentCwd:
        nextAgentCwd !== undefined
          ? resolve(this.config.rootDir, nextAgentCwd || '.')
          : current.agentCwd,
      promptFile: nextPromptFile ? nextPromptFile : current.promptFile,
      promptBody: input.promptBody ?? current.promptBody,
      discordNotifyChannelId:
        input.discordNotifyChannelId !== undefined
          ? nextDiscordNotifyChannelId
          : current.discordNotifyChannelId,
      maxIterations:
        input.maxIterations && input.maxIterations > 0 ? input.maxIterations : current.maxIterations,
      idleSeconds:
        input.idleSeconds && input.idleSeconds > 0 ? input.idleSeconds : current.idleSeconds,
      mode: input.mode ?? current.mode,
      updatedAt: nowIso(),
      updatedBy: actor.source,
    };

    this.store.writeSettings(next);
    this.applyRuntimeSettings(next);

    const status = this.store.readStatus();
    status.task = next.taskName;
    status.maxIterations = next.maxIterations;
    status.agentCommand = next.agentCommand;
    status.mode = next.mode;
    status.promptFile = next.promptBody.trim()
      ? '[画面またはDiscordからの prompt 上書き]'
      : toPortableDisplayPath(this.config.rootDir, next.promptFile);
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    await this.appendEvent('settings.updated', 'info', `${actor.source} が実行設定を更新しました`, {
      source: actor.source,
      maxIterations: next.maxIterations,
      mode: next.mode,
      agentCwd: next.agentCwd,
      discordNotifyChannelId: next.discordNotifyChannelId,
    });

    this.refreshStatusCounters();
    return next;
  }

  async createTask(input: TaskDraftInput, actor: ActionActor): Promise<TaskRecord> {
    const record = await this.tasks.createTask(input, actor);
    this.refreshStatusCounters();
    return record;
  }

  async previewTaskImport(specText: string): Promise<TaskImportPreview> {
    return this.tasks.previewTaskImport(specText);
  }

  async importTasksFromSpec(
    specText: string,
    actor: ActionActor,
  ): Promise<{ preview: TaskImportPreview; tasks: TaskRecord[] }> {
    const result = await this.tasks.importTasksFromSpec(specText, actor);
    this.refreshStatusCounters();
    return result;
  }

  async updateTask(
    taskId: string,
    input: TaskDraftInput,
    actor: ActionActor,
  ): Promise<TaskRecord | null> {
    const result = await this.tasks.updateTask(taskId, input, actor);
    this.refreshStatusCounters();
    return result;
  }

  async completeTask(taskId: string, actor: ActionActor): Promise<TaskRecord | null> {
    const result = await this.tasks.completeTask(taskId, actor, {
      listPendingQuestions: () => this.listPendingQuestions(),
      readBlockers: () => this.store.readBlockers(),
      listPromptInjectionQueue: () => this.listPromptInjectionQueue(),
    });
    this.refreshStatusCounters();
    return result;
  }

  async reopenTask(taskId: string, actor: ActionActor): Promise<TaskRecord | null> {
    const result = await this.tasks.reopenTask(taskId, actor);
    this.refreshStatusCounters();
    return result;
  }

  async moveTask(taskId: string, position: 'front' | 'back', actor: ActionActor): Promise<TaskRecord | null> {
    const result = await this.tasks.moveTask(taskId, position, actor);
    this.refreshStatusCounters();
    return result;
  }

  async requestRunStart(
    actor: ActionActor,
  ): Promise<{ started: boolean; status: RunStatus; message: string }> {
    const current = this.store.readStatus();
    if (current.phase === 'queued') {
      return {
        started: false,
        status: this.refreshStatusCounters(),
        message: 'run はすでに待機列にあります',
      };
    }

    if (['starting', 'running', 'pause_requested', 'paused'].includes(current.lifecycle)) {
      return {
        started: false,
        status: this.refreshStatusCounters(),
        message: 'run はすでに実行中です',
      };
    }

    const settings = this.getRuntimeSettings();
    const settingsError = this.validateRuntimeSettings(settings);
    if (settingsError) {
      await this.appendEvent('run.request.rejected', 'warning', settingsError, { source: actor.source });
      return {
        started: false,
        status: this.refreshStatusCounters(),
        message: settingsError,
      };
    }

    this.store.clearRunArtifacts();

    const status = this.store.readStatus();
    status.runId = '';
    status.task = settings.taskName;
    status.phase = 'queued';
    status.lifecycle = 'idle';
    status.control = 'running';
    status.iteration = 0;
    status.maxIterations = settings.maxIterations;
    status.currentStatusText = `${actor.source} が start を要求しました`;
    status.lastQuestionId = undefined;
    status.lastQuestionText = undefined;
    status.lastBlockerId = undefined;
    status.lastBlockerText = undefined;
    status.pendingQuestionCount = 0;
    status.answeredQuestionCount = 0;
    status.pendingInjectionCount = 0;
    status.blockerCount = 0;
    status.activeTaskCount = 0;
    status.completedTaskCount = 0;
    status.queuedTaskCount = 0;
    status.startedAt = undefined;
    status.finishedAt = undefined;
    status.lastPromptPreview = undefined;
    status.lastError = undefined;
    status.updatedAt = nowIso();
    status.agentCommand = settings.agentCommand;
    status.mode = settings.mode;
    status.promptFile = settings.promptBody.trim()
      ? '[画面またはDiscordからの prompt 上書き]'
      : toPortableDisplayPath(this.config.rootDir, settings.promptFile);
    status.thinkingText = 'Ralph は待機中です。最初のTaskから着手できます。';
    this.store.writeStatus(status);

    this.tasks.synchronizeTaskCatalog();
    await this.appendEvent('run.requested', 'info', `${actor.source} が run 開始を要求しました`, {
      source: actor.source,
    });

    return {
      started: true,
      status: this.refreshStatusCounters(),
      message: 'run 開始を待機列に追加しました',
    };
  }

  async recoverInterruptedRun(actor: ActionActor = { source: 'system' }): Promise<RunStatus | null> {
    const status = this.store.readStatus();
    if (!['starting', 'running', 'pause_requested', 'paused'].includes(status.lifecycle)) {
      return null;
    }

    status.lifecycle = 'failed';
    status.phase = 'interrupted';
    status.control = 'running';
    status.currentStatusText = '前回の run は service 再起動で中断されました';
    status.thinkingText = '前回の中断状態を回復しました。次の run を受け付けできます。';
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);
    await this.appendEvent('run.recovered', 'warning', `${actor.source} が古い実行状態を回復しました`, {
      source: actor.source,
    });
    return this.refreshStatusCounters();
  }

  async pauseRun(actor: ActionActor): Promise<RunStatus> {
    const status = this.store.readStatus();
    if (!['starting', 'running', 'pause_requested'].includes(status.lifecycle)) {
      throw new Error('pause できる run は現在ありません');
    }

    status.control = 'paused';
    status.lifecycle = 'pause_requested';
    status.phase = 'paused';
    status.thinkingText = '一時停止中です。Task と状態は保持しています。';
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    await this.appendEvent('run.pause', 'warning', `${actor.source} が pause を要求しました`);
    return this.refreshStatusCounters();
  }

  async resumeRun(actor: ActionActor): Promise<RunStatus> {
    const status = this.store.readStatus();
    if (status.control !== 'paused' && !['paused', 'pause_requested'].includes(status.lifecycle)) {
      throw new Error('resume できる run は現在ありません');
    }

    status.control = 'running';
    status.lifecycle = 'running';
    status.phase = 'running';
    status.thinkingText = '再開しました。現在のTaskから続けます。';
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    await this.appendEvent('run.resume', 'info', `${actor.source} が resume しました`);
    return this.refreshStatusCounters();
  }

  async abortRun(actor: ActionActor): Promise<RunStatus> {
    const status = this.store.readStatus();
    const canAbort =
      status.phase === 'queued'
      || ['starting', 'running', 'pause_requested', 'paused'].includes(status.lifecycle);
    if (!canAbort) {
      throw new Error('中断できる run は現在ありません');
    }

    status.control = 'abort_requested';
    status.lifecycle = 'aborted';
    status.phase = 'aborted';
    status.thinkingText = '中断要求を受け取りました。現在のターンを安全に閉じます。';
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);
    await this.appendEvent('run.abort', 'error', `${actor.source} が中断を要求しました`);
    return this.refreshStatusCounters();
  }

  async submitAnswer(questionId: string, answer: string, actor: ActionActor): Promise<AnswerRecord> {
    const questions = this.store.readQuestions();
    const answers = this.store.readAnswers();
    const timestamp = nowIso();
    const normalizedQuestionId = questionId.trim();
    const normalizedAnswer = answer.trim();
    if (!normalizedQuestionId || !normalizedAnswer) {
      throw new Error('質問IDと回答の両方が必要です');
    }

    const question = questions.find((item) => item.id === normalizedQuestionId);

    if (!question) {
      throw new Error(`指定した質問が見つかりません: ${normalizedQuestionId}`);
    }

    if (question.status === 'answered') {
      throw new Error(`${normalizedQuestionId} にはすでに回答があります`);
    }

    const answerId = nextSequentialId(
      'A',
      answers.map((item) => item.id),
    );

    const record: AnswerRecord = {
      id: answerId,
      questionId: normalizedQuestionId,
      answer: normalizedAnswer,
      createdAt: timestamp,
      source: actor.source,
    };

    answers.push(record);
    this.store.writeAnswers(answers);

    question.status = 'answered';
    question.answerId = record.id;
    question.answeredAt = timestamp;
    this.store.writeQuestions(questions);

    await this.appendEvent(
      'question.answered',
      'info',
      `${normalizedQuestionId} に回答が追加されました`,
      { source: actor.source, answerId },
    );
    this.refreshStatusCounters();

    return record;
  }

  async enqueueManualNote(note: string, actor: ActionActor): Promise<void> {
    const notes = this.store.readManualNotes();
    const noteId = nextSequentialId(
      'N',
      notes.map((item) => item.id),
    );

    notes.push({
      id: noteId,
      note,
      createdAt: nowIso(),
      source: actor.source,
    });
    this.store.writeManualNotes(notes);
    await this.appendEvent('note.enqueued', 'info', `${actor.source} が手動ノートを投入しました`, {
      noteId,
    });
    this.refreshStatusCounters();
  }

  listPendingQuestions(): QuestionRecord[] {
    return this.store.readQuestions().filter((question) => question.status === 'pending');
  }

  listAnsweredQuestions(): Array<QuestionRecord & { answer?: AnswerRecord }> {
    const answers = this.store.readAnswers();
    return this.store
      .readQuestions()
      .filter((question) => question.status === 'answered')
      .map((question) => ({
        ...question,
        answer: answers.find((answer) => answer.id === question.answerId),
      }));
  }

  listPromptInjectionQueue(): PromptInjectionItem[] {
    const answers = this.store
      .readAnswers()
      .filter((answer) => !answer.injectedAt)
      .map((answer) => ({
        id: answer.id,
        kind: 'answer' as const,
        label: answer.questionId,
        text: answer.answer,
        createdAt: answer.createdAt,
      }));

    const notes = this.store
      .readManualNotes()
      .filter((note) => !note.injectedAt)
      .map((note) => ({
        id: note.id,
        kind: 'note' as const,
        label: note.id,
        text: note.note,
        createdAt: note.createdAt,
      }));

    return [...answers, ...notes].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async preparePromptForNextTurn(): Promise<string> {
    await this.importLocalInbox();

    const settings = this.getRuntimeSettings();
    const basePrompt = settings.promptBody.trim()
      ? settings.promptBody
      : readFileSync(settings.promptFile, 'utf8');
    const answers = this.store.readAnswers();
    const notes = this.store.readManualNotes();
    const queuedAnswers = answers.filter((answer) => !answer.injectedAt);
    const queuedNotes = notes.filter((note) => !note.injectedAt);
    const dashboard = await this.getDashboardData();
    const orchestrationSection = renderOrchestrationSummary(
      dashboard.taskBoard,
      dashboard.status.maxIntegration,
    );
    const result = composePromptWithInjections(
      basePrompt,
      queuedAnswers,
      queuedNotes,
      [orchestrationSection],
    );

    if (result.injectedAnswerIds.length > 0) {
      const injectedAt = nowIso();
      for (const answer of answers) {
        if (result.injectedAnswerIds.includes(answer.id)) {
          answer.injectedAt = injectedAt;
        }
      }
      this.store.writeAnswers(answers);
    }

    if (result.injectedNoteIds.length > 0) {
      const injectedAt = nowIso();
      for (const note of notes) {
        if (result.injectedNoteIds.includes(note.id)) {
          note.injectedAt = injectedAt;
        }
      }
      this.store.writeManualNotes(notes);
    }

    const status = this.refreshStatusCounters();
    status.lastPromptPreview = result.appendedSections.join('\n\n').slice(0, 1000);
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    return result.prompt;
  }

  async handleAgentOutput(output: string): Promise<{ done: boolean; markers: MarkerMatch[] }> {
    const markers = parseStructuredMarkers(output);
    let done = false;

    for (const marker of markers) {
      if (marker.kind === 'STATUS') {
        await this.recordAgentStatus(marker.content);
      }

      if (marker.kind === 'QUESTION') {
        await this.recordQuestion(marker.content);
      }

      if (marker.kind === 'BLOCKER') {
        await this.recordBlocker(marker.content);
      }

      if (marker.kind === 'THINKING') {
        await this.recordThinking(marker.content);
      }

      if (marker.kind === 'TASK') {
        await this.recordTaskSignal(marker.content);
      }

      if (marker.kind === 'DONE') {
        done = true;
        await this.markDone(marker.content || 'DONE マーカーを受信しました');
      }
    }

    if (markers.length === 0) {
      await this.appendEvent('agent.output', 'info', 'structured marker がない出力を受信しました');
    }

    return { done, markers };
  }

  async recordAgentStatus(message: string): Promise<void> {
    const status = this.store.readStatus();
    status.currentStatusText = message;
    status.thinkingText = message;
    status.phase = 'running';
    if (status.control === 'running') {
      status.lifecycle = 'running';
    }
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    await this.appendEvent('agent.status', 'info', message);
  }

  async recordThinking(message: string): Promise<void> {
    const status = this.store.readStatus();
    status.thinkingText = message;
    if (!status.currentStatusText) {
      status.currentStatusText = message;
    }
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    await this.appendEvent('agent.thinking', 'info', message);
  }

  async recordQuestion(questionText: string, source: string = 'agent'): Promise<QuestionRecord> {
    const questions = this.store.readQuestions();
    const existingPending = questions.find(
      (question) => question.status === 'pending' && question.text === questionText,
    );
    if (existingPending) {
      return existingPending;
    }

    const questionId = nextSequentialId(
      'Q',
      questions.map((item) => item.id),
    );

    const question: QuestionRecord = {
      id: questionId,
      text: questionText,
      status: 'pending',
      createdAt: nowIso(),
      source,
    };

    questions.push(question);
    this.store.writeQuestions(questions);

    const status = this.store.readStatus();
    status.lastQuestionId = question.id;
    status.lastQuestionText = question.text;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    await this.appendEvent('question.created', 'warning', `${question.id}: ${question.text}`, {
      questionId: question.id,
    });
    this.refreshStatusCounters();

    return question;
  }

  async recordBlocker(blockerText: string, source: string = 'agent'): Promise<void> {
    const blockers = this.store.readBlockers();
    const blockerId = nextSequentialId(
      'B',
      blockers.map((item) => item.id),
    );

    blockers.push({
      id: blockerId,
      text: blockerText,
      createdAt: nowIso(),
      source,
    });
    this.store.writeBlockers(blockers);

    const status = this.store.readStatus();
    status.lastBlockerId = blockerId;
    status.lastBlockerText = blockerText;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    await this.appendEvent('blocker.created', 'error', `${blockerId}: ${blockerText}`, {
      blockerId,
    });
    this.refreshStatusCounters();
  }

  async recordTaskSignal(content: string, source: string = 'agent'): Promise<void> {
    await this.tasks.recordTaskSignal(content, source);
    this.refreshStatusCounters();
  }

  async markDone(message: string): Promise<void> {
    const currentTask = this.tasks.findCurrentTask(
      buildOrchestrationSnapshot({
        status: this.store.readStatus(),
        tasks: this.tasks.synchronizeTaskCatalog(),
        pendingQuestions: this.listPendingQuestions(),
        blockers: this.store.readBlockers(),
        promptInjectionQueue: this.listPromptInjectionQueue(),
      }).taskBoard,
    );
    if (currentTask) {
      await this.completeTask(currentTask.id, { source: 'agent' });
    }

    const status = this.store.readStatus();
    status.lifecycle = 'completed';
    status.control = 'running';
    status.phase = 'completed';
    status.currentStatusText = message;
    status.thinkingText = message;
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);
    await this.appendEvent('run.completed', 'info', message);
  }

  async markRunStarted(): Promise<RunStatus> {
    const settings = this.getRuntimeSettings();
    const status = this.store.readStatus();
    status.runId = createRunId();
    status.task = settings.taskName;
    status.phase = 'starting';
    status.lifecycle = 'starting';
    status.control = 'running';
    status.startedAt = nowIso();
    status.finishedAt = undefined;
    status.updatedAt = nowIso();
    status.agentCommand = settings.agentCommand;
    status.mode = settings.mode;
    status.promptFile = settings.promptBody.trim()
      ? '[画面またはDiscordからの prompt 上書き]'
      : toPortableDisplayPath(this.config.rootDir, settings.promptFile);
    status.maxIterations = settings.maxIterations;
    status.thinkingText = 'Task の流れを確認し、最初のTaskに担当を割り当てています。';
    this.store.writeStatus(status);
    this.tasks.synchronizeTaskCatalog();
    await this.appendEvent('run.started', 'info', 'supervisor を開始しました', {
      mode: this.config.mode,
    });
    return this.refreshStatusCounters();
  }

  async updateIteration(iteration: number): Promise<RunStatus> {
    const status = this.store.readStatus();
    status.iteration = iteration;
    status.phase = status.control === 'paused' ? 'paused' : 'running';
    status.lifecycle = status.control === 'paused' ? 'paused' : 'running';
    status.thinkingText = `${iteration} 回目の思考を進めています。現在のTaskを中心に回しています。`;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    return this.refreshStatusCounters();
  }

  async markMaxIterationsReached(): Promise<void> {
    const status = this.store.readStatus();
    status.lifecycle = 'failed';
    status.phase = 'max_iterations_reached';
    status.currentStatusText = '最大反復回数に到達しました';
    status.thinkingText = '思考回数の上限に到達しました。続きは次の run で進めてください。';
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);
    await this.appendEvent('run.max_iterations', 'warning', '最大反復回数に到達しました');
  }

  async markRuntimeError(error: unknown): Promise<void> {
    const status = this.store.readStatus();
    status.lifecycle = status.control === 'abort_requested' ? 'aborted' : 'failed';
    status.phase = status.lifecycle;
    status.lastError = error instanceof Error ? error.stack ?? error.message : String(error);
    status.thinkingText = '実行中に障害が発生しました。状態を確認して次の run を準備してください。';
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);
    await this.appendEvent('run.error', 'error', 'supervisor でエラーが発生しました', {
      error: status.lastError,
    });
  }

  async appendAgentOutput(output: string, iteration: number): Promise<void> {
    const header = `\n=== iteration ${iteration} @ ${nowIso()} ===\n`;
    await this.store.appendAgentOutput(`${header}${output.trimEnd()}\n`);
  }

  private async importLocalInbox(): Promise<void> {
    const offsets = this.store.readInboxOffsets();
    const answerLines = await this.store.readAnswerInboxLines();
    const noteLines = await this.store.readNoteInboxLines();
    let nextAnswerOffset =
      offsets.answersLineOffset > answerLines.length ? 0 : offsets.answersLineOffset;
    let nextNoteOffset =
      offsets.notesLineOffset > noteLines.length ? 0 : offsets.notesLineOffset;

    for (let index = nextAnswerOffset; index < answerLines.length; index += 1) {
      const line = answerLines[index]?.trim() ?? '';
      if (!line) {
        nextAnswerOffset = index + 1;
        continue;
      }

      try {
        const payload = JSON.parse(line) as { questionId?: string; answer?: string };
        if (!payload.questionId?.trim() || !payload.answer?.trim()) {
          throw new Error('questionId と answer の両方が必要です');
        }

        await this.submitAnswer(payload.questionId, payload.answer, { source: 'file' });
        nextAnswerOffset = index + 1;
      } catch (error) {
        await this.appendEvent(
          'file.answer.invalid',
          'warning',
          `answer-inbox.jsonl の ${index + 1} 行目を読み取れませんでした: ${error instanceof Error ? error.message : line}`,
        );
        break;
      }
    }

    for (let index = nextNoteOffset; index < noteLines.length; index += 1) {
      const line = noteLines[index]?.trim() ?? '';
      if (!line) {
        nextNoteOffset = index + 1;
        continue;
      }

      await this.enqueueManualNote(line, { source: 'file' });
      nextNoteOffset = index + 1;
    }

    if (nextAnswerOffset !== offsets.answersLineOffset || nextNoteOffset !== offsets.notesLineOffset) {
      this.store.writeInboxOffsets({
        answersLineOffset: nextAnswerOffset,
        notesLineOffset: nextNoteOffset,
      });
    }
  }

  private applyRuntimeSettings(settings: RuntimeSettings): void {
    this.config.taskName = settings.taskName;
    this.config.agentCommand = settings.agentCommand;
    this.config.agentCwd = settings.agentCwd;
    this.config.promptFile = settings.promptFile;
    this.config.discordNotifyChannelId = settings.discordNotifyChannelId;
    this.config.maxIterations = settings.maxIterations;
    this.config.idleSeconds = settings.idleSeconds;
    this.config.mode = settings.mode;
  }

  private canOverrideAgentCommand(actor: ActionActor): boolean {
    return this.config.allowRuntimeAgentCommandOverride || !['web', 'discord'].includes(actor.source);
  }

  private validateRuntimeSettings(settings: RuntimeSettings): string | null {
    if (!settings.taskName.trim()) {
      return 'run を開始する前に taskName を設定してください';
    }

    if (settings.mode === 'command' && !settings.agentCommand.trim()) {
      return '通常実行では agentCommand が必要です';
    }

    if (!settings.agentCwd.trim()) {
      return 'run を開始する前に実行ディレクトリを設定してください';
    }

    if (!existsSync(settings.agentCwd)) {
      return `実行ディレクトリが見つかりません: ${settings.agentCwd}`;
    }

    try {
      if (!statSync(settings.agentCwd).isDirectory()) {
        return `実行ディレクトリではありません: ${settings.agentCwd}`;
      }
    } catch (error) {
      return `実行ディレクトリを確認できません: ${settings.agentCwd} / ${error instanceof Error ? error.message : String(error)}`;
    }

    if (!settings.promptBody.trim() && !settings.promptFile.trim()) {
      return 'run を開始する前に promptBody または promptFile を設定してください';
    }

    if (!settings.promptBody.trim() && !existsSync(settings.promptFile)) {
      return `promptFile が見つかりません: ${settings.promptFile}`;
    }

    return null;
  }

  private refreshStatusCounters(): RunStatus {
    const status = this.store.readStatus();
    const previous = JSON.stringify(status);
    const questions = this.store.readQuestions();
    const pendingQuestions = questions.filter((question) => question.status === 'pending');
    const blockers = this.store.readBlockers();
    const promptInjectionQueue = this.listPromptInjectionQueue();
    const orchestration = buildOrchestrationSnapshot({
      status,
      tasks: this.tasks.synchronizeTaskCatalog(),
      pendingQuestions,
      blockers,
      promptInjectionQueue,
    });

    status.pendingQuestionCount = pendingQuestions.length;
    status.answeredQuestionCount = questions.filter((question) => question.status === 'answered').length;
    status.pendingInjectionCount = promptInjectionQueue.length;
    status.blockerCount = blockers.length;
    status.totalTaskCount = orchestration.totalTaskCount;
    status.activeTaskCount = orchestration.activeTaskCount;
    status.completedTaskCount = orchestration.completedTaskCount;
    status.queuedTaskCount = orchestration.queuedTaskCount;
    status.maxIntegration = orchestration.maxIntegration;
    status.thinkingText = status.thinkingText || orchestration.thinkingFrames[0];
    if (JSON.stringify(status) !== previous) {
      this.store.writeStatus(status);
    }
    return status;
  }

  private findCurrentTask(taskBoard: TaskBoardItem[]): TaskBoardItem | undefined {
    return this.tasks.findCurrentTask(taskBoard);
  }

  private findNextTask(taskBoard: TaskBoardItem[]): TaskBoardItem | undefined {
    return this.tasks.findNextTask(taskBoard);
  }

  private async appendEvent(
    type: string,
    level: EventRecord['level'],
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    await this.store.appendEvent({
      id: createEventId(),
      timestamp: nowIso(),
      type,
      message,
      level,
      data,
    });
  }
}
