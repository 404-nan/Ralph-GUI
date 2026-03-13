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
  startedAt?: string;
  finishedAt?: string;
  updatedAt: string;
  agentCommand: string;
  mode: RunMode;
  promptFile: string;
  lastPromptPreview?: string;
  lastError?: string;
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

export interface DashboardData {
  status: RunStatus;
  pendingQuestions: QuestionRecord[];
  answeredQuestions: Array<QuestionRecord & { answer?: AnswerRecord }>;
  blockers: BlockerRecord[];
  promptInjectionQueue: PromptInjectionItem[];
  recentEvents: EventRecord[];
  agentLogTail: string[];
}

export interface MarkerMatch {
  kind: 'STATUS' | 'QUESTION' | 'BLOCKER' | 'DONE';
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
