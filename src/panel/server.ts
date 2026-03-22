import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Duplex } from 'node:stream';

import type { RunActions } from '../actions/run-actions.ts';
import type { AppConfig } from '../config.ts';
import type {
  AgentProfile,
  ApiErrorPayload,
  ApiResponse,
  ImportedTaskDraft,
  RunMode,
  TaskPriority,
} from '../shared/types.ts';
import { renderPanelHtml, resolveStaticFile } from './html.ts';

export interface PanelServerHooks {
  onAbort?: () => void;
  onDiscordReconnect?: () => Promise<void> | void;
  waitForIdle?: () => Promise<void> | void;
}

const JSON_BODY_LIMIT = 1024 * 1024;
const WS_GUID = '258EAFA5-E914-47DA-95CA-5AB5DC11E5B5';
const WS_TOKEN_TTL_MS = 5 * 60 * 1000;

interface PanelRealtimeState {
  wsClients: Set<Duplex>;
  wsSessionTokens: Map<string, number>;
}

function createRealtimeState(): PanelRealtimeState {
  return {
    wsClients: new Set<Duplex>(),
    wsSessionTokens: new Map<string, number>(),
  };
}

function disposeRealtimeState(state: PanelRealtimeState): void {
  state.wsSessionTokens.clear();
  for (const socket of state.wsClients) {
    socket.destroy();
  }
  state.wsClients.clear();
}

class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    options: {
      retryable?: boolean;
      details?: Record<string, unknown>;
    } = {},
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.details = options.details;
  }
}

