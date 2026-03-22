export const STATE_SCHEMA_VERSION = 2;

export type RunLifecycleState =
  | 'idle'
  | 'starting'
  | 'running'
  | 'paused'
  | 'pause_requested'
  | 'completed'
  | 'aborted'
  | 'failed';

export type ControlState = 'running' | 'paused' | 'abort_requested' | 'aborted';
export type RunMode = 'command' | 'demo';
export type RunState =
  | 'idle'
  | 'ready'
  | 'running'
  | 'paused'
  | 'blocked'
  | 'needs_review'
  | 'completed'
  | 'aborted'
  | 'failed';
export type RunTurnOutcome = 'ok' | 'non_zero_exit' | 'stuck' | 'aborted' | 'error';
export type TestStatus = 'not_run' | 'passed' | 'failed' | 'unknown';

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type StoredTaskStatus = 'pending' | 'blocked' | 'completed';
export type DisplayTaskStatus = 'current' | 'next' | 'blocked' | 'done';

export interface AgentProfile {
  id: string;
  label: string;
  command: string;
  description?: string;
}

export interface RunStatus {
  schemaVersion: number;
  runId: string;
  task: string;
  phase: string;
  lifecycle: RunLifecycleState;
  control: ControlState;
  runState: RunState;
  runReason: string;
  iteration: number;
  maxIterations: number;
  currentStatusText: string;
  lastQuestionId?: string;
  lastQuestionText?: string;
  lastBlockerId?: string;
  lastBlockerText?: string;
  pendingQuestionCount: number;
  answeredQuestionCount: number;
  pendingInjectionCount: number;
  blockerCount: number;
  totalTaskCount: number;
  activeTaskCount: number;
  completedTaskCount: number;
  queuedTaskCount: number;
  blockedTaskCount: number;
  maxIntegration: number;
  currentTaskId?: string;
  startedAt?: string;
  finishedAt?: string;
  updatedAt: string;
  agentCommand: string;
  mode: RunMode;
  promptFile: string;
  lastPromptPreview?: string;
  lastError?: string;
  thinkingText?: string;
}

export interface QuestionRecord {
  id: string;
  text: string;
  status: 'pending' | 'answered';
  createdAt: string;
  source: string;
  answerId?: string;
  answeredAt?: string;
  notifiedAt?: string;
}

export interface AnswerRecord {
  id: string;
  questionId: string;
  answer: string;
  createdAt: string;
  source: string;
  injectedAt?: string;
}

export interface ManualNoteRecord {
  id: string;
  note: string;
  createdAt: string;
  source: string;
  injectedAt?: string;
}

export interface BlockerRecord {
  id: string;
  text: string;
  createdAt: string;
  source: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  summary: string;
  priority: TaskPriority;
  sortIndex: number;
  status: StoredTaskStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  source: string;
  acceptanceCriteria: string[];
  notes?: string;
  blockedReason?: string;
  titleOverride?: string;
  summaryOverride?: string;
  agentId?: string;
}

export interface EventRecord {
  id: string;
  timestamp: string;
  type: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: Record<string, unknown>;
}

export interface PromptInjectionItem {
  id: string;
  kind: 'answer' | 'note';
  label: string;
  text: string;
  createdAt: string;
}

export interface DecisionChoiceView {
  id: string;
  label: string;
  kind: 'answer' | 'custom';
  answer?: string;
}

export interface DecisionView {
  id: string;
  title: string;
  status: 'pending' | 'answered';
  recommendedAnswer: string;
  fallbackAnswer: string;
  createdAt: string;
  source: string;
  choices: DecisionChoiceView[];
}

export interface ArtifactView {
  id: string;
  title: string;
  summary: string;
  tone: 'info' | 'success' | 'warning';
  timestamp: string;
}

export interface ResourceView {
  id: string;
  label: string;
  value: string;
  detail?: string;
  level: 'ok' | 'warning' | 'error';
}

export interface DashboardDiagnosticItem {
  key: string;
  level: 'ok' | 'warning' | 'error';
  message: string;
}

export interface SetupPresetView {
  id: string;
  label: string;
  command: string;
  description: string;
}

export interface SetupDiagnostics {
  ok: boolean;
  summary: {
    ok: number;
    warning: number;
    error: number;
  };
  items: DashboardDiagnosticItem[];
  presets: SetupPresetView[];
}

