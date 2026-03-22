import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import test from 'node:test';

import type { AppConfig } from '../config.ts';
import { RunActions } from '../actions/run-actions.ts';
import { FileStateStore } from '../state/store.ts';
import { startPanelServer } from './server.ts';

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
    panelPort: 0,
    panelHost: '127.0.0.1',
    panelUsername: 'ralph',
    panelPassword: 'secret',
    allowRuntimeAgentCommandOverride: false,
    taskName: 'panel test',
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
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-panel-'));
  mkdirSync(join(rootDir, 'prompts'), { recursive: true });
  writeFileSync(join(rootDir, 'prompts', 'supervisor.md'), 'base prompt', 'utf8');
  return rootDir;
}

function basicAuth(config: AppConfig): string {
  return `Basic ${Buffer.from(`${config.panelUsername}:${config.panelPassword}`).toString('base64')}`;
}

async function startSystem(config: AppConfig) {
  const store = new FileStateStore(config);
  await store.ensureInitialized();
  const actions = new RunActions(store, config);
  const server = startPanelServer(config, actions);
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  const baseUrl = `http://${config.panelHost}:${address.port}`;

  return { server, baseUrl };
}

async function closeServer(server: ReturnType<typeof startPanelServer>): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

async function wsHandshake(baseUrl: string, path: string, authHeader?: string): Promise<string> {
  const url = new URL(path, baseUrl);

  return new Promise((resolve, reject) => {
    const request = httpRequest({
      protocol: url.protocol,
      hostname: url.hostname,
      port: Number(url.port),
      path: `${url.pathname}${url.search}`,
      method: 'GET',
      headers: {
        Upgrade: 'websocket',
        Connection: 'Upgrade',
        'Sec-WebSocket-Key': Buffer.from('0123456789abcdef').toString('base64'),
        'Sec-WebSocket-Version': '13',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    request.setTimeout(5000, () => {
      request.destroy(new Error('websocket handshake timed out'));
    });

    request.on('upgrade', (response, socket) => {
      socket.destroy();
      resolve(`HTTP ${response.statusCode}`);
    });

    request.on('response', async (response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of response) {
        chunks.push(Buffer.from(chunk));
      }
      resolve(`HTTP ${response.statusCode} ${Buffer.concat(chunks).toString('utf8')}`);
    });

    request.on('error', reject);
    request.end();
  });
}

async function apiRequest<T>(
  baseUrl: string,
  config: AppConfig,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Authorization', basicAuth(config));
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });
  assert.equal(response.status < 400, true, `${init.method ?? 'GET'} ${path} failed with ${response.status}`);
  const payload = await response.json() as { ok: true; data: T };
  return payload.data;
}

