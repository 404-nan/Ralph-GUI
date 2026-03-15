import type {
  BlockerRecord,
  OrchestrationSnapshot,
  PromptInjectionItem,
  QuestionRecord,
  RunStatus,
  TaskBoardItem,
  TaskRecord,
} from '../shared/types.ts';

const PRIORITY_WEIGHT: Record<TaskRecord['priority'], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sortTasks(tasks: TaskRecord[]): TaskRecord[] {
  return [...tasks].sort((left, right) => {
    const orderDelta = left.sortIndex - right.sortIndex;
    if (orderDelta !== 0) {
      return orderDelta;
    }

    const priorityDelta = PRIORITY_WEIGHT[left.priority] - PRIORITY_WEIGHT[right.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return left.id.localeCompare(right.id);
  });
}

export function deriveMaxIntegration(taskCount: number): number {
  if (taskCount <= 0) {
    return 1;
  }

  return clamp(Math.ceil(taskCount / 3) + 1, 2, 6);
}

export interface BuildOrchestrationInput {
  status: RunStatus;
  tasks: TaskRecord[];
  pendingQuestions: QuestionRecord[];
  blockers: BlockerRecord[];
  promptInjectionQueue: PromptInjectionItem[];
}

export function buildOrchestrationSnapshot(
  input: BuildOrchestrationInput,
): OrchestrationSnapshot {
  const sortedTasks = sortTasks(input.tasks);
  const unfinishedTasks = sortedTasks.filter((task) => task.status !== 'completed');
  const maxIntegration = deriveMaxIntegration(unfinishedTasks.length || sortedTasks.length);
  const pendingTasks = unfinishedTasks.filter((task) => task.status === 'pending');
  const activeIds = new Set(pendingTasks.slice(0, maxIntegration).map((task) => task.id));

  const taskBoard: TaskBoardItem[] = sortedTasks.map((task) => {
    const displayStatus =
      task.status === 'completed'
        ? 'completed'
        : task.status === 'blocked'
          ? 'blocked'
          : activeIds.has(task.id)
            ? 'active'
            : 'queued';

    return {
      ...task,
      displayStatus,
    };
  });

  const activeTasks = taskBoard.filter((task) => task.displayStatus === 'active');
  const queuedTasks = taskBoard.filter((task) => task.displayStatus === 'queued');
  const completedTasks = taskBoard.filter((task) => task.displayStatus === 'completed');

  const thinkingFrames = [
    input.status.thinkingText || input.status.currentStatusText || 'Ralph が Task の流れを組み直しています。',
    `${activeTasks.length} 件進行中、${queuedTasks.length} 件待機、${completedTasks.length} 件完了です。`,
    `MaxIntegration は ${unfinishedTasks.length || sortedTasks.length} 件のTaskから ${maxIntegration} に決まっています。`,
  ];

  if (input.pendingQuestions.length > 0) {
    thinkingFrames.push(
      `${input.pendingQuestions.length} 件の回答待ちがありますが、止まらず進めています。`,
    );
  }

  if (input.promptInjectionQueue.length > 0) {
    thinkingFrames.push(
      `${input.promptInjectionQueue.length} 件の差し込み情報を次のターンに回します。`,
    );
  }

  if (input.blockers.length > 0) {
    thinkingFrames.push(
      `${input.blockers.length} 件の要対応を可視化しつつ、全体は止めていません。`,
    );
  }

  return {
    maxIntegration,
    totalTaskCount: taskBoard.length,
    activeTaskCount: activeTasks.length,
    completedTaskCount: completedTasks.length,
    queuedTaskCount: queuedTasks.length,
    taskBoard,
    thinkingFrames: [...new Set(thinkingFrames.filter(Boolean))],
  };
}
