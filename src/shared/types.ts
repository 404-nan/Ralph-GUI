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

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type StoredTaskStatus = 'pending' | 'blocked' | 'completed';
export type DisplayTaskStatus = 'active' | 'queued' | 'blocked' | 'completed';

export interface RunStatus {
  runId: string;
  task: string;
  phase: string;
  lifecycle: RunLifecycleState;
  control: ControlState;
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
  maxIntegration: number;
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
  titleOverride?: string;
  summaryOverride?: string;
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

export interface TaskBoardItem extends TaskRecord {
  displayStatus: DisplayTaskStatus;
  laneId?: string;
}

export interface OrchestrationSnapshot {
  maxIntegration: number;
  totalTaskCount: number;
  activeTaskCount: number;
  completedTaskCount: number;
  queuedTaskCount: number;
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
}

export interface DashboardData {
  status: RunStatus;
  settings: RuntimeSettings;
  capabilities: {
    canEditAgentCommand: boolean;
  };
  currentTask?: TaskBoardItem;
  nextTask?: TaskBoardItem;
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
