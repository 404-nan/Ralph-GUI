import { panelStyles } from './styles.ts';

export function renderPanelHtml(): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Ralph — Mission Control</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>${panelStyles}</style>
</head>
<body>
<div class="toast-container" id="toasts"></div>

<div class="app">
  <!-- TOP BAR -->
  <header class="topbar">
    <div class="topbar-logo">Ralph</div>
    <div id="pill" class="pill pill-idle"><span class="dot"></span><span id="pillText">待機</span></div>
    <div class="topbar-spacer"></div>
    <div class="topbar-actions">
      <button id="startBtn" class="btn btn-cyan btn-sm" onclick="doStart()">実行開始</button>
      <button id="pauseBtn" class="btn btn-amber btn-sm" onclick="doPause()">一時停止</button>
      <button id="resumeBtn" class="btn btn-ghost btn-sm" onclick="doResume()">再開</button>
      <button id="abortBtn" class="btn btn-red btn-sm" onclick="doAbort()">中断</button>
    </div>
  </header>

  <!-- GRID -->
  <div class="grid">
    <!-- LEFT: Main workspace -->
    <div class="left-col">
      <div class="panel panel-pad">
        <div class="hero">
          <div id="heroStatus" class="hero-status">読み込み中...</div>
          <div class="hero-meta">
            <span id="heroIter">反復 0/0</span>
            <span id="heroTask" class="mono">—</span>
            <span id="heroTime" class="mono">—</span>
          </div>
          <div class="progress"><div id="progFill" class="progress-fill" style="width:0%"></div></div>
        </div>
        <div id="questionArea"></div>
        <div id="taskPairArea"></div>
        <div class="note-wrap">
          <textarea id="noteInput" rows="1" placeholder="メモを次のターンに送る..."></textarea>
          <button class="btn btn-cyan btn-sm" onclick="sendNote()">送信</button>
        </div>
      </div>
    </div>

    <!-- RIGHT: Sidebar -->
    <div class="sidebar">
      <!-- Tasks -->
      <div class="panel">
        <div class="panel-head">
          <div class="tl-header"><span class="panel-title">Tasks</span><span id="tlMeta" class="tl-count"></span></div>
          <button class="btn btn-cyan btn-sm" onclick="showAddTask()">+ 追加</button>
        </div>
        <div style="padding:14px 20px">
          <div id="tfArea"></div>
          <div class="import-box">
            <div class="import-head">
              <div>
                <div class="panel-title">README / PRD から一括追加</div>
                <div class="import-copy">README、要件メモ、issue、ChatGPT の JSON をそのまま貼れます。</div>
              </div>
              <div class="import-actions">
                <button id="taskImportPreviewBtn" class="btn btn-ghost btn-sm" onclick="previewTaskImport()">Preview</button>
                <button id="taskImportImportBtn" class="btn btn-cyan btn-sm" onclick="importTaskSpec()">Task化</button>
              </div>
            </div>
            <textarea id="taskImportInput" class="import-input" rows="8" placeholder="README、PRD、issue、要件メモ、または userStories JSON を貼り付ける"></textarea>
            <div class="import-foot">
              <span class="field-hint">見出し / 箇条書き / JSON に対応。preview で確認してから Task 化できます。</span>
              <button class="btn btn-ghost btn-sm" onclick="clearTaskImport()">クリア</button>
            </div>
            <div id="taskImportPreview" class="import-preview"></div>
          </div>
          <div class="tl-filters" id="filterBar">
            <button class="chip active" data-f="open">未完了</button>
            <button class="chip" data-f="done">完了</button>
            <button class="chip" data-f="all">すべて</button>
          </div>
          <input id="tlSearch" class="tl-search" placeholder="検索..."/>
          <div id="taskList"></div>
        </div>
      </div>

      <!-- Settings (collapsible) -->
      <div class="panel">
        <button class="section-toggle" onclick="toggleSection(this)">設定 <span class="arrow">▾</span></button>
        <div class="section-body">
          <form id="settingsForm" class="s-grid" onsubmit="saveSettings(event)">
            <div class="field"><label>Task名</label><input id="sTaskName"/></div>
            <div class="field"><label>回数</label><input id="sMaxIter" type="number" min="1"/></div>
            <div class="field"><label>待機秒</label><input id="sIdle" type="number" min="1"/></div>
            <div class="field"><label>方式</label><select id="sMode"><option value="command">通常</option><option value="demo">デモ</option></select></div>
            <div class="field full"><label>コマンド</label><input id="sAgent"/><div id="sAgentHint" class="field-hint"></div></div>
            <div class="field full"><label>Promptファイル</label><input id="sPromptFile"/></div>
            <div class="field full"><label>Prompt上書き</label><textarea id="sPromptBody" rows="2" placeholder="直接promptを書く"></textarea></div>
            <div class="field full"><button type="submit" class="btn btn-cyan" style="width:100%">保存</button></div>
          </form>
        </div>
      </div>

      <!-- Logs (collapsible) -->
      <div class="panel">
        <button class="section-toggle" onclick="toggleSection(this)">ログ <span class="arrow">▾</span></button>
        <div class="section-body">
          <div style="margin-bottom:16px">
            <div class="panel-title" style="margin-bottom:8px">最近のイベント</div>
            <div id="evList"></div>
          </div>
          <div>
            <div class="panel-title" style="margin-bottom:8px">エージェント出力 <span id="logLines" style="font-weight:400"></span></div>
            <pre id="agentLog" class="log-pre">読み込み中...</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
