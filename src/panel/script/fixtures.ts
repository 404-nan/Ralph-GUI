export const panelScriptFixtures = String.raw`
const FIXTURE_MODES = ['live', 'plan-review', 'active-workspace', 'blocked-waiting'];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function fixtureIso(offsetMinutes = 0) {
  return new Date(Date.now() + offsetMinutes * 60_000).toISOString();
}

function baseFixtureData() {
  const now = new Date('2026-03-21T10:15:00.000Z');
  const iso = (minutes) => new Date(now.getTime() + minutes * 60_000).toISOString();
  const makeTask = (id, title, summary, status, sortIndex, source = 'spec-import') => ({
    id,
    title,
    summary,
    priority: sortIndex === 0 ? 'high' : 'medium',
    sortIndex,
    status: status === 'completed' ? 'completed' : status === 'blocked' ? 'blocked' : 'pending',
    displayStatus: status,
    createdAt: iso(-120 + sortIndex * 5),
    updatedAt: iso(-30 + sortIndex * 6),
    source,
    acceptanceCriteria: [],
    notes: '',
  });

  const taskBoard = [
    makeTask('TG-001', 'spec structure を task graph に正規化する', 'chapter / requirement / appendix を node に分解する。', 'active', 0),
    makeTask('TG-002', 'graph import review を行う', '粒度、依存、done definition を見直す。', 'queued', 1),
    makeTask('TG-003', 'workspace header に dependency を常時表示する', 'parent / child / blocked-by / related を header で把握可能にする。', 'queued', 2),
    makeTask('TG-004', 'decision policy を確認する', '設計判断待ちの質問テンプレートを定義する。', 'blocked', 3),
    makeTask('TG-005', 'composer 統合を polish する', 'note / task / decision を bottom composer へ統合する。', 'completed', 4),
  ];

  return {
    status: {
      runId: 'fixture-run',
      task: 'panel-v2 fixture review',
      phase: 'working',
      lifecycle: 'running',
      control: 'running',
      iteration: 3,
      maxIterations: 12,
      currentStatusText: 'task workspace を更新しています',
      pendingQuestionCount: 1,
      answeredQuestionCount: 2,
      pendingInjectionCount: 1,
      blockerCount: 1,
      totalTaskCount: taskBoard.length,
      activeTaskCount: 1,
      completedTaskCount: 1,
      queuedTaskCount: 2,
      maxIntegration: 3,
      updatedAt: iso(0),
      agentCommand: 'codex exec --model gpt-5.2-codex',
      mode: 'command',
      promptFile: 'prompts/supervisor.md',
      thinkingText: 'task graph を点検し、次の判断待ちを前に出しています',
    },
    settings: {
      taskName: 'panel-v2 workspace design',
      agentCommand: 'codex exec --model gpt-5.2-codex',
      agentCwd: '/workspace/ralph-loop',
      promptFile: 'prompts/supervisor.md',
      promptBody: 'workspace first',
      discordNotifyChannelId: '',
      maxIterations: 12,
      idleSeconds: 5,
      mode: 'command',
      updatedAt: iso(-80),
      updatedBy: 'fixture',
    },
    capabilities: { canEditAgentCommand: true },
    currentTask: taskBoard[0],
    nextTask: taskBoard[1],
    pendingQuestions: [
      { id: 'Q-001', text: 'plan review を承認して active workspace に進めるか？', status: 'pending', createdAt: iso(-18), source: 'fixture' },
    ],
    pendingDecisions: [
      {
        id: 'Q-001',
        title: 'plan review を承認して active workspace に進めるか？',
        status: 'pending',
        recommendedAnswer: 'この plan で進めてください',
        fallbackAnswer: 'まず dependency 表示だけ先に実装してください',
        createdAt: iso(-18),
        source: 'fixture',
        choices: [
          { id: 'recommended', label: 'この plan で進める', kind: 'answer', answer: 'この plan で進めてください' },
          { id: 'narrow', label: 'dependency だけ先に', kind: 'answer', answer: 'まず dependency 表示だけ先に実装してください' },
          { id: 'custom', label: '内容を書いて答える', kind: 'custom' },
        ],
      },
    ],
    answeredQuestions: [
      { id: 'Q-000', text: 'Home を主役にしますか？', status: 'answered', createdAt: iso(-90), source: 'fixture', answer: { id: 'A-001', questionId: 'Q-000', answer: 'いいえ。Home は薄い入口にしてください', createdAt: iso(-88), source: 'fixture' } },
    ],
    blockers: [
      { id: 'B-001', text: 'decision policy 未確定のため blocked task が残っています', createdAt: iso(-16), source: 'fixture' },
    ],
    promptInjectionQueue: [
      { id: 'N-001', kind: 'note', label: 'workspace-first', text: 'generic dashboard にはしない', createdAt: iso(-12) },
    ],
    recentEvents: [
      { id: 'E-001', timestamp: iso(-26), type: 'task.imported', message: 'spec import: 4 tasks generated', level: 'info' },
      { id: 'E-002', timestamp: iso(-20), type: 'task.updated', message: 'task.updated: header relation chips added', level: 'info' },
      { id: 'E-003', timestamp: iso(-16), type: 'question.created', message: 'plan review approval required', level: 'warning' },
      { id: 'E-004', timestamp: iso(-10), type: 'note.enqueued', message: 'manual note queued', level: 'info' },
    ],
    artifacts: [
      { id: 'AR-001', title: 'spec import 完了', summary: 'source spec から task graph を生成しました', tone: 'success', timestamp: iso(-26) },
      { id: 'AR-002', title: 'header relation 設計', summary: 'parent / child / blocked-by / related を task header に集約', tone: 'info', timestamp: iso(-20) },
    ],
    agentLogTail: ['[STATUS] spec imported', '[TASK] TG-001 normalize graph', '[QUESTION] plan review approval'],
    taskBoard,
    thinkingFrames: ['spec imported', 'plan review pending', 'next action is approve or narrow the scope'],
    layers: {
      surface: {
        projectName: 'ralph-loop',
        projectPath: '/workspace/ralph-loop',
        modelLabel: 'gpt-5.2-codex',
        modelDetail: 'fixture data',
      },
      control: {
        run: {
          runId: 'fixture-run',
          requestLabel: 'panel-v2 workspace design',
          lifecycleLabel: '作業中',
          modeLabel: '通常',
          currentTaskLabel: 'spec structure を task graph に正規化する',
          nextTaskLabel: 'graph import review を行う',
          activeTaskCount: 1,
          queuedTaskCount: 2,
          completedTaskCount: 1,
          pendingDecisionCount: 2,
          updatedAt: iso(0),
        },
        previewQueue: [
          { id: 'N-001', kind: 'note', label: 'workspace-first', text: 'generic dashboard にはしない', createdAt: iso(-12) },
        ],
      },
      power: {
        resources: [],
        diagnostics: [
          { key: 'taskCatalog', level: 'ok', message: 'fixture catalog loaded' },
          { key: 'promptFile', level: 'warning', message: 'fixture uses inline source spec excerpts' },
        ],
        panelUrl: 'http://127.0.0.1:8787',
        panelAuthEnabled: false,
        canEditAgentCommand: true,
        agentCommand: 'codex exec --model gpt-5.2-codex',
        promptSource: 'fixture',
      },
    },
  };
}

function buildScenarioMeta(kind, dashboard) {
  const base = {
    scenarioLabel: 'Live workspace',
    scenarioTone: 'default',
    goal: '現在の task を前に進め、判断待ちがあれば即座に発行する。',
    doneDefinition: 'spec → plan → task workspace の導線が明確で、次アクションが 5 秒で分かる。',
    sourceSpec: 'panel-v2 workspace requirements / design task graph',
    primaryAction: { label: 'Tasks を確認', dataset: { secondaryTab: 'tasks' }, className: 'btn btn-primary btn-small' },
    relations: [
      { label: 'parent · workspace foundation', tone: '' },
      { label: 'child · header / composer polish', tone: '' },
      { label: 'blocked-by · none', tone: '' },
      { label: 'related · inbox / decisions', tone: '' },
    ],
    chat: [
      { role: 'system', label: 'system note', copy: '現在の live dashboard data から workspace 向け要約を生成します。', meta: 'surface summary' },
      { role: 'agent', label: 'next move', copy: dashboard.currentTask ? 'まず「' + dashboard.currentTask.title + '」の進行に必要な context を整理します。' : 'active task がないため queue を見直します。', meta: 'derived from current task' },
    ],
  };

  if (kind === 'plan-review') {
    return {
      ...base,
      scenarioLabel: 'Spec imported / plan review',
      goal: 'spec import 直後の plan を点検し、task graph の粒度と依存をレビューする。',
      doneDefinition: 'import された task ごとに goal / dependency / next action が読める。承認または scope 調整の判断を 1 回で返せる。',
      sourceSpec: 'source spec excerpt: chapters, requirements, dependency hints, acceptance criteria',
      primaryAction: { label: 'plan を承認', dataset: { useDecision: 'Q-001' }, className: 'btn btn-primary btn-small' },
      relations: [
        { label: 'parent · spec import', tone: '' },
        { label: 'child · TG-002 graph review', tone: '' },
        { label: 'blocked-by · approval pending', tone: 'is-decision' },
        { label: 'related · source excerpts', tone: '' },
      ],
      chat: [
        { role: 'system', label: 'spec imported', copy: '設計書を task graph に変換し、4 つの主要 task に分解しました。', meta: 'import finished' },
        { role: 'agent', label: 'plan review', copy: '粒度は適切ですが、decision policy と dependency visibility の確認が必要です。', meta: 'review draft' },
        { role: 'decision', label: 'decision pending', copy: 'この plan で active workspace に移行するか判断してください。', meta: 'human approval needed' },
      ],
    };
  }

  if (kind === 'active-workspace') {
    return {
      ...base,
      scenarioLabel: 'Active task workspace',
      goal: 'TG-001 を 1 task = 1 chat の深さで進め、header / sticky context / bottom composer を整える。',
      doneDefinition: 'task workspace 上部に goal / done definition / source spec が固定され、sidebar を閉じても主要操作が残る。',
      sourceSpec: 'workspace contract: collapsible sidebar, optional right drawer, unified composer',
      primaryAction: { label: 'dependency を更新', dataset: { prefillNote: 'parent / child / blocked-by / related の見え方を微調整してください' }, className: 'btn btn-primary btn-small' },
      relations: [
        { label: 'parent · TG-000 workspace strategy', tone: '' },
        { label: 'child · TG-003 header relation view', tone: '' },
        { label: 'blocked-by · none', tone: '' },
        { label: 'related · composer unification', tone: '' },
      ],
      chat: [
        { role: 'system', label: 'goal pinned', copy: 'workspace 上部に固定コンテキストを表示し、task を進める面へ再構成します。', meta: 'sticky context' },
        { role: 'agent', label: 'implementation', copy: 'sidebar collapse, right drawer toggle, utility panels の階層整理を進めています。', meta: 'active task' },
        { role: 'agent', label: 'evidence', copy: 'generic dashboard card grid を避けるため、hero + header + sticky strip + task chat の単一構図へ移行しました。', meta: 'design rationale' },
      ],
    };
  }

  if (kind === 'blocked-waiting') {
    return {
      ...base,
      scenarioLabel: 'Waiting decision / blocked',
      goal: 'blocked task を前面に出し、必要な decision を最短で返せる状態にする。',
      doneDefinition: 'blocked-by の理由、代替案、推奨回答が 1 画面で読み取れる。',
      sourceSpec: 'decision policy excerpt: recommend / fallback / custom answer',
      primaryAction: { label: '推奨回答を使う', dataset: { answerQuestion: 'Q-001', answerValue: 'この plan で進めてください' }, className: 'btn btn-primary btn-small' },
      relations: [
        { label: 'parent · decision workflow', tone: '' },
        { label: 'child · TG-004 policy finalize', tone: '' },
        { label: 'blocked-by · decision policy 未確定', tone: 'is-blocked' },
        { label: 'related · blocker history', tone: 'is-decision' },
      ],
      chat: [
        { role: 'blocked', label: 'blocked', copy: 'decision policy が未確定のため、blocked task を進められません。', meta: 'critical path' },
        { role: 'decision', label: 'required decision', copy: '推奨案で進めるか、dependency 表示だけ先に進めるかを選んでください。', meta: 'human response required' },
        { role: 'system', label: 'safe fallback', copy: '返答がない場合は dependency 表示だけを先に進める fallback を使用します。', meta: 'fallback path' },
      ],
    };
  }

  return base;
}

function syncFixtureDashboard(dashboard) {
  const activeTasks = dashboard.taskBoard.filter((task) => task.displayStatus === 'active');
  const queuedTasks = dashboard.taskBoard.filter((task) => task.displayStatus === 'queued');
  const blockedTasks = dashboard.taskBoard.filter((task) => task.displayStatus === 'blocked');
  const completedTasks = dashboard.taskBoard.filter((task) => task.displayStatus === 'completed');

  dashboard.currentTask = activeTasks[0] || blockedTasks[0];
  dashboard.nextTask = queuedTasks[0];
  dashboard.status.totalTaskCount = dashboard.taskBoard.length;
  dashboard.status.activeTaskCount = activeTasks.length;
  dashboard.status.completedTaskCount = completedTasks.length;
  dashboard.status.queuedTaskCount = queuedTasks.length;
  dashboard.status.pendingQuestionCount = dashboard.pendingQuestions.length;
  dashboard.status.blockerCount = dashboard.blockers.length;
  dashboard.status.pendingInjectionCount = dashboard.promptInjectionQueue.length;
  dashboard.status.answeredQuestionCount = dashboard.answeredQuestions.length;
  dashboard.status.updatedAt = fixtureIso();
  dashboard.layers.control.run.activeTaskCount = activeTasks.length;
  dashboard.layers.control.run.queuedTaskCount = queuedTasks.length;
  dashboard.layers.control.run.completedTaskCount = completedTasks.length;
  dashboard.layers.control.run.pendingDecisionCount = dashboard.pendingDecisions.length + dashboard.blockers.length;
  dashboard.layers.control.run.updatedAt = dashboard.status.updatedAt;
  dashboard.layers.control.run.currentTaskLabel = dashboard.currentTask?.title || 'これから決まります';
  dashboard.layers.control.run.nextTaskLabel = dashboard.nextTask?.title || '未定';
  dashboard.workspace = buildScenarioMeta(state.fixtureMode, dashboard);
  dashboard.__fixtureMode = state.fixtureMode;
  return dashboard;
}

function appendFixtureEvent(dashboard, type, message, level = 'info') {
  dashboard.recentEvents.unshift({
    id: 'E-' + Math.random().toString(36).slice(2, 8),
    timestamp: fixtureIso(),
    type,
    message,
    level,
  });
  dashboard.recentEvents = dashboard.recentEvents.slice(0, 12);
}

function fixtureTaskPreview(specText) {
  const tasks = specText
    .split(/\n+/)
    .map((line) => line.trim().replace(/^[-*]\s*/, ''))
    .filter(Boolean)
    .slice(0, 5)
    .map((line, index) => ({ title: line, summary: 'fixture preview task ' + String(index + 1) }));
  return { tasks };
}

function fixtureDashboard(mode) {
  const dashboard = baseFixtureData();
  if (mode === 'active-workspace') {
    dashboard.status.pendingQuestionCount = 0;
    dashboard.pendingQuestions = [];
    dashboard.pendingDecisions = [];
    dashboard.blockers = [];
    dashboard.status.blockerCount = 0;
    dashboard.layers.control.run.pendingDecisionCount = 0;
    dashboard.status.currentStatusText = 'active task workspace を深掘りしています';
  }
  if (mode === 'blocked-waiting') {
    dashboard.currentTask = { ...dashboard.taskBoard[3], displayStatus: 'blocked' };
    dashboard.nextTask = dashboard.taskBoard[2];
    dashboard.status.currentStatusText = '判断待ちのため blocked task を保持しています';
    dashboard.status.lifecycle = 'paused';
    dashboard.status.control = 'paused';
    dashboard.layers.control.run.currentTaskLabel = dashboard.currentTask.title;
  }
  dashboard.workspace = buildScenarioMeta(mode, dashboard);
  dashboard.__fixtureMode = mode;
  return dashboard;
}

function ensureFixtureDashboard() {
  if (!state.dashboardData || !isFixtureMode()) {
    state.dashboardData = getFixtureDashboard(state.fixtureMode);
  }
  return clone(state.dashboardData);
}

function fixtureApi(path, body = {}) {
  const dashboard = ensureFixtureDashboard();
  const taskById = (taskId) => dashboard.taskBoard.find((item) => item.id === taskId);

  if (path === '/api/note') {
    const note = String(body.note || '').trim();
    if (!note) return null;
    dashboard.promptInjectionQueue.unshift({ id: 'N-' + Math.random().toString(36).slice(2, 8), kind: 'note', label: 'manual note', text: note, createdAt: fixtureIso() });
    appendFixtureEvent(dashboard, 'note.enqueued', 'fixture note: ' + note);
  }

  if (path === '/api/answer') {
    const questionId = String(body.questionId || '');
    const answer = String(body.answer || '').trim();
    if (!questionId || !answer) return null;
    const question = dashboard.pendingQuestions.find((item) => item.id === questionId);
    dashboard.pendingQuestions = dashboard.pendingQuestions.filter((item) => item.id !== questionId);
    dashboard.pendingDecisions = dashboard.pendingDecisions.filter((item) => item.id !== questionId);
    if (question) {
      dashboard.answeredQuestions.unshift({
        ...question,
        status: 'answered',
        answer: { id: 'A-' + Math.random().toString(36).slice(2, 8), questionId, answer, createdAt: fixtureIso(), source: 'fixture-ui' },
      });
    }
    if (state.fixtureMode === 'blocked-waiting') {
      dashboard.blockers = [];
      const blockedTask = dashboard.taskBoard.find((task) => task.id === 'TG-004');
      if (blockedTask) {
        blockedTask.displayStatus = 'active';
        blockedTask.status = 'pending';
        blockedTask.updatedAt = fixtureIso();
      }
      dashboard.status.lifecycle = 'running';
      dashboard.status.control = 'running';
      dashboard.status.currentStatusText = 'decision を受け取り blocked task を再開しました';
    }
    appendFixtureEvent(dashboard, 'question.answered', 'fixture decision answered: ' + answer);
  }

  if (path === '/api/task/create') {
    const title = String(body.title || '').trim();
    if (!title) return null;
    const summary = String(body.summary || '').trim();
    dashboard.taskBoard.push({
      id: 'TG-' + String(dashboard.taskBoard.length + 1).padStart(3, '0'),
      title,
      summary: summary || title,
      priority: 'medium',
      sortIndex: dashboard.taskBoard.length,
      status: 'pending',
      displayStatus: 'queued',
      createdAt: fixtureIso(),
      updatedAt: fixtureIso(),
      source: 'fixture-ui',
      acceptanceCriteria: [],
      notes: '',
    });
    appendFixtureEvent(dashboard, 'task.created', 'fixture task created: ' + title);
  }

  if (path === '/api/task/update') {
    const task = taskById(String(body.taskId || ''));
    if (!task) return null;
    task.title = String(body.title || task.title).trim() || task.title;
    task.summary = String(body.summary || task.summary).trim() || task.summary;
    task.updatedAt = fixtureIso();
    appendFixtureEvent(dashboard, 'task.updated', 'fixture task updated: ' + task.title);
  }

  if (path === '/api/task/complete') {
    const task = taskById(String(body.taskId || ''));
    if (!task) return null;
    task.displayStatus = 'completed';
    task.status = 'completed';
    task.updatedAt = fixtureIso();
    appendFixtureEvent(dashboard, 'task.completed', 'fixture task completed: ' + task.title);
  }

  if (path === '/api/task/reopen') {
    const task = taskById(String(body.taskId || ''));
    if (!task) return null;
    task.displayStatus = 'queued';
    task.status = 'pending';
    task.updatedAt = fixtureIso();
    appendFixtureEvent(dashboard, 'task.reopened', 'fixture task reopened: ' + task.title);
  }

  if (path === '/api/task/move') {
    const taskId = String(body.taskId || '');
    const index = dashboard.taskBoard.findIndex((task) => task.id === taskId);
    if (index >= 0) {
      const [task] = dashboard.taskBoard.splice(index, 1);
      dashboard.taskBoard.splice(body.position === 'front' ? 0 : dashboard.taskBoard.length, 0, task);
      dashboard.taskBoard.forEach((item, order) => { item.sortIndex = order; });
      appendFixtureEvent(dashboard, 'task.reordered', 'fixture task reordered: ' + task.title);
    }
  }

  if (path === '/api/task/import/preview') {
    return fixtureTaskPreview(String(body.specText || ''));
  }

  if (path === '/api/task/import') {
    const preview = fixtureTaskPreview(String(body.specText || ''));
    preview.tasks.forEach((task) => {
      dashboard.taskBoard.push({
        id: 'TG-' + String(dashboard.taskBoard.length + 1).padStart(3, '0'),
        title: task.title,
        summary: task.summary,
        priority: 'medium',
        sortIndex: dashboard.taskBoard.length,
        status: 'pending',
        displayStatus: 'queued',
        createdAt: fixtureIso(),
        updatedAt: fixtureIso(),
        source: 'fixture-import',
        acceptanceCriteria: [],
        notes: '',
      });
    });
    appendFixtureEvent(dashboard, 'task.imported', 'fixture imported ' + String(preview.tasks.length) + ' tasks');
    syncFixtureDashboard(dashboard);
    state.dashboardData = dashboard;
    return { tasks: preview.tasks };
  }

  if (path === '/api/start') {
    dashboard.status.lifecycle = 'running';
    dashboard.status.control = 'running';
    dashboard.status.currentStatusText = 'fixture run を開始しました';
    appendFixtureEvent(dashboard, 'run.started', 'fixture run started');
  }

  if (path === '/api/pause') {
    dashboard.status.lifecycle = 'paused';
    dashboard.status.control = 'paused';
    dashboard.status.currentStatusText = 'fixture run を一時停止しました';
    appendFixtureEvent(dashboard, 'run.pause', 'fixture run paused', 'warning');
  }

  if (path === '/api/resume') {
    dashboard.status.lifecycle = 'running';
    dashboard.status.control = 'running';
    dashboard.status.currentStatusText = 'fixture run を再開しました';
    appendFixtureEvent(dashboard, 'run.resume', 'fixture run resumed');
  }

  if (path === '/api/abort') {
    dashboard.status.lifecycle = 'aborted';
    dashboard.status.control = 'aborted';
    dashboard.status.currentStatusText = 'fixture run を中断しました';
    appendFixtureEvent(dashboard, 'run.error', 'fixture run aborted', 'warning');
  }

  syncFixtureDashboard(dashboard);
  state.dashboardData = dashboard;
  return { ok: true, fixture: true };
}

function getFixtureDashboard(mode) {
  return fixtureDashboard(mode);
}
`;
