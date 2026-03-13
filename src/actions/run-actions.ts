import { readFileSync } from 'node:fs';

import type { AppConfig } from '../config.ts';
import { parseStructuredMarkers } from '../parser/markers.ts';
import { composePromptWithInjections } from '../prompt/composer.ts';
import { createRunId, nextSequentialId } from '../shared/id.ts';
import { nowIso } from '../shared/time.ts';
import type {
  AnswerRecord,
  DashboardData,
  EventRecord,
  MarkerMatch,
  PromptInjectionItem,
  QuestionRecord,
  RunStatus,
} from '../shared/types.ts';
import { FileStateStore } from '../state/store.ts';

export interface ActionActor {
  source: string;
}

export class RunActions {
  readonly store: FileStateStore;
  readonly config: AppConfig;

  constructor(store: FileStateStore, config: AppConfig) {
    this.store = store;
    this.config = config;
  }

  async getDashboardData(): Promise<DashboardData> {
    await this.importLocalInbox();

    const status = this.refreshStatusCounters();
    const questions = this.store.readQuestions();
    const answers = this.store.readAnswers();

    return {
      status,
      pendingQuestions: questions.filter((question) => question.status === 'pending'),
      answeredQuestions: questions
        .filter((question) => question.status === 'answered')
        .map((question) => ({
          ...question,
          answer: answers.find((answer) => answer.id === question.answerId),
        })),
      blockers: this.store.readBlockers().slice(-20).reverse(),
      promptInjectionQueue: this.listPromptInjectionQueue(),
      recentEvents: (await this.store.listRecentEvents(40)).reverse(),
      agentLogTail: (await this.store.readAgentOutputTail(80)).filter(Boolean),
    };
  }

  getStatus(): RunStatus {
    return this.refreshStatusCounters();
  }

  async pauseRun(actor: ActionActor): Promise<RunStatus> {
    const status = this.store.readStatus();
    status.control = 'paused';
    status.lifecycle = status.lifecycle === 'running' ? 'pause_requested' : 'paused';
    status.phase = 'paused';
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    await this.appendEvent('run.pause', 'warning', `${actor.source} が pause を要求しました`);
    return this.refreshStatusCounters();
  }

  async resumeRun(actor: ActionActor): Promise<RunStatus> {
    const status = this.store.readStatus();
    status.control = 'running';
    status.lifecycle = status.lifecycle === 'paused' ? 'running' : status.lifecycle;
    status.phase = 'running';
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    await this.appendEvent('run.resume', 'info', `${actor.source} が resume しました`);
    return this.refreshStatusCounters();
  }

