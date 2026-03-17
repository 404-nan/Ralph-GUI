import type { AppConfig } from '../config.ts';
import type {
  ArtifactView,
  BlockerRecord,
  DashboardDiagnosticItem,
  DashboardLayers,
  DecisionView,
  EventRecord,
  PromptInjectionItem,
  QuestionRecord,
  RunMode,
  RunStatus,
  RuntimeSettings,
  TaskBoardItem,
} from '../shared/types.ts';

function basename(value: string): string {
  const normalized = value.replaceAll('\\', '/').split('/').filter(Boolean);
  return normalized.at(-1) ?? value;
}

function lifecycleLabel(value: RunStatus['lifecycle']): string {
  return {
    idle: '待機中',
    starting: '準備中',
    running: '作業中',
    paused: '一時停止',
    pause_requested: '停止を待っています',
    completed: '完了',
    aborted: '中断',
    failed: '要確認',
  }[value] ?? '待機中';
}

function modeLabel(value: RunMode): string {
  return value === 'demo' ? 'デモ' : '通常';
}

function findDiagnosticLevel(items: DashboardDiagnosticItem[], key: string): DashboardDiagnosticItem['level'] {
  return items.find((item) => item.key === key)?.level ?? 'ok';
}

export interface ModelLabelInfo {
  label: string;
  detail: string;
}

export interface BuildDashboardLayersInput {
  config: AppConfig;
  settings: RuntimeSettings;
  status: RunStatus;
  currentTask?: TaskBoardItem;
  nextTask?: TaskBoardItem;
  pendingDecisions: DecisionView[];
  blockers: BlockerRecord[];
  promptInjectionQueue: PromptInjectionItem[];
  diagnostics: DashboardDiagnosticItem[];
  model: ModelLabelInfo;
  canEditAgentCommand: boolean;
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

export function buildDashboardLayers(input: BuildDashboardLayersInput): DashboardLayers {
  const {
    config,
    settings,
    status,
    currentTask,
    nextTask,
    pendingDecisions,
    blockers,
    promptInjectionQueue,
    diagnostics,
    model,
    canEditAgentCommand,
  } = input;

  const panelUrl = `http://${config.panelHost}:${config.panelPort}`;
  const promptSource = settings.promptBody.trim() ? '[画面からの追加指示]' : settings.promptFile || '(未設定)';

  return {
    surface: {
      projectName: basename(settings.agentCwd),
      projectPath: settings.agentCwd,
      modelLabel: model.label,
      modelDetail: model.detail,
    },
    control: {
      run: {
        runId: status.runId || '未開始',
        requestLabel: status.task || 'まだ設定されていません',
        lifecycleLabel: lifecycleLabel(status.lifecycle),
        modeLabel: modeLabel(status.mode),
        currentTaskLabel: currentTask?.title ?? 'これから決まります',
        nextTaskLabel: nextTask?.title ?? '未定',
        activeTaskCount: status.activeTaskCount,
        queuedTaskCount: status.queuedTaskCount,
        completedTaskCount: status.completedTaskCount,
        pendingDecisionCount: pendingDecisions.length + blockers.length,
        updatedAt: status.updatedAt,
      },
      previewQueue: promptInjectionQueue,
    },
    power: {
      resources: [
        {
          id: 'model',
          label: '利用モデル',
          value: model.label,
          detail: model.detail,
          level: 'ok',
        },
        {
          id: 'workspace',
          label: '作業フォルダ',
          value: settings.agentCwd,
          detail: basename(settings.agentCwd),
          level: findDiagnosticLevel(diagnostics, 'agentCwd'),
        },
        {
          id: 'prompt',
          label: '指示ソース',
          value: promptSource,
          detail: settings.promptBody.trim() ? '追加の指示を優先します' : basename(settings.promptFile || '(未設定)'),
          level: findDiagnosticLevel(diagnostics, 'promptFile'),
        },
        {
          id: 'taskCatalog',
          label: '仕様ファイル',
          value: config.taskCatalogFile || '(未設定)',
          detail: config.taskCatalogFile ? basename(config.taskCatalogFile) : '画面からやることを追加できます',
          level: findDiagnosticLevel(diagnostics, 'taskCatalog'),
        },
        {
          id: 'notify',
          label: '通知先',
          value: settings.discordNotifyChannelId || (config.discordEnabled ? 'DM または未設定' : 'Discord 無効'),
          detail: config.discordEnabled ? 'Discord と連携できます' : 'Web 画面のみで使えます',
          level: findDiagnosticLevel(diagnostics, 'discordTarget'),
        },
        {
          id: 'panel',
          label: '画面URL',
          value: panelUrl,
          detail: config.panelUsername.trim() && config.panelPassword.trim() ? 'Basic 認証あり' : 'Basic 認証なし',
          level: findDiagnosticLevel(diagnostics, 'panelAuth'),
        },
      ],
      diagnostics,
      panelUrl,
      panelAuthEnabled: config.panelUsername.trim().length > 0 && config.panelPassword.trim().length > 0,
      canEditAgentCommand,
      agentCommand: settings.agentCommand,
      promptSource,
    },
  };
}
