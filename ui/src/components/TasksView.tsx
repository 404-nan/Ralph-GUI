import { useState } from 'react';

import type { DashboardData, TaskBoardItem } from '../../../src/shared/types.ts';
import { Card, EmptyState, ToneBadge } from './PanelPrimitives.tsx';
import {
  formatDateTime,
  laneLabel,
  laneTone,
  priorityLabel,
  priorityTone,
} from './mission-support.ts';

function TaskLane(props: {
  title: string;
  items: TaskBoardItem[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/75">
      <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-100">
        {props.title} <span className="text-slate-500">({props.items.length})</span>
      </div>
      <div className="space-y-2 p-3">
        {props.items.length > 0 ? props.items.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => props.onSelectTask(task.id)}
            className={`w-full rounded-2xl border px-3 py-3 text-left ${
              props.selectedTaskId === task.id
                ? 'border-sky-700 bg-sky-950/30'
                : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-slate-100">{task.id}</div>
                <div className="mt-1 truncate text-sm text-slate-300">{task.title}</div>
              </div>
              <ToneBadge label={priorityLabel(task.priority)} className={priorityTone(task.priority)} />
            </div>
            {task.blockedReason && <div className="mt-2 text-xs text-amber-300">{task.blockedReason}</div>}
          </button>
        )) : (
          <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-center text-sm text-slate-500">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

function TaskActionButton(props: {
  tone: 'neutral' | 'warning' | 'success';
  onClick: () => void;
  children: string;
}) {
  const classes = {
    neutral: 'border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-700 hover:bg-slate-900',
    warning: 'border-amber-700 bg-amber-950 text-amber-100 hover:bg-amber-900',
    success: 'border-emerald-700 bg-emerald-950 text-emerald-100 hover:bg-emerald-900',
  } as const;

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-xl border px-3 py-2 text-sm font-medium ${classes[props.tone]}`}
    >
      {props.children}
    </button>
  );
}

export function TasksView(props: {
  dashboard: DashboardData;
  selectedTask?: TaskBoardItem;
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onCreateTask: () => void;
  onEditTask: (task: TaskBoardItem) => void;
  onMoveTop: (task: TaskBoardItem) => void;
  onMoveUp: (task: TaskBoardItem) => void;
  onMoveDown: (task: TaskBoardItem) => void;
  onBlock: (task: TaskBoardItem) => void;
  onUnblock: (task: TaskBoardItem) => void;
  onComplete: (task: TaskBoardItem) => void;
  onReopen: (task: TaskBoardItem) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const task = props.selectedTask;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-slate-100">Task Board</div>
            <div className="text-sm text-slate-500">今触る task を先に見せて、他は後ろに隠します。</div>
          </div>
          <button
            type="button"
            onClick={props.onCreateTask}
            className="rounded-2xl border border-sky-700 bg-sky-950 px-4 py-3 text-sm font-medium text-sky-100 hover:bg-sky-900"
          >
            新規 task
          </button>
        </div>

        <TaskLane
          title="Current"
          items={props.dashboard.currentTask ? [props.dashboard.currentTask] : []}
          selectedTaskId={props.selectedTaskId}
          onSelectTask={props.onSelectTask}
        />
        <TaskLane
          title="Next"
          items={props.dashboard.nextTasks}
          selectedTaskId={props.selectedTaskId}
          onSelectTask={props.onSelectTask}
        />
        <TaskLane
          title="Blocked"
          items={props.dashboard.blockedTasks}
          selectedTaskId={props.selectedTaskId}
          onSelectTask={props.onSelectTask}
        />
        <TaskLane
          title="Done"
          items={props.dashboard.doneTasks}
          selectedTaskId={props.selectedTaskId}
          onSelectTask={props.onSelectTask}
        />
      </div>

      <div>
        {task ? (
          <Card
            title={`${task.id} • ${task.title}`}
            subtitle={task.summary || 'No summary'}
            actions={
              <div className="flex flex-wrap gap-2">
                <TaskActionButton tone="neutral" onClick={() => props.onEditTask(task)}>
                  編集
                </TaskActionButton>
                {task.displayStatus === 'blocked' ? (
                  <TaskActionButton tone="warning" onClick={() => props.onUnblock(task)}>
                    Unblock
                  </TaskActionButton>
                ) : (
                  <TaskActionButton tone="warning" onClick={() => props.onBlock(task)}>
                    Block
                  </TaskActionButton>
                )}
                {task.displayStatus === 'done' ? (
                  <TaskActionButton tone="neutral" onClick={() => props.onReopen(task)}>
                    Reopen
                  </TaskActionButton>
                ) : (
                  <TaskActionButton tone="success" onClick={() => props.onComplete(task)}>
                    Complete
                  </TaskActionButton>
                )}
              </div>
            }
          >
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <ToneBadge label={laneLabel(task.displayStatus)} className={laneTone(task.displayStatus)} />
                <ToneBadge label={priorityLabel(task.priority)} className={priorityTone(task.priority)} />
                {task.agentId && <ToneBadge label={`agent: ${task.agentId}`} className="border-violet-800 bg-violet-950/70 text-violet-100" />}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">やること</div>
                <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                  {task.summary || 'No summary'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">完了条件</div>
                {task.acceptanceCriteria.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {task.acceptanceCriteria.map((criterion) => (
                      <div key={criterion} className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">
                        {criterion}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-slate-500">Criteria is empty.</div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">状態</div>
                <div className="mt-2 text-sm text-slate-300">
                  {task.blockedReason ? `Blocked: ${task.blockedReason}` : 'Not blocked'}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {task.notes || 'No notes'}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced((current) => !current)}
                className="rounded-2xl border border-slate-800 px-4 py-3 text-left text-sm text-slate-300 hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="font-medium text-slate-100">
                  {showAdvanced ? '詳細を隠す' : '詳細を表示'}
                </div>
                <div className="mt-1 text-slate-500">
                  並び替えや時刻情報をまとめています。
                </div>
              </button>

              {showAdvanced && (
                <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap gap-2">
                    {task.displayStatus !== 'done' && (
                      <>
                        <TaskActionButton tone="neutral" onClick={() => props.onMoveTop(task)}>
                          Current にする
                        </TaskActionButton>
                        <TaskActionButton tone="neutral" onClick={() => props.onMoveUp(task)}>
                          Move up
                        </TaskActionButton>
                        <TaskActionButton tone="neutral" onClick={() => props.onMoveDown(task)}>
                          Move down
                        </TaskActionButton>
                      </>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Created</div>
                      <div className="mt-2 text-sm text-slate-300">{formatDateTime(task.createdAt)}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Updated</div>
                      <div className="mt-2 text-sm text-slate-300">{formatDateTime(task.updatedAt)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <EmptyState title="Task を選択してください" detail="左側の board から 1 件選ぶと詳細と操作が表示されます。" />
        )}
      </div>
    </div>
  );
}