${renderScript()}
</script>
</body>
</html>`;
}

function renderScript(): string {
  return `
// ── State ──────────────────────────────────────
let dashboardData = null;
let taskFilter = 'open';
let searchQuery = '';
let settingsDirty = false;
let canEditAgent = false;
let editingTaskId = '';
let taskImportPreview = null;
let taskImportPreviewTimer = null;

// ── Helpers ────────────────────────────────────
function esc(v) {
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function enc(v) { return encodeURIComponent(String(v ?? '')); }
function dec(v) { try { return decodeURIComponent(String(v ?? '')); } catch { return String(v ?? ''); } }
function fTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return iso; }
}
function lcLbl(v) {
  return { starting: '開始中', running: '実行中', paused: '一時停止', pause_requested: '停止待ち', completed: '完了', aborted: '中断', failed: '失敗' }[v] || '待機';
}
function lcCls(v) {
  if (['starting', 'running'].includes(v)) return 'pill-running';
  if (['paused', 'pause_requested'].includes(v)) return 'pill-paused';
  if (v === 'completed') return 'pill-done';
  if (['failed', 'aborted'].includes(v)) return 'pill-error';
  return 'pill-idle';
}

// ── Toast (max 5) ──────────────────────────────
const TOAST_MAX = 5;
function toast(msg, tone = 'info') {
  const container = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast toast-' + tone;
  el.textContent = msg;
  container.appendChild(el);
  // Enforce max visible toasts
  while (container.children.length > TOAST_MAX) {
    container.removeChild(container.firstChild);
  }
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3500);
}

// ── Section toggle ─────────────────────────────
function toggleSection(btn) {
  btn.classList.toggle('open');
  btn.nextElementSibling.classList.toggle('open');
}

// ── API ────────────────────────────────────────
async function api(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  if (!r.ok) { toast(await r.text() || 'エラー', 'error'); return null; }
  return r.json().catch(() => ({}));
}

async function doStart() { const r = await api('/api/start'); if (r) toast(r.message || '実行要求', r.started ? 'success' : 'warning'); await refresh(); }
async function doPause() { if (await api('/api/pause')) toast('一時停止', 'warning'); await refresh(); }
async function doResume() { if (await api('/api/resume')) toast('再開', 'success'); await refresh(); }
async function doAbort() { if (!confirm('runを中断しますか？')) return; if (await api('/api/abort')) toast('中断', 'warning'); await refresh(); }

async function sendNote() {
  const input = document.getElementById('noteInput');
  const val = input.value.trim();
  if (!val) { toast('メモを入力', 'warning'); return; }
  if (await api('/api/note', { note: val })) { input.value = ''; toast('メモを送信', 'success'); await refresh(); }
}

async function answerQ(qid) {
  const ta = document.getElementById('ans_' + qid);
  if (!ta) return;
  const val = ta.value.trim();
  if (!val) { toast('回答を入力', 'warning'); return; }
  if (await api('/api/answer', { questionId: qid, answer: val })) { toast('回答を送信', 'success'); await refresh(); }
}

