import type {
  AgentProfile,
  ApiResponse,
  DashboardData,
  ImportedTaskDraft,
  QuickTestResult,
  RuntimeSettings,
  TaskImportPreview,
  TaskPriority,
  TaskRecord,
} from '../../../src/shared/types.ts';

const API_BASE = '/api';

export class ApiClientError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options: {
      code?: string;
      retryable?: boolean;
      details?: Record<string, unknown>;
    } = {},
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.code = options.code ?? 'api_error';
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

export interface TaskInput {
  title?: string;
  summary?: string;
  priority?: TaskPriority;
  acceptanceCriteria?: string[];
  notes?: string;
  blockedReason?: string;
  agentId?: string;
}

export interface ImportResult {
  preview: TaskImportPreview;
  tasks: TaskRecord[];
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  let payload: ApiResponse<T> | null = null;

  try {
    payload = await response.json() as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.ok === false) {
    const error = payload && payload.ok === false
      ? payload.error
      : {
          code: 'http_error',
          message: `Request failed with status ${response.status}.`,
        };

    throw new ApiClientError(error.message, {
      code: error.code,
      retryable: error.retryable,
      details: error.details,
    });
  }

  return payload.data;
}

export const apiClient = {
  getDashboard: () => request<DashboardData>('/dashboard'),
  getSession: () => request<{ token: string; expiresAt: string }>('/session'),
  startRun: () => request<{ started: boolean; status: DashboardData['status']; message: string }>('/start', { method: 'POST' }),
  pauseRun: () => request<DashboardData['status']>('/pause', { method: 'POST' }),
  resumeRun: () => request<DashboardData['status']>('/resume', { method: 'POST' }),
  abortRun: () => request<DashboardData['status']>('/abort', { method: 'POST' }),
  resetState: () => request<{ status: DashboardData['status'] }>('/reset', { method: 'POST' }),
  reconnectDiscord: () => request<{ ok: true }>('/discord/reconnect', { method: 'POST' }),
  quickTestSettings: () => request<QuickTestResult>('/settings/quick-test', { method: 'POST' }),

  updateSettings: (settings: Partial<RuntimeSettings>) =>
    request<RuntimeSettings>('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),

  submitAnswer: (questionId: string, answer: string) =>
    request('/answer', {
      method: 'POST',
      body: JSON.stringify({ questionId, answer }),
    }),

  enqueueNote: (note: string) =>
    request('/note', {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  previewTaskImport: (specText: string) =>
    request<TaskImportPreview>('/task/import/preview', {
      method: 'POST',
      body: JSON.stringify({ specText }),
    }),

  importTasksFromSpec: (specText: string, reviewedDrafts?: ImportedTaskDraft[]) =>
    request<ImportResult>('/task/import', {
      method: 'POST',
      body: JSON.stringify({ specText, reviewedDrafts }),
    }),

  createTask: (input: TaskInput) =>
    request<TaskRecord>('/task/create', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  updateTask: (taskId: string, updates: TaskInput) =>
    request<TaskRecord>('/task/update', {
      method: 'POST',
      body: JSON.stringify({ taskId, ...updates }),
    }),

  completeTask: (taskId: string) =>
    request<TaskRecord>('/task/complete', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),

  reopenTask: (taskId: string) =>
    request<TaskRecord>('/task/reopen', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),

  blockTask: (taskId: string, reason: string) =>
    request<TaskRecord>('/task/block', {
      method: 'POST',
      body: JSON.stringify({ taskId, reason }),
    }),

  unblockTask: (taskId: string) =>
    request<TaskRecord>('/task/unblock', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    }),

  moveTask: (
    taskId: string,
    position: 'top' | 'up' | 'down' | 'bottom' | 'front' | 'back',
  ) =>
    request<TaskRecord>('/task/move', {
      method: 'POST',
      body: JSON.stringify({ taskId, position }),
    }),

  updateAgentProfiles: (profiles: AgentProfile[]) =>
    request<RuntimeSettings>('/settings', {
      method: 'POST',
      body: JSON.stringify({ agentProfiles: profiles }),
    }),
};
