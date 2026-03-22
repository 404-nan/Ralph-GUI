import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { readFile, appendFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

import type { AppConfig } from '../config.ts';
import { toPortableDisplayPath } from '../shared/path.ts';
import { nowIso } from '../shared/time.ts';
import {
  STATE_SCHEMA_VERSION,
  type AnswerRecord,
  type BlockerRecord,
  type EventRecord,
  type ManualNoteRecord,
  type QuestionRecord,
  type RunReport,
  type RuntimeSettings,
  type RunStatus,
  type StateMeta,
  type StoredTaskStatus,
  type TaskPriority,
  type TaskRecord,
} from '../shared/types.ts';

interface InboxOffsets {
  answersLineOffset: number;
  notesLineOffset: number;
}

type InitialConfigSnapshot = Readonly<
  Pick<
    AppConfig,
    | 'rootDir'
    | 'promptFile'
    | 'agentCommand'
    | 'agentCwd'
    | 'mode'
    | 'maxIterations'
    | 'idleSeconds'
    | 'taskName'
    | 'discordNotifyChannelId'
  >
>;

function splitInboxLines(content: string): string[] {
  if (!content) {
    return [];
  }

  const lines = content.split(/\r?\n/);
  if (lines.at(-1) === '') {
    lines.pop();
  }
  return lines;
}

function normalizePriority(value: unknown): TaskPriority {
  if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') {
    return value;
  }
  return 'medium';
}

function normalizeTaskStatus(value: unknown): StoredTaskStatus {
  if (value === 'completed' || value === 'done') {
    return 'completed';
  }
  if (value === 'blocked') {
    return 'blocked';
  }
  return 'pending';
}

function inferRunState(status: Partial<RunStatus>): RunStatus['runState'] {
  const lifecycle = status.lifecycle ?? 'idle';
  const phase = status.phase ?? 'idle';

  if (lifecycle === 'completed') {
    return 'completed';
  }
  if (lifecycle === 'aborted' || status.control === 'abort_requested') {
    return 'aborted';
  }
  if (lifecycle === 'failed') {
    return phase === 'needs_review' ? 'needs_review' : 'failed';
  }
  if (lifecycle === 'paused' || lifecycle === 'pause_requested' || status.control === 'paused') {
    return 'paused';
  }
  if (lifecycle === 'running' || lifecycle === 'starting') {
    return 'running';
  }
  if (phase === 'queued') {
    return 'ready';
  }

  return 'idle';
}

function buildDefaultStatus(config: InitialConfigSnapshot): RunStatus {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    runId: '',
    task: config.taskName,
    phase: 'idle',
    lifecycle: 'idle',
    control: 'running',
    runState: 'idle',
    runReason: 'Run can be started.',
    iteration: 0,
    maxIterations: config.maxIterations,
    currentStatusText: '',
    pendingQuestionCount: 0,
    answeredQuestionCount: 0,
    pendingInjectionCount: 0,
    blockerCount: 0,
    totalTaskCount: 0,
    activeTaskCount: 0,
    completedTaskCount: 0,
    queuedTaskCount: 0,
    blockedTaskCount: 0,
    maxIntegration: 1,
    updatedAt: nowIso(),
    agentCommand: config.agentCommand,
    mode: config.mode,
    promptFile: toPortableDisplayPath(config.rootDir, config.promptFile),
    thinkingText: '',
  };
}

function buildDefaultMeta(): StateMeta {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    migratedAt: nowIso(),
  };
}

function buildDefaultRunReport(): RunReport {
  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    updatedAt: nowIso(),
    retryCount: 0,
    retryBudget: 2,
    stuckCount: 0,
    changedFiles: [],
    recentArtifacts: [],
    recentOutputs: [],
    testSummary: [],
    completion: {
      signalReceived: false,
      criteriaTotal: 0,
      criteriaMet: 0,
      unresolvedBlockers: 0,
      unresolvedDecisions: 0,
      testsStatus: 'not_run',
      status: 'in_progress',
      message: 'No completion evidence collected yet.',
      pendingItems: [],
    },
  };
}