async function completeTask(id) { if (await api('/api/task/complete', { taskId: id })) { toast(id + ' 完了', 'success'); await refresh(); } }
async function reopenTask(id) { if (await api('/api/task/reopen', { taskId: id })) { toast(id + ' 未完了に', 'warning'); await refresh(); } }
async function moveTask(id, pos) { if (await api('/api/task/move', { taskId: id, position: pos })) { toast(pos === 'front' ? '最優先に' : '後ろへ', 'success'); await refresh(); } }

// ── Task form ──────────────────────────────────
function showAddTask() { editingTaskId = ''; renderTF(); }
function editTask(id, title, summary) { editingTaskId = id; renderTF(title, summary); }
function hideTF() { editingTaskId = ''; document.getElementById('tfArea').innerHTML = ''; }
function renderTF(title, summary) {
  document.getElementById('tfArea').innerHTML =
    '<div class="tf"><div class="tf-title"><span>' + (editingTaskId ? esc(editingTaskId) + ' を編集' : '新しいTask') + '</span><button class="btn btn-ghost btn-sm" onclick="hideTF()">閉じる</button></div>' +
    '<form onsubmit="submitTF(event)"><input id="tfT" placeholder="Task名" value="' + esc(title || '') + '"/>' +
    '<textarea id="tfS" rows="2" placeholder="説明・完了条件">' + esc(summary || '') + '</textarea>' +
    '<button type="submit" class="btn btn-cyan btn-sm">保存</button></form></div>';
  document.getElementById('tfT').focus();
}
async function submitTF(e) {
  e.preventDefault();
  const title = document.getElementById('tfT').value.trim();
  const summary = document.getElementById('tfS').value.trim();
  if (!title) { toast('Task名を入力', 'warning'); return; }
  if (editingTaskId) { if (await api('/api/task/update', { taskId: editingTaskId, title, summary })) toast(editingTaskId + ' 更新', 'success'); }
  else { if (await api('/api/task/create', { title, summary })) toast('Task追加', 'success'); }
  hideTF(); await refresh();
}

// ── Task import ─────────────────────────────────
function importFormatLabel(format) {
  return { json: 'JSON', list: '箇条書き', headings: '見出し', empty: '未検出' }[format] || format;
}
function taskImportText() {
  return document.getElementById('taskImportInput').value || '';
}
function clearTaskImportPreviewTimer() {
  if (taskImportPreviewTimer) {
    clearTimeout(taskImportPreviewTimer);
    taskImportPreviewTimer = null;
  }
}
function renderTaskImportPreview() {
  const input = taskImportText().trim();
  const wrap = document.getElementById('taskImportPreview');
  const previewBtn = document.getElementById('taskImportPreviewBtn');
  const importBtn = document.getElementById('taskImportImportBtn');

  previewBtn.disabled = !input;
  importBtn.disabled = !input || !taskImportPreview || !taskImportPreview.tasks || taskImportPreview.tasks.length === 0;

  if (!input) {
    taskImportPreview = null;
    wrap.innerHTML = '<div class="import-empty">README、PRD、issue、要件メモ、または ChatGPT が返した userStories JSON を貼ると preview できます。</div>';
    return;
  }

  if (!taskImportPreview) {
    wrap.innerHTML = '<div class="import-empty">入力中です。少し待つか Preview を押すと Task 候補を解析します。</div>';
    return;
  }

  if (!taskImportPreview.tasks || taskImportPreview.tasks.length === 0) {
    wrap.innerHTML = '<div class="import-empty">Task に分解できる項目がまだ見つかっていません。見出し、箇条書き、または JSON を試してください。</div>';
    return;
  }

  const items = taskImportPreview.tasks.slice(0, 6).map((task, index) =>
    '<div class="import-item">' +
      '<div class="import-item-head"><span class="import-item-index">' + String(index + 1) + '</span><span class="import-item-title">' + esc(task.title) + '</span></div>' +
      '<div class="import-item-summary">' + esc(task.summary || task.title) + '</div>' +
      (task.acceptanceCriteria && task.acceptanceCriteria.length
        ? '<div class="import-item-criteria">' + task.acceptanceCriteria.slice(0, 3).map(item => '<span class="import-chip">' + esc(item) + '</span>').join('') + '</div>'
        : '') +
    '</div>'
  ).join('');

  wrap.innerHTML =
    '<div class="import-meta">' +
      '<span class="import-pill">' + esc(importFormatLabel(taskImportPreview.format)) + '</span>' +
      '<span>' + esc(taskImportPreview.tasks.length) + ' 件 preview</span>' +
      (taskImportPreview.truncated ? '<span class="import-warn">先頭 40 件までに切り詰めています</span>' : '') +
    '</div>' +
    items +
    (taskImportPreview.tasks.length > 6 ? '<div class="import-more">ほか ' + esc(taskImportPreview.tasks.length - 6) + ' 件</div>' : '');
}
async function previewTaskImport() {
  clearTaskImportPreviewTimer();
  const specText = taskImportText().trim();
  if (!specText) {
    taskImportPreview = null;
    renderTaskImportPreview();
    toast('README か仕様メモを貼ってください', 'warning');
    return;
  }

  const preview = await api('/api/task/import/preview', { specText });
  if (!preview) return;
  taskImportPreview = preview;
  renderTaskImportPreview();
}
function scheduleTaskImportPreview() {
  taskImportPreview = null;
  renderTaskImportPreview();
  clearTaskImportPreviewTimer();
  if (!taskImportText().trim()) return;
  taskImportPreviewTimer = setTimeout(() => { void previewTaskImport(); }, 450);
}
async function importTaskSpec() {
  clearTaskImportPreviewTimer();
  const specText = taskImportText().trim();
  if (!specText) {
    toast('README か仕様メモを貼ってください', 'warning');
    return;
  }

  const result = await api('/api/task/import', { specText });
  if (!result) return;
  toast((result.tasks?.length || 0) + ' 件のTaskを追加', 'success');
  document.getElementById('taskImportInput').value = '';
  taskImportPreview = null;
  renderTaskImportPreview();
  await refresh();
}
function clearTaskImport() {
  clearTaskImportPreviewTimer();
  document.getElementById('taskImportInput').value = '';
  taskImportPreview = null;
  renderTaskImportPreview();
}

