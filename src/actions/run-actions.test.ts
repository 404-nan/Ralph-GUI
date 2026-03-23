import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import type { AppConfig } from '../config.ts';
import { FileStateStore } from '../state/store.ts';
import { RunActions } from './run-actions.ts';

function makeConfig(rootDir: string): AppConfig {
  return {
    rootDir,
    promptFile: join(rootDir, 'prompts', 'supervisor.md'),
    taskCatalogFile: '',
    stateDir: join(rootDir, 'state'),
    logDir: join(rootDir, 'logs'),
    agentCommand: 'demo',
    agentCwd: rootDir,
    mode: 'demo',
    maxIterations: 5,
    idleSeconds: 1,
    panelPort: 8787,
    panelHost: '127.0.0.1',
    panelUsername: '',
    panelPassword: '',
    allowRuntimeAgentCommandOverride: false,
    taskName: 'test',
    discordToken: '',
    discordNotifyChannelId: '',
    discordDmUserId: '',
    discordAppName: 'RalphGUI',
    discordAllowedUserIds: [],
    discordGuildId: '',
    discordApplicationId: '',
    discordEnabled: false,
  };
}

async function makeActions(config: AppConfig): Promise<{ store: FileStateStore; actions: RunActions }> {
  const store = new FileStateStore(config);
  await store.ensureInitialized();
  return {
    store,
    actions: new RunActions(store, config),
  };
}

function makeRoot(): string {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-actions-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), 'base prompt', 'utf8');
  return rootDir;
}

test('RunActions exposes a single-active board with current and next lanes', async () => {
  const rootDir = makeRoot();
  writeFileSync(
    join(rootDir, 'prd.json'),
    JSON.stringify({
      userStories: [
        { id: 'US-001', title: 'first', priority: 1, passes: false },
        { id: 'US-002', title: 'second', priority: 2, passes: false },
        { id: 'US-003', title: 'third', priority: 3, passes: false },
      ],
    }),
    'utf8',
  );

  const config = makeConfig(rootDir);
  config.taskCatalogFile = join(rootDir, 'prd.json');
  const { actions } = await makeActions(config);

  const dashboard = await actions.getDashboardData();

  assert.equal(dashboard.status.maxIntegration, 1);
  assert.equal(dashboard.currentTask?.id, 'US-001');
  assert.deepEqual(dashboard.nextTasks.map((task) => task.id), ['US-002', 'US-003']);
  assert.deepEqual(
    dashboard.taskBoard.filter((task) => task.displayStatus === 'current').map((task) => task.id),
    ['US-001'],
  );

  rmSync(rootDir, { recursive: true, force: true });
});

test('RunActions supports strong task lifecycle operations and blocked reasons', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { actions } = await makeActions(config);

  const created = await actions.createTask(
    {
      title: 'Operator dashboard',
      summary: 'Make next step obvious',
      priority: 'high',
      acceptanceCriteria: ['Current task is visible', 'Blocked reason is visible'],
      notes: 'Touch the panel and dashboard data',
      blockedReason: 'Need setup confirmation',
      agentId: 'agent-1',
    },
    { source: 'test' },
  );

  let dashboard = await actions.getDashboardData();
  assert.equal(dashboard.blockedTasks[0]?.id, created.id);
  assert.equal(dashboard.blockedTasks[0]?.blockedReason, 'Need setup confirmation');

  await actions.unblockTask(created.id, { source: 'test' });
  await actions.moveTask(created.id, 'top', { source: 'test' });
  await actions.completeTask(created.id, { source: 'test' });

  dashboard = await actions.getDashboardData();
  assert.equal(dashboard.doneTasks[0]?.id, created.id);
  assert.equal(dashboard.doneTasks[0]?.displayStatus, 'done');

  await actions.reopenTask(created.id, { source: 'test' });
  dashboard = await actions.getDashboardData();
  assert.equal(dashboard.currentTask?.id, created.id);
  assert.equal(dashboard.currentTask?.priority, 'high');
  assert.equal(dashboard.currentTask?.agentId, 'agent-1');

  rmSync(rootDir, { recursive: true, force: true });
});

test('RunActions rejects run start when every task is blocked', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { actions } = await makeActions(config);

  await actions.createTask(
    {
      title: 'Blocked task',
      blockedReason: 'Need credentials',
    },
    { source: 'test' },
  );

  const result = await actions.requestRunStart({ source: 'test' });

  assert.equal(result.started, false);
  assert.match(result.message, /blocked task/i);

  rmSync(rootDir, { recursive: true, force: true });
});

test('RunActions marks a DONE turn as needs_review when evidence is weak', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { actions, store } = await makeActions(config);

  const created = await actions.createTask(
    {
      title: 'Evidence-sensitive task',
      acceptanceCriteria: ['Run tests', 'Change files'],
    },
    { source: 'test' },
  );
  await actions.moveTask(created.id, 'top', { source: 'test' });

  await actions.recordTurnResult({
    output: 'finished turn',
    iteration: 1,
    exitCode: 0,
    signal: null,
    doneSignalMessage: 'DONE',
  });

  const status = store.readStatus();
  const report = store.readRunReport();

  assert.equal(status.runState, 'needs_review');
  assert.equal(report.completion.status, 'needs_review');
  assert.ok(report.completion.pendingItems.some((item) => /changed-file evidence/i.test(item)));
  assert.ok(report.completion.pendingItems.some((item) => /No test execution/i.test(item)));

  rmSync(rootDir, { recursive: true, force: true });
});

