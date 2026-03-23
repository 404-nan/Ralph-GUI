import {
  ListTodo,
  Pause,
  Play,
  RefreshCcw,
  Send,
  Settings2,
  ShieldAlert,
  Sparkles,
  Square,
  TerminalSquare,
  Waypoints,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import type {
  DashboardData,
  DecisionView,
  ImportedTaskDraft,
  QuickTestResult,
  TaskBoardItem,
  TaskImportPreview,
} from '../../../src/shared/types.ts';
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
  validateSettingsDraft,
  validateTaskDraft,
  type SettingsDraft,
  type TaskEditorDraft,
  type View,
} from './mission-support.ts';
import { SetupView } from './SetupView.tsx';
import { TaskEditorModal } from './TaskEditorModal.tsx';
import { TasksView } from './TasksView.tsx';
import { TimelineView } from './TimelineView.tsx';
import { ToastContainer } from './Toast.tsx';

function SummaryPill(props: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className={`rounded-full border px-3 py-2 text-sm ${props.tone ?? 'border-slate-800 bg-slate-950/80 text-slate-200'}`}>
      <span className="text-slate-500">{props.label}</span>
      <span className="ml-2 font-medium text-slate-100">{props.value}</span>
    </div>
  );
}

function NavButton(props: {
  label: string;
  icon: ReactNode;
  active: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-current={props.active ? 'page' : undefined}
      className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium ${
        props.active
          ? 'border-sky-700 bg-sky-950/50 text-sky-100'
          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      {props.icon}
      <span>{props.label}</span>
      {props.badge && (
        <span className={`rounded-full border px-2 py-0.5 text-[11px] ${
          props.active
            ? 'border-sky-700/80 bg-sky-950/80 text-sky-100'
            : 'border-slate-700 bg-slate-950 text-slate-400'
        }`}
        >
          {props.badge}
        </span>
      )}
    </button>
  );
}

function NotesView(props: {
  dashboard: DashboardData;
  noteText: string;
  busy: boolean;
  onChangeNoteText: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
      <Card
        title="メモを送る"
        subtitle="AI に追加で伝えたいことだけを短く渡します。"
      >
        <textarea
          value={props.noteText}
          onChange={(event) => props.onChangeNoteText(event.target.value)}
          rows={8}
          className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
          placeholder="例: まず WebPanel を最小機能で整理してから細部を詰める。"
        />
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={props.onSubmit}
            disabled={props.busy}
            className="inline-flex items-center gap-2 rounded-2xl border border-sky-700 bg-sky-950 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            送信
          </button>
        </div>
      </Card>

      <Card
        title="送信待ちキュー"
        subtitle="次のターンで AI に渡されるメモや回答だけを表示します。"
      >
        {props.dashboard.promptInjectionQueue.length > 0 ? (
          <div className="space-y-3">
            {props.dashboard.promptInjectionQueue.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.kind}</div>
                <div className="mt-1 text-sm font-medium text-slate-100">{item.label}</div>
                <div className="mt-2 text-sm text-slate-400">{item.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="キューは空です"
            detail="送信したメモや回答はここで確認できます。"
          />
        )}
      </Card>
    </div>
  );
}

export function AppShell() {
  const { data: dashboard, refresh, isConnected, errorMessage } = useDashboard();
  const { toasts, addToast, removeToast } = useToast();

  const [view, setView] = useState<View>('mission');
  const [notesOpen, setNotesOpen] = useState(false);
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
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

  useEffect(() => {
    if (view === 'import' || view === 'timeline') {
      setUtilitiesOpen(true);
    }
  }, [view]);

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
  const canAbort =
    ['starting', 'running', 'pause_requested', 'paused'].includes(controlState)
    || dashboard.status.phase === 'queued';
  const busy = (key: string) => busyKey === key;
  const utilityViewActive = view === 'import' || view === 'timeline';

  const withAction = async <T,>(
    key: string,
    action: () => Promise<T>,
    options: {
      successMessage?: string;
      refreshAfter?: boolean;
      onSuccess?: (result: T) => void;
    } = {},
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

  const handleImportTextChange = (value: string) => {
    setImportText(value);
    setImportPreview(null);
    setReviewDrafts([]);
  };

  const saveTask = async () => {
    const validationMessage = validateTaskDraft(taskDraft);
    if (validationMessage) {
      addToast(validationMessage, 'error');
      return;
    }

    const payload = draftToTaskInput(taskDraft);
    const task = editingTaskId
      ? dashboard.taskBoard.find((item) => item.id === editingTaskId) ?? null
      : null;
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

  const saveSettings = async () => {
    const validationMessage = validateSettingsDraft(settingsDraft);
    if (validationMessage) {
      addToast(validationMessage, 'error');
      return;
    }

    await withAction('settings-save', () => apiClient.updateSettings(settingsDraft), {
      successMessage: '設定を保存しました',
      onSuccess: () => setSettingsDirty(false),
    });
  };

  const saveSettingsAndQuickTest = async () => {
    const validationMessage = validateSettingsDraft(settingsDraft);
    if (validationMessage) {
      addToast(validationMessage, 'error');
      return;
    }

    await withAction(
      'settings-save-quick-test',
      async () => {
        await apiClient.updateSettings(settingsDraft);
        return apiClient.quickTestSettings();
      },
      {
        refreshAfter: false,
        successMessage: '設定を保存して接続テストを実行しました',
        onSuccess: (result) => {
          setSettingsDirty(false);
          setQuickTestResult(result);
        },
      },
    );
  };

  const requestCompleteTask = (task: TaskBoardItem) => {
    const warnings: string[] = [];
    if (task.acceptanceCriteria.length === 0) {
      warnings.push('完了条件が空です。');
    }
    if (task.blockedReason) {
      warnings.push('blocked 理由が残っています。');
    }
    if (dashboard.pendingDecisions.length > 0) {
      warnings.push(`未回答の判断が ${dashboard.pendingDecisions.length} 件あります。`);
    }

    const message = warnings.length > 0
      ? `${task.id} を完了にしますか？\n\n注意:\n- ${warnings.join('\n- ')}`
      : `${task.id} を完了にしますか？`;
    if (!window.confirm(message)) {
      return;
    }

    void withAction('task-complete', () => apiClient.completeTask(task.id), {
      successMessage: `${task.id} を完了にしました`,
    });
  };

  const unselectDuplicateDrafts = () => {
    if (!importPreview) {
      return;
    }

    const duplicateIndexes = new Set<number>();
    for (const group of importPreview.duplicateGroups) {
      for (const index of group.indexes.slice(1)) {
        duplicateIndexes.add(index);
      }
    }

    setReviewDrafts((current) => current.map((draft, index) => (
      duplicateIndexes.has(index)
        ? { ...draft, selected: false }
        : draft
    )));
    addToast('重複候補の後ろ側を外しました', 'success');
  };

  const applySplitSuggestions = () => {
    if (!importPreview || importPreview.splitSuggestions.length === 0) {
      return;
    }

    setReviewDrafts((current) => {
      const next = [...current];
      for (const suggestion of importPreview.splitSuggestions) {
        if (next[suggestion.index]) {
          next[suggestion.index] = { ...next[suggestion.index], selected: false };
        }
        next.push(...suggestion.suggestions.map((item) => ({ ...item, selected: true })));
      }
      return next;
    });
    addToast('分割案を下書きへ追加しました', 'success');
  };

  const primaryNavItems: Array<{ id: View; label: string; icon: ReactNode; badge?: string }> = [
    { id: 'mission', label: '実行', icon: <Waypoints className="h-4 w-4" />, badge: dashboard.currentTask?.id },
    { id: 'tasks', label: 'タスク', icon: <ListTodo className="h-4 w-4" />, badge: String(dashboard.taskBoard.length) },
    { id: 'setup', label: '設定', icon: <Settings2 className="h-4 w-4" />, badge: setupRequired ? String(dashboard.setupDiagnostics.summary.error) : undefined },
  ];
  const utilityNavItems: Array<{ id: View; label: string; icon: ReactNode }> = [
    { id: 'import', label: '取り込み', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'timeline', label: 'ログ', icon: <TerminalSquare className="h-4 w-4" /> },
  ];

  const toggleUtilities = () => {
    if (utilitiesOpen && utilityViewActive) {
      setView('mission');
      setUtilitiesOpen(false);
      return;
    }
    setUtilitiesOpen((current) => !current);
  };

  return (
    <div className="min-h-screen bg-[#05070c] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.08),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(34,197,94,0.06),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.35),_transparent_30%)]" />

      <div className="relative mx-auto max-w-[1320px] px-4 py-4 sm:px-6 sm:py-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-sky-800 bg-sky-950/60 p-3 text-sky-100">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-slate-100">{dashboard.settings.taskName || 'Ralph Control'}</h1>
                  <div className="mt-1 text-sm text-slate-400">
                    今動かすために必要な情報だけを先に見せる画面です。
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-300">
                {dashboard.status.thinkingText || dashboard.status.currentStatusText || dashboard.runReason}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canStart && (
                <button
                  type="button"
                  onClick={() => void withAction('run-start', () => apiClient.startRun(), { successMessage: 'run を開始キューへ追加しました' })}
                  disabled={busy('run-start')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-700 bg-emerald-950 px-4 py-3 text-sm font-medium text-emerald-100 hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  開始
                </button>
              )}
              {canPause && (
                <button
                  type="button"
                  onClick={() => void withAction('run-pause', () => apiClient.pauseRun(), { successMessage: 'pause を要求しました' })}
                  disabled={busy('run-pause')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-700 bg-amber-950 px-4 py-3 text-sm font-medium text-amber-100 hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pause className="h-4 w-4" />
                  一時停止
                </button>
              )}
              {canResume && (
                <button
                  type="button"
                  onClick={() => void withAction('run-resume', () => apiClient.resumeRun(), { successMessage: 'run を再開しました' })}
                  disabled={busy('run-resume')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-sky-700 bg-sky-950 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  再開
                </button>
              )}
              {canAbort && (
                <button
                  type="button"
                  onClick={() => void withAction('run-abort', () => apiClient.abortRun(), { successMessage: 'abort を要求しました' })}
                  disabled={busy('run-abort')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-rose-700 bg-rose-950 px-4 py-3 text-sm font-medium text-rose-100 hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Square className="h-4 w-4" />
                  中止
                </button>
              )}
              <button
                type="button"
                onClick={() => void refresh().catch((error) => addToast(getErrorMessage(error), 'error'))}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-800 px-4 py-3 text-sm text-slate-300 hover:border-slate-700 hover:bg-slate-900"
              >
                <RefreshCcw className="h-4 w-4" />
                更新
              </button>
            </div>
          </div>

          {setupRequired && (
            <div className="mt-5 rounded-2xl border border-amber-800 bg-amber-950/50 px-4 py-3 text-sm text-amber-100">
              設定に未解決のエラーがあります。
              <button
                type="button"
                onClick={() => setView('setup')}
                className="ml-2 rounded-lg border border-amber-700 px-2 py-1 text-xs font-medium text-amber-100 hover:bg-amber-900"
              >
                設定を開く
              </button>
            </div>
          )}

          <div className="mt-5 space-y-3">
            <div>
              <div className="mb-2 text-sm font-medium text-slate-400">実行状態</div>
              <div className="flex flex-wrap gap-2">
                <SummaryPill label="状態" value={runStateLabel(dashboard.status.runState)} tone={runStateTone(dashboard.status.runState)} />
                <SummaryPill label="実行中" value={dashboard.currentTask?.id ?? 'none'} />
                <SummaryPill label="未回答" value={String(dashboard.status.pendingQuestionCount)} />
                <SummaryPill label="停止中" value={String(dashboard.blockedTasks.length + dashboard.blockers.length)} />
              </div>
            </div>
            <div>
              <div className="mb-2 text-sm font-medium text-slate-400">システム</div>
              <div className="flex flex-wrap gap-2">
                <SummaryPill label="タスク数" value={String(dashboard.taskBoard.length)} />
                <SummaryPill
                  label="接続"
                  value={isConnected ? 'WS' : 'Polling'}
                  tone={isConnected ? 'border-emerald-800 bg-emerald-950/60 text-emerald-100' : 'border-amber-800 bg-amber-950/60 text-amber-100'}
                />
                <SummaryPill label="更新" value={formatRelativeTime(dashboard.status.updatedAt)} />
              </div>
            </div>
          </div>
        </header>

        <section className="mt-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
          <nav aria-label="Panel views" className="flex flex-wrap items-center gap-2">
            {primaryNavItems.map((item) => (
              <NavButton
                key={item.id}
                label={item.label}
                icon={item.icon}
                active={view === item.id}
                badge={item.badge}
                onClick={() => {
                  setView(item.id);
                  setUtilitiesOpen(false);
                }}
              />
            ))}

            <button
              type="button"
              onClick={() => setNotesOpen((current) => !current)}
              aria-expanded={notesOpen}
              aria-controls="notes-panel"
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
                notesOpen
                  ? 'border-sky-700 bg-sky-950/50 text-sky-100'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <Send className="h-4 w-4" />
              メモ
            </button>

            <button
              type="button"
              onClick={toggleUtilities}
              aria-expanded={utilitiesOpen}
              aria-controls="utility-panel"
              className={`ml-auto inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
                utilitiesOpen || utilityViewActive
                  ? 'border-slate-700 bg-slate-900 text-slate-100'
                  : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              その他
            </button>
          </nav>

          {utilitiesOpen && (
            <div id="utility-panel" className="mt-3 border-t border-slate-800 pt-3">
              <div className="mb-2 text-sm font-medium text-slate-400">
                普段は隠しておく補助機能
              </div>
              <div className="flex flex-wrap gap-2">
                {utilityNavItems.map((item) => (
                  <NavButton
                    key={item.id}
                    label={item.label}
                    icon={item.icon}
                    active={view === item.id}
                    onClick={() => {
                      setUtilitiesOpen(true);
                      setView(item.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {notesOpen && (
          <section id="notes-panel" className="mt-4">
            <NotesView
              dashboard={dashboard}
              noteText={noteText}
              busy={busy('note-submit')}
              onChangeNoteText={setNoteText}
              onSubmit={() => {
                if (!noteText.trim()) {
                  addToast('メモを入力してください', 'error');
                  return;
                }
                void withAction('note-submit', () => apiClient.enqueueNote(noteText), {
                  successMessage: 'オペレーターノートを追加しました',
                  onSuccess: () => setNoteText(''),
                });
              }}
            />
          </section>
        )}

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
                    requestCompleteTask(currentTask);
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
              onComplete={requestCompleteTask}
              onReopen={(task) => void withAction('task-reopen', () => apiClient.reopenTask(task.id), { successMessage: `${task.id} を reopen しました` })}
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
              busySaveAndQuickTest={busy('settings-save-quick-test')}
              busyReset={busy('reset-state')}
              onChangeSettings={(patch) => {
                setSettingsDraft((current) => ({ ...current!, ...patch }));
                setSettingsDirty(true);
              }}
              onToggleAdvanced={() => setSetupAdvanced((current) => !current)}
              onSave={() => void saveSettings()}
              onSaveAndQuickTest={() => void saveSettingsAndQuickTest()}
              onReset={() => {
                if (!window.confirm('state を初期化します。task / 質問 / 回答 / メモ / inbox / 保存済み設定も消えます。実行中の run があれば停止させたうえで続行します。')) {
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

          {view === 'import' && (
            <ImportView
              importText={importText}
              importPreview={importPreview}
              reviewDrafts={reviewDrafts}
              busyPreview={busy('import-preview')}
              busyCommit={busy('import-commit')}
              onChangeImportText={handleImportTextChange}
              onPreview={() => {
                setImportPreview(null);
                setReviewDrafts([]);
                void withAction('import-preview', () => apiClient.previewTaskImport(importText), {
                  refreshAfter: false,
                  onSuccess: (result) => {
                    setImportPreview(result);
                    setReviewDrafts(result.drafts.map((draft) => ({ ...draft, selected: draft.selected ?? true })));
                  },
                });
              }}
              onCommit={() => {
                if (!importPreview?.previewToken) {
                  addToast('先に最新の下書きを作ってください', 'error');
                  return;
                }
                if (reviewDrafts.filter((draft) => draft.selected !== false).length === 0) {
                  addToast('少なくとも 1 件は選択してください', 'error');
                  return;
                }
                void withAction('import-commit', () => apiClient.importTasksFromSpec(importText, reviewDrafts, importPreview.previewToken), {
                  successMessage: 'preview から task を取り込みました',
                  onSuccess: () => {
                    setImportPreview(null);
                    setReviewDrafts([]);
                    setImportText('');
                    setView('tasks');
                    setUtilitiesOpen(false);
                  },
                });
              }}
              onChangeDraft={(index, patch) => setReviewDrafts((current) => current.map((draft, draftIndex) => draftIndex === index ? { ...draft, ...patch } : draft))}
              onUnselectDuplicates={unselectDuplicateDrafts}
              onApplySplitSuggestions={applySplitSuggestions}
            />
          )}

          {view === 'timeline' && <TimelineView dashboard={dashboard} />}
        </section>
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
