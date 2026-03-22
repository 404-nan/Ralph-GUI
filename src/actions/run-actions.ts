import { existsSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { buildOrchestrationSnapshot } from '../orchestration/model.ts';
import { assessConfig, type AppConfig } from '../config.ts';
import { parseStructuredMarkers } from '../parser/markers.ts';
import { composePromptWithInjections } from '../prompt/composer.ts';
import { createEventId, createRunId, nextSequentialId } from '../shared/id.ts';
import { toPortableDisplayPath } from '../shared/path.ts';
import { nowIso } from '../shared/time.ts';
import type {
  AgentProfile,
  AnswerRecord,
  DashboardData,
  DashboardDiagnosticItem,
  EventRecord,
  ImportedTaskDraft,
  MarkerMatch,
  PromptInjectionItem,
  QuickTestResult,
  QuestionRecord,
  RunReport,
  RunMode,
  RunStatus,
  RuntimeSettings,
  SetupPresetView,
  TaskBoardItem,
  TaskImportPreview,
  TaskRecord,
  TestStatus,
} from '../shared/types.ts';
import { FileStateStore } from '../state/store.ts';
import {
  buildArtifacts,
  buildPendingDecisions,
} from './dashboard-view.ts';
import {
  TaskManager,
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
  agentProfiles?: AgentProfile[];
}

export interface RecordTurnResultInput {
  output: string;
  iteration: number;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  doneSignalMessage?: string;
}

function buildSetupPresets(): SetupPresetView[] {
  return [
    {
      id: 'codex',
      label: 'Codex CLI',
      command: 'codex exec --full-auto --skip-git-repo-check',
      description: 'Default Codex CLI for autonomous repo work.',
    },
    {
      id: 'claude-code',
      label: 'Claude Code',
      command: 'claude --dangerously-skip-permissions',
      description: 'Claude Code CLI with direct execution.',
    },
    {
      id: 'gemini',
      label: 'Gemini CLI',
      command: 'gemini --yolo',
      description: 'Gemini CLI for fast operator-driven loops.',
    },
  ];
}

function renderOrchestrationSummary(
  currentTask: TaskBoardItem | undefined,
  nextTasks: TaskBoardItem[],
  blockedTasks: TaskBoardItem[],
  pendingDecisions: QuestionRecord[],
): string {
  const sections = ['Mission control snapshot:'];

  if (currentTask) {
    sections.push(`- Current task: ${currentTask.id} / ${currentTask.title}`);
    if (currentTask.summary && currentTask.summary !== currentTask.title) {
      sections.push(`- Current task summary: ${currentTask.summary}`);
    }
    if (currentTask.acceptanceCriteria.length > 0) {
      sections.push('- Acceptance criteria:');
      for (const criterion of currentTask.acceptanceCriteria.slice(0, 6)) {
        sections.push(`  - ${criterion}`);
      }
    }
    if (currentTask.notes) {
      sections.push(`- Current task notes: ${currentTask.notes}`);
    }
  } else {
    sections.push('- Current task: none');
  }

  if (nextTasks.length > 0) {
    sections.push('- Next up queue:');
    for (const task of nextTasks.slice(0, 5)) {
      sections.push(`  - ${task.id}: ${task.title}`);
    }
  }

  if (blockedTasks.length > 0) {
    sections.push('- Blocked tasks:');
    for (const task of blockedTasks.slice(0, 5)) {
      const reason = task.blockedReason ? ` (${task.blockedReason})` : '';
      sections.push(`  - ${task.id}: ${task.title}${reason}`);
    }
  }

  if (pendingDecisions.length > 0) {
    sections.push('- Pending decisions:');
    for (const question of pendingDecisions.slice(0, 5)) {
      sections.push(`  - ${question.id}: ${question.text}`);
    }
  }

  return sections.join('\n');
}

function deriveRunReason(
  status: RunStatus,
  currentTask: TaskBoardItem | undefined,
  nextTasks: TaskBoardItem[],
  blockedTasks: TaskBoardItem[],
  pendingDecisions: QuestionRecord[],
  runReport: RunReport,
): string {
  if (status.runState === 'paused') {
    return 'Paused by operator. Resume when you are ready to continue the current task.';
  }
  if (status.runState === 'aborted') {
    return 'Abort requested. The current turn is being stopped safely.';
  }
  if (status.runState === 'needs_review') {
    return runReport.completion.message;
  }
  if (status.runState === 'completed') {
    return runReport.completion.message || 'The current run completed with operator-visible evidence.';
  }
  if (currentTask) {
    return `Current task is ${currentTask.id} / ${currentTask.title}.`;
  }
  if (blockedTasks.length > 0) {
    return `No runnable task is available. ${blockedTasks.length} blocked task(s) need operator action.`;
  }
  if (nextTasks.length > 0) {
    return `${nextTasks.length} task(s) are queued but no current focus is selected.`;
  }
  if (pendingDecisions.length > 0) {
    return `${pendingDecisions.length} decision(s) are pending before the next confident step.`;
  }
  if (status.phase === 'queued') {
    return 'Run is queued and waiting for the supervisor loop.';
  }
  return 'Task board is empty. Add a task or import a spec to start a mission run.';
}

function summarizeTestsFromOutput(output: string): { status: TestStatus; lines: string[] } {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const relevant = lines.filter((line) => /(test|spec|jest|vitest|playwright|pytest|cargo test|npm test|pnpm test|PASS|FAIL|failing)/i.test(line));
  if (relevant.length === 0) {
    return { status: 'not_run', lines: [] };
  }
  if (relevant.some((line) => /(FAIL|failing|failed|error)/i.test(line))) {
    return { status: 'failed', lines: relevant.slice(-8) };
  }
  if (relevant.some((line) => /(PASS|passed|ok \d+ -|all tests passed)/i.test(line))) {
    return { status: 'passed', lines: relevant.slice(-8) };
  }
  return { status: 'unknown', lines: relevant.slice(-8) };
}

function extractRecentOutputs(output: string): string[] {
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-10);
}