function stableStringify(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function normalizeTaskRecord(raw: Partial<TaskRecord>, index: number): TaskRecord {
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : `Task ${index + 1}`;
  const summary = typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary.trim() : title;
  const createdAt = typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : nowIso();
  const updatedAt = typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : createdAt;
  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : `TASK-${index + 1}`,
    title,
    summary,
    priority: normalizePriority(raw.priority),
    sortIndex: Number.isFinite(raw.sortIndex) ? Number(raw.sortIndex) : index + 1,
    status: normalizeTaskStatus(raw.status),
    createdAt,
    updatedAt,
    completedAt: typeof raw.completedAt === 'string' && raw.completedAt ? raw.completedAt : undefined,
    source: typeof raw.source === 'string' && raw.source.trim() ? raw.source : 'system',
    acceptanceCriteria: Array.isArray(raw.acceptanceCriteria)
      ? raw.acceptanceCriteria.map((item) => String(item).trim()).filter(Boolean)
      : [],
    notes: typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes : undefined,
    blockedReason:
      typeof raw.blockedReason === 'string' && raw.blockedReason.trim() ? raw.blockedReason : undefined,
    titleOverride:
      typeof raw.titleOverride === 'string' && raw.titleOverride.trim() ? raw.titleOverride : undefined,
    summaryOverride:
      typeof raw.summaryOverride === 'string' && raw.summaryOverride.trim() ? raw.summaryOverride : undefined,
    agentId: typeof raw.agentId === 'string' && raw.agentId.trim() ? raw.agentId : undefined,
  };
}

function normalizeStatusRecord(raw: Partial<RunStatus>, defaults: RunStatus): RunStatus {
  const phase = typeof raw.phase === 'string' && raw.phase ? raw.phase : defaults.phase;
  const lifecycle =
    raw.lifecycle === 'idle'
    || raw.lifecycle === 'starting'
    || raw.lifecycle === 'running'
    || raw.lifecycle === 'paused'
    || raw.lifecycle === 'pause_requested'
    || raw.lifecycle === 'completed'
    || raw.lifecycle === 'aborted'
    || raw.lifecycle === 'failed'
      ? raw.lifecycle
      : defaults.lifecycle;
  const control =
    raw.control === 'running'
    || raw.control === 'paused'
    || raw.control === 'abort_requested'
    || raw.control === 'aborted'
      ? raw.control
      : defaults.control;

  return {
    ...defaults,
    ...raw,
    schemaVersion: STATE_SCHEMA_VERSION,
    phase,
    lifecycle,
    control,
    runState:
      raw.runState === 'idle'
      || raw.runState === 'ready'
      || raw.runState === 'running'
      || raw.runState === 'paused'
      || raw.runState === 'blocked'
      || raw.runState === 'needs_review'
      || raw.runState === 'completed'
      || raw.runState === 'aborted'
      || raw.runState === 'failed'
        ? raw.runState
        : inferRunState(raw),
    runReason:
      typeof raw.runReason === 'string' && raw.runReason.trim() ? raw.runReason : defaults.runReason,
    maxIntegration: 1,
    activeTaskCount: Number.isFinite(raw.activeTaskCount) ? Number(raw.activeTaskCount) : 0,
    queuedTaskCount: Number.isFinite(raw.queuedTaskCount) ? Number(raw.queuedTaskCount) : 0,
    blockedTaskCount: Number.isFinite(raw.blockedTaskCount) ? Number(raw.blockedTaskCount) : 0,
    completedTaskCount: Number.isFinite(raw.completedTaskCount) ? Number(raw.completedTaskCount) : 0,
    totalTaskCount: Number.isFinite(raw.totalTaskCount) ? Number(raw.totalTaskCount) : 0,
    pendingQuestionCount: Number.isFinite(raw.pendingQuestionCount) ? Number(raw.pendingQuestionCount) : 0,
    answeredQuestionCount: Number.isFinite(raw.answeredQuestionCount) ? Number(raw.answeredQuestionCount) : 0,
    pendingInjectionCount: Number.isFinite(raw.pendingInjectionCount) ? Number(raw.pendingInjectionCount) : 0,
    blockerCount: Number.isFinite(raw.blockerCount) ? Number(raw.blockerCount) : 0,
    iteration: Number.isFinite(raw.iteration) ? Number(raw.iteration) : 0,
    maxIterations: Number.isFinite(raw.maxIterations) ? Number(raw.maxIterations) : defaults.maxIterations,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : nowIso(),
    task: typeof raw.task === 'string' && raw.task.trim() ? raw.task : defaults.task,
    agentCommand:
      typeof raw.agentCommand === 'string' && raw.agentCommand.trim()
        ? raw.agentCommand
        : defaults.agentCommand,
    mode: raw.mode === 'demo' || raw.mode === 'command' ? raw.mode : defaults.mode,
    promptFile:
      typeof raw.promptFile === 'string' && raw.promptFile.trim() ? raw.promptFile : defaults.promptFile,
    currentStatusText:
      typeof raw.currentStatusText === 'string' ? raw.currentStatusText : defaults.currentStatusText,
    thinkingText: typeof raw.thinkingText === 'string' ? raw.thinkingText : defaults.thinkingText,
    lastError: typeof raw.lastError === 'string' && raw.lastError ? raw.lastError : undefined,
    currentTaskId:
      typeof raw.currentTaskId === 'string' && raw.currentTaskId.trim() ? raw.currentTaskId : undefined,
  };
}

