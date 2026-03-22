import { ListTodo, Pause, Play, RefreshCcw, Send, Settings2, ShieldAlert, Sparkles, Square, TerminalSquare, Waypoints } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import type { DecisionView, ImportedTaskDraft, QuickTestResult, TaskBoardItem, TaskImportPreview } from '../../../src/shared/types.ts';
import { apiClient } from '../api/client.ts';
import { useDashboard } from '../hooks/useDashboard.ts';
import { useToast } from '../hooks/useToast.ts';
import { ImportView } from './ImportView.tsx';
import { MissionView } from './MissionView.tsx';
import { Card, EmptyState } from './PanelPrimitives.tsx';
import {
  blankTaskDraft,
  draftToTaskInput,
  formatRelativeTime,
  getErrorMessage,
  runStateLabel,
  runStateTone,
  settingsToDraft,
  taskToDraft,
  type SettingsDraft,
  type TaskEditorDraft,
  type View,
} from './mission-support.ts';
import { SetupView } from './SetupView.tsx';
import { TaskEditorModal } from './TaskEditorModal.tsx';
import { TasksView } from './TasksView.tsx';
import { TimelineView } from './TimelineView.tsx';
import { ToastContainer } from './Toast.tsx';

export function AppShell() {
  const { data: dashboard, refresh, isConnected, errorMessage } = useDashboard();
  const { toasts, addToast, removeToast } = useToast();

  const [view, setView] = useState<View>('mission');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskEditorDraft>(blankTaskDraft());
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [decisionInputs, setDecisionInputs] = useState<Record<string, string>>({});
  const [noteText, setNoteText] = useState('');
  const [importText, setImportText] = useState('');
  const [importPreview, setImportPreview] = useState<TaskImportPreview | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<ImportedTaskDraft[]>([]);
  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft | null>(null);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [setupAdvanced, setSetupAdvanced] = useState(false);
  const [quickTestResult, setQuickTestResult] = useState<QuickTestResult | null>(null);

  useEffect(() => {
    if (!dashboard) {
      return;
    }

    if (!selectedTaskId || !dashboard.taskBoard.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(
        dashboard.currentTask?.id
        ?? dashboard.nextTasks[0]?.id
        ?? dashboard.blockedTasks[0]?.id
        ?? dashboard.doneTasks[0]?.id
        ?? null,
      );
    }

    if (!settingsDirty) {
      setSettingsDraft(settingsToDraft(dashboard.settings));
    }

    if (dashboard.setupDiagnostics.summary.error > 0 && dashboard.taskBoard.length === 0) {
      setView((current) => (current === 'mission' ? 'setup' : current));
    }
  }, [dashboard, selectedTaskId, settingsDirty]);

  if (!dashboard || !settingsDraft) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05070c] text-slate-100">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-8 py-7 text-center">
          <div className="text-base font-medium">Mission Control を準備中</div>
          <div className="mt-1 text-sm text-slate-500">dashboard / state / diagnostics を読み込んでいます。</div>
        </div>
      </div>
    );
  }

  const selectedTask =
    dashboard.taskBoard.find((task) => task.id === selectedTaskId)
    ?? dashboard.currentTask
    ?? dashboard.taskBoard[0];
  const setupRequired = dashboard.setupDiagnostics.summary.error > 0;
  const controlState = dashboard.status.lifecycle;
  const canStart = ['idle', 'completed', 'aborted', 'failed'].includes(controlState);
  const canPause = ['starting', 'running'].includes(controlState);
  const canResume = controlState === 'paused' || controlState === 'pause_requested';
  const canAbort = ['starting', 'running', 'pause_requested', 'paused'].includes(controlState) || dashboard.status.phase === 'queued';
  const busy = (key: string) => busyKey === key;

  const withAction = async <T,>(
    key: string,
    action: () => Promise<T>,
    options: { successMessage?: string; refreshAfter?: boolean; onSuccess?: (result: T) => void } = {},
  ): Promise<T | null> => {
    setBusyKey(key);
    try {
      const result = await action();
      options.onSuccess?.(result);
      if (options.refreshAfter !== false) {
        await refresh();
      }
      if (options.successMessage) {
        addToast(options.successMessage, 'success');
      }
      return result;
    } catch (error) {
      addToast(getErrorMessage(error), 'error');
      return null;
    } finally {
      setBusyKey((current) => (current === key ? null : current));
    }
  };

  const openCreateTask = () => {
    setEditingTaskId(null);
    setTaskDraft(blankTaskDraft());
    setEditorOpen(true);
  };

  const openEditTask = (task: TaskBoardItem) => {
    setEditingTaskId(task.id);
    setTaskDraft(taskToDraft(task));
    setEditorOpen(true);
  };

  const saveTask = async () => {
    const payload = draftToTaskInput(taskDraft);
    const task = editingTaskId ? dashboard.taskBoard.find((item) => item.id === editingTaskId) ?? null : null;
    const result = task
      ? await withAction('task-save', () => apiClient.updateTask(task.id, payload), {
        successMessage: `${task.id} を更新しました`,
        onSuccess: () => {
          setEditorOpen(false);
          setEditingTaskId(null);
        },
      })
      : await withAction('task-create', () => apiClient.createTask(payload), {
        successMessage: 'task を追加しました',
        onSuccess: (record) => {
          setSelectedTaskId(record.id);
          setEditorOpen(false);
        },
      });

    if (result) {
      setTaskDraft(blankTaskDraft());
    }
  };

  const submitDecision = async (decision: DecisionView, answer: string) => {
    if (!answer.trim()) {
      addToast('回答を入力してください', 'error');
      return;
    }

    await withAction(`decision-${decision.id}`, () => apiClient.submitAnswer(decision.id, answer), {
      successMessage: `${decision.id} に回答しました`,
      onSuccess: () => setDecisionInputs((current) => ({ ...current, [decision.id]: '' })),
    });
  };

  const navItems: Array<{ id: View; label: string; icon: ReactNode; badge?: string }> = [
    { id: 'mission', label: 'Mission Control', icon: <Waypoints className="h-4 w-4" />, badge: dashboard.currentTask?.id },
    { id: 'tasks', label: 'Tasks', icon: <ListTodo className="h-4 w-4" />, badge: String(dashboard.taskBoard.length) },
    { id: 'import', label: 'Import', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'setup', label: 'Setup', icon: <Settings2 className="h-4 w-4" />, badge: setupRequired ? String(dashboard.setupDiagnostics.summary.error) : undefined },
    { id: 'timeline', label: 'Timeline', icon: <TerminalSquare className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(34,197,94,0.06),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.35),_transparent_30%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1880px]">
        <aside className="w-[290px] border-r border-slate-900 bg-[#06090f] px-5 py-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-sky-800 bg-sky-950/60 p-3 text-sky-100"><ShieldAlert className="h-5 w-5" /></div>
              <div>
                <div className="text-lg font-semibold text-slate-100">Ralph Mission Control</div>
                <div className="text-sm text-slate-500">Operator-first single-active orchestration</div>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${runStateTone(dashboard.status.runState)}`}>{runStateLabel(dashboard.status.runState)}</span>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] ${isConnected ? 'border-emerald-800 bg-emerald-950/60 text-emerald-100' : 'border-amber-800 bg-amber-950/60 text-amber-100'}`}>{isConnected ? 'WS connected' : 'Polling'}</span>
              </div>
              <div className="mt-3 text-sm text-slate-300">{dashboard.runReason}</div>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                  view === item.id ? 'border-sky-700 bg-sky-950/40 text-sky-100' : 'border-slate-900 bg-transparent text-slate-300 hover:border-slate-800 hover:bg-slate-950/60'
                }`}
              >
                <span className="flex items-center gap-3 text-sm font-medium">{item.icon}{item.label}</span>
                {item.badge && <span className="rounded-full border border-slate-800 bg-slate-950 px-2 py-0.5 text-[11px] text-slate-400">{item.badge}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/75 p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Run summary</div>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Iteration</span><span>{dashboard.status.iteration}/{dashboard.status.maxIterations}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Questions</span><span>{dashboard.status.pendingQuestionCount} pending</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Blockers</span><span>{dashboard.blockedTasks.length + dashboard.blockers.length}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Changed files</span><span>{dashboard.runReport.changedFiles.length}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-slate-500">Last update</span><span>{formatRelativeTime(dashboard.status.updatedAt)}</span></div>
            </div>
          </div>
        </aside>

        <main className="flex-1 px-6 py-6">
          <header className="rounded-3xl border border-slate-800 bg-slate-950/80 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold text-slate-100">{dashboard.settings.taskName || 'Mission Run'}</h1>
                  {dashboard.currentTask && <span className="rounded-full border border-sky-700 bg-sky-950/60 px-2.5 py-1 text-xs text-sky-100">current: {dashboard.currentTask.id}</span>}
                </div>
                <div className="mt-2 text-sm text-slate-400">{dashboard.status.thinkingText || dashboard.status.currentStatusText || dashboard.runReason}</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {canStart && <button type="button" onClick={() => void withAction('run-start', () => apiClient.startRun(), { successMessage: 'run を開始キューへ追加しました' })} disabled={busy('run-start')} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-700 bg-emerald-950 px-4 py-3 text-sm font-medium text-emerald-100 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"><Play className="h-4 w-4" />Start</button>}
                {canPause && <button type="button" onClick={() => void withAction('run-pause', () => apiClient.pauseRun(), { successMessage: 'pause を要求しました' })} disabled={busy('run-pause')} className="inline-flex items-center gap-2 rounded-2xl border border-amber-700 bg-amber-950 px-4 py-3 text-sm font-medium text-amber-100 hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"><Pause className="h-4 w-4" />Pause</button>}
                {canResume && <button type="button" onClick={() => void withAction('run-resume', () => apiClient.resumeRun(), { successMessage: 'run を再開しました' })} disabled={busy('run-resume')} className="inline-flex items-center gap-2 rounded-2xl border border-sky-700 bg-sky-950 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"><RefreshCcw className="h-4 w-4" />Resume</button>}
                {canAbort && <button type="button" onClick={() => void withAction('run-abort', () => apiClient.abortRun(), { successMessage: 'abort を要求しました' })} disabled={busy('run-abort')} className="inline-flex items-center gap-2 rounded-2xl border border-rose-700 bg-rose-950 px-4 py-3 text-sm font-medium text-rose-100 hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-50"><Square className="h-4 w-4" />Abort</button>}
                <button type="button" onClick={() => void refresh().catch((error) => addToast(getErrorMessage(error), 'error'))} className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 px-4 py-3 text-sm text-slate-300 hover:border-slate-700 hover:bg-slate-900"><RefreshCcw className="h-4 w-4" />Refresh</button>
              </div>
            </div>
          </header>

          <section className="mt-6">
            {view === 'mission' && (
              <MissionView
                dashboard={dashboard}
                errorMessage={errorMessage}
                decisionInputs={decisionInputs}
                onSelectTask={(taskId) => {
                  setSelectedTaskId(taskId);
                  setView('tasks');
                }}
                onChangeDecisionInput={(decisionId, value) => setDecisionInputs((current) => ({ ...current, [decisionId]: value }))}
                onSubmitDecision={submitDecision}
                onEditCurrentTask={() => {
                  const currentTask = dashboard.currentTask;
                  if (currentTask) {
                    openEditTask(currentTask);
                  }
                }}
                onCompleteCurrentTask={() => {
                  const currentTask = dashboard.currentTask;
                  if (currentTask) {
                    void withAction('task-complete-current', () => apiClient.completeTask(currentTask.id), { successMessage: `${currentTask.id} を完了にしました` });
                  }
                }}
              />
            )}
            {view === 'tasks' && (
              <TasksView
                dashboard={dashboard}
                selectedTask={selectedTask}
                selectedTaskId={selectedTaskId}
                onSelectTask={setSelectedTaskId}
                onCreateTask={openCreateTask}
                onEditTask={openEditTask}
                onMoveTop={(task) => void withAction('task-move-top', () => apiClient.moveTask(task.id, 'top'), { successMessage: `${task.id} を current 側へ寄せました` })}
                onMoveUp={(task) => void withAction('task-move-up', () => apiClient.moveTask(task.id, 'up'), { successMessage: `${task.id} を前へ移動しました` })}
                onMoveDown={(task) => void withAction('task-move-down', () => apiClient.moveTask(task.id, 'down'), { successMessage: `${task.id} を後ろへ移動しました` })}
                onBlock={(task) => {
                  const reason = window.prompt('blocked reason を入力してください');
                  if (!reason?.trim()) {
                    return;
                  }
                  void withAction('task-block', () => apiClient.blockTask(task.id, reason), { successMessage: `${task.id} を block しました` });
                }}
                onUnblock={(task) => void withAction('task-unblock', () => apiClient.unblockTask(task.id), { successMessage: `${task.id} を unblock しました` })}
                onComplete={(task) => void withAction('task-complete', () => apiClient.completeTask(task.id), { successMessage: `${task.id} を完了にしました` })}
                onReopen={(task) => void withAction('task-reopen', () => apiClient.reopenTask(task.id), { successMessage: `${task.id} を reopen しました` })}
              />
            )}
            {view === 'import' && (
              <ImportView
                importText={importText}
                importPreview={importPreview}
                reviewDrafts={reviewDrafts}
                busyPreview={busy('import-preview')}
                busyCommit={busy('import-commit')}
                onChangeImportText={setImportText}
                onPreview={() => void withAction('import-preview', () => apiClient.previewTaskImport(importText), { refreshAfter: false, onSuccess: (result) => {
                  setImportPreview(result);
                  setReviewDrafts(result.drafts.map((draft) => ({ ...draft, selected: draft.selected ?? true })));
                } })}
                onCommit={() => {
                  if (reviewDrafts.filter((draft) => draft.selected !== false).length === 0) {
                    addToast('少なくとも 1 件は選択してください', 'error');
                    return;
                  }
                  void withAction('import-commit', () => apiClient.importTasksFromSpec(importText, reviewDrafts), {
                    successMessage: 'preview から task を取り込みました',
                    onSuccess: () => {
                      setImportPreview(null);
                      setReviewDrafts([]);
                      setImportText('');
                      setView('tasks');
                    },
                  });
                }}
                onChangeDraft={(index, patch) => setReviewDrafts((current) => current.map((draft, draftIndex) => draftIndex === index ? { ...draft, ...patch } : draft))}
              />
            )}
            {view === 'setup' && (
              <SetupView
                dashboard={dashboard}
                settingsDraft={settingsDraft}
                settingsDirty={settingsDirty}
                setupAdvanced={setupAdvanced}
                quickTestResult={quickTestResult}
                busySave={busy('settings-save')}
                busyQuickTest={busy('settings-quick-test')}
                busyReset={busy('reset-state')}
                onChangeSettings={(patch) => {
                  setSettingsDraft((current) => ({ ...current!, ...patch }));
                  setSettingsDirty(true);
                }}
                onToggleAdvanced={() => setSetupAdvanced((current) => !current)}
                onSave={() => void withAction('settings-save', () => apiClient.updateSettings(settingsDraft), { successMessage: '設定を保存しました', onSuccess: () => setSettingsDirty(false) })}
                onQuickTest={() => void withAction('settings-quick-test', () => apiClient.quickTestSettings(), { refreshAfter: false, successMessage: '接続テストを実行しました', onSuccess: (result) => setQuickTestResult(result) })}
                onReset={() => {
                  if (!window.confirm('state を初期化します。実行中の run があれば停止させたうえで続行します。')) {
                    return;
                  }
                  void withAction('reset-state', () => apiClient.resetState(), { successMessage: 'state を初期化しました' });
                }}
                onApplyPreset={(command, label) => {
                  setSettingsDraft((current) => ({ ...current!, agentCommand: command, mode: 'command' }));
                  setSettingsDirty(true);
                  addToast(`${label} preset を適用しました`, 'success');
                }}
              />
            )}
            {view === 'timeline' && <TimelineView dashboard={dashboard} />}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card title="Operator Notes" subtitle="Inject notes into the next turn without losing traceability.">
              <div className="flex gap-3">
                <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={4} className="flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700" placeholder="Example: prioritize the packaging fix before more UI work." />
                <button
                  type="button"
                  onClick={() => {
                    if (!noteText.trim()) {
                      addToast('メモを入力してください', 'error');
                      return;
                    }
                    void withAction('note-submit', () => apiClient.enqueueNote(noteText), { successMessage: 'オペレーターノートを追加しました', onSuccess: () => setNoteText('') });
                  }}
                  disabled={busy('note-submit')}
                  className="rounded-2xl border border-sky-700 bg-sky-950 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </Card>

            <Card title="Recent Human Inputs" subtitle="Queued answers and notes that will be injected into future turns.">
              {dashboard.promptInjectionQueue.length > 0 ? (
                <div className="space-y-2">
                  {dashboard.promptInjectionQueue.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.kind}</div>
                      <div className="mt-1 text-sm text-slate-100">{item.label}</div>
                      <div className="mt-1 text-sm text-slate-400">{item.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Queue は空です" detail="回答やノートを追加すると、次の prompt injection で使われます。" />
              )}
            </Card>
          </section>
        </main>
      </div>

      <TaskEditorModal
        open={editorOpen}
        task={editingTaskId ? dashboard.taskBoard.find((task) => task.id === editingTaskId) ?? null : null}
        draft={taskDraft}
        setDraft={setTaskDraft}
        agentProfiles={dashboard.agentProfiles}
        busy={busy('task-save') || busy('task-create')}
        onClose={() => setEditorOpen(false)}
        onSave={() => void saveTask()}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