// ── Settings ───────────────────────────────────
async function saveSettings(e) {
  e.preventDefault();
  const r = await api('/api/settings', {
    taskName: document.getElementById('sTaskName').value.trim(),
    maxIterations: parseInt(document.getElementById('sMaxIter').value, 10),
    idleSeconds: parseInt(document.getElementById('sIdle').value, 10),
    mode: document.getElementById('sMode').value,
    agentCommand: canEditAgent ? document.getElementById('sAgent').value.trim() : undefined,
    promptFile: document.getElementById('sPromptFile').value.trim(),
    promptBody: document.getElementById('sPromptBody').value,
  });
  if (r) { settingsDirty = false; toast('設定を保存', 'success'); await refresh(); }
}

// ── Render: Home ───────────────────────────────
function renderHome(d) {
  const st = d.status;
  document.getElementById('heroStatus').textContent = st.thinkingText || st.currentStatusText || '待機中';
  document.getElementById('heroIter').textContent = '反復 ' + st.iteration + '/' + st.maxIterations;
  document.getElementById('heroTask').textContent = st.task || '—';
  document.getElementById('heroTime').textContent = fTime(st.updatedAt);
  const pct = st.maxIterations > 0 ? Math.round(st.iteration / st.maxIterations * 100) : 0;
  document.getElementById('progFill').style.width = pct + '%';
  const pill = document.getElementById('pill');
  pill.className = 'pill ' + lcCls(st.lifecycle);
  pill.querySelector('#pillText').textContent = lcLbl(st.lifecycle);

  // Questions — use data-* attributes for answer buttons
  const qa = document.getElementById('questionArea');
  const pq = d.pendingQuestions || [];
  qa.innerHTML = pq.map(q =>
    '<div class="q-card"><div class="q-label">' + esc(q.id) + ' · 回答待ち</div>' +
    '<div class="q-text">' + esc(q.text) + '</div>' +
    '<div class="q-form"><textarea id="ans_' + esc(q.id) + '" rows="1" placeholder="回答を入力..."></textarea>' +
    '<button class="btn btn-cyan btn-sm" data-answer-qid="' + esc(enc(q.id)) + '">送信</button></div></div>'
  ).join('');

  // Task pair
  const tp = document.getElementById('taskPairArea');
  const ct = d.currentTask, nt = d.nextTask;
  if (ct || nt) {
    tp.innerHTML = '<div class="task-pair">' +
      (ct ? '<div class="tp-card current"><div class="tp-label">現在</div><div class="tp-title">' + esc(ct.title) + '</div><div class="tp-id">' + esc(ct.id) + '</div></div>' : '') +
      (nt ? '<div class="tp-card next"><div class="tp-label">次</div><div class="tp-title">' + esc(nt.title) + '</div><div class="tp-id">' + esc(nt.id) + '</div></div>' : '') +
      '</div>';
  } else {
    tp.innerHTML = '';
  }

  // Controls
  const running = ['starting', 'running'].includes(st.lifecycle);
  const paused = ['paused', 'pause_requested'].includes(st.lifecycle);
  const ready = st.task && (st.mode === 'demo' || st.agentCommand);
  const hasTasks = (d.taskBoard || []).length > 0;
  document.getElementById('startBtn').disabled = !hasTasks || !ready || st.phase === 'queued' || running || paused;
  document.getElementById('startBtn').textContent = st.phase === 'queued' ? '予約済み' : st.lifecycle === 'completed' ? '再実行' : '実行開始';
  document.getElementById('pauseBtn').disabled = !running;
  document.getElementById('resumeBtn').disabled = !paused;
  document.getElementById('abortBtn').disabled = !running && !paused && st.phase !== 'queued';
}

