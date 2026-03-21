import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHash } from 'node:crypto';
import type { Duplex } from 'node:stream';

import type { RunActions } from '../actions/run-actions.ts';
import type { AppConfig } from '../config.ts';
import { resolveStaticFile, renderPanelHtml } from './html.ts';

export interface PanelServerHooks {
  onAbort?: () => void;
  onDiscordReconnect?: () => Promise<void> | void;
}

const JSON_BODY_LIMIT = 1024 * 1024;

class HttpError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

function isPanelAuthEnabled(config: AppConfig): boolean {
  return config.panelUsername.trim().length > 0 && config.panelPassword.trim().length > 0;
}

function isAuthorized(request: IncomingMessage, config: AppConfig): boolean {
  if (!isPanelAuthEnabled(config)) {
    return true;
  }

  const header = request.headers.authorization;
  if (!header?.startsWith('Basic ')) {
    return false;
  }

  const encoded = header.slice('Basic '.length).trim();
  const actual = Buffer.from(encoded, 'base64').toString('utf8');
  return actual === `${config.panelUsername}:${config.panelPassword}`;
}

function writeUnauthorized(response: ServerResponse): void {
  writeText(response, 401, '認証が必要です', {
    'www-authenticate': 'Basic realm="Ralph Panel", charset="UTF-8"',
  });
}

function writeJson(response: ServerResponse, statusCode: number, data: unknown): void {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function writeText(
  response: ServerResponse,
  statusCode: number,
  message: string,
  headers: Record<string, string> = {},
): void {
  response.writeHead(statusCode, {
    'content-type': 'text/plain; charset=utf-8',
    ...headers,
  });
  response.end(message);
}

function writeError(response: ServerResponse, error: unknown): void {
  if (response.writableEnded) {
    return;
  }

  if (error instanceof HttpError) {
    writeText(response, error.statusCode, error.message);
    return;
  }

  console.error('panel: request failed', error);
  writeText(response, 500, 'panel request failed');
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  for await (const chunk of request) {
    const buffer = Buffer.from(chunk);
    totalSize += buffer.byteLength;
    if (totalSize > JSON_BODY_LIMIT) {
      throw new HttpError(413, 'リクエストボディが大きすぎます');
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'JSON を読み取れませんでした');
  }
}

// --- Minimal WebSocket implementation ---

const WS_GUID = '258EAFA5-E914-47DA-95CA-5AB5DC11E5B5';
const wsClients = new Set<Duplex>();

function encodeWsFrame(data: string): Buffer {
  const payload = Buffer.from(data, 'utf8');
  const len = payload.length;
  let header: Buffer;
  if (len < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text
    header[1] = len;
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payload]);
}

