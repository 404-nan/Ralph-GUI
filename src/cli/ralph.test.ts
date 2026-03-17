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

test('ralph launcher resolves bundled prompt paths even when started outside the repo root', () => {
  const outsideDir = mkdtempSync(join(tmpdir(), 'ralph-launcher-'));
  const stateDir = join(outsideDir, 'state');
  const logDir = join(outsideDir, 'logs');

  const result = spawnSync(CLI_LAUNCHER_PATH, ['check', '--json'], {
    cwd: outsideDir,
    env: {
      ...sanitizedEnv(),
      RALPH_AGENT_MODE: 'command',
      RALPH_AGENT_COMMAND: 'codex exec --full-auto --skip-git-repo-check',
      RALPH_PROMPT_FILE: 'prompts/supervisor.md',
      RALPH_TASK_CATALOG_FILE: '',
      RALPH_STATE_DIR: resolve(stateDir),
      RALPH_LOG_DIR: resolve(logDir),
    },
    encoding: 'utf8',
  });

  try {
    assert.equal(result.status, 0, result.stderr);
    const payload = JSON.parse(result.stdout) as {
      items: Array<{ key: string; level: string; message: string }>;
    };
    const promptCheck = payload.items.find((item) => item.key === 'promptFile');
    assert.equal(promptCheck?.level, 'ok');
    assert.match(promptCheck?.message || '', /prompts\/supervisor\.md/);
    assert.doesNotMatch(promptCheck?.message || '', /ralph-launcher-/);
  } finally {
    rmSync(outsideDir, { recursive: true, force: true });
  }
});