function normalizeSettingsRecord(
  raw: Partial<RuntimeSettings> | null,
  defaults: RuntimeSettings,
): RuntimeSettings {
  if (!raw) {
    return defaults;
  }

  return {
    ...defaults,
    ...raw,
    taskName: typeof raw.taskName === 'string' && raw.taskName.trim() ? raw.taskName : defaults.taskName,
    agentCommand:
      typeof raw.agentCommand === 'string' && raw.agentCommand.trim()
        ? raw.agentCommand
        : defaults.agentCommand,
    agentCwd: typeof raw.agentCwd === 'string' && raw.agentCwd.trim() ? raw.agentCwd : defaults.agentCwd,
    promptFile:
      typeof raw.promptFile === 'string' && raw.promptFile.trim() ? raw.promptFile : defaults.promptFile,
    promptBody: typeof raw.promptBody === 'string' ? raw.promptBody : '',
    discordNotifyChannelId:
      typeof raw.discordNotifyChannelId === 'string' ? raw.discordNotifyChannelId : defaults.discordNotifyChannelId,
    maxIterations:
      Number.isFinite(raw.maxIterations) && Number(raw.maxIterations) > 0
        ? Number(raw.maxIterations)
        : defaults.maxIterations,
    idleSeconds:
      Number.isFinite(raw.idleSeconds) && Number(raw.idleSeconds) > 0
        ? Number(raw.idleSeconds)
        : defaults.idleSeconds,
    mode: raw.mode === 'demo' || raw.mode === 'command' ? raw.mode : defaults.mode,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : defaults.updatedAt,
    updatedBy: typeof raw.updatedBy === 'string' && raw.updatedBy ? raw.updatedBy : defaults.updatedBy,
    agentProfiles: Array.isArray(raw.agentProfiles)
      ? raw.agentProfiles
          .filter((profile): profile is RuntimeSettings['agentProfiles'][number] => Boolean(profile))
          .map((profile, index) => ({
            id:
              typeof profile.id === 'string' && profile.id.trim() ? profile.id : `agent-${index + 1}`,
            label:
              typeof profile.label === 'string' && profile.label.trim()
                ? profile.label
                : `Agent ${index + 1}`,
            command:
              typeof profile.command === 'string' && profile.command.trim() ? profile.command : '',
            description:
              typeof profile.description === 'string' && profile.description.trim()
                ? profile.description
                : undefined,
          }))
      : [],
  };
}

function normalizeRunReportRecord(raw: Partial<RunReport> | null): RunReport {
  const defaults = buildDefaultRunReport();
  if (!raw) {
    return defaults;
  }

  return {
    ...defaults,
    ...raw,
    schemaVersion: STATE_SCHEMA_VERSION,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : defaults.updatedAt,
    retryCount: Number.isFinite(raw.retryCount) ? Number(raw.retryCount) : defaults.retryCount,
    retryBudget: Number.isFinite(raw.retryBudget) ? Number(raw.retryBudget) : defaults.retryBudget,
    stuckCount: Number.isFinite(raw.stuckCount) ? Number(raw.stuckCount) : defaults.stuckCount,
    changedFiles: Array.isArray(raw.changedFiles)
      ? raw.changedFiles.map((item) => String(item).trim()).filter(Boolean)
      : [],
    recentArtifacts: Array.isArray(raw.recentArtifacts) ? raw.recentArtifacts : [],
    recentOutputs: Array.isArray(raw.recentOutputs)
      ? raw.recentOutputs.map((item) => String(item)).filter(Boolean)
      : [],
    testSummary: Array.isArray(raw.testSummary)
      ? raw.testSummary.map((item) => String(item)).filter(Boolean)
      : [],
    completion: {
      ...defaults.completion,
      ...raw.completion,
      pendingItems: Array.isArray(raw.completion?.pendingItems)
        ? raw.completion.pendingItems.map((item) => String(item).trim()).filter(Boolean)
        : [],
      testsStatus:
        raw.completion?.testsStatus === 'not_run'
        || raw.completion?.testsStatus === 'passed'
        || raw.completion?.testsStatus === 'failed'
        || raw.completion?.testsStatus === 'unknown'
          ? raw.completion.testsStatus
          : defaults.completion.testsStatus,
      status:
        raw.completion?.status === 'in_progress'
        || raw.completion?.status === 'completed'
        || raw.completion?.status === 'needs_review'
          ? raw.completion.status
          : defaults.completion.status,
    },
  };
}