function isPanelAuthEnabled(config: AppConfig): boolean {
  return config.panelUsername.trim().length > 0 && config.panelPassword.trim().length > 0;
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function parseBasicAuth(header: string | undefined): { username: string; password: string } | null {
  if (!header?.startsWith('Basic ')) {
    return null;
  }

  try {
    const encoded = header.slice('Basic '.length).trim();
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex < 0) {
      return null;
    }
    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function isAuthorized(request: IncomingMessage, config: AppConfig): boolean {
  if (!isPanelAuthEnabled(config)) {
    return true;
  }

  const auth = parseBasicAuth(request.headers.authorization);
  if (!auth) {
    return false;
  }

  return safeCompare(auth.username, config.panelUsername) && safeCompare(auth.password, config.panelPassword);
}

function isLoopbackHost(hostname: string): boolean {
  return ['127.0.0.1', 'localhost', '::1'].includes(hostname);
}

function isTrustedOrigin(request: IncomingMessage, config: AppConfig): boolean {
  const origin = request.headers.origin;
  if (!origin) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(`http://${request.headers.host ?? `${config.panelHost}:${config.panelPort}`}`);

    if (originUrl.host === requestUrl.host) {
      return true;
    }

    if (isLoopbackHost(originUrl.hostname) && isLoopbackHost(requestUrl.hostname)) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function noStore(response: ServerResponse): void {
  response.setHeader('cache-control', 'no-store');
}

function writeJson<T>(response: ServerResponse, statusCode: number, payload: ApiResponse<T>): void {
  noStore(response);
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
}

function writeSuccess<T>(response: ServerResponse, data: T, statusCode: number = 200): void {
  writeJson(response, statusCode, { ok: true, data });
}

function writeError(response: ServerResponse, error: unknown): void {
  if (response.writableEnded) {
    return;
  }

  const payload: ApiErrorPayload =
    error instanceof HttpError
      ? {
          code: error.code,
          message: error.message,
          retryable: error.retryable,
          details: error.details,
        }
      : {
          code: 'internal_error',
          message: 'panel request failed',
          retryable: true,
        };

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  if (!(error instanceof HttpError)) {
    console.error('panel: request failed', error);
  }
  writeJson(response, statusCode, { ok: false, error: payload });
}

function writeUnauthorized(response: ServerResponse): void {
  noStore(response);
  response.writeHead(401, {
    'content-type': 'application/json; charset=utf-8',
    'www-authenticate': 'Basic realm="Ralph Panel", charset="UTF-8"',
  });
  response.end(
    JSON.stringify({
      ok: false,
      error: {
        code: 'unauthorized',
        message: 'Authentication is required.',
      },
    }),
  );
}

function writeWsUnauthorized(socket: Duplex, statusCode: 401 | 403, message: string): void {
  socket.write(
    `HTTP/1.1 ${statusCode} ${statusCode === 401 ? 'Unauthorized' : 'Forbidden'}\r\n` +
    'Connection: close\r\n' +
    'Content-Type: text/plain; charset=utf-8\r\n' +
    `Content-Length: ${Buffer.byteLength(message, 'utf8')}\r\n` +
    '\r\n' +
    message,
  );
  socket.destroy();
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    totalSize += buffer.byteLength;
    if (totalSize > JSON_BODY_LIMIT) {
      throw new HttpError(413, 'payload_too_large', 'Request body is too large.');
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be valid JSON.');
  }
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, 'validation_error', `${field} is required.`);
  }
  return value;
}

function asNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asRunMode(value: unknown): RunMode | undefined {
  return value === 'demo' || value === 'command' ? value : undefined;
}

function asTaskPriority(value: unknown): TaskPriority | undefined {
  return value === 'critical' || value === 'high' || value === 'medium' || value === 'low'
    ? value
    : undefined;
}

function asAgentProfiles(value: unknown): AgentProfile[] | undefined {
  return Array.isArray(value) ? (value as AgentProfile[]) : undefined;
}

function asReviewedDrafts(value: unknown): ImportedTaskDraft[] | undefined {
  return Array.isArray(value) ? (value as ImportedTaskDraft[]) : undefined;
}

function asMovePosition(
  value: unknown,
): 'top' | 'up' | 'down' | 'bottom' | 'front' | 'back' {
  if (
    value === 'top'
    || value === 'up'
    || value === 'down'
    || value === 'bottom'
    || value === 'front'
    || value === 'back'
  ) {
    return value;
  }

  throw new HttpError(
    400,
    'validation_error',
    'position must be one of top, up, down, bottom, front, or back.',
  );
}

function pruneExpiredTokens(state: PanelRealtimeState): void {
  const now = Date.now();
  for (const [token, expiresAt] of state.wsSessionTokens.entries()) {
    if (expiresAt <= now) {
      state.wsSessionTokens.delete(token);
    }
  }
}

function issueWsToken(state: PanelRealtimeState): { token: string; expiresAt: string } {
  pruneExpiredTokens(state);
  const token = randomBytes(24).toString('base64url');
  const expiresAt = Date.now() + WS_TOKEN_TTL_MS;
  state.wsSessionTokens.set(token, expiresAt);
  return { token, expiresAt: new Date(expiresAt).toISOString() };
}

function consumeWsToken(state: PanelRealtimeState, token: string | null): boolean {
  pruneExpiredTokens(state);
  if (!token) {
    return false;
  }

  const expiresAt = state.wsSessionTokens.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    state.wsSessionTokens.delete(token);
    return false;
  }

  state.wsSessionTokens.delete(token);
  return true;
}

function encodeWsFrame(data: string): Buffer {
  const payload = Buffer.from(data, 'utf8');
  const len = payload.length;

  if (len < 126) {
    return Buffer.concat([Buffer.from([0x81, len]), payload]);
  }

  if (len < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
    return Buffer.concat([header, payload]);
  }

  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(len), 2);
  return Buffer.concat([header, payload]);
}

function broadcast(state: PanelRealtimeState, message: Record<string, unknown>): void {
  const frame = encodeWsFrame(JSON.stringify(message));
  for (const socket of state.wsClients) {
    try {
      socket.write(frame);
    } catch {
      state.wsClients.delete(socket);
    }
  }
}

