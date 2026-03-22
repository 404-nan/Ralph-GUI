import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import type { AppConfig } from '../config.ts';
import { STATE_SCHEMA_VERSION } from '../shared/types.ts';
import { FileStateStore } from './store.ts';

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
    taskName: 'state test',
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

function makeRoot(): string {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-store-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), 'base prompt', 'utf8');
  return rootDir;
}

test('FileStateStore initializes v10 metadata and run report files', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const store = new FileStateStore(config);

  await store.ensureInitialized();

  assert.equal(store.readMeta().schemaVersion, STATE_SCHEMA_VERSION);
  assert.equal(store.readStatus().schemaVersion, STATE_SCHEMA_VERSION);
  assert.equal(store.readRunReport().schemaVersion, STATE_SCHEMA_VERSION);
  assert.equal(existsSync(join(config.stateDir, 'meta.json')), true);
  assert.equal(existsSync(join(config.stateDir, 'run-report.json')), true);

  rmSync(rootDir, { recursive: true, force: true });
});

test('FileStateStore migrates legacy status and tasks into the v10 schema', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  mkdirSync(config.stateDir, { recursive: true });
  mkdirSync(config.logDir, { recursive: true });

  writeFileSync(join(config.stateDir, 'status.json'), JSON.stringify({
    runId: '',
    task: 'legacy task',
    phase: 'queued',
    lifecycle: 'idle',
    control: 'running',
    iteration: 0,
    maxIterations: 5,
    currentStatusText: '',
    pendingQuestionCount: 0,
    answeredQuestionCount: 0,
    pendingInjectionCount: 0,
    blockerCount: 0,
    totalTaskCount: 1,
    activeTaskCount: 0,
    completedTaskCount: 0,
    queuedTaskCount: 1,
    updatedAt: new Date().toISOString(),
    agentCommand: 'demo',
    mode: 'demo',
    promptFile: 'prompts/supervisor.md',
  }), 'utf8');
  writeFileSync(join(config.stateDir, 'tasks.json'), JSON.stringify([
    {
      id: 'T-001',
      title: 'legacy task',
      summary: '',
      priority: 'high',
      sortIndex: 1,
      status: 'queued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'legacy',
      acceptanceCriteria: [],
    },
  ]), 'utf8');

  const store = new FileStateStore(config);
  await store.ensureInitialized();

  const status = store.readStatus();
  const tasks = store.readTasks();
  const meta = store.readMeta();

  assert.equal(status.schemaVersion, STATE_SCHEMA_VERSION);
  assert.equal(status.runState, 'ready');
  assert.equal(tasks[0]?.status, 'pending');
  assert.equal(meta.schemaVersion, STATE_SCHEMA_VERSION);

  rmSync(rootDir, { recursive: true, force: true });
});

test('FileStateStore falls back safely when a JSON state file is corrupted', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const store = new FileStateStore(config);
  await store.ensureInitialized();

  const statusPath = join(config.stateDir, 'status.json');
  writeFileSync(statusPath, '{"broken":', 'utf8');

  const originalWarn = console.warn;
  const warnCalls: unknown[][] = [];
  console.warn = (...args) => {
    warnCalls.push(args);
  };
  let status;
  try {
    status = store.readStatus();
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(status.task, config.taskName);
  assert.equal(existsSync(statusPath), false);
  assert.ok(readdirSync(config.stateDir).some((fileName) => fileName.startsWith('status.json.corrupt-')));
  assert.equal(warnCalls.length, 1);

  rmSync(rootDir, { recursive: true, force: true });
});

test('FileStateStore resetRuntimeData clears run-report artifacts as well as legacy files', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const store = new FileStateStore(config);
  await store.ensureInitialized();

  const report = store.readRunReport();
  report.retryCount = 2;
  report.changedFiles = ['src/panel/server.ts'];
  store.writeRunReport(report);
  writeFileSync(join(config.stateDir, 'events.jsonl'), '{"type":"dirty"}\n', 'utf8');
  writeFileSync(join(config.logDir, 'agent-output.log'), 'dirty log\n', 'utf8');

  store.resetRuntimeData();

  assert.equal(store.readRunReport().retryCount, 0);
  assert.deepEqual(store.readRunReport().changedFiles, []);
  assert.equal(readFileSync(join(config.stateDir, 'events.jsonl'), 'utf8'), '');
  assert.equal(readFileSync(join(config.logDir, 'agent-output.log'), 'utf8'), '');

  rmSync(rootDir, { recursive: true, force: true });
});