export class FileStateStore {
  private readonly stateDir: string;
  private readonly logDir: string;
  private readonly initialConfig: InitialConfigSnapshot;

  private readonly metaPath: string;
  private readonly statusPath: string;
  private readonly questionsPath: string;
  private readonly answersPath: string;
  private readonly manualNotesPath: string;
  private readonly blockersPath: string;
  private readonly tasksPath: string;
  private readonly settingsPath: string;
  private readonly runReportPath: string;
  private readonly eventsPath: string;
  private readonly agentOutputPath: string;
  private readonly answerInboxPath: string;
  private readonly noteInboxPath: string;
  private readonly inboxOffsetsPath: string;
  private readonly currentPromptPath: string;

  constructor(config: AppConfig) {
    this.stateDir = config.stateDir;
    this.logDir = config.logDir;
    this.initialConfig = {
      rootDir: config.rootDir,
      promptFile: config.promptFile,
      agentCommand: config.agentCommand,
      agentCwd: config.agentCwd,
      mode: config.mode,
      maxIterations: config.maxIterations,
      idleSeconds: config.idleSeconds,
      taskName: config.taskName,
      discordNotifyChannelId: config.discordNotifyChannelId,
    };

    this.metaPath = join(this.stateDir, 'meta.json');
    this.statusPath = join(this.stateDir, 'status.json');
    this.questionsPath = join(this.stateDir, 'questions.json');
    this.answersPath = join(this.stateDir, 'answers.json');
    this.manualNotesPath = join(this.stateDir, 'manual-notes.json');
    this.blockersPath = join(this.stateDir, 'blockers.json');
    this.tasksPath = join(this.stateDir, 'tasks.json');
    this.settingsPath = join(this.stateDir, 'settings.json');
    this.runReportPath = join(this.stateDir, 'run-report.json');
    this.eventsPath = join(this.stateDir, 'events.jsonl');
    this.agentOutputPath = join(this.logDir, 'agent-output.log');
    this.answerInboxPath = join(this.stateDir, 'answer-inbox.jsonl');
    this.noteInboxPath = join(this.stateDir, 'note-inbox.txt');
    this.inboxOffsetsPath = join(this.stateDir, 'inbox-offsets.json');
    this.currentPromptPath = join(this.stateDir, '.current-prompt.md');
  }

  async ensureInitialized(): Promise<void> {
    mkdirSync(this.stateDir, { recursive: true });
    mkdirSync(this.logDir, { recursive: true });

    this.writeJsonIfMissing(this.statusPath, this.defaultStatus());
    this.writeJsonIfMissing(this.questionsPath, []);
    this.writeJsonIfMissing(this.answersPath, []);
    this.writeJsonIfMissing(this.manualNotesPath, []);
    this.writeJsonIfMissing(this.blockersPath, []);
    this.writeJsonIfMissing(this.tasksPath, []);
    this.writeJsonIfMissing(this.settingsPath, this.defaultSettings());
    this.writeJsonIfMissing(this.runReportPath, this.defaultRunReport());
    this.writeJsonIfMissing(this.inboxOffsetsPath, { answersLineOffset: 0, notesLineOffset: 0 });
    this.writeJsonIfMissing(this.metaPath, this.defaultMeta());

    if (!existsSync(this.eventsPath)) {
      writeFileSync(this.eventsPath, '', 'utf8');
    }

    if (!existsSync(this.agentOutputPath)) {
      writeFileSync(this.agentOutputPath, '', 'utf8');
    }

    if (!existsSync(this.answerInboxPath)) {
      writeFileSync(this.answerInboxPath, '', 'utf8');
    }

    if (!existsSync(this.noteInboxPath)) {
      writeFileSync(this.noteInboxPath, '', 'utf8');
    }

    this.migrateState();
  }