function handleWsUpgrade(
  request: IncomingMessage,
  socket: Duplex,
  config: AppConfig,
  state: PanelRealtimeState,
): void {
  if (!isTrustedOrigin(request, config)) {
    writeWsUnauthorized(socket, 403, 'Untrusted origin.');
    return;
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  if (!consumeWsToken(state, url.searchParams.get('token'))) {
    writeWsUnauthorized(socket, 401, 'Missing or expired WebSocket session token.');
    return;
  }

  const key = request.headers['sec-websocket-key'];
  if (!key) {
    writeWsUnauthorized(socket, 401, 'Missing WebSocket key.');
    return;
  }

  const accept = createHash('sha1').update(key + WS_GUID).digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n` +
    '\r\n',
  );

  state.wsClients.add(socket);

  socket.on('data', (raw: Buffer) => {
    if (raw.length < 2) {
      return;
    }

    const opcode = raw[0] & 0x0f;
    if (opcode === 0x08) {
      state.wsClients.delete(socket);
      socket.end();
      return;
    }

    if (opcode === 0x09) {
      const pong = Buffer.from(raw);
      pong[0] = (pong[0] & 0xf0) | 0x0a;
      socket.write(pong);
    }
  });

  socket.on('close', () => state.wsClients.delete(socket));
  socket.on('error', () => state.wsClients.delete(socket));
  socket.write(encodeWsFrame(JSON.stringify({ type: 'connected' })));
}

function notifyClients(state: PanelRealtimeState): void {
  broadcast(state, { type: 'refresh' });
}

function formatPanelUrl(server: ReturnType<typeof createServer>, config: AppConfig): string {
  const address = server.address();
  if (!address) {
    return `http://${config.panelHost}:${config.panelPort}`;
  }

  if (typeof address === 'string') {
    return address;
  }

  return `http://${config.panelHost}:${address.port}`;
}