// ── Render: Tasks ──────────────────────────────
function renderTasks(d) {
  const items = d.taskBoard || [], ct = d.currentTask, nt = d.nextTask;
  const q = searchQuery.toLowerCase();
  let filtered = items;
  if (taskFilter === 'open') filtered = items.filter(i => i.displayStatus !== 'completed');
  else if (taskFilter === 'done') filtered = items.filter(i => i.displayStatus === 'completed');
  if (q) filtered = filtered.filter(i => [i.id, i.title, i.summary].join(' ').toLowerCase().includes(q));
  document.getElementById('tlMeta').textContent = filtered.length + '/' + items.length + '件';
  document.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('active', b.dataset.f === taskFilter));
  const el = document.getElementById('taskList');
  if (!items.length) { el.innerHTML = '<div class="empty"><div class="empty-title">Taskがまだありません</div><div class="empty-copy">最初のTaskを追加して運用を始めましょう</div><button class="btn btn-cyan" onclick="showAddTask()">Taskを追加</button></div>'; return; }
  if (!filtered.length) { el.innerHTML = '<div class="empty"><div class="empty-copy">条件に合うTaskはありません</div></div>'; return; }
  const groups = ['active', 'queued', 'blocked', 'completed'];
  const gL = { active: '進行中', queued: '待機', blocked: '停止', completed: '完了' };
  let h = '';
  for (const g of groups) {
    const gi = filtered.filter(i => i.displayStatus === g);
    if (!gi.length) continue;
    h += '<div class="tl-group">' + esc(gL[g]) + ' · ' + gi.length + '件</div>';
    for (const item of gi) {
      const isCur = ct && ct.id === item.id, isNx = nt && nt.id === item.id, isDone = item.displayStatus === 'completed';
      const eidEnc = esc(enc(item.id)), etitleEnc = esc(enc(item.title)), esummaryEnc = esc(enc(item.summary || ''));
      h += '<div class="tl-item' + (isCur ? ' is-cur' : '') + (isNx ? ' is-nxt' : '') + '">' +
        '<button class="tl-check' + (isDone ? ' done' : '') + '" data-act="' + (isDone ? 'reopen' : 'complete') + '" data-task-id="' + eidEnc + '">✓</button>' +
        '<div class="tl-body"><div class="tl-head"><span class="tl-id">' + esc(item.id) + '</span>' +
        (isCur ? '<span class="tl-badge badge-cur">現在</span>' : '') +
        (isNx ? '<span class="tl-badge badge-nxt">次</span>' : '') +
        '</div><div class="tl-title">' + esc(item.title) + '</div>' +
        (item.summary && item.summary !== item.title ? '<div class="tl-summary">' + esc(item.summary) + '</div>' : '') +
        '<div class="tl-actions">' +
        (!isDone ? '<button class="btn btn-ghost btn-sm" data-act="move-front" data-task-id="' + eidEnc + '">最優先</button><button class="btn btn-ghost btn-sm" data-act="move-back" data-task-id="' + eidEnc + '">後ろへ</button>' : '') +
        '<button class="btn btn-ghost btn-sm" data-act="edit" data-task-id="' + eidEnc + '" data-task-title="' + etitleEnc + '" data-task-summary="' + esummaryEnc + '">編集</button>' +
        '</div></div></div>';
    }
  }
  el.innerHTML = h;
}

