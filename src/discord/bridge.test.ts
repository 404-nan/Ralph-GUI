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
    agentCwd: rootDir,
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
    discordAppName: 'RalphGUI',
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

test('Discord notifications use the runtime-updated notify channel id', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-discord-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), '# prompt\n', 'utf8');

  const config = makeConfig(rootDir);
  const store = new FileStateStore(config);
  await store.ensureInitialized();
  const actions = new RunActions(store, config);
  const bridge = new DiscordBridge(config, actions);

  try {
    await actions.updateRuntimeSettings({ discordNotifyChannelId: 'channel-2' }, { source: 'web' });
    assert.equal(await bridge.resolveNotificationChannelId(), 'channel-2');
  } finally {
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test('Discord notifications fall back to notify channel when DM delivery is blocked', async () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-discord-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), '# prompt\n', 'utf8');

  const config = makeConfig(rootDir);
  config.discordDmUserId = 'user-1';
  const store = new FileStateStore(config);
  await store.ensureInitialized();
  const actions = new RunActions(store, config);
  const bridge = new DiscordBridge(config, actions);
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = input instanceof Request ? input.url : String(input);
    requests.push(url);

    if (url.endsWith('/users/@me/channels')) {
      return new Response(JSON.stringify({ id: 'dm-channel-1' }), { status: 200 });
    }

    if (url.endsWith('/channels/dm-channel-1/messages')) {
      return new Response(
        JSON.stringify({ message: 'Cannot send messages to this user', code: 50278 }),
        { status: 403 },
      );
    }

    if (url.endsWith('/channels/channel-1/messages')) {
      return new Response('{}', { status: 200 });
    }

    throw new Error(`unexpected fetch: ${url}`);
  }) as typeof fetch;

  try {
    await bridge.notifyStatus('hello');

    assert.deepEqual(requests, [
      'https://discord.com/api/v10/users/@me/channels',
      'https://discord.com/api/v10/channels/dm-channel-1/messages',
      'https://discord.com/api/v10/channels/channel-1/messages',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    rmSync(rootDir, { recursive: true, force: true });
  }
});