  async abortRun(actor: ActionActor): Promise<RunStatus> {
    const status = this.store.readStatus();
    status.control = 'abort_requested';
    status.lifecycle = 'aborted';
    status.phase = 'aborted';
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);
    await this.appendEvent('run.abort', 'error', `${actor.source} が abort を要求しました`);
    return this.refreshStatusCounters();
  }

  async submitAnswer(questionId: string, answer: string, actor: ActionActor): Promise<AnswerRecord> {
    const questions = this.store.readQuestions();
    const answers = this.store.readAnswers();
    const timestamp = nowIso();
    const answerId = nextSequentialId(
      'A',
      answers.map((item) => item.id),
    );

    const record: AnswerRecord = {
      id: answerId,
      questionId,
      answer,
      createdAt: timestamp,
      source: actor.source,
    };

    answers.push(record);
    this.store.writeAnswers(answers);

    const question = questions.find((item) => item.id === questionId);
    if (question) {
      question.status = 'answered';
      question.answerId = record.id;
      question.answeredAt = timestamp;
      this.store.writeQuestions(questions);
    }

    await this.appendEvent(
      'question.answered',
      'info',
      `${questionId} に回答が追加されました`,
      { source: actor.source, answerId },
    );
    this.refreshStatusCounters();

    return record;
  }

  async enqueueManualNote(note: string, actor: ActionActor): Promise<void> {
    const notes = this.store.readManualNotes();
    const noteId = nextSequentialId(
      'N',
      notes.map((item) => item.id),
    );

    notes.push({
      id: noteId,
      note,
      createdAt: nowIso(),
      source: actor.source,
    });
    this.store.writeManualNotes(notes);
    await this.appendEvent('note.enqueued', 'info', `${actor.source} が手動ノートを投入しました`, {
      noteId,
    });
    this.refreshStatusCounters();
  }

  listPendingQuestions(): QuestionRecord[] {
    return this.store.readQuestions().filter((question) => question.status === 'pending');
  }

  listAnsweredQuestions(): Array<QuestionRecord & { answer?: AnswerRecord }> {
    const answers = this.store.readAnswers();
    return this.store
      .readQuestions()
      .filter((question) => question.status === 'answered')
      .map((question) => ({
        ...question,
        answer: answers.find((answer) => answer.id === question.answerId),
      }));
  }

  listPromptInjectionQueue(): PromptInjectionItem[] {
    const answers = this.store
      .readAnswers()
      .filter((answer) => !answer.injectedAt)
      .map((answer) => ({
        id: answer.id,
        kind: 'answer' as const,
        label: answer.questionId,
        text: answer.answer,
        createdAt: answer.createdAt,
      }));

    const notes = this.store
      .readManualNotes()
      .filter((note) => !note.injectedAt)
      .map((note) => ({
        id: note.id,
        kind: 'note' as const,
        label: note.id,
        text: note.note,
        createdAt: note.createdAt,
      }));

    return [...answers, ...notes].sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async preparePromptForNextTurn(): Promise<string> {
    await this.importLocalInbox();

    const basePrompt = readFileSync(this.config.promptFile, 'utf8');
    const answers = this.store.readAnswers();
    const notes = this.store.readManualNotes();
    const queuedAnswers = answers.filter((answer) => !answer.injectedAt);
    const queuedNotes = notes.filter((note) => !note.injectedAt);
    const result = composePromptWithInjections(basePrompt, queuedAnswers, queuedNotes);

    if (result.injectedAnswerIds.length > 0) {
      const injectedAt = nowIso();
      for (const answer of answers) {
        if (result.injectedAnswerIds.includes(answer.id)) {
          answer.injectedAt = injectedAt;
        }
      }
      this.store.writeAnswers(answers);
    }

    if (result.injectedNoteIds.length > 0) {
      const injectedAt = nowIso();
      for (const note of notes) {
        if (result.injectedNoteIds.includes(note.id)) {
          note.injectedAt = injectedAt;
        }
      }
      this.store.writeManualNotes(notes);
    }

    const status = this.refreshStatusCounters();
    status.lastPromptPreview = result.appendedSections.join('\n\n').slice(0, 1000);
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    return result.prompt;
  }

  async handleAgentOutput(output: string): Promise<{ done: boolean; markers: MarkerMatch[] }> {
    const markers = parseStructuredMarkers(output);
    let done = false;

    for (const marker of markers) {
      if (marker.kind === 'STATUS') {
        await this.recordAgentStatus(marker.content);
      }

      if (marker.kind === 'QUESTION') {
        await this.recordQuestion(marker.content);
      }

      if (marker.kind === 'BLOCKER') {
        await this.recordBlocker(marker.content);
      }

      if (marker.kind === 'DONE') {
        done = true;
        await this.markDone(marker.content || 'DONE marker received');
      }
    }

    if (markers.length === 0) {
      await this.appendEvent('agent.output', 'info', 'structured marker がない出力を受信しました');
    }

    return { done, markers };
  }

  async recordAgentStatus(message: string): Promise<void> {
    const status = this.store.readStatus();
    status.currentStatusText = message;
    status.phase = 'running';
    if (status.control === 'running') {
      status.lifecycle = 'running';
    }
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    await this.appendEvent('agent.status', 'info', message);
  }

  async recordQuestion(questionText: string, source: string = 'agent'): Promise<QuestionRecord> {
    const questions = this.store.readQuestions();
    const existingPending = questions.find(
      (question) => question.status === 'pending' && question.text === questionText,
    );
    if (existingPending) {
      return existingPending;
    }

    const questionId = nextSequentialId(
      'Q',
      questions.map((item) => item.id),
    );

    const question: QuestionRecord = {
      id: questionId,
      text: questionText,
      status: 'pending',
      createdAt: nowIso(),
      source,
    };

    questions.push(question);
    this.store.writeQuestions(questions);

    const status = this.store.readStatus();
    status.lastQuestionId = question.id;
    status.lastQuestionText = question.text;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    await this.appendEvent('question.created', 'warning', `${question.id}: ${question.text}`, {
      questionId: question.id,
    });
    this.refreshStatusCounters();

    return question;
  }

  async recordBlocker(blockerText: string, source: string = 'agent'): Promise<void> {
    const blockers = this.store.readBlockers();
    const blockerId = nextSequentialId(
      'B',
      blockers.map((item) => item.id),
    );

    blockers.push({
      id: blockerId,
      text: blockerText,
      createdAt: nowIso(),
      source,
    });
    this.store.writeBlockers(blockers);

    const status = this.store.readStatus();
    status.lastBlockerId = blockerId;
    status.lastBlockerText = blockerText;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);

    await this.appendEvent('blocker.created', 'error', `${blockerId}: ${blockerText}`, {
      blockerId,
    });
    this.refreshStatusCounters();
  }

  async markDone(message: string): Promise<void> {
    const status = this.store.readStatus();
    status.lifecycle = 'completed';
    status.control = 'running';
    status.phase = 'completed';
    status.currentStatusText = message;
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);
    await this.appendEvent('run.completed', 'info', message);
  }

  async markRunStarted(): Promise<RunStatus> {
    const status = this.store.readStatus();
    status.runId = createRunId();
    status.task = this.config.taskName;
    status.phase = 'starting';
    status.lifecycle = 'starting';
    status.control = 'running';
    status.startedAt = status.startedAt ?? nowIso();
    status.updatedAt = nowIso();
    status.agentCommand = this.config.agentCommand;
    status.mode = this.config.mode;
    status.promptFile = this.config.promptFile;
    status.maxIterations = this.config.maxIterations;
    this.store.writeStatus(status);
    await this.appendEvent('run.started', 'info', 'supervisor を開始しました', {
      mode: this.config.mode,
    });
    return this.refreshStatusCounters();
  }

  async updateIteration(iteration: number): Promise<RunStatus> {
    const status = this.store.readStatus();
    status.iteration = iteration;
    status.phase = status.control === 'paused' ? 'paused' : 'running';
    status.lifecycle = status.control === 'paused' ? 'paused' : 'running';
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    return this.refreshStatusCounters();
  }

  async markMaxIterationsReached(): Promise<void> {
    const status = this.store.readStatus();
    status.lifecycle = 'failed';
    status.phase = 'max_iterations_reached';
    status.currentStatusText = '最大反復回数に到達しました';
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);
    await this.appendEvent('run.max_iterations', 'warning', '最大反復回数に到達しました');
  }

  async markRuntimeError(error: unknown): Promise<void> {
    const status = this.store.readStatus();
    status.lifecycle = status.control === 'abort_requested' ? 'aborted' : 'failed';
    status.phase = status.lifecycle;
    status.lastError = error instanceof Error ? error.stack ?? error.message : String(error);
    status.finishedAt = nowIso();
    status.updatedAt = status.finishedAt;
    this.store.writeStatus(status);
    await this.appendEvent('run.error', 'error', 'supervisor でエラーが発生しました', {
      error: status.lastError,
    });
  }

  async appendAgentOutput(output: string, iteration: number): Promise<void> {
    const header = `\n=== iteration ${iteration} @ ${nowIso()} ===\n`;
    await this.store.appendAgentOutput(`${header}${output.trimEnd()}\n`);
  }

  private async importLocalInbox(): Promise<void> {
    const offsets = this.store.readInboxOffsets();
    const answerLines = await this.store.readAnswerInboxLines();
    const noteLines = await this.store.readNoteInboxLines();

    const newAnswerLines = answerLines
      .slice(offsets.answersLineOffset)
      .map((line) => line.trim())
      .filter(Boolean);
    const newNoteLines = noteLines
      .slice(offsets.notesLineOffset)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of newAnswerLines) {
      try {
        const payload = JSON.parse(line) as { questionId?: string; answer?: string };
        if (payload.questionId && payload.answer) {
          await this.submitAnswer(payload.questionId, payload.answer, { source: 'file' });
        }
      } catch {
        await this.appendEvent('file.answer.invalid', 'warning', `answer-inbox.jsonl の行を読み取れませんでした: ${line}`);
      }
    }

    for (const line of newNoteLines) {
      await this.enqueueManualNote(line, { source: 'file' });
    }

    if (newAnswerLines.length > 0 || newNoteLines.length > 0) {
      this.store.writeInboxOffsets({
        answersLineOffset: answerLines.length,
        notesLineOffset: noteLines.length,
      });
    }
  }

  private refreshStatusCounters(): RunStatus {
    const status = this.store.readStatus();
    const questions = this.store.readQuestions();
    const blockers = this.store.readBlockers();
    const queuedAnswers = this.store.readAnswers().filter((answer) => !answer.injectedAt).length;
    const queuedNotes = this.store.readManualNotes().filter((note) => !note.injectedAt).length;

    status.pendingQuestionCount = questions.filter((question) => question.status === 'pending').length;
    status.answeredQuestionCount = questions.filter((question) => question.status === 'answered').length;
    status.pendingInjectionCount = queuedAnswers + queuedNotes;
    status.blockerCount = blockers.length;
    status.updatedAt = nowIso();
    this.store.writeStatus(status);
    return status;
  }

  private async appendEvent(
    type: string,
    level: EventRecord['level'],
    message: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const recentEvents = await this.store.listRecentEvents(500);
    const eventId = nextSequentialId(
      'E',
      recentEvents.map((event) => event.id),
    );

    await this.store.appendEvent({
      id: eventId,
      timestamp: nowIso(),
      type,
      message,
      level,
      data,
    });
  }
}