async function routeApiRequest(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
  actions: RunActions,
  hooks: PanelServerHooks,
  realtimeState: PanelRealtimeState,
): Promise<boolean> {
  if (request.method === 'GET' && url.pathname === '/api/dashboard') {
    writeSuccess(response, await actions.getDashboardData());
    return true;
  }

  if (request.method === 'GET' && url.pathname === '/api/session') {
    writeSuccess(response, issueWsToken(realtimeState));
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/start') {
    writeSuccess(response, await actions.requestRunStart({ source: 'web' }));
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/settings') {
    const body = await readJsonBody(request);
    try {
      writeSuccess(
        response,
        await actions.updateRuntimeSettings(
          {
            taskName: asString(body.taskName),
            agentCommand: asString(body.agentCommand),
            agentCwd: asString(body.agentCwd),
            promptFile: asString(body.promptFile),
            promptBody: asString(body.promptBody),
            discordNotifyChannelId: asString(body.discordNotifyChannelId),
            maxIterations: asNumber(body.maxIterations),
            idleSeconds: asNumber(body.idleSeconds),
            mode: asRunMode(body.mode),
            agentProfiles: asAgentProfiles(body.agentProfiles),
          },
          { source: 'web' },
        ),
      );
    } catch (error) {
      throw new HttpError(400, 'settings_update_failed', error instanceof Error ? error.message : 'Failed to update settings.');
    }
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/settings/quick-test') {
    writeSuccess(response, await actions.quickTestRuntimeSettings({ source: 'web' }));
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/discord/reconnect') {
    if (!hooks.onDiscordReconnect) {
      throw new HttpError(409, 'discord_not_running', 'Discord bridge is not running.');
    }

    try {
      await hooks.onDiscordReconnect();
    } catch (error) {
      throw new HttpError(409, 'discord_reconnect_failed', error instanceof Error ? error.message : 'Discord reconnect failed.');
    }

    writeSuccess(response, { ok: true });
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/pause') {
    try {
      writeSuccess(response, await actions.pauseRun({ source: 'web' }));
    } catch (error) {
      throw new HttpError(409, 'pause_failed', error instanceof Error ? error.message : 'Pause failed.');
    }
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/resume') {
    try {
      writeSuccess(response, await actions.resumeRun({ source: 'web' }));
    } catch (error) {
      throw new HttpError(409, 'resume_failed', error instanceof Error ? error.message : 'Resume failed.');
    }
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/abort') {
    try {
      const data = await actions.abortRun({ source: 'web' });
      hooks.onAbort?.();
      writeSuccess(response, data);
    } catch (error) {
      throw new HttpError(409, 'abort_failed', error instanceof Error ? error.message : 'Abort failed.');
    }
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/reset') {
    try {
      const status = actions.getStatus();
      const mustCoordinateReset =
        status.control === 'abort_requested'
        || status.phase === 'queued'
        || ['starting', 'running', 'pause_requested', 'paused'].includes(status.lifecycle);

      if (mustCoordinateReset) {
        if (!hooks.waitForIdle) {
          throw new HttpError(409, 'reset_conflict', 'Cannot reset state while a run is still active.');
        }

        if (status.control !== 'abort_requested') {
          await actions.abortRun({ source: 'web' });
        }
        hooks.onAbort?.();
        await hooks.waitForIdle();
      }

      writeSuccess(response, { status: actions.resetRuntimeData() });
    } catch (error) {
      if (error instanceof HttpError) {
        throw error;
      }
      throw new HttpError(409, 'reset_failed', error instanceof Error ? error.message : 'State reset failed.');
    }
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/answer') {
    const body = await readJsonBody(request);
    writeSuccess(
      response,
      await actions.submitAnswer(
        asRequiredString(body.questionId, 'questionId'),
        asRequiredString(body.answer, 'answer'),
        { source: 'web' },
      ),
    );
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/note') {
    const body = await readJsonBody(request);
    await actions.enqueueManualNote(asRequiredString(body.note, 'note'), { source: 'web' });
    writeSuccess(response, { ok: true });
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/task/import/preview') {
    const body = await readJsonBody(request);
    writeSuccess(response, await actions.previewTaskImport(asRequiredString(body.specText, 'specText')));
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/task/import') {
    const body = await readJsonBody(request);
    try {
      writeSuccess(
        response,
        await actions.importTasksFromSpec(
          asRequiredString(body.specText, 'specText'),
          { source: 'web' },
          asReviewedDrafts(body.reviewedDrafts),
        ),
      );
    } catch (error) {
      throw new HttpError(400, 'task_import_failed', error instanceof Error ? error.message : 'Task import failed.');
    }
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/task/create') {
    const body = await readJsonBody(request);
    writeSuccess(
      response,
      await actions.createTask(
          {
            title: asString(body.title),
            summary: asString(body.summary),
            priority: asTaskPriority(body.priority),
            acceptanceCriteria: Array.isArray(body.acceptanceCriteria) ? body.acceptanceCriteria as string[] : undefined,
            notes: asString(body.notes),
            blockedReason: asString(body.blockedReason),
          agentId: asString(body.agentId),
        },
        { source: 'web' },
      ),
    );
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/task/update') {
    const body = await readJsonBody(request);
    const task = await actions.updateTask(
      asRequiredString(body.taskId, 'taskId'),
      {
        title: asString(body.title),
        summary: asString(body.summary),
        priority: asTaskPriority(body.priority),
        acceptanceCriteria: Array.isArray(body.acceptanceCriteria) ? body.acceptanceCriteria as string[] : undefined,
        notes: asString(body.notes),
        blockedReason: asString(body.blockedReason),
        agentId: asString(body.agentId),
      },
      { source: 'web' },
    );

    if (!task) {
      throw new HttpError(404, 'task_not_found', 'Task not found.');
    }

    writeSuccess(response, task);
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/task/complete') {
    const body = await readJsonBody(request);
    const task = await actions.completeTask(asRequiredString(body.taskId, 'taskId'), { source: 'web' });
    if (!task) {
      throw new HttpError(404, 'task_not_found', 'Task not found.');
    }
    writeSuccess(response, task);
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/task/reopen') {
    const body = await readJsonBody(request);
    const task = await actions.reopenTask(asRequiredString(body.taskId, 'taskId'), { source: 'web' });
    if (!task) {
      throw new HttpError(404, 'task_not_found', 'Task not found.');
    }
    writeSuccess(response, task);
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/task/block') {
    const body = await readJsonBody(request);
    const task = await actions.blockTask(
      asRequiredString(body.taskId, 'taskId'),
      asRequiredString(body.reason, 'reason'),
      { source: 'web' },
    );
    if (!task) {
      throw new HttpError(404, 'task_not_found', 'Task not found.');
    }
    writeSuccess(response, task);
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/task/unblock') {
    const body = await readJsonBody(request);
    const task = await actions.unblockTask(asRequiredString(body.taskId, 'taskId'), { source: 'web' });
    if (!task) {
      throw new HttpError(404, 'task_not_found', 'Task not found.');
    }
    writeSuccess(response, task);
    notifyClients(realtimeState);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/task/move') {
    const body = await readJsonBody(request);
    const task = await actions.moveTask(
      asRequiredString(body.taskId, 'taskId'),
      asMovePosition(body.position),
      { source: 'web' },
    );
    if (!task) {
      throw new HttpError(404, 'task_not_found', 'Task not found.');
    }
    writeSuccess(response, task);
    notifyClients(realtimeState);
    return true;
  }

  return false;
}

