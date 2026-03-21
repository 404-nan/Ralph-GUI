import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import type { AppConfig } from '../config.ts';
import { AgentRunner } from './agent-runner.ts';

function makeConfig(rootDir: string): AppConfig {
  return {
    rootDir,
    promptFile: join(rootDir, 'prompts', 'supervisor.md'),
    taskCatalogFile: '',
    stateDir: join(rootDir, 'state'),
    logDir: join(rootDir, 'logs'),
    agentCommand: 'node -e "setInterval(() => {}, 1000)"',
    agentCwd: rootDir,
    mode: 'command',
    maxIterations: 5,
    idleSeconds: 1,
    panelPort: 8787,
    panelHost: '127.0.0.1',
    panelUsername: '',
    panelPassword: '',
    allowRuntimeAgentCommandOverride: false,
    taskName: 'runner-test',
    discordToken: '',
    discordNotifyChannelId: '',
    discordDmUserId: '',
    discordAppName: 'RalphLoop',
    discordAllowedUserIds: [],
    discordGuildId: '',
    discordApplicationId: '',
    discordEnabled: false,
  };
}

test('AgentRunner abortCurrent terminates an in-flight command run', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-runner-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), 'base prompt', 'utf8');

  const runner = new AgentRunner(makeConfig(rootDir));
  const pending = runner.run('prompt', 1);

  await new Promise((resolve) => setTimeout(resolve, 100));
  runner.abortCurrent();

  const result = await pending;

  assert.equal(result.exitCode, null);
  assert.ok(result.signal === 'SIGTERM' || result.signal === 'SIGKILL');

  rmSync(rootDir, { recursive: true, force: true });
});

test('AgentRunner starts the agent command in the configured execution directory', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-runner-'));
  const workspaceDir = join(rootDir, 'workspace');
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  mkdirSync(workspaceDir, { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), 'base prompt', 'utf8');

  const config = makeConfig(rootDir);
  config.agentCommand = 'node -e "process.stdout.write(process.cwd())"';
  config.agentCwd = workspaceDir;

  const runner = new AgentRunner(config);
  const result = await runner.run('prompt', 1);

  assert.equal(result.exitCode, 0);
  assert.equal(result.output, workspaceDir);

  rmSync(rootDir, { recursive: true, force: true });
});

test('AgentRunner writes the prompt file into config.stateDir', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-runner-'));
  const stateDir = mkdtempSync(join(tmpdir(), 'ralph-runner-state-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), 'base prompt', 'utf8');

  const config = makeConfig(rootDir);
  config.stateDir = stateDir;
  config.agentCommand = 'node -e "process.stdout.write(process.env.RALPH_PROMPT_FILE || \'\')"';

  const runner = new AgentRunner(config);
  const result = await runner.run('prompt body', 1);
  const promptFilePath = join(stateDir, '.current-prompt.md');

  assert.equal(result.exitCode, 0);
  assert.equal(result.output, promptFilePath);
  assert.equal(existsSync(promptFilePath), true);
  assert.equal(readFileSync(promptFilePath, 'utf8'), 'prompt body');
  assert.equal(existsSync(join(rootDir, 'state', '.current-prompt.md')), false);

  rmSync(rootDir, { recursive: true, force: true });
  rmSync(stateDir, { recursive: true, force: true });
});
