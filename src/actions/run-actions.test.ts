import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { AppConfig } from '../config.ts';
import { FileStateStore } from '../state/store.ts';
import { RunActions } from './run-actions.ts';

function makeConfig(rootDir: string): AppConfig {
  return {
    rootDir,
    promptFile: join(rootDir, 'prompts', 'supervisor.md'),
    stateDir: join(rootDir, 'state'),
    logDir: join(rootDir, 'logs'),
    agentCommand: 'demo',
    mode: 'demo',
    maxIterations: 5,
    idleSeconds: 1,
    panelPort: 8787,
    panelHost: '127.0.0.1',
    taskName: 'test',
    discordToken: '',
    discordNotifyChannelId: '',
    discordDmUserId: '',
    discordAppName: 'RalphLoop',
    discordEnabled: false,
  };
}

test('RunActions consumes local answer inbox once and injects it only once', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-loop-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), 'base prompt', { encoding: 'utf8' });
  const config = makeConfig(rootDir);
  const store = new FileStateStore(config);
  await store.ensureInitialized();
  const actions = new RunActions(store, config);

  await actions.recordQuestion('staging を優先しますか？');
  writeFileSync(
    join(config.stateDir, 'answer-inbox.jsonl'),
    `${JSON.stringify({ questionId: 'Q-001', answer: 'staging を優先してください' })}\n`,
    'utf8',
  );

  const prompt = await actions.preparePromptForNextTurn();
  const secondPrompt = await actions.preparePromptForNextTurn();

  assert.match(prompt, /先ほどの質問の答えが届きました/);
  assert.match(prompt, /Q-001: staging を優先してください/);
  assert.equal(secondPrompt, 'base prompt');

  rmSync(rootDir, { recursive: true, force: true });
});