test('RunActions completes a criteria-free task when DONE and zero exit are observed', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { actions, store } = await makeActions(config);

  const created = await actions.createTask(
    {
      title: 'Simple task',
      summary: 'No explicit criteria',
    },
    { source: 'test' },
  );
  await actions.moveTask(created.id, 'top', { source: 'test' });

  await actions.recordTurnResult({
    output: 'completed',
    iteration: 1,
    exitCode: 0,
    signal: null,
    doneSignalMessage: 'DONE',
  });

  const status = store.readStatus();
  const dashboard = await actions.getDashboardData();

  assert.equal(status.runState, 'completed');
  assert.equal(dashboard.doneTasks[0]?.id, created.id);

  rmSync(rootDir, { recursive: true, force: true });
});

test('RunActions imports reviewed drafts from preview output', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { actions } = await makeActions(config);

  const spec = `
# Mission Control
- Build a mission control dashboard
  - Show current task
- Build a mission control dashboard
  - Avoid duplicate work
- Harden setup flow
  - Add diagnostics
`;

  const preview = await actions.previewTaskImport(spec);
  assert.equal(preview.format, 'list');
  assert.equal(preview.duplicateGroups.length, 1);
  assert.match(preview.previewToken, /^[a-f0-9]{64}$/);

  const imported = await actions.importTasksFromSpec(spec, { source: 'test' }, [
    { ...preview.drafts[0], selected: true },
    { ...preview.drafts[1], selected: false },
    { ...preview.drafts[2], selected: true },
  ], preview.previewToken);

  assert.equal(imported.tasks.length, 2);
  assert.deepEqual(imported.tasks.map((task) => task.title), [
    'Build a mission control dashboard',
    'Harden setup flow',
  ]);

  rmSync(rootDir, { recursive: true, force: true });
});

test('RunActions rejects stale task import previews', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { actions } = await makeActions(config);

  const preview = await actions.previewTaskImport('- Build dashboard');

  await assert.rejects(
    actions.importTasksFromSpec('- Build dashboard\n- Add tests', { source: 'test' }, preview.drafts, preview.previewToken),
    /preview/i,
  );

  rmSync(rootDir, { recursive: true, force: true });
});

test('RunActions keeps answers queued until they are injected into the next prompt', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { actions, store } = await makeActions(config);

  const question = await actions.recordQuestion('Should we keep the setup minimal?', 'test');
  await actions.submitAnswer(question.id, 'はい、最小構成で進めてください', { source: 'test' });

  let storedQuestions = store.readQuestions();
  assert.equal(storedQuestions[0]?.status, 'queued');
  assert.equal(actions.listPromptInjectionQueue().length, 1);

  const prompt = await actions.preparePromptForNextTurn();
  assert.match(prompt, /最小構成/);

  storedQuestions = store.readQuestions();
  assert.equal(storedQuestions[0]?.status, 'answered');
  assert.ok(storedQuestions[0]?.answeredAt);
  assert.equal(actions.listPromptInjectionQueue().length, 0);

  rmSync(rootDir, { recursive: true, force: true });
});

test('RunActions skips invalid answer inbox lines and continues importing later lines', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { actions, store } = await makeActions(config);

  const questionA = await actions.recordQuestion('A?', 'test');
  const questionB = await actions.recordQuestion('B?', 'test');
  writeFileSync(
    join(config.stateDir, 'answer-inbox.jsonl'),
    [
      JSON.stringify({ questionId: questionA.id, answer: 'first' }),
      '{"questionId":',
      JSON.stringify({ questionId: questionB.id, answer: 'second' }),
    ].join('\n'),
    'utf8',
  );

  await actions.getDashboardData();

  const questions = store.readQuestions();
  const answers = store.readAnswers();
  assert.equal(questions.find((item) => item.id === questionA.id)?.status, 'queued');
  assert.equal(questions.find((item) => item.id === questionB.id)?.status, 'queued');
  assert.equal(answers.length, 2);
  assert.equal(store.readInboxOffsets().answersLineOffset, 3);

  rmSync(rootDir, { recursive: true, force: true });
});

test('RunActions quick test succeeds in demo mode and dashboard exposes diagnostics', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { actions } = await makeActions(config);

  const quickTest = await actions.quickTestRuntimeSettings({ source: 'test' });
  const dashboard = await actions.getDashboardData();

  assert.equal(quickTest.ok, true);
  assert.equal(dashboard.setupDiagnostics.ok, true);
  assert.equal(dashboard.capabilities.canQuickTestAgent, true);

  rmSync(rootDir, { recursive: true, force: true });
});
