import type {
  ArtifactView,
  DecisionView,
  EventRecord,
  QuestionRecord,
  RunMode,
} from '../shared/types.ts';

export interface ModelLabelInfo {
  label: string;
  detail: string;
}

export function detectModelLabel(agentCommand: string, mode: RunMode): ModelLabelInfo {
  if (mode === 'demo') {
    return { label: 'デモ', detail: 'デモ用エージェントを使用しています' };
  }

  const explicit =
    agentCommand.match(/(?:--model|-m)\s+(['"]?)([^\s'"]+)\1/)?.[2]
    ?? agentCommand.match(/\b(gpt-[\w.-]+|o\d[\w.-]*|claude-[\w.-]+|gemini-[\w.-]+|llama[\w.-]*)\b/i)?.[1];
  if (explicit) {
    return { label: explicit, detail: '実行コマンドから判別しました' };
  }

  if (agentCommand.includes('codex')) {
    return { label: 'Codex (既定)', detail: 'Codex CLI の既定モデルを使用します' };
  }

  if (agentCommand.includes('claude')) {
    return { label: 'Claude (既定)', detail: 'Claude CLI の既定モデルを使用します' };
  }

  if (agentCommand.includes('gemini')) {
    return { label: 'Gemini (既定)', detail: 'Gemini CLI の既定モデルを使用します' };
  }

  return {
    label: 'コマンド指定',
    detail: 'モデル名はコマンドから判別できませんでした',
  };
}

export function buildPendingDecisions(questions: QuestionRecord[]): DecisionView[] {
  return questions.map((question) => ({
    id: question.id,
    title: question.text,
    status: question.status,
    recommendedAnswer: 'おすすめの方針で進めてください',
    fallbackAnswer: 'いったん安全な案で進めて、必要ならあとで調整してください',
    createdAt: question.createdAt,
    source: question.source,
    choices: [
      {
        id: 'recommended',
        label: 'おすすめで進める',
        kind: 'answer',
        answer: 'おすすめの方針で進めてください',
      },
      {
        id: 'later',
        label: 'あとで決める',
        kind: 'answer',
        answer: 'いったん安全な案で進めて、必要ならあとで調整してください',
      },
      {
        id: 'custom',
        label: '内容を書いて答える',
        kind: 'custom',
      },
    ],
  }));
}

export function buildArtifacts(events: EventRecord[]): ArtifactView[] {
  return events.flatMap((event) => {
    const message = String(event.message || '');
    const summary = message.includes(':') ? message.slice(message.indexOf(':') + 1).trim() : message;

    if (['agent.thinking', 'agent.status', 'agent.output', 'run.requested', 'question.created', 'blocker.created'].includes(event.type)) {
      return [];
    }

    if (event.type === 'task.completed') {
      return [{ id: event.id, title: 'やることが完了しました', summary, tone: 'success', timestamp: event.timestamp }];
    }
    if (event.type === 'task.created') {
      return [{ id: event.id, title: 'やることを追加しました', summary, tone: 'info', timestamp: event.timestamp }];
    }
    if (event.type === 'task.imported') {
      return [{ id: event.id, title: 'やることをまとめて追加しました', summary: message, tone: 'success', timestamp: event.timestamp }];
    }
    if (event.type === 'task.reordered') {
      return [{ id: event.id, title: '順番を整えました', summary, tone: 'info', timestamp: event.timestamp }];
    }
    if (event.type === 'task.updated') {
      return [{ id: event.id, title: 'やることを更新しました', summary, tone: 'info', timestamp: event.timestamp }];
    }
    if (event.type === 'run.started') {
      return [{ id: event.id, title: '作業を始めました', summary: message, tone: 'info', timestamp: event.timestamp }];
    }
    if (event.type === 'run.completed') {
      return [{ id: event.id, title: '作業が完了しました', summary: message, tone: 'success', timestamp: event.timestamp }];
    }
    if (event.type === 'run.pause') {
      return [{ id: event.id, title: '作業を止めています', summary: 'いつでも再開できます', tone: 'warning', timestamp: event.timestamp }];
    }
    if (event.type === 'run.resume') {
      return [{ id: event.id, title: '作業を再開しました', summary: '続きから進めます', tone: 'info', timestamp: event.timestamp }];
    }
    if (event.type === 'run.error') {
      return [{ id: event.id, title: '作業が止まりました', summary: message, tone: 'warning', timestamp: event.timestamp }];
    }
    if (event.type === 'note.enqueued') {
      return [{ id: event.id, title: '伝えた内容を受け取りました', summary: '次のターンに反映します', tone: 'info', timestamp: event.timestamp }];
    }
    if (event.type === 'settings.updated') {
      return [{ id: event.id, title: '設定を更新しました', summary: '次の作業から反映されます', tone: event.level === 'warning' ? 'warning' : 'info', timestamp: event.timestamp }];
    }

    return [];
  });
}