  readMeta(): StateMeta {
    const raw = this.readJson<StateMeta>(this.metaPath);
    return {
      schemaVersion:
        raw && Number.isFinite(raw.schemaVersion) ? Number(raw.schemaVersion) : STATE_SCHEMA_VERSION,
      migratedAt: raw?.migratedAt || nowIso(),
    };
  }

  writeMeta(meta: StateMeta): void {
    this.writeJson(this.metaPath, meta);
  }

  readStatus(): RunStatus {
    return normalizeStatusRecord(this.readJson<Partial<RunStatus>>(this.statusPath) ?? {}, this.defaultStatus());
  }

  writeStatus(status: RunStatus): void {
    this.writeJson(this.statusPath, normalizeStatusRecord(status, this.defaultStatus()));
  }

  readQuestions(): QuestionRecord[] {
    return this.readJson<QuestionRecord[]>(this.questionsPath) ?? [];
  }

  writeQuestions(questions: QuestionRecord[]): void {
    this.writeJson(this.questionsPath, questions);
  }

  readAnswers(): AnswerRecord[] {
    return this.readJson<AnswerRecord[]>(this.answersPath) ?? [];
  }

  writeAnswers(answers: AnswerRecord[]): void {
    this.writeJson(this.answersPath, answers);
  }

  readManualNotes(): ManualNoteRecord[] {
    return this.readJson<ManualNoteRecord[]>(this.manualNotesPath) ?? [];
  }

  writeManualNotes(notes: ManualNoteRecord[]): void {
    this.writeJson(this.manualNotesPath, notes);
  }

  readBlockers(): BlockerRecord[] {
    return this.readJson<BlockerRecord[]>(this.blockersPath) ?? [];
  }

  writeBlockers(blockers: BlockerRecord[]): void {
    this.writeJson(this.blockersPath, blockers);
  }

  readTasks(): TaskRecord[] {
    const raw = this.readJson<Array<Partial<TaskRecord>>>(this.tasksPath) ?? [];
    return raw.map((task, index) => normalizeTaskRecord(task, index));
  }

  writeTasks(tasks: TaskRecord[]): void {
    this.writeJson(
      this.tasksPath,
      tasks.map((task, index) => normalizeTaskRecord(task, index)),
    );
  }

  readSettings(): RuntimeSettings {
    return normalizeSettingsRecord(this.readJson<Partial<RuntimeSettings>>(this.settingsPath), this.defaultSettings());
  }

  writeSettings(settings: RuntimeSettings): void {
    this.writeJson(this.settingsPath, normalizeSettingsRecord(settings, this.defaultSettings()));
  }

  readRunReport(): RunReport {
    return normalizeRunReportRecord(this.readJson<Partial<RunReport>>(this.runReportPath));
  }

  writeRunReport(report: RunReport): void {
    this.writeJson(this.runReportPath, normalizeRunReportRecord(report));
  }

  async listRecentEvents(count: number): Promise<EventRecord[]> {
    const content = await this.readFileOrEmpty(this.eventsPath);
    const lines = content.split('\n').filter(Boolean);
    const recent = lines.slice(-count);

    return recent.flatMap((line) => {
      try {
        return [JSON.parse(line) as EventRecord];
      } catch (error) {
        console.warn(
          `state: events.jsonl の行をスキップしました: ${this.eventsPath} / ${error instanceof Error ? error.message : String(error)}`,
        );
        return [];
      }
    });
  }

  async appendEvent(event: EventRecord): Promise<void> {
    await appendFile(this.eventsPath, `${JSON.stringify(event)}\n`, 'utf8');
  }

  async readAgentOutputTail(lines: number): Promise<string[]> {
    const content = await this.readFileOrEmpty(this.agentOutputPath);
    const all = content.split('\n');
    return all.slice(-lines);
  }

  async appendAgentOutput(text: string): Promise<void> {
    await appendFile(this.agentOutputPath, text, 'utf8');
  }

  clearRunArtifacts(): void {
    this.writeQuestions([]);
    this.writeAnswers([]);
    this.writeManualNotes([]);
    this.writeBlockers([]);
    this.writeRunReport(this.defaultRunReport());
    writeFileSync(this.eventsPath, '', 'utf8');
    writeFileSync(this.agentOutputPath, '', 'utf8');
    writeFileSync(this.currentPromptPath, '', 'utf8');
  }

