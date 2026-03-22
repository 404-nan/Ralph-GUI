import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import test from 'node:test';

import { loadConfig } from '../config.ts';
import { RunActions } from '../actions/run-actions.ts';
import { FileStateStore } from '../state/store.ts';

const CLI_PATH = fileURLToPath(new URL('./ralph.ts', import.meta.url));
const CLI_LAUNCHER_PATH = fileURLToPath(new URL('../../ralph', import.meta.url));

function sanitizedEnv(): NodeJS.ProcessEnv {
  return Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !key.startsWith('RALPH_')),
  );
}

test('ralph check diagnoses persisted runtime settings instead of stale env prompt paths', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-cli-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'runtime.md'), '# runtime prompt\n', 'utf8');
  writeFileSync(
    join(rootDir, '.env'),
    [
      'RALPH_AGENT_MODE=command',
      'RALPH_AGENT_COMMAND=codex exec --full-auto --skip-git-repo-check',
      'RALPH_PROMPT_FILE=prompts/missing.md',
      'RALPH_TASK_CATALOG_FILE=',
    ].join('\n'),
    'utf8',
  );

  const config = loadConfig(rootDir);
  const store = new FileStateStore(config);
  await store.ensureInitialized();
  const actions = new RunActions(store, config);
  await actions.updateRuntimeSettings(
    {
      promptFile: join(rootDir, 'prompts', 'runtime.md'),
    },
    { source: 'test' },
  );

  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', CLI_PATH, 'check', '--json'],
    {
      cwd: rootDir,
      env: sanitizedEnv(),
      encoding: 'utf8',
    },
  );

  try {
    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout) as {
      items: Array<{ key: string; level: string; message: string }>;
    };
    const promptCheck = payload.items.find((item) => item.key === 'promptFile');
    assert.equal(promptCheck?.level, 'ok');
    assert.match(promptCheck?.message || '', /runtime\.md/);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test('ralph check does not create persisted runtime settings when state is absent', () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-cli-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), '# prompt\n', 'utf8');

  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', CLI_PATH, 'check', '--task', 'overridden', '--mode', 'demo', '--json'],
    {
      cwd: rootDir,
      env: sanitizedEnv(),
      encoding: 'utf8',
    },
  );

  try {
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(rootDir, 'state', 'settings.json')), false);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test('ralph configure persists the agent execution directory override', () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-cli-'));
  const workspaceDir = join(rootDir, 'workspace');
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  mkdirSync(workspaceDir, { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), '# prompt\n', 'utf8');

  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', CLI_PATH, 'configure', '--cwd', 'workspace'],
    {
      cwd: rootDir,
      env: sanitizedEnv(),
      encoding: 'utf8',
    },
  );

  try {
    assert.equal(result.status, 0, result.stderr);
    const settings = JSON.parse(readFileSync(join(rootDir, 'state', 'settings.json'), 'utf8')) as {
      agentCwd: string;
    };
    assert.equal(settings.agentCwd, workspaceDir);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test('ralph reset clears runtime data and recreates shareable state files', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-cli-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), '# prompt\n', 'utf8');

  const config = loadConfig(rootDir);
  const store = new FileStateStore(config);
  await store.ensureInitialized();
  const actions = new RunActions(store, config);
  await actions.updateRuntimeSettings(
    {
      taskName: 'custom task',
      maxIterations: 9,
      idleSeconds: 1,
      discordNotifyChannelId: '123456',
    },
    { source: 'test' },
  );
  store.writeQuestions([
    {
      id: 'Q-001',
      text: 'pending question',
      status: 'pending',
      createdAt: '2026-03-17T00:00:00.000Z',
      source: 'test',
    },
  ]);
  store.writeTasks([
    {
      id: 'TASK-001',
      title: 'dirty task',
      summary: 'dirty task',
      priority: 'medium',
      status: 'pending',
      createdAt: '2026-03-17T00:00:00.000Z',
      updatedAt: '2026-03-17T00:00:00.000Z',
      source: 'test',
      acceptanceCriteria: [],
    },
  ]);
  writeFileSync(join(rootDir, 'state', 'answer-inbox.jsonl'), '{"value":1}\n', 'utf8');
  writeFileSync(join(rootDir, 'state', 'note-inbox.txt'), 'dirty note\n', 'utf8');
  writeFileSync(join(rootDir, 'state', 'events.jsonl'), '{"type":"dirty"}\n', 'utf8');
  writeFileSync(join(rootDir, 'logs', 'agent-output.log'), 'dirty log\n', 'utf8');

  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', CLI_PATH, 'reset'],
    {
      cwd: rootDir,
      env: sanitizedEnv(),
      encoding: 'utf8',
    },
  );

  try {
    assert.equal(result.status, 0, result.stderr);

    const status = JSON.parse(readFileSync(join(rootDir, 'state', 'status.json'), 'utf8')) as {
      lifecycle: string;
      phase: string;
      pendingQuestionCount: number;
      totalTaskCount: number;
      promptFile: string;
    };
    const questions = JSON.parse(readFileSync(join(rootDir, 'state', 'questions.json'), 'utf8')) as unknown[];
    const tasks = JSON.parse(readFileSync(join(rootDir, 'state', 'tasks.json'), 'utf8')) as unknown[];
    const settings = JSON.parse(readFileSync(join(rootDir, 'state', 'settings.json'), 'utf8')) as {
      taskName: string;
      promptFile: string;
      discordNotifyChannelId: string;
    };

    assert.equal(status.lifecycle, 'idle');
    assert.equal(status.phase, 'idle');
    assert.equal(status.pendingQuestionCount, 0);
    assert.equal(status.totalTaskCount, 0);
    assert.equal(status.promptFile, 'prompts/supervisor.md');
    assert.deepEqual(questions, []);
    assert.deepEqual(tasks, []);
    assert.equal(settings.taskName, 'Codex supervised run');
    assert.equal(settings.promptFile, join(rootDir, 'prompts', 'supervisor.md'));
    assert.equal(settings.discordNotifyChannelId, '');
    assert.equal(readFileSync(join(rootDir, 'state', 'answer-inbox.jsonl'), 'utf8'), '');
    assert.equal(readFileSync(join(rootDir, 'state', 'note-inbox.txt'), 'utf8'), '');
    assert.equal(readFileSync(join(rootDir, 'state', 'events.jsonl'), 'utf8'), '');
    assert.equal(readFileSync(join(rootDir, 'logs', 'agent-output.log'), 'utf8'), '');
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test('ralph supervisor starts the watcher without auto-queuing a run', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-cli-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), '# prompt\n', 'utf8');
  writeFileSync(
    join(rootDir, '.env'),
    [
      'RALPH_AGENT_MODE=demo',
      'RALPH_PROMPT_FILE=prompts/supervisor.md',
      'RALPH_TASK_CATALOG_FILE=',
      'RALPH_STATE_DIR=state',
      'RALPH_LOG_DIR=logs',
    ].join('\n'),
    'utf8',
  );

  const child = spawn(
    process.execPath,
    ['--experimental-strip-types', CLI_PATH, 'supervisor'],
    {
      cwd: rootDir,
      env: sanitizedEnv(),
      stdio: 'ignore',
    },
  );

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    child.kill('SIGTERM');
    await new Promise((resolve) => child.once('close', resolve));

    const status = JSON.parse(readFileSync(join(rootDir, 'state', 'status.json'), 'utf8')) as {
      phase: string;
      lifecycle: string;
      runId: string;
    };
    assert.equal(status.phase, 'idle');
    assert.equal(status.lifecycle, 'idle');
    assert.equal(status.runId, '');
  } finally {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
    rmSync(rootDir, { recursive: true, force: true });
  }
});