export function startPanelServer(
  config: AppConfig,
  actions: RunActions,
  hooks: PanelServerHooks = {},
) {
  const realtimeState = createRealtimeState();
  const isHtmlNavigation = (pathname: string): boolean => pathname === '/' || !/\.[^/]+$/.test(pathname);
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    try {
      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

      if (request.method !== 'GET' && request.method !== 'HEAD' && !isTrustedOrigin(request, config)) {
        throw new HttpError(403, 'forbidden_origin', 'Requests must originate from the local panel.');
      }

      if (url.pathname.startsWith('/api/')) {
        if (!isAuthorized(request, config)) {
          writeUnauthorized(response);
          return;
        }

        const handled = await routeApiRequest(request, response, url, actions, hooks, realtimeState);
        if (!handled) {
          throw new HttpError(404, 'not_found', 'API route not found.');
        }
        return;
      }

      if (!isAuthorized(request, config)) {
        writeUnauthorized(response);
        return;
      }

      if (request.method === 'GET' || request.method === 'HEAD') {
        const staticFile = resolveStaticFile(url.pathname);
        if (staticFile) {
          noStore(response);
          response.writeHead(200, { 'content-type': staticFile.contentType });
          if (request.method === 'HEAD') {
            response.end();
          } else {
            response.end(staticFile.content);
          }
          return;
        }

        if (isHtmlNavigation(url.pathname)) {
          const html = renderPanelHtml();
          noStore(response);
          response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
          if (request.method === 'HEAD') {
            response.end();
          } else {
            response.end(html);
          }
          return;
        }
      }

      throw new HttpError(404, 'not_found', 'Page not found.');
    } catch (error) {
      writeError(response, error);
    }
  });

  server.on('upgrade', (request: IncomingMessage, socket: Duplex) => {
    try {
      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
      if (url.pathname !== '/ws') {
        socket.destroy();
        return;
      }

      if (!isAuthorized(request, config)) {
        writeWsUnauthorized(socket, 401, 'Authentication is required.');
        return;
      }

      handleWsUpgrade(request, socket, config, realtimeState);
    } catch {
      socket.destroy();
    }
  });

  const closeServer = server.close.bind(server);
  server.close = ((callback?: (error?: Error) => void) => {
    disposeRealtimeState(realtimeState);
    return closeServer(callback);
  }) as typeof server.close;

  server.on('close', () => {
    disposeRealtimeState(realtimeState);
  });

  server.listen(config.panelPort, config.panelHost, () => {
    console.log(`panel: ${formatPanelUrl(server, config)}`);
  });

  return server;
}
