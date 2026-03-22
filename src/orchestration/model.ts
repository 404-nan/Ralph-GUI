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

export function deriveMaxIntegration(): number {
  return 1;
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
  const pendingTasks = sortedTasks.filter((task) => task.status === 'pending');
  const blockedTasks = sortedTasks.filter((task) => task.status === 'blocked');
  const doneTasks = sortedTasks.filter((task) => task.status === 'completed');

  const currentTask = pendingTasks[0];
  const nextTasks = pendingTasks.slice(1);
  const maxIntegration = deriveMaxIntegration();

  const taskBoard: TaskBoardItem[] = [
    ...sortedTasks.map((task) => {
      let displayStatus: TaskBoardItem['displayStatus'] = 'next';
      if (task.status === 'completed') {
        displayStatus = 'done';
      } else if (task.status === 'blocked') {
        displayStatus = 'blocked';
      } else if (currentTask && task.id === currentTask.id) {
        displayStatus = 'current';
      }

      return {
        ...task,
        displayStatus,
      };
    }),
  ];

  const thinkingFrames = [
    input.status.thinkingText || input.status.currentStatusText || 'Ralph is preparing the next operator-visible step.',
  ];

  if (currentTask) {
    thinkingFrames.push(`現在のTaskは ${currentTask.id} / ${currentTask.title} です。`);
  } else if (blockedTasks.length > 0) {
    thinkingFrames.push('進められるTaskがなく、blocker 解消待ちです。');
  } else {
    thinkingFrames.push('未完了Taskはありません。新しい run を待っています。');
  }

  if (nextTasks.length > 0) {
    thinkingFrames.push(`${nextTasks.length} 件が next up queue に入っています。`);
  }

  if (input.pendingQuestions.length > 0) {
    thinkingFrames.push(`${input.pendingQuestions.length} 件の operator decision が pending です。`);
  }

  if (input.promptInjectionQueue.length > 0) {
    thinkingFrames.push(`${input.promptInjectionQueue.length} 件の note / answer が次ターンに投入されます。`);
  }

  if (input.blockers.length > 0) {
    thinkingFrames.push(`${input.blockers.length} 件の blocker を明示しつつ進行状況を保持しています。`);
  }

  return {
    maxIntegration,
    totalTaskCount: taskBoard.length,
    activeTaskCount: currentTask ? 1 : 0,
    blockedTaskCount: blockedTasks.length,
    completedTaskCount: doneTasks.length,
    queuedTaskCount: nextTasks.length,
    currentTask: taskBoard.find((task) => task.displayStatus === 'current'),
    nextTasks: taskBoard.filter((task) => task.displayStatus === 'next'),
    blockedTasks: taskBoard.filter((task) => task.displayStatus === 'blocked'),
    doneTasks: taskBoard.filter((task) => task.displayStatus === 'done'),
    taskBoard,
    thinkingFrames: [...new Set(thinkingFrames.filter(Boolean))],
  };
}
