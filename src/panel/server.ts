import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';

import type { RunActions } from '../actions/run-actions.ts';
import type { AppConfig } from '../config.ts';

export interface PanelServerHooks {
  onAbort?: () => void;
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, string>> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, string>;
}

function renderHtml(): string {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>RalphLoop Panel</title>
  <style>
    :root {
      --bg: #f2efe7;
      --ink: #1d2a33;
      --card: #fffdf8;
      --line: #d4cbb8;
      --accent: #a94918;
      --soft: #f0d9c9;
      --warn: #915f12;
      --danger: #9f2d22;
      --mono: "IBM Plex Mono", Consolas, monospace;
      --sans: "Yu Gothic UI", "Hiragino Sans", sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: var(--ink);
      font-family: var(--sans);
      background:
        radial-gradient(circle at top left, rgba(169, 73, 24, 0.12), transparent 28%),
        linear-gradient(180deg, #f7f3ea 0%, var(--bg) 100%);
    }
    main { max-width: 1280px; margin: 0 auto; padding: 24px; }
    h1, h2 { margin: 0; }
    .hero, .toolbar, .grid, .list, form { display: grid; gap: 12px; }
    .hero { grid-template-columns: 1fr auto; align-items: end; margin-bottom: 18px; }
    .toolbar { grid-auto-flow: column; }
    .grid { grid-template-columns: repeat(12, 1fr); }
    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(20, 30, 40, 0.05);
    }
    .span-3 { grid-column: span 3; }
    .span-4 { grid-column: span 4; }
    .span-6 { grid-column: span 6; }
    .span-8 { grid-column: span 8; }
    .span-12 { grid-column: span 12; }
    .label { font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: #7b878f; }
    .value { font-size: 28px; font-weight: 700; margin-top: 8px; }
    .meta { color: #5d6a71; line-height: 1.5; margin-top: 10px; }
    .item {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px;
      background: #fffaf3;
    }
    .item small { display: block; margin-bottom: 6px; color: #6f7a81; font-family: var(--mono); }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 6px 10px;
      border-radius: 999px;
      background: var(--soft);
      color: var(--accent);
      font-size: 12px;
    }
    textarea, input {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px 12px;
      background: #fff;
      font: inherit;
    }
    button {
      border: none;
      border-radius: 999px;
      padding: 10px 14px;
      cursor: pointer;
      font-weight: 700;
      background: var(--ink);
      color: white;
    }
    button.secondary { background: #61717a; }
    button.warn { background: var(--warn); }
    button.danger { background: var(--danger); }
    pre {
      margin: 0;
      max-height: 340px;
      overflow: auto;
      background: #152028;
      color: #e8f1e8;
      border-radius: 14px;
      padding: 14px;
      font-family: var(--mono);
      white-space: pre-wrap;
    }
    .empty { color: #7f8a90; font-style: italic; }
    @media (max-width: 960px) {
      .hero { grid-template-columns: 1fr; }
      .toolbar { grid-auto-flow: row; }
      .span-3, .span-4, .span-6, .span-8, .span-12 { grid-column: span 12; }
    }
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <div>
        <h1>RalphLoop Supervisor Panel</h1>
        <p>Discord と同じ state を見ながら、pause / resume / abort / answer / note injection を操作する一画面コンソールです。</p>
      </div>
      <div class="toolbar">
        <button class="secondary" onclick="refreshDashboard()">Refresh</button>
        <button class="warn" onclick="postAction('/api/pause')">Pause</button>
        <button onclick="postAction('/api/resume')">Resume</button>
        <button class="danger" onclick="postAction('/api/abort')">Abort</button>
      </div>
    </section>

    <section class="grid">
      <article class="card span-3">
        <div class="label">Run State</div>
        <div id="lifecycle" class="value">-</div>
        <div id="statusMeta" class="meta"></div>
      </article>
      <article class="card span-3">
        <div class="label">Task</div>
        <div id="task" class="value" style="font-size: 20px;">-</div>
        <div id="phaseMeta" class="meta"></div>
      </article>
      <article class="card span-3">
        <div class="label">Iteration</div>
        <div id="iteration" class="value">0</div>
        <div id="iterationMeta" class="meta"></div>
      </article>
      <article class="card span-3">
        <div class="label">Prompt Queue</div>
        <div id="injectionCount" class="value">0</div>
        <div id="queueMeta" class="meta"></div>
      </article>

      <article class="card span-6">
        <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2>Pending Questions</h2>
          <span id="pendingCount" class="pill">0 items</span>
        </header>
        <div id="pendingQuestions" class="list"></div>
      </article>

      <article class="card span-6">
        <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2>Prompt Injection Queue</h2>
          <span class="pill">one-shot injection</span>
        </header>
        <div id="injectionQueue" class="list"></div>
      </article>

      <article class="card span-6">
        <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2>Manual Note</h2>
          <span class="pill">next turn only</span>
        </header>
        <form onsubmit="submitNote(event)">
          <textarea id="noteText" rows="4" placeholder="次ターン prompt に一度だけ差し込むメモ"></textarea>
          <button type="submit">Add Note</button>
        </form>
      </article>

      <article class="card span-6">
        <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2>Answered Questions</h2>
          <span id="answeredCount" class="pill">0 items</span>
        </header>
        <div id="answeredQuestions" class="list"></div>
      </article>

      <article class="card span-4">
        <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2>Blockers</h2>
          <span id="blockerCount" class="pill">0 items</span>
        </header>
        <div id="blockers" class="list"></div>
      </article>

      <article class="card span-8">
        <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2>Recent Events</h2>
          <span class="pill">JSONL tail</span>
        </header>
        <pre id="eventsLog">(loading)</pre>
      </article>

      <article class="card span-12">
        <header style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2>Agent Output Tail</h2>
          <span class="pill">latest log</span>
        </header>
        <pre id="agentLog">(loading)</pre>
      </article>
    </section>
  </main>

  <script>
    function escapeHtml(value) {
      return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    async function postAction(path, payload = {}) {
      const response = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        alert(await response.text());
        return;
      }
      await refreshDashboard();
    }

    async function submitNote(event) {
      event.preventDefault();
      const note = document.getElementById('noteText').value.trim();
      if (!note) return;
      await postAction('/api/note', { note });
      document.getElementById('noteText').value = '';
    }

    async function submitAnswer(questionId) {
      const input = document.getElementById('answer-' + questionId);
      const answer = input.value.trim();
      if (!answer) return;
      await postAction('/api/answer', { questionId, answer });
      input.value = '';
    }

    function renderList(rootId, html, emptyText) {
      const root = document.getElementById(rootId);
      root.innerHTML = html || '<div class="empty">' + escapeHtml(emptyText) + '</div>';
    }

    function renderPendingQuestions(items) {
      document.getElementById('pendingCount').textContent = items.length + ' items';
      renderList('pendingQuestions', items.map((item) => \`
        <div class="item">
          <small>\${escapeHtml(item.id)} / \${escapeHtml(item.createdAt)}</small>
          <div>\${escapeHtml(item.text)}</div>
          <form onsubmit="event.preventDefault(); submitAnswer('\${escapeHtml(item.id)}');">
            <textarea id="answer-\${escapeHtml(item.id)}" rows="3" placeholder="この質問への回答"></textarea>
            <button type="submit">Submit Answer</button>
          </form>
        </div>
      \`).join(''), 'pending question はありません');
    }

    function renderInjectionQueue(items) {
      renderList('injectionQueue', items.map((item) => \`
        <div class="item">
          <small>\${escapeHtml(item.kind)} / \${escapeHtml(item.label)} / \${escapeHtml(item.createdAt)}</small>
          <div>\${escapeHtml(item.text)}</div>
        </div>
      \`).join(''), '注入待ち項目はありません');
    }

    function renderAnswered(items) {
      document.getElementById('answeredCount').textContent = items.length + ' items';
      renderList('answeredQuestions', items.map((item) => \`
        <div class="item">
          <small>\${escapeHtml(item.id)} / answered at \${escapeHtml(item.answeredAt || '-')}</small>
          <div><strong>Q:</strong> \${escapeHtml(item.text)}</div>
          <div><strong>A:</strong> \${escapeHtml(item.answer?.answer || '(missing)')}</div>
        </div>
      \`).join(''), 'まだ回答済み質問はありません');
    }

    function renderBlockers(items) {
      document.getElementById('blockerCount').textContent = items.length + ' items';
      renderList('blockers', items.map((item) => \`
        <div class="item">
          <small>\${escapeHtml(item.id)} / \${escapeHtml(item.createdAt)}</small>
          <div>\${escapeHtml(item.text)}</div>
        </div>
      \`).join(''), 'blocker はありません');
    }

    async function refreshDashboard() {
      const response = await fetch('/api/dashboard');
      const data = await response.json();

      document.getElementById('lifecycle').textContent = data.status.lifecycle;
      document.getElementById('task').textContent = data.status.task;
      document.getElementById('iteration').textContent = String(data.status.iteration);
      document.getElementById('injectionCount').textContent = String(data.status.pendingInjectionCount);
      document.getElementById('statusMeta').innerHTML =
        '<div>control: ' + escapeHtml(data.status.control) + '</div>' +
        '<div>updated: ' + escapeHtml(data.status.updatedAt) + '</div>';
      document.getElementById('phaseMeta').innerHTML =
        '<div>phase: ' + escapeHtml(data.status.phase) + '</div>' +
        '<div>status: ' + escapeHtml(data.status.currentStatusText) + '</div>';
      document.getElementById('iterationMeta').innerHTML =
        '<div>max: ' + escapeHtml(String(data.status.maxIterations)) + '</div>' +
        '<div>mode: ' + escapeHtml(data.status.mode) + '</div>';
      document.getElementById('queueMeta').innerHTML =
        '<div>pending questions: ' + escapeHtml(String(data.status.pendingQuestionCount)) + '</div>' +
        '<div>answered: ' + escapeHtml(String(data.status.answeredQuestionCount)) + '</div>';

      renderPendingQuestions(data.pendingQuestions);
      renderInjectionQueue(data.promptInjectionQueue);
      renderAnswered(data.answeredQuestions);
      renderBlockers(data.blockers);
      document.getElementById('eventsLog').textContent = data.recentEvents
        .map((event) => JSON.stringify(event))
        .join('\\n');
      document.getElementById('agentLog').textContent = data.agentLogTail.join('\\n');
    }

    setInterval(refreshDashboard, 5000);
    refreshDashboard();
  </script>
</body>
</html>`;
}

export function startPanelServer(
  config: AppConfig,
  actions: RunActions,
  hooks: PanelServerHooks = {},
) {
  const html = renderHtml();

  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

    if (request.method === 'GET' && url.pathname === '/') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(html);
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/dashboard') {
      const data = await actions.getDashboardData();
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(data));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/pause') {
      const data = await actions.pauseRun({ source: 'web' });
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(data));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/resume') {
      const data = await actions.resumeRun({ source: 'web' });
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(data));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/abort') {
      const data = await actions.abortRun({ source: 'web' });
      hooks.onAbort?.();
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(data));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/answer') {
      const body = await readJsonBody(request);
      if (!body.questionId || !body.answer) {
        response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('questionId and answer are required');
        return;
      }

      const data = await actions.submitAnswer(body.questionId, body.answer, { source: 'web' });
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(data));
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/note') {
      const body = await readJsonBody(request);
      if (!body.note) {
        response.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('note is required');
        return;
      }

      await actions.enqueueManualNote(body.note, { source: 'web' });
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('not found');
  });

  server.listen(config.panelPort, config.panelHost, () => {
    console.log(`panel: http://${config.panelHost}:${config.panelPort}`);
  });

  return server;
}
