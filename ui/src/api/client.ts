import type { 
  DashboardData, 
  RuntimeSettings,
  TaskRecord
} from '../../../src/shared/types.ts';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `API Error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  getDashboard: () => fetchJson<DashboardData>('/dashboard'),
  startRun: () => fetchJson('/start', { method: 'POST' }),
  pauseRun: () => fetchJson('/pause', { method: 'POST' }),
  resumeRun: () => fetchJson('/resume', { method: 'POST' }),
  abortRun: () => fetchJson('/abort', { method: 'POST' }),
  
  updateSettings: (settings: Partial<RuntimeSettings>) => 
    fetchJson('/settings', { method: 'POST', body: JSON.stringify(settings) }),
  
  submitAnswer: (questionId: string, answer: string) => 
    fetchJson('/answer', { method: 'POST', body: JSON.stringify({ questionId, answer }) }),
  
  enqueueNote: (note: string) => 
    fetchJson('/note', { method: 'POST', body: JSON.stringify({ note }) }),
    
  previewTaskImport: (specText: string) => 
    fetchJson('/task/import/preview', { method: 'POST', body: JSON.stringify({ specText }) }),
    
  importTasksFromSpec: (specText: string) => 
    fetchJson('/task/import', { method: 'POST', body: JSON.stringify({ specText }) }),
    
  createTask: (title: string, summary?: string) => 
    fetchJson<TaskRecord>('/task/create', { method: 'POST', body: JSON.stringify({ title, summary }) }),
    
  updateTask: (taskId: string, updates: { title?: string, summary?: string }) => 
    fetchJson<TaskRecord>('/task/update', { method: 'POST', body: JSON.stringify({ taskId, ...updates }) }),
    
  completeTask: (taskId: string) => 
    fetchJson<TaskRecord>('/task/complete', { method: 'POST', body: JSON.stringify({ taskId }) }),
    
  reopenTask: (taskId: string) => 
    fetchJson<TaskRecord>('/task/reopen', { method: 'POST', body: JSON.stringify({ taskId }) }),
    
  moveTask: (taskId: string, position: 'front' | 'back') => 
    fetchJson<TaskRecord>('/task/move', { method: 'POST', body: JSON.stringify({ taskId, position }) }),
};