test('panel server requires auth for API requests and rejects cross-origin POSTs', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { server, baseUrl } = await startSystem(config);

  try {
    const unauthorized = await fetch(`${baseUrl}/api/dashboard`);
    assert.equal(unauthorized.status, 401);

    const authorized = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: basicAuth(config) },
    });
    assert.equal(authorized.status, 200);

    const crossOrigin = await fetch(`${baseUrl}/api/note`, {
      method: 'POST',
      headers: {
        Authorization: basicAuth(config),
        Origin: 'http://evil.example',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ note: 'x' }),
    });
    assert.equal(crossOrigin.status, 403);
  } finally {
    await closeServer(server);
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test('panel server issues websocket session tokens and rejects upgrades without one', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { server, baseUrl } = await startSystem(config);

  try {
    const sessionResponse = await fetch(`${baseUrl}/api/session`, {
      headers: { Authorization: basicAuth(config) },
    });
    const sessionPayload = await sessionResponse.json() as { ok: true; data: { token: string } };

    assert.equal(sessionResponse.status, 200);
    assert.ok(sessionPayload.data.token);

    const missingToken = await wsHandshake(baseUrl, '/ws', basicAuth(config));
    assert.match(missingToken, /HTTP 401/);

    assert.match(sessionPayload.data.token, /^[A-Za-z0-9_-]+$/);
  } finally {
    await closeServer(server);
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test('panel server scopes websocket session tokens to the issuing server instance', async () => {
  const rootDirA = makeRoot();
  const rootDirB = makeRoot();
  const configA = makeConfig(rootDirA);
  const configB = makeConfig(rootDirB);
  const { server: serverA, baseUrl: baseUrlA } = await startSystem(configA);
  const { server: serverB, baseUrl: baseUrlB } = await startSystem(configB);

  try {
    const sessionResponse = await fetch(`${baseUrlA}/api/session`, {
      headers: { Authorization: basicAuth(configA) },
    });
    const sessionPayload = await sessionResponse.json() as { ok: true; data: { token: string } };

    assert.equal(sessionResponse.status, 200);
    assert.ok(sessionPayload.data.token);

    const crossServer = await wsHandshake(
      baseUrlB,
      `/ws?token=${sessionPayload.data.token}`,
      basicAuth(configB),
    );
    assert.match(crossServer, /HTTP 401/);

    const sameServer = await wsHandshake(
      baseUrlA,
      `/ws?token=${sessionPayload.data.token}`,
      basicAuth(configA),
    );
    assert.match(sameServer, /HTTP 101/);
  } finally {
    await closeServer(serverA);
    await closeServer(serverB);
    rmSync(rootDirA, { recursive: true, force: true });
    rmSync(rootDirB, { recursive: true, force: true });
  }
});

test('panel server logs the resolved ephemeral port after listen', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const messages: string[] = [];
  const originalLog = console.log;
  let server: ReturnType<typeof startPanelServer> | undefined;

  console.log = (...args: unknown[]) => {
    messages.push(args.map((arg) => String(arg)).join(' '));
  };

  try {
    const started = await startSystem(config);
    server = started.server;
    const address = server.address() as AddressInfo;

    assert.equal(
      messages.some((message) => message === `panel: http://${config.panelHost}:${address.port}`),
      true,
    );
    assert.equal(messages.some((message) => message.endsWith(':0')), false);
  } finally {
    console.log = originalLog;
    if (server) {
      await closeServer(server);
    }
    rmSync(rootDir, { recursive: true, force: true });
  }
});

test('panel server exposes mission-control task flows through authenticated APIs', async () => {
  const rootDir = makeRoot();
  const config = makeConfig(rootDir);
  const { server, baseUrl } = await startSystem(config);

  try {
    const currentTask = await apiRequest<{ id: string }>(baseUrl, config, '/api/task/create', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Mission control dashboard',
        summary: 'Build the current task card',
        priority: 'critical',
        acceptanceCriteria: ['Current task is visible'],
        notes: 'Operator-first view',
        agentId: 'codex',
      }),
    });
    const nextTask = await apiRequest<{ id: string }>(baseUrl, config, '/api/task/create', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Setup diagnostics',
        summary: 'Show settings issues before the run starts',
        priority: 'high',
      }),
    });

    await apiRequest(baseUrl, config, '/api/task/block', {
      method: 'POST',
      body: JSON.stringify({
        taskId: nextTask.id,
        reason: 'Waiting for operator approval',
      }),
    });

    const blockedDashboard = await apiRequest<{
      currentTask?: { id: string };
      blockedTasks: Array<{ id: string; blockedReason?: string }>;
      nextTasks: Array<{ id: string }>;
    }>(baseUrl, config, '/api/dashboard');

    assert.equal(blockedDashboard.currentTask?.id, currentTask.id);
    assert.equal(blockedDashboard.nextTasks.length, 0);
    assert.equal(blockedDashboard.blockedTasks.length, 1);
    assert.equal(blockedDashboard.blockedTasks[0]?.id, nextTask.id);
    assert.equal(blockedDashboard.blockedTasks[0]?.blockedReason, 'Waiting for operator approval');

    await apiRequest(baseUrl, config, '/api/task/unblock', {
      method: 'POST',
      body: JSON.stringify({ taskId: nextTask.id }),
    });
    await apiRequest(baseUrl, config, '/api/task/complete', {
      method: 'POST',
      body: JSON.stringify({ taskId: currentTask.id }),
    });

    const resumedDashboard = await apiRequest<{
      currentTask?: { id: string };
      blockedTasks: Array<{ id: string }>;
      doneTasks: Array<{ id: string }>;
    }>(baseUrl, config, '/api/dashboard');

    assert.equal(resumedDashboard.currentTask?.id, nextTask.id);
    assert.equal(resumedDashboard.blockedTasks.length, 0);
    assert.equal(resumedDashboard.doneTasks.some((task) => task.id === currentTask.id), true);
  } finally {
    await closeServer(server);
    rmSync(rootDir, { recursive: true, force: true });
  }
});