(process.platform === 'win32' ? test.skip : test)('ralph launcher keeps the caller cwd while resolving bundled prompt paths', () => {
  const outsideDir = mkdtempSync(join(tmpdir(), 'ralph-launcher-'));

  const result = spawnSync(CLI_LAUNCHER_PATH, ['reset'], {
    cwd: outsideDir,
    env: {
      ...sanitizedEnv(),
      RALPH_AGENT_MODE: 'command',
      RALPH_AGENT_COMMAND: 'codex exec --full-auto --skip-git-repo-check',
      RALPH_PROMPT_FILE: 'prompts/supervisor.md',
      RALPH_TASK_CATALOG_FILE: '',
      RALPH_STATE_DIR: 'state',
      RALPH_LOG_DIR: 'logs',
    },
    encoding: 'utf8',
  });

  try {
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(outsideDir, 'state', 'status.json')), true);
    const status = JSON.parse(readFileSync(join(outsideDir, 'state', 'status.json'), 'utf8')) as {
      promptFile: string;
      task: string;
    };
    assert.equal(status.task, 'Codex supervised run');
    assert.match(status.promptFile, /prompts\/supervisor\.md/);
    assert.doesNotMatch(status.promptFile, /ralph-launcher-/);
  } finally {
    rmSync(outsideDir, { recursive: true, force: true });
  }
});