  resetRuntimeData(): void {
    this.writeMeta(this.defaultMeta());
    this.writeStatus(this.defaultStatus());
    this.writeQuestions([]);
    this.writeAnswers([]);
    this.writeManualNotes([]);
    this.writeBlockers([]);
    this.writeTasks([]);
    this.writeSettings(this.defaultSettings());
    this.writeRunReport(this.defaultRunReport());
    this.writeInboxOffsets({ answersLineOffset: 0, notesLineOffset: 0 });
    writeFileSync(this.eventsPath, '', 'utf8');
    writeFileSync(this.agentOutputPath, '', 'utf8');
    writeFileSync(this.answerInboxPath, '', 'utf8');
    writeFileSync(this.noteInboxPath, '', 'utf8');
    writeFileSync(this.currentPromptPath, '', 'utf8');
  }

  readInboxOffsets(): InboxOffsets {
    return this.readJson<InboxOffsets>(this.inboxOffsetsPath) ?? {
      answersLineOffset: 0,
      notesLineOffset: 0,
    };
  }

  writeInboxOffsets(offsets: InboxOffsets): void {
    this.writeJson(this.inboxOffsetsPath, offsets);
  }

  async readAnswerInboxLines(): Promise<string[]> {
    const content = await this.readFileOrEmpty(this.answerInboxPath);
    return splitInboxLines(content);
  }

  async readNoteInboxLines(): Promise<string[]> {
    const content = await this.readFileOrEmpty(this.noteInboxPath);
    return splitInboxLines(content);
  }

  private migrateState(): void {
    const nextMeta = this.defaultMeta();
    const status = normalizeStatusRecord(this.readJson<Partial<RunStatus>>(this.statusPath) ?? {}, this.defaultStatus());
    const tasks = (this.readJson<Array<Partial<TaskRecord>>>(this.tasksPath) ?? []).map((task, index) =>
      normalizeTaskRecord(task, index),
    );
    const settings = normalizeSettingsRecord(
      this.readJson<Partial<RuntimeSettings>>(this.settingsPath),
      this.defaultSettings(),
    );
    const runReport = normalizeRunReportRecord(this.readJson<Partial<RunReport>>(this.runReportPath));

    this.syncJsonFile(this.metaPath, nextMeta);
    this.syncJsonFile(this.statusPath, status);
    this.syncJsonFile(this.tasksPath, tasks);
    this.syncJsonFile(this.settingsPath, settings);
    this.syncJsonFile(this.runReportPath, runReport);
  }

  private readJson<T>(filePath: string): T | null {
    if (!existsSync(filePath)) {
      return null;
    }

    const content = readFileSync(filePath, 'utf8').trim();
    if (!content) {
      return null;
    }

    try {
      return JSON.parse(content) as T;
    } catch (error) {
      const backupPath = `${filePath}.corrupt-${Date.now()}`;
      try {
        renameSync(filePath, backupPath);
      } catch {
        // Keep returning a safe fallback even if the corrupt file could not be moved.
      }
      console.warn(
        `state: JSON が壊れていたため退避しました: ${filePath} -> ${backupPath} / ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  private syncJsonFile(filePath: string, data: unknown): void {
    const next = stableStringify(data);
    const current = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
    if (current !== next) {
      this.writeJson(filePath, data);
    }
  }

  private writeJson(filePath: string, data: unknown): void {
    mkdirSync(dirname(filePath), { recursive: true });
    const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    writeFileSync(tempPath, stableStringify(data), 'utf8');
    renameSync(tempPath, filePath);
  }

  private writeJsonIfMissing(filePath: string, data: unknown): void {
    if (!existsSync(filePath)) {
      this.writeJson(filePath, data);
    }
  }

  private async readFileOrEmpty(filePath: string): Promise<string> {
    if (!existsSync(filePath)) {
      return '';
    }

    return readFile(filePath, 'utf8');
  }

  private defaultSettings(): RuntimeSettings {
    return {
      taskName: this.initialConfig.taskName,
      agentCommand: this.initialConfig.agentCommand,
      agentCwd: this.initialConfig.agentCwd,
      promptFile: this.initialConfig.promptFile,
      promptBody: '',
      discordNotifyChannelId: this.initialConfig.discordNotifyChannelId,
      maxIterations: this.initialConfig.maxIterations,
      idleSeconds: this.initialConfig.idleSeconds,
      mode: this.initialConfig.mode,
      updatedAt: nowIso(),
      updatedBy: 'system',
      agentProfiles: [],
    };
  }

  private defaultStatus(): RunStatus {
    return buildDefaultStatus(this.initialConfig);
  }

  private defaultMeta(): StateMeta {
    return buildDefaultMeta();
  }

  private defaultRunReport(): RunReport {
    return buildDefaultRunReport();
  }
}