export interface TaskBoardItem extends TaskRecord {
  displayStatus: DisplayTaskStatus;
  laneId?: string;
}

export interface OrchestrationSnapshot {
  maxIntegration: number;
  totalTaskCount: number;
  activeTaskCount: number;
  blockedTaskCount: number;
  completedTaskCount: number;
  queuedTaskCount: number;
  currentTask?: TaskBoardItem;
  nextTasks: TaskBoardItem[];
  blockedTasks: TaskBoardItem[];
  doneTasks: TaskBoardItem[];
  taskBoard: TaskBoardItem[];
  thinkingFrames: string[];
}

export interface RuntimeSettings {
  taskName: string;
  agentCommand: string;
  agentCwd: string;
  promptFile: string;
  promptBody: string;
  discordNotifyChannelId: string;
  maxIterations: number;
  idleSeconds: number;
  mode: RunMode;
  updatedAt: string;
  updatedBy: string;
  agentProfiles: AgentProfile[];
}

export interface QuickTestResult {
  ok: boolean;
  summary: string;
  output: string[];
}

export interface RunTurnRecord {
  iteration: number;
  startedAt?: string;
  finishedAt: string;
  exitCode: number | null;
  signal: string | null;
  outcome: RunTurnOutcome;
  summary: string;
  doneSignalReceived: boolean;
}

export interface CompletionEvidence {
  signalReceived: boolean;
  criteriaTotal: number;
  criteriaMet: number;
  unresolvedBlockers: number;
  unresolvedDecisions: number;
  testsStatus: TestStatus;
  status: 'in_progress' | 'completed' | 'needs_review';
  message: string;
  pendingItems: string[];
}

export interface RunReport {
  schemaVersion: number;
  updatedAt: string;
  retryCount: number;
  retryBudget: number;
  stuckCount: number;
  currentTaskId?: string;
  lastCompletedTaskId?: string;
  lastTurn?: RunTurnRecord;
  changedFiles: string[];
  recentArtifacts: ArtifactView[];
  recentOutputs: string[];
  testSummary: string[];
  completion: CompletionEvidence;
}

export interface DashboardData {
  status: RunStatus;
  runReason: string;
  runReport: RunReport;
  settings: RuntimeSettings;
  setupDiagnostics: SetupDiagnostics;
  capabilities: {
    canEditAgentCommand: boolean;
    canQuickTestAgent: boolean;
  };
  currentTask?: TaskBoardItem;
  nextTask?: TaskBoardItem;
  nextTasks: TaskBoardItem[];
  blockedTasks: TaskBoardItem[];
  doneTasks: TaskBoardItem[];
  pendingQuestions: QuestionRecord[];
  pendingDecisions: DecisionView[];
  answeredQuestions: Array<QuestionRecord & { answer?: AnswerRecord }>;
  blockers: BlockerRecord[];
  promptInjectionQueue: PromptInjectionItem[];
  recentEvents: EventRecord[];
  artifacts: ArtifactView[];
  agentLogTail: string[];
  taskBoard: TaskBoardItem[];
  thinkingFrames: string[];
  agentProfiles: AgentProfile[];
}

export interface MarkerMatch {
  kind: 'STATUS' | 'QUESTION' | 'BLOCKER' | 'DONE' | 'THINKING' | 'TASK';
  content: string;
  raw: string;
  lineStart: number;
  lineEnd: number;
}

export interface PromptCompositionResult {
  prompt: string;
  injectedAnswerIds: string[];
  injectedNoteIds: string[];
  appendedSections: string[];
}

export interface StateMeta {
  schemaVersion: number;
  migratedAt: string;
}

export interface ImportedTaskDraft {
  title: string;
  summary: string;
  priority: TaskPriority;
  acceptanceCriteria: string[];
  notes?: string;
  selected?: boolean;
}

export interface TaskImportDuplicateGroup {
  key: string;
  indexes: number[];
  title: string;
}

export interface TaskImportSplitSuggestion {
  index: number;
  suggestions: ImportedTaskDraft[];
}

export interface TaskImportPreview {
  format: 'json' | 'list' | 'headings' | 'empty';
  drafts: ImportedTaskDraft[];
  duplicateGroups: TaskImportDuplicateGroup[];
  splitSuggestions: TaskImportSplitSuggestion[];
  truncated: boolean;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
}

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiErrorPayload;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