// ── Render: Logs & Settings ────────────────────
function renderLogs(d) {
  const events = d.recentEvents || [];
  const el = document.getElementById('evList');
  el.innerHTML = events.length
    ? events.map(e => '<div class="ev-row"><div class="ev-time">' + fTime(e.timestamp) + '</div><div><div class="ev-type">' + esc(e.type) + '</div><div class="ev-msg">' + esc(e.message) + '</div></div></div>').join('')
    : '<div style="color:var(--text-muted);font-size:.8rem">イベントなし</div>';
  const log = d.agentLogTail || [];
  document.getElementById('agentLog').textContent = log.join('\\n') || '(出力なし)';
  document.getElementById('logLines').textContent = '(' + log.filter(Boolean).length + '行)';
  if (!settingsDirty && d.settings) {
    const s = d.settings;
    document.getElementById('sTaskName').value = s.taskName || '';
    document.getElementById('sMaxIter').value = s.maxIterations || 1;
    document.getElementById('sIdle').value = s.idleSeconds || 1;
    document.getElementById('sMode').value = s.mode || 'command';
    document.getElementById('sAgent').value = s.agentCommand || '';
    document.getElementById('sPromptFile').value = s.promptFile || '';
    document.getElementById('sPromptBody').value = s.promptBody || '';
    document.getElementById('sAgent').disabled = !canEditAgent;
    document.getElementById('sAgentHint').textContent = canEditAgent ? '変更可' : '起動時設定に固定中';
  }
}

// ── Refresh ────────────────────────────────────
async function refresh() {
  try {
    const r = await fetch('/api/dashboard');
    dashboardData = await r.json();
    canEditAgent = dashboardData.capabilities?.canEditAgentCommand || false;
    renderHome(dashboardData);
    renderTasks(dashboardData);
    renderLogs(dashboardData);
  } catch (e) { console.error(e); }
}

// ── Event Delegation ───────────────────────────
document.getElementById('filterBar').addEventListener('click', e => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  taskFilter = b.dataset.f;
  if (dashboardData) renderTasks(dashboardData);
});

document.getElementById('taskList').addEventListener('click', e => {
  if (!(e.target instanceof HTMLElement)) return;
  const button = e.target.closest('[data-act]');
  if (!(button instanceof HTMLElement)) return;
  const taskId = dec(button.dataset.taskId || '');
  if (!taskId) return;
  const act = button.dataset.act || '';
  if (act === 'complete') { void completeTask(taskId); return; }
  if (act === 'reopen') { void reopenTask(taskId); return; }
  if (act === 'move-front') { void moveTask(taskId, 'front'); return; }
  if (act === 'move-back') { void moveTask(taskId, 'back'); return; }
  if (act === 'edit') { editTask(taskId, dec(button.dataset.taskTitle || ''), dec(button.dataset.taskSummary || '')); }
});

// Event delegation for question answer buttons
document.getElementById('questionArea').addEventListener('click', e => {
  if (!(e.target instanceof HTMLElement)) return;
  const button = e.target.closest('[data-answer-qid]');
  if (!(button instanceof HTMLElement)) return;
  const qid = dec(button.dataset.answerQid || '');
  if (qid) void answerQ(qid);
});

document.getElementById('tlSearch').addEventListener('input', e => { searchQuery = e.target.value; if (dashboardData) renderTasks(dashboardData); });
document.getElementById('noteInput').addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); sendNote(); } });
document.getElementById('taskImportInput').addEventListener('input', () => scheduleTaskImportPreview());
document.querySelectorAll('#settingsForm input, #settingsForm textarea, #settingsForm select').forEach(el => {
  el.addEventListener('input', () => settingsDirty = true);
  el.addEventListener('change', () => settingsDirty = true);
});

setInterval(() => refresh().catch(console.error), 4000);
refresh().catch(console.error);
renderTaskImportPreview();
`;
}
