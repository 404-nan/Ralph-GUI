import type { BlockerRecord, QuestionRecord, RunStatus } from './types.ts';

export interface Notifier {
  notifyRunStarted(status: RunStatus): Promise<void>;
  notifyStatus(message: string): Promise<void>;
  notifyQuestion(question: QuestionRecord): Promise<void>;
  notifyBlocker(blocker: BlockerRecord): Promise<void>;
  notifyDone(message: string): Promise<void>;
  notifyRunAborted(reason: string): Promise<void>;
}

export class NoopNotifier implements Notifier {
  async notifyRunStarted(): Promise<void> {}
  async notifyStatus(): Promise<void> {}
  async notifyQuestion(): Promise<void> {}
  async notifyBlocker(): Promise<void> {}
  async notifyDone(): Promise<void> {}
  async notifyRunAborted(): Promise<void> {}
}

export class CompositeNotifier implements Notifier {
  private readonly notifiers: Notifier[];

  constructor(notifiers: Notifier[]) {
    this.notifiers = notifiers;
  }

  async notifyRunStarted(status: RunStatus): Promise<void> {
    await Promise.all(this.notifiers.map((notifier) => notifier.notifyRunStarted(status)));
  }

  async notifyStatus(message: string): Promise<void> {
    await Promise.all(this.notifiers.map((notifier) => notifier.notifyStatus(message)));
  }

  async notifyQuestion(question: QuestionRecord): Promise<void> {
    await Promise.all(this.notifiers.map((notifier) => notifier.notifyQuestion(question)));
  }

  async notifyBlocker(blocker: BlockerRecord): Promise<void> {
    await Promise.all(this.notifiers.map((notifier) => notifier.notifyBlocker(blocker)));
  }

  async notifyDone(message: string): Promise<void> {
    await Promise.all(this.notifiers.map((notifier) => notifier.notifyDone(message)));
  }

  async notifyRunAborted(reason: string): Promise<void> {
    await Promise.all(this.notifiers.map((notifier) => notifier.notifyRunAborted(reason)));
  }
}

export class ConsoleNotifier implements Notifier {
  async notifyRunStarted(status: RunStatus): Promise<void> {
    console.log(`[run.started] ${status.task} / mode=${status.mode} / iteration=${status.iteration}`);
  }

  async notifyStatus(message: string): Promise<void> {
    console.log(`[status] ${message}`);
  }

  async notifyQuestion(question: QuestionRecord): Promise<void> {
    console.log(`[question] ${question.id}: ${question.text}`);
  }

  async notifyBlocker(blocker: BlockerRecord): Promise<void> {
    console.log(`[blocker] ${blocker.id}: ${blocker.text}`);
  }

  async notifyDone(message: string): Promise<void> {
    console.log(`[done] ${message}`);
  }

  async notifyRunAborted(reason: string): Promise<void> {
    console.log(`[aborted] ${reason}`);
  }
}
