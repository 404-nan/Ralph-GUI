import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import type { AppConfig } from '../config.ts';
import { RunActions } from '../actions/run-actions.ts';
import { FileStateStore } from '../state/store.ts';
import { DiscordBridge, isDiscordOperatorAllowed, isDiscordOriginAllowed } from './bridge.ts';

function makeConfig(rootDir: string = '/tmp'): AppConfig {
  return {
    rootDir,
    promptFile: join(rootDir, 'prompts', 'supervisor.md'),
    taskCatalogFile: '',
    stateDir: join(rootDir, 'state'),
    logDir: join(rootDir, 'logs'),
    agentCommand: 'codex exec',
    mode: 'command',
    maxIterations: 20,
    idleSeconds: 5,
    panelPort: 8787,
    panelHost: '127.0.0.1',
    panelUsername: '',
    panelPassword: '',
    allowRuntimeAgentCommandOverride: false,
    taskName: 'discord review',
    discordToken: 'token',
    discordNotifyChannelId: 'channel-1',
    discordDmUserId: '',
    discordAppName: 'RalphLoop',
    discordAllowedUserIds: [],
    discordGuildId: '',
    discordApplicationId: '',
    discordEnabled: true,
  };
}

test('Discord commands are denied until an operator user is configured', () => {
  const config = makeConfig();

  assert.equal(isDiscordOperatorAllowed(config, 'user-1'), false);

  config.discordDmUserId = 'owner-1';
  assert.equal(isDiscordOperatorAllowed(config, 'owner-1'), true);
  assert.equal(isDiscordOperatorAllowed(config, 'user-1'), false);

  config.discordAllowedUserIds = ['user-1', 'user-2'];
  assert.equal(isDiscordOperatorAllowed(config, 'user-1'), true);
});

test('Discord guild restriction is enforced when configured', () => {
  const config = makeConfig();

  assert.equal(isDiscordOriginAllowed(config, undefined), true);

  config.discordGuildId = 'guild-1';
  assert.equal(isDiscordOriginAllowed(config, 'guild-1'), true);
  assert.equal(isDiscordOriginAllowed(config, 'guild-2'), false);
  assert.equal(isDiscordOriginAllowed(config, undefined), false);
});

test('Discord /task-edit without arguments returns usage instead of throwing', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-discord-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), '# prompt\n', 'utf8');

  const config = makeConfig(rootDir);
  const store = new FileStateStore(config);
  await store.ensureInitialized();
  const actions = new RunActions(store, config);
  const bridge = new DiscordBridge(config, actions);
  const replies: string[] = [];

  try {
    await bridge.executeCommand('task-edit', '', [], async (content) => {
      replies.push(content);
    });

    assert.deepEqual(replies, ['使い方: /task-edit T-001 タイトル | 説明']);
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});