function classifyTurnOutcome(
  exitCode: number | null,
  signal: NodeJS.Signals | null,
  output: string,
  previousReport: RunReport,
): 'ok' | 'non_zero_exit' | 'stuck' | 'aborted' | 'error' {
  if (signal) {
    return signal === 'SIGTERM' || signal === 'SIGKILL' ? 'aborted' : 'error';
  }
  if (typeof exitCode === 'number' && exitCode !== 0) {
    return 'non_zero_exit';
  }
  const previousSummary = previousReport.lastTurn?.summary ?? '';
  const nextSummary = output.trim().slice(-400);
  if (!nextSummary || nextSummary === previousSummary) {
    return 'stuck';
  }
  return 'ok';
}

function safeGitCommand(config: AppConfig, args: string[]): string[] {
  const result = spawnSync('git', args, {
    cwd: config.agentCwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: 2500,
  });

  if (result.error || result.status !== 0 || !result.stdout) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function collectChangedFiles(config: AppConfig): string[] {
  return safeGitCommand(config, ['status', '--short', '--untracked-files=normal'])
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    .slice(0, 20);
}

function buildCompletionEvidence(
  currentTask: TaskBoardItem | undefined,
  pendingQuestions: number,
  blockers: number,
  doneSignalMessage: string | undefined,
  exitCode: number | null,
  changedFiles: string[],
  testsStatus: TestStatus,
): RunReport['completion'] {
  const pendingItems: string[] = [];
  const criteriaTotal = currentTask?.acceptanceCriteria.length ?? 0;

  if (!doneSignalMessage?.trim()) {
    pendingItems.push('DONE marker or operator completion signal was not observed.');
  }
  if (typeof exitCode === 'number' && exitCode !== 0) {
    pendingItems.push(`Agent command exited with code ${exitCode}.`);
  }
  if (pendingQuestions > 0) {
    pendingItems.push(`${pendingQuestions} pending decision(s) remain unanswered.`);
  }
  if (blockers > 0) {
    pendingItems.push(`${blockers} blocker(s) remain unresolved.`);
  }
  if (criteriaTotal > 0 && changedFiles.length === 0) {
    pendingItems.push('No changed-file evidence was captured for the current task.');
  }
  if (criteriaTotal > 0 && testsStatus === 'not_run') {
    pendingItems.push('No test execution was observed for a task that has acceptance criteria.');
  }
  if (testsStatus === 'failed') {
    pendingItems.push('Latest observed test output indicates a failure.');
  }

  const status =
    doneSignalMessage?.trim()
      ? pendingItems.length === 0
        ? 'completed'
        : 'needs_review'
      : 'in_progress';

  const message =
    status === 'completed'
      ? 'Completion signal, changed-file evidence, and current task checks are aligned.'
      : status === 'needs_review'
        ? 'Completion signal was received, but evidence is not strong enough to auto-complete the task.'
        : 'Current run is still gathering evidence for completion.';

  return {
    signalReceived: Boolean(doneSignalMessage?.trim()),
    criteriaTotal,
    criteriaMet: status === 'completed' ? criteriaTotal : 0,
    unresolvedBlockers: blockers,
    unresolvedDecisions: pendingQuestions,
    testsStatus,
    status,
    message,
    pendingItems,
  };
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
    const recentEvents = (await this.store.listRecentEvents(40)).reverse();
    const artifacts = buildArtifacts(recentEvents).slice(0, 8);
    const runReport = this.store.readRunReport();
    const configAssessment = assessConfig(this.config, settings);
    const setupDiagnostics = {
      ok: configAssessment.ok,
      summary: configAssessment.summary,
      items: configAssessment.items as DashboardDiagnosticItem[],
      presets: buildSetupPresets(),
    };

    return {
      status,
      runReason: status.runReason,
      runReport,
      settings,
      setupDiagnostics,
      capabilities: {
        canEditAgentCommand,
        canQuickTestAgent: true,
      },
      currentTask: orchestration.currentTask,
      nextTask: orchestration.nextTasks[0],
      nextTasks: orchestration.nextTasks,
      blockedTasks: orchestration.blockedTasks,
      doneTasks: orchestration.doneTasks,
      pendingQuestions,
      pendingDecisions,
      answeredQuestions,
      blockers,
      promptInjectionQueue,
      recentEvents,
      artifacts: runReport.recentArtifacts.length > 0 ? runReport.recentArtifacts : artifacts,
      agentLogTail: (await this.store.readAgentOutputTail(80)).filter(Boolean),
      taskBoard: orchestration.taskBoard,
      thinkingFrames: orchestration.thinkingFrames,
      agentProfiles: settings.agentProfiles,
    };
  }

  getStatus(): RunStatus {
    return this.refreshStatusCounters();
  }

  getCurrentTask(): TaskBoardItem | undefined {
    const status = this.getStatus();
    const orchestration = buildOrchestrationSnapshot({
      status,
      tasks: this.tasks.synchronizeTaskCatalog(),
      pendingQuestions: this.listPendingQuestions(),
      blockers: this.store.readBlockers(),
      promptInjectionQueue: this.listPromptInjectionQueue(),
    });
    return orchestration.currentTask;
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
      agentProfiles: input.agentProfiles ?? current.agentProfiles,
    };

    this.store.writeSettings(next);
    this.applyRuntimeSettings(next);

    const status = this.store.readStatus();
    status.task = next.taskName;
    status.maxIterations = next.maxIterations;
    status.agentCommand = next.agentCommand;
    status.mode = next.mode;
    status.promptFile = next.promptBody.trim()
      ? '[runtime prompt override]'
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

  async quickTestRuntimeSettings(actor: ActionActor): Promise<QuickTestResult> {
    const settings = this.getRuntimeSettings();
    const validationError = this.validateRuntimeSettings(settings);
    if (validationError) {
      return {
        ok: false,
        summary: validationError,
        output: ['Validation failed before the command probe started.'],
      };
    }

    if (settings.mode === 'demo') {
      return {
        ok: true,
        summary: 'Demo mode is configured correctly.',
        output: ['Demo mode does not require a live agent command probe.'],
      };
    }

    const prompt = 'Connection test from Ralph Mission Control. Reply with a short OK.';
    const promptFilePath = resolve(this.config.stateDir, '.current-prompt.md');
    const command = settings.agentCommand.replace(/\{PROMPT_FILE\}/g, promptFilePath);
    const result = spawnSync(command, {
      cwd: settings.agentCwd,
      input: prompt,
      encoding: 'utf8',
      shell: true,
      timeout: 8000,
      env: {
        ...process.env,
        RALPH_CONNECTION_TEST: '1',
        RALPH_PROMPT_FILE: promptFilePath,
      },
    });

    const output = [result.stdout, result.stderr]
      .filter(Boolean)
      .flatMap((chunk) => String(chunk).split(/\r?\n/))
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 12);

    const ok = !result.error && (result.status === 0 || result.status === null);
    const summary = ok
      ? 'Agent command probe started successfully.'
      : result.error
        ? `Probe failed: ${result.error.message}`
        : `Probe exited with code ${result.status}`;

    await this.appendEvent('settings.quick_test', ok ? 'info' : 'warning', `${actor.source} ran a quick settings test`, {
      ok,
      exitCode: result.status,
    });

    return { ok, summary, output };
  }

  resetRuntimeData(): RunStatus {
    this.store.resetRuntimeData();
    this.applyRuntimeSettings(this.store.readSettings());
    return this.store.readStatus();
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
    reviewedDrafts?: ImportedTaskDraft[],
  ): Promise<{ preview: TaskImportPreview; tasks: TaskRecord[] }> {
    const result = await this.tasks.importTasksFromSpec(specText, actor, reviewedDrafts);
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

  async blockTask(taskId: string, reason: string, actor: ActionActor): Promise<TaskRecord | null> {
    const result = await this.tasks.blockTask(taskId, reason, actor);
    this.refreshStatusCounters();
    return result;
  }

  async unblockTask(taskId: string, actor: ActionActor): Promise<TaskRecord | null> {
    const result = await this.tasks.unblockTask(taskId, actor);
    this.refreshStatusCounters();
    return result;
  }

  async moveTask(
    taskId: string,
    position: 'top' | 'up' | 'down' | 'bottom' | 'front' | 'back',
    actor: ActionActor,
  ): Promise<TaskRecord | null> {
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

    const snapshot = buildOrchestrationSnapshot({
      status: this.store.readStatus(),
      tasks: this.tasks.synchronizeTaskCatalog(),
      pendingQuestions: this.listPendingQuestions(),
      blockers: this.store.readBlockers(),
      promptInjectionQueue: this.listPromptInjectionQueue(),
    });
    if (!snapshot.currentTask && snapshot.blockedTasks.length > 0) {
      return {
        started: false,
        status: this.refreshStatusCounters(),
        message: '現在の focus にできる task がありません。blocked task を解消してください',
      };
    }

    this.store.clearRunArtifacts();

    const status = this.store.readStatus();
    status.runId = '';
    status.task = settings.taskName;
    status.phase = 'queued';
    status.lifecycle = 'idle';
    status.control = 'running';
    status.runState = 'ready';
    status.runReason = 'Run is queued and waiting for the supervisor loop.';
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
    status.blockedTaskCount = 0;
    status.currentTaskId = snapshot.currentTask?.id;
    status.startedAt = undefined;
    status.finishedAt = undefined;
    status.lastPromptPreview = undefined;
    status.lastError = undefined;
    status.updatedAt = nowIso();
    status.agentCommand = settings.agentCommand;
    status.mode = settings.mode;
    status.promptFile = settings.promptBody.trim()
      ? '[runtime prompt override]'
      : toPortableDisplayPath(this.config.rootDir, settings.promptFile);
    status.thinkingText = snapshot.currentTask
      ? `Ralph は ${snapshot.currentTask.id} から着手する準備をしています。`
      : 'Ralph は task board が空の状態で run 開始を待っています。';
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
    status.runState = 'needs_review';
    status.runReason = 'Previous run was interrupted by a process restart.';
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
    status.runState = 'paused';
    status.runReason = 'Paused by operator. Resume to continue the current task.';
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
    status.runState = 'running';
    status.runReason = 'Supervisor resumed the current task.';
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
    status.runState = 'aborted';
    status.runReason = 'Abort requested by operator.';
    status.thinkingText = '中断要求を受け取りました。現在のターンを安全に閉じます。';
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);

    const report = this.store.readRunReport();
    report.updatedAt = nowIso();
    if (report.lastTurn) {
      report.lastTurn.outcome = 'aborted';
      report.lastTurn.finishedAt = report.updatedAt;
    }
    this.store.writeRunReport(report);

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
      dashboard.currentTask,
      dashboard.nextTasks,
      dashboard.blockedTasks,
      dashboard.pendingQuestions,
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
    status.lastPromptPreview = result.appendedSections.join('\n\n').slice(0, 1400);
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    return result.prompt;
  }

  async handleAgentOutput(output: string): Promise<{ done: boolean; doneMessage?: string; markers: MarkerMatch[] }> {
    const markers = parseStructuredMarkers(output);
    let done = false;
    let doneMessage: string | undefined;

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
        doneMessage = marker.content || 'DONE marker を受信しました';
      }
    }

    if (markers.length === 0) {
      await this.appendEvent('agent.output', 'info', 'structured marker がない出力を受信しました');
    }

    return { done, doneMessage, markers };
  }

  async recordTurnResult(input: RecordTurnResultInput): Promise<void> {
    const dashboard = await this.getDashboardData();
    const report = this.store.readRunReport();
    const tests = summarizeTestsFromOutput(input.output);
    const changedFiles = collectChangedFiles(this.config);
    const outcome = classifyTurnOutcome(input.exitCode, input.signal, input.output, report);
    const currentTask = dashboard.currentTask;

    report.updatedAt = nowIso();
    report.currentTaskId = currentTask?.id;
    report.changedFiles = changedFiles;
    report.recentOutputs = extractRecentOutputs(input.output);
    report.testSummary = tests.lines;
    report.lastTurn = {
      iteration: input.iteration,
      startedAt: report.lastTurn?.startedAt,
      finishedAt: report.updatedAt,
      exitCode: input.exitCode,
      signal: input.signal,
      outcome,
      summary: input.output.trim().slice(-400),
      doneSignalReceived: Boolean(input.doneSignalMessage?.trim()),
    };
    report.retryCount = outcome === 'non_zero_exit' || outcome === 'stuck' ? report.retryCount + 1 : 0;
    report.stuckCount = outcome === 'stuck' ? report.stuckCount + 1 : report.stuckCount;
    report.completion = buildCompletionEvidence(
      currentTask,
      dashboard.pendingQuestions.length,
      dashboard.blockers.length,
      input.doneSignalMessage,
      input.exitCode,
      changedFiles,
      tests.status,
    );

    const eventArtifacts = buildArtifacts((await this.store.listRecentEvents(20)).reverse());
    report.recentArtifacts = [
      ...eventArtifacts.slice(0, 6),
      ...(changedFiles.length > 0
        ? [{
            id: `artifact-changed-files-${report.updatedAt}`,
            title: 'Changed files',
            summary: changedFiles.slice(0, 5).join(', '),
            tone: 'info' as const,
            timestamp: report.updatedAt,
          }]
        : []),
    ].slice(0, 8);
    this.store.writeRunReport(report);

    if (report.completion.status === 'completed') {
      if (currentTask) {
        await this.completeTask(currentTask.id, { source: 'agent' });
        report.lastCompletedTaskId = currentTask.id;
        this.store.writeRunReport(report);
      }

      const status = this.store.readStatus();
      status.lifecycle = 'completed';
      status.control = 'running';
      status.phase = 'completed';
      status.runState = 'completed';
      status.runReason = report.completion.message;
      status.currentStatusText = input.doneSignalMessage || report.completion.message;
      status.thinkingText = status.currentStatusText;
      status.finishedAt = nowIso();
      status.updatedAt = status.finishedAt;
      this.store.writeStatus(status);
      await this.appendEvent('run.completed', 'info', input.doneSignalMessage || report.completion.message);
      return;
    }

    if (report.completion.status === 'needs_review') {
      const status = this.store.readStatus();
      status.lifecycle = 'failed';
      status.control = 'running';
      status.phase = 'needs_review';
      status.runState = 'needs_review';
      status.runReason = report.completion.message;
      status.currentStatusText = input.doneSignalMessage || report.completion.message;
      status.thinkingText = report.completion.pendingItems[0] || report.completion.message;
      status.finishedAt = nowIso();
      status.updatedAt = status.finishedAt;
      this.store.writeStatus(status);
      await this.appendEvent('run.needs_review', 'warning', report.completion.message, {
        pendingItems: report.completion.pendingItems,
      });
      return;
    }

    if (outcome === 'non_zero_exit') {
      await this.recordAgentStatus(
        `agent command は exit code ${input.exitCode} で終了しました。retry budget=${report.retryBudget}, current retry=${report.retryCount}`,
      );
      return;
    }

    if (outcome === 'stuck') {
      await this.recordAgentStatus('最新ターンで大きな変化を観測できませんでした。stuck として記録します。');
    }
  }

  async recordAgentStatus(message: string): Promise<void> {
    const status = this.store.readStatus();
    status.currentStatusText = message;
    status.thinkingText = message;
    status.phase = 'running';
    status.runState = 'running';
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

  async markRunStarted(): Promise<RunStatus> {
    const settings = this.getRuntimeSettings();
    const status = this.store.readStatus();
    const snapshot = buildOrchestrationSnapshot({
      status,
      tasks: this.tasks.synchronizeTaskCatalog(),
      pendingQuestions: this.listPendingQuestions(),
      blockers: this.store.readBlockers(),
      promptInjectionQueue: this.listPromptInjectionQueue(),
    });

    status.runId = createRunId();
    status.task = settings.taskName;
    status.phase = 'starting';
    status.lifecycle = 'starting';
    status.control = 'running';
    status.runState = 'running';
    status.runReason = snapshot.currentTask
      ? `Starting current task ${snapshot.currentTask.id}.`
      : 'Starting run without a selected task.';
    status.startedAt = nowIso();
    status.finishedAt = undefined;
    status.updatedAt = nowIso();
    status.agentCommand = settings.agentCommand;
    status.mode = settings.mode;
    status.promptFile = settings.promptBody.trim()
      ? '[runtime prompt override]'
      : toPortableDisplayPath(this.config.rootDir, settings.promptFile);
    status.maxIterations = settings.maxIterations;
    status.currentTaskId = snapshot.currentTask?.id;
    status.thinkingText = snapshot.currentTask
      ? `Current focus is ${snapshot.currentTask.id}. Ralph is preparing the prompt and agent command.`
      : 'Ralph is preparing the first turn.';
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
    status.runState = status.control === 'paused' ? 'paused' : 'running';
    status.thinkingText = `${iteration} 回目の思考を進めています。現在のTaskを中心に回しています。`;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    const report = this.store.readRunReport();
    report.updatedAt = nowIso();
    report.lastTurn = {
      iteration,
      startedAt: report.lastTurn?.startedAt ?? report.updatedAt,
      finishedAt: report.updatedAt,
      exitCode: null,
      signal: null,
      outcome: 'ok',
      summary: 'Turn started.',
      doneSignalReceived: false,
    };
    this.store.writeRunReport(report);

    return this.refreshStatusCounters();
  }

  async markMaxIterationsReached(): Promise<void> {
    const status = this.store.readStatus();
    status.lifecycle = 'failed';
    status.phase = 'max_iterations_reached';
    status.runState = 'needs_review';
    status.runReason = 'Maximum iteration count was reached before completion evidence was strong enough.';
    status.currentStatusText = '最大反復回数に到達しました';
    status.thinkingText = '思考回数の上限に到達しました。続きは次の run で進めてください。';
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);

    const report = this.store.readRunReport();
    report.updatedAt = nowIso();
    report.completion.status = 'needs_review';
    report.completion.message = 'Maximum iterations were reached before task completion was confirmed.';
    report.completion.pendingItems = [
      ...report.completion.pendingItems,
      'Iteration limit was reached.',
    ].filter(Boolean);
    this.store.writeRunReport(report);

    await this.appendEvent('run.max_iterations', 'warning', '最大反復回数に到達しました');
  }

  async markRuntimeError(error: unknown): Promise<void> {
    const status = this.store.readStatus();
    status.lifecycle = status.control === 'abort_requested' ? 'aborted' : 'failed';
    status.phase = status.lifecycle;
    status.runState = status.control === 'abort_requested' ? 'aborted' : 'failed';
    status.runReason = 'Supervisor encountered a runtime error.';
    status.lastError = error instanceof Error ? error.stack ?? error.message : String(error);
    status.thinkingText = '実行中に障害が発生しました。状態を確認して次の run を準備してください。';
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);

    const report = this.store.readRunReport();
    report.updatedAt = nowIso();
    report.completion.status = 'needs_review';
    report.completion.message = 'Runtime error captured by the supervisor.';
    report.completion.pendingItems = [
      ...report.completion.pendingItems,
      status.lastError ?? 'Unknown runtime error.',
    ].filter(Boolean);
    this.store.writeRunReport(report);

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
    const runReport = this.store.readRunReport();

    status.pendingQuestionCount = pendingQuestions.length;
    status.answeredQuestionCount = questions.filter((question) => question.status === 'answered').length;
    status.pendingInjectionCount = promptInjectionQueue.length;
    status.blockerCount = blockers.length;
    status.totalTaskCount = orchestration.totalTaskCount;
    status.activeTaskCount = orchestration.activeTaskCount;
    status.completedTaskCount = orchestration.completedTaskCount;
    status.queuedTaskCount = orchestration.queuedTaskCount;
    status.blockedTaskCount = orchestration.blockedTaskCount;
    status.maxIntegration = 1;
    status.currentTaskId = orchestration.currentTask?.id;
    status.runReason = deriveRunReason(
      status,
      orchestration.currentTask,
      orchestration.nextTasks,
      orchestration.blockedTasks,
      pendingQuestions,
      runReport,
    );
    if (status.phase === 'queued' && status.runState !== 'running') {
      status.runState = 'ready';
    } else if (status.lifecycle === 'paused' || status.lifecycle === 'pause_requested') {
      status.runState = 'paused';
    } else if (!orchestration.currentTask && orchestration.blockedTasks.length > 0 && status.lifecycle === 'idle') {
      status.runState = 'blocked';
    } else if (status.lifecycle === 'completed') {
      status.runState = 'completed';
    } else if (status.lifecycle === 'aborted') {
      status.runState = 'aborted';
    } else if (status.phase === 'needs_review') {
      status.runState = 'needs_review';
    } else if (status.lifecycle === 'failed') {
      status.runState = 'failed';
    } else if (status.lifecycle === 'running' || status.lifecycle === 'starting') {
      status.runState = 'running';
    } else if (status.totalTaskCount > 0) {
      status.runState = 'ready';
    } else {
      status.runState = 'idle';
    }
    status.thinkingText = status.thinkingText || orchestration.thinkingFrames[0];
    if (JSON.stringify(status) !== previous) {
      this.store.writeStatus(status);
    }
    return status;
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