function handleWsUpgrade(request: IncomingMessage, socket: Duplex) {
  const key = request.headers['sec-websocket-key'];
  if (!key) {
    socket.destroy();
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

  wsClients.add(socket);

  socket.on('data', (raw: Buffer) => {
    // Handle close frame or ping
    if (raw.length >= 2) {
      const opcode = raw[0] & 0x0f;
      if (opcode === 0x08) {
        // Close frame
        wsClients.delete(socket);
        socket.end();
      } else if (opcode === 0x09) {
        // Ping - send pong
        const pong = Buffer.from(raw);
        pong[0] = (pong[0] & 0xf0) | 0x0a;
        socket.write(pong);
      }
    }
  });

  socket.on('close', () => wsClients.delete(socket));
  socket.on('error', () => wsClients.delete(socket));

  // Send initial refresh
  socket.write(encodeWsFrame(JSON.stringify({ type: 'connected' })));
}

export function notifyClients(): void {
  const frame = encodeWsFrame(JSON.stringify({ type: 'refresh' }));
  for (const socket of wsClients) {
    try {
      socket.write(frame);
    } catch {
      wsClients.delete(socket);
    }
  }
}

// --- CORS ---

function addCorsHeaders(response: ServerResponse): void {
  response.setHeader('access-control-allow-origin', '*');
  response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
  response.setHeader('access-control-allow-headers', 'content-type, authorization');
}

export function startPanelServer(
  config: AppConfig,
  actions: RunActions,
  hooks: PanelServerHooks = {},
) {
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    try {
      addCorsHeaders(response);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        response.writeHead(204);
        response.end();
        return;
      }

      if (!isAuthorized(request, config)) {
        writeUnauthorized(response);
        return;
      }

      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

      // --- API Routes ---

      if (request.method === 'GET' && url.pathname === '/api/dashboard') {
        writeJson(response, 200, await actions.getDashboardData());
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/start') {
        writeJson(response, 200, await actions.requestRunStart({ source: 'web' }));
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/settings') {
        const body = await readJsonBody(request);
        try {
          writeJson(
            response,
            200,
            await actions.updateRuntimeSettings(
              {
                taskName: typeof body.taskName === 'string' ? body.taskName : undefined,
                agentCommand: typeof body.agentCommand === 'string' ? body.agentCommand : undefined,
                agentCwd: typeof body.agentCwd === 'string' ? body.agentCwd : undefined,
                promptFile: typeof body.promptFile === 'string' ? body.promptFile : undefined,
                promptBody: typeof body.promptBody === 'string' ? body.promptBody : undefined,
                discordNotifyChannelId:
                  typeof body.discordNotifyChannelId === 'string' ? body.discordNotifyChannelId : undefined,
                maxIterations:
                  body.maxIterations !== undefined ? Number.parseInt(String(body.maxIterations), 10) : undefined,
                idleSeconds:
                  body.idleSeconds !== undefined ? Number.parseInt(String(body.idleSeconds), 10) : undefined,
                mode:
                  body.mode === 'demo'
                    ? 'demo'
                    : body.mode === 'command'
                      ? 'command'
                      : undefined,
              },
              { source: 'web' },
            ),
          );
        } catch (error) {
          throw new HttpError(400, error instanceof Error ? error.message : '設定を更新できませんでした');
        }
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/discord/reconnect') {
        if (!hooks.onDiscordReconnect) {
          throw new HttpError(409, 'Discord bridge は現在起動していません');
        }

        try {
          await hooks.onDiscordReconnect();
        } catch (error) {
          throw new HttpError(409, error instanceof Error ? error.message : 'Discord を再接続できませんでした');
        }

        writeJson(response, 200, { ok: true });
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/pause') {
        try {
          writeJson(response, 200, await actions.pauseRun({ source: 'web' }));
        } catch (error) {
          throw new HttpError(409, error instanceof Error ? error.message : 'pause できませんでした');
        }
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/resume') {
        try {
          writeJson(response, 200, await actions.resumeRun({ source: 'web' }));
        } catch (error) {
          throw new HttpError(409, error instanceof Error ? error.message : 'resume できませんでした');
        }
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/abort') {
        let data;
        try {
          data = await actions.abortRun({ source: 'web' });
        } catch (error) {
          throw new HttpError(409, error instanceof Error ? error.message : '中断できませんでした');
        }
        hooks.onAbort?.();
        writeJson(response, 200, data);
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/answer') {
        const body = await readJsonBody(request);
        if (typeof body.questionId !== 'string' || typeof body.answer !== 'string' || !body.questionId || !body.answer) {
          throw new HttpError(400, '質問IDと回答の両方が必要です');
        }

        try {
          writeJson(response, 200, await actions.submitAnswer(body.questionId, body.answer, { source: 'web' }));
        } catch (error) {
          throw new HttpError(400, error instanceof Error ? error.message : '回答を保存できませんでした');
        }
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/note') {
        const body = await readJsonBody(request);
        if (typeof body.note !== 'string' || !body.note) {
          throw new HttpError(400, 'メモを入力してください');
        }

        await actions.enqueueManualNote(body.note, { source: 'web' });
        writeJson(response, 200, { ok: true });
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/task/import/preview') {
        const body = await readJsonBody(request);
        if (typeof body.specText !== 'string' || !body.specText.trim()) {
          throw new HttpError(400, '仕様書を貼り付けてください');
        }

        writeJson(response, 200, await actions.previewTaskImport(body.specText));
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/task/import') {
        try {
          const body = await readJsonBody(request);
          if (typeof body.specText !== 'string' || !body.specText.trim()) {
            throw new HttpError(400, '仕様書を貼り付けてください');
          }

          writeJson(response, 200, await actions.importTasksFromSpec(body.specText, { source: 'web' }));
        } catch (error) {
          if (error instanceof HttpError) {
            throw error;
          }
          throw new HttpError(400, error instanceof Error ? error.message : 'Task を一括追加できませんでした');
        }
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/task/create') {
        try {
          const body = await readJsonBody(request);
          writeJson(
            response,
            200,
            await actions.createTask(
              {
                title: typeof body.title === 'string' ? body.title : undefined,
                summary: typeof body.summary === 'string' ? body.summary : undefined,
              },
              { source: 'web' },
            ),
          );
        } catch (error) {
          throw new HttpError(400, error instanceof Error ? error.message : 'Task を作成できませんでした');
        }
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/task/update') {
        const body = await readJsonBody(request);
        if (typeof body.taskId !== 'string' || !body.taskId) {
          throw new HttpError(400, '更新対象のTask IDが必要です');
        }

        const data = await actions.updateTask(
          body.taskId,
          {
            title: typeof body.title === 'string' ? body.title : undefined,
            summary: typeof body.summary === 'string' ? body.summary : undefined,
          },
          { source: 'web' },
        );

        if (!data) {
          throw new HttpError(404, '指定した Task が見つかりません');
        }

        writeJson(response, 200, data);
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/task/complete') {
        const body = await readJsonBody(request);
        if (typeof body.taskId !== 'string' || !body.taskId) {
          throw new HttpError(400, '完了にするTask IDが必要です');
        }

        const data = await actions.completeTask(body.taskId, { source: 'web' });
        if (!data) {
          throw new HttpError(404, '指定した Task が見つかりません');
        }

        writeJson(response, 200, data);
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/task/reopen') {
        const body = await readJsonBody(request);
        if (typeof body.taskId !== 'string' || !body.taskId) {
          throw new HttpError(400, '戻すTask IDが必要です');
        }

        const data = await actions.reopenTask(body.taskId, { source: 'web' });
        if (!data) {
          throw new HttpError(404, '指定した Task が見つかりません');
        }

        writeJson(response, 200, data);
        notifyClients();
        return;
      }

      if (request.method === 'POST' && url.pathname === '/api/task/move') {
        const body = await readJsonBody(request);
        if (typeof body.taskId !== 'string' || !body.taskId) {
          throw new HttpError(400, '並び替えるTask IDが必要です');
        }
        if (body.position !== 'front' && body.position !== 'back') {
          throw new HttpError(400, 'position は front または back で指定してください');
        }

        const data = await actions.moveTask(body.taskId, body.position, { source: 'web' });
        if (!data) {
          throw new HttpError(404, '指定した Task が見つかりません');
        }

        writeJson(response, 200, data);
        notifyClients();
        return;
      }

      // --- Static file serving ---

      if (request.method === 'GET') {
        const staticFile = resolveStaticFile(url.pathname);
        if (staticFile) {
          response.writeHead(200, { 'content-type': staticFile.contentType });
          response.end(staticFile.content);
          return;
        }

        // SPA fallback: serve index.html for non-API, non-asset GET requests
        const indexFile = resolveStaticFile('/');
        if (indexFile) {
          response.writeHead(200, { 'content-type': indexFile.contentType });
          response.end(indexFile.content);
          return;
        }
      }

      throw new HttpError(404, 'ページが見つかりません');
    } catch (error) {
      writeError(response, error);
    }
  });

  // WebSocket upgrade handler
  server.on('upgrade', (request: IncomingMessage, socket: Duplex) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    if (url.pathname === '/ws') {
      handleWsUpgrade(request, socket);
    } else {
      socket.destroy();
    }
  });

  server.listen(config.panelPort, config.panelHost, () => {
    console.log(`panel: http://${config.panelHost}:${config.panelPort}`);
  });

  return server;
}
