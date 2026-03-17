import { panelStyles } from './styles.ts';

export function renderPanelHtml(): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Ralph | 相談しながら進める画面</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet"/>
<style>${panelStyles}</style>
</head>
<body>
<div class="toast-container" id="toasts"></div>

<div class="app">
  <header class="topbar">
    <button id="sidebarToggleBtn" class="icon-btn" onclick="toggleSidebar()" aria-label="サイドバーを開閉">
      <span class="icon-btn-mark">☰</span>
      <span id="sidebarToggleCount" class="icon-btn-count is-hidden">0</span>
    </button>
    <div class="topbar-brand">
      <div class="topbar-logo">Ralph</div>
      <div class="topbar-brand-copy">
        <div id="topbarProject" class="topbar-project">プロジェクトを確認しています</div>
        <div id="topbarProjectPath" class="topbar-subtle">作業フォルダを確認しています</div>
      </div>
    </div>
    <div class="topbar-meta">
      <div class="topbar-meta-block">
        <div class="topbar-meta-label">モデル</div>
        <div id="topbarModel" class="mini-pill">確認中</div>
      </div>
      <div id="pill" class="pill pill-idle"><span class="dot"></span><span id="pillText">待機</span></div>
    </div>
  </header>

  <div class="app-shell">
    <aside id="sidebar" class="sidebar-panel">
      <div class="sidebar-scroll">
        <div class="sidebar-head">
          <div>
            <div class="panel-title">管理と詳細</div>
            <div class="sidebar-copy">主画面は会話中心のまま、必要な情報だけをここから開けます。</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="toggleSidebar(false)">閉じる</button>
        </div>

        <div class="sidebar-group">
          <div class="sidebar-group-label">管理</div>
          <div class="sidebar-group-copy">作業の切り替え、確認、やること、簡単な設定</div>
        </div>

        <section id="sessionSection" class="panel">
          <button class="section-toggle open" onclick="toggleSection(this)">作業セッション <span class="arrow">▾</span></button>
          <div class="section-body open">
            <div id="sessionPanel"></div>
          </div>
        </section>

        <section id="inboxSection" class="panel">
          <button class="section-toggle open" onclick="toggleSection(this)">Inbox <span class="arrow">▾</span></button>
          <div class="section-body open">
            <div id="inboxList"></div>
          </div>
        </section>

        <section id="tasksSection" class="panel">
          <button class="section-toggle open" onclick="toggleSection(this)">やること <span class="arrow">▾</span></button>
          <div class="section-body open">
            <div class="sidebar-actions">
              <button class="btn btn-cyan btn-sm" onclick="showAddTask()">やることを追加</button>
              <button class="btn btn-ghost btn-sm" onclick="toggleTaskImport()">まとめて追加</button>
            </div>
            <div id="tfArea"></div>
            <div id="taskImportWrap" class="inline-panel is-hidden">
              <div class="import-box">
                <div class="import-head">
                  <div>
                    <div class="panel-title">仕様やメモからまとめて追加</div>
                    <div class="import-copy">README、要件メモ、issue などを貼り付けると、やることに分けて追加できます。</div>
                  </div>
                  <div class="import-actions">
                    <button id="taskImportPreviewBtn" class="btn btn-ghost btn-sm" onclick="previewTaskImport()">内容を確認</button>
                    <button id="taskImportImportBtn" class="btn btn-cyan btn-sm" onclick="importTaskSpec()">やることとして追加</button>
                  </div>
                </div>
                <textarea id="taskImportInput" class="import-input" rows="8" placeholder="README、要件メモ、issue、仕様テキストを貼り付ける"></textarea>
                <div class="import-foot">
                  <span class="field-hint">見出し、箇条書き、JSON を読み取れます。確認してから追加できます。</span>
                  <button class="btn btn-ghost btn-sm" onclick="clearTaskImport()">クリア</button>
                </div>
                <div id="taskImportPreview" class="import-preview"></div>
              </div>
            </div>
            <div id="taskList"></div>
          </div>
        </section>

        <section id="previewSection" class="panel">
          <button class="section-toggle" onclick="toggleSection(this)">次に反映する内容 <span class="arrow">▾</span></button>
          <div class="section-body">
            <div id="previewList"></div>
          </div>
        </section>

        <section id="quickSettingsSection" class="panel">
          <button class="section-toggle" onclick="toggleSection(this)">かんたん設定 <span class="arrow">▾</span></button>
          <div class="section-body">
            <form id="quickSettingsForm" class="s-grid quick-grid" onsubmit="saveQuickSettings(event)">
              <div class="field full"><label>今回の依頼</label><input id="qTaskName" placeholder="何を進めたいかを短く書く"/></div>
              <div class="field"><label>回数</label><input id="qMaxIter" type="number" min="1"/></div>
              <div class="field"><label>待機秒</label><input id="qIdle" type="number" min="1"/></div>
              <div class="field full"><label>動かし方</label><select id="qMode"><option value="command">通常</option><option value="demo">デモ</option></select></div>
              <div class="field full"><button type="submit" class="btn btn-cyan" style="width:100%">かんたん設定を保存</button></div>
            </form>
          </div>
        </section>

        <div class="sidebar-group">
          <div class="sidebar-group-label">詳細</div>
          <div class="sidebar-group-copy">上級者向けの実行環境、診断、詳細ログ</div>
        </div>

        <section id="resourcesSection" class="panel">
          <button class="section-toggle" onclick="toggleSection(this)">実行環境 <span class="settings-tag">詳細</span><span class="arrow">▾</span></button>
          <div class="section-body">
            <div id="resourceList"></div>
          </div>
        </section>

        <section id="diagnosticsSection" class="panel">
          <button class="section-toggle" onclick="toggleSection(this)">診断 <span class="settings-tag">詳細</span><span class="arrow">▾</span></button>
          <div class="section-body">
            <div id="diagnosticList"></div>
          </div>
        </section>

        <section id="advancedSection" class="panel">
          <button class="section-toggle" onclick="toggleSection(this)">高度な設定 <span class="settings-tag">上級者向け</span><span class="arrow">▾</span></button>
          <div class="section-body">
            <div id="advancedSummary" class="advanced-summary"></div>
            <form id="advancedSettingsForm" class="s-grid" onsubmit="saveAdvancedSettings(event)">
              <div class="field full"><label>実行コマンド</label><input id="sAgent"/><div id="sAgentHint" class="field-hint"></div></div>
              <div class="field full"><label>作業フォルダ</label><input id="sAgentCwd" placeholder="/abs/path/to/repo"/><div class="field-hint">空にすると Ralph を起動した場所を使います。</div></div>
              <div class="field full"><label>指示ファイル</label><input id="sPromptFile"/></div>
              <div class="field full"><label>追加の指示</label><textarea id="sPromptBody" rows="3" placeholder="補足したい指示を書く"></textarea></div>
              <div class="field full"><label>Discord 通知先</label><input id="sDiscordChannel" placeholder="123456789012345678"/><div class="field-hint">通知先だけをここから変更できます。</div></div>
              <div class="field full"><button type="button" class="btn btn-ghost" style="width:100%" onclick="doDiscordReconnect()">Discord をつなぎ直す</button></div>
              <div class="field full"><button type="submit" class="btn btn-cyan" style="width:100%">高度な設定を保存</button></div>
            </form>
          </div>
        </section>

        <section id="logsSection" class="panel">
          <button class="section-toggle" onclick="toggleSection(this)">ログ <span class="settings-tag">詳細</span><span class="arrow">▾</span></button>
          <div class="section-body">
            <div class="log-stack">
              <div>
                <div class="panel-title" style="margin-bottom:8px">最近の動き</div>
                <div id="evList"></div>
              </div>
              <div>
                <div class="panel-title" style="margin-bottom:8px">エージェント出力</div>
                <pre id="agentLog" class="log-pre">読み込み中...</pre>
              </div>
            </div>
          </div>
        </section>
      </div>
    </aside>

    <main class="main-col">
      <section class="panel panel-pad status-panel">
        <div class="section-label">今の状況</div>
        <div id="heroStatus" class="hero-status">読み込み中...</div>
        <div id="heroHighlights" class="hero-highlights"></div>
        <div class="status-grid">
          <div class="status-box">
            <div class="status-label">今回の依頼</div>
            <div id="heroRequest" class="status-value">—</div>
          </div>
          <div class="status-box">
            <div class="status-label">今やっていること</div>
            <div id="heroCurrentTask" class="status-value">—</div>
          </div>
          <div class="status-box">
            <div class="status-label">次にやること</div>
            <div id="heroNextTask" class="status-value">—</div>
          </div>
        </div>
        <div class="control-row">
          <button id="startBtn" class="btn btn-cyan" onclick="doStart()">はじめる</button>
          <button id="pauseBtn" class="btn btn-amber" onclick="doPause()">いったん止める</button>
          <button id="resumeBtn" class="btn btn-ghost" onclick="doResume()">つづける</button>
          <button id="abortBtn" class="btn btn-red" onclick="doAbort()">この作業をやめる</button>
        </div>
      </section>

      <section class="panel panel-pad conversation-panel">
        <div class="conversation-head">
          <div>
            <div class="section-label">会話と進み具合</div>
            <div class="conversation-copy">今進んでいること、できたこと、確認が必要なことをここで追えます。</div>
          </div>
        </div>
        <div id="conversationFeed" class="conversation-feed"></div>
      </section>

      <section class="panel panel-pad composer-panel">
        <div class="composer-head">
          <div class="section-label">伝えること</div>
          <div id="composerTaskChip" class="task-chip is-hidden"></div>
        </div>
        <div class="composer-row">
          <button id="composerMoreBtn" class="icon-btn icon-btn-muted" onclick="toggleComposerTools()" aria-label="追加メニューを開く">
            <span class="icon-btn-mark">＋</span>
          </button>
          <textarea id="noteInput" rows="1" placeholder="Ralph に伝えたいことを書く"></textarea>
          <button class="btn btn-cyan" onclick="sendNote()">送信</button>
        </div>
        <div id="composerTools" class="composer-tools is-hidden">
          <button class="btn btn-ghost btn-sm" onclick="openInbox()">Inbox を見る</button>
          <button class="btn btn-ghost btn-sm" onclick="openTaskComposer()">やることを追加</button>
          <button class="btn btn-ghost btn-sm" onclick="openTaskImport()">仕様から追加</button>
          <button class="btn btn-ghost btn-sm" onclick="openSettings()">設定を開く</button>
        </div>
      </section>
    </main>
  </div>
</div>

<div id="sidebarScrim" class="sidebar-scrim" onclick="toggleSidebar(false)"></div>

<script>
${renderScript()}
</script>
</body>
</html>`;
}

function renderScript(): string {
  return `
let dashboardData = null;
let settingsDirty = false;
let canEditAgent = false;
let editingTaskId = '';
let taskImportPreview = null;
let taskImportPreviewTimer = null;
let sidebarOpen = false;
let composerToolsOpen = false;
let abortCardOpen = false;

function esc(v) {
  return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function enc(v) { return encodeURIComponent(String(v ?? '')); }
function dec(v) { try { return decodeURIComponent(String(v ?? '')); } catch { return String(v ?? ''); } }
function fTime(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}
function lcLbl(v) {
  return { starting: '準備中', running: '作業中', paused: '一時停止', pause_requested: '停止を待っています', completed: '完了', aborted: '中断', failed: '止まっています' }[v] || '待機';
}
function lcCls(v) {
  if (['starting', 'running'].includes(v)) return 'pill-running';
  if (['paused', 'pause_requested'].includes(v)) return 'pill-paused';
  if (v === 'completed') return 'pill-done';
  if (['failed', 'aborted'].includes(v)) return 'pill-error';
  return 'pill-idle';
}
function stripPrefix(message) {
  const text = String(message || '').trim();
  const index = text.indexOf(':');
  return index === -1 ? text : text.slice(index + 1).trim();
}
function trimLines(text, max = 3) {
  const lines = String(text || '').split(/\\r?\\n/).filter(Boolean);
  return lines.slice(0, max).join(' / ');
}

const TOAST_MAX = 5;
function toast(msg, tone = 'info') {
  const container = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast toast-' + tone;
  el.textContent = msg;
  container.appendChild(el);
  while (container.children.length > TOAST_MAX) {
    container.removeChild(container.firstChild);
  }
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 280); }, 3200);
}

function toggleSidebar(force) {
  sidebarOpen = typeof force === 'boolean' ? force : !sidebarOpen;
  document.body.classList.toggle('sidebar-open', sidebarOpen);
  document.getElementById('sidebar').classList.toggle('open', sidebarOpen);
  document.getElementById('sidebarScrim').classList.toggle('open', sidebarOpen);
}
function toggleComposerTools(force) {
  composerToolsOpen = typeof force === 'boolean' ? force : !composerToolsOpen;
  document.getElementById('composerTools').classList.toggle('is-hidden', !composerToolsOpen);
  document.getElementById('composerMoreBtn').classList.toggle('active', composerToolsOpen);
}
function toggleSection(btn) {
  btn.classList.toggle('open');
  btn.nextElementSibling.classList.toggle('open');
}
function openSidebarSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const toggle = section.querySelector('.section-toggle');
  const body = section.querySelector('.section-body');
  if (toggle) toggle.classList.add('open');
  if (body) body.classList.add('open');
  toggleSidebar(true);
}
function openInbox() {
  toggleComposerTools(false);
  openSidebarSection('inboxSection');
}
function openTaskComposer() {
  toggleComposerTools(false);
  openSidebarSection('tasksSection');
  toggleTaskImport(false);
  showAddTask();
}
function openTaskImport() {
  toggleComposerTools(false);
  openSidebarSection('tasksSection');
  toggleTaskImport(true);
}
function openSettings() {
  toggleComposerTools(false);
  openSidebarSection('quickSettingsSection');
}
function toggleTaskImport(force) {
  const wrap = document.getElementById('taskImportWrap');
  const show = typeof force === 'boolean' ? force : wrap.classList.contains('is-hidden');
  wrap.classList.toggle('is-hidden', !show);
}
function autosizeComposer() {
  const input = document.getElementById('noteInput');
  if (!(input instanceof HTMLTextAreaElement)) return;
  input.style.height = '0px';
  input.style.height = Math.min(input.scrollHeight, 180) + 'px';
}

async function api(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  if (!response.ok) {
    toast(await response.text() || 'エラーが発生しました', 'error');
    return null;
  }
  return response.json().catch(() => ({}));
}

async function doStart() {
  const result = await api('/api/start');
  if (result) {
    toast(result.message || '作業を始めます', result.started ? 'success' : 'warning');
    abortCardOpen = false;
    await refresh();
  }
}
async function doPause() {
  if (await api('/api/pause')) {
    toast('作業をいったん止めました', 'warning');
    await refresh();
  }
}
async function doResume() {
  if (await api('/api/resume')) {
    toast('作業を再開しました', 'success');
    await refresh();
  }
}
function doAbort() {
  if (!dashboardData) return;
  abortCardOpen = true;
  renderFeed(dashboardData);
  scrollToCard('abortCard');
}
async function confirmAbort() {
  if (await api('/api/abort')) {
    abortCardOpen = false;
    toast('この作業を止めました', 'warning');
    await refresh();
  }
}
async function doDiscordReconnect() {
  if (await api('/api/discord/reconnect')) {
    toast('Discord をつなぎ直しました', 'success');
    await refresh();
  }
}

async function sendNote(prefill) {
  const input = document.getElementById('noteInput');
  if (prefill) {
    input.value = prefill;
    autosizeComposer();
    input.focus();
    return;
  }
  const value = input.value.trim();
  if (!value) {
    toast('伝えたい内容を書いてください', 'warning');
    return;
  }
  if (await api('/api/note', { note: value })) {
    input.value = '';
    autosizeComposer();
    toggleComposerTools(false);
    toast('内容を受け取りました', 'success');
    await refresh();
  }
}

async function submitDecision(questionId, presetValue) {
  const value = presetValue ?? document.getElementById('ans_' + questionId)?.value?.trim();
  if (!value) {
    toast('返答を入力してください', 'warning');
    return;
  }
  if (await api('/api/answer', { questionId, answer: value })) {
    toast('確認内容を反映しました', 'success');
    await refresh();
    scrollToCard('historySection');
  }
}
function focusDecisionInput(questionId) {
  const input = document.getElementById('ans_' + questionId);
  if (!input) return;
  input.focus();
  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
function scrollToCard(cardId) {
  const target = document.getElementById(cardId);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function completeTask(id) {
  if (await api('/api/task/complete', { taskId: id })) {
    toast('やることを完了にしました', 'success');
    await refresh();
  }
}
async function moveTask(id, pos) {
  if (await api('/api/task/move', { taskId: id, position: pos })) {
    toast(pos === 'front' ? '先に進める作業にしました' : 'あとで進める作業にしました', 'success');
    await refresh();
  }
}

function showAddTask() {
  editingTaskId = '';
  toggleComposerTools(false);
  openSidebarSection('tasksSection');
  renderTF();
}
function editTask(id, title, summary) {
  editingTaskId = id;
  toggleComposerTools(false);
  openSidebarSection('tasksSection');
  renderTF(title, summary);
}
function hideTF() {
  editingTaskId = '';
  document.getElementById('tfArea').innerHTML = '';
}
function renderTF(title, summary) {
  document.getElementById('tfArea').innerHTML =
    '<div class="tf"><div class="tf-title"><span>' + (editingTaskId ? 'やることを編集' : 'やることを追加') + '</span><button class="btn btn-ghost btn-sm" onclick="hideTF()">閉じる</button></div>' +
    '<form onsubmit="submitTF(event)"><input id="tfT" placeholder="やることの名前" value="' + esc(title || '') + '"/>' +
    '<textarea id="tfS" rows="2" placeholder="補足や完了の目安">' + esc(summary || '') + '</textarea>' +
    '<button type="submit" class="btn btn-cyan btn-sm">保存</button></form></div>';
  document.getElementById('tfT').focus();
}
async function submitTF(event) {
  event.preventDefault();
  const title = document.getElementById('tfT').value.trim();
  const summary = document.getElementById('tfS').value.trim();
  if (!title) {
    toast('やることの名前を入力してください', 'warning');
    return;
  }
  if (editingTaskId) {
    if (await api('/api/task/update', { taskId: editingTaskId, title, summary })) {
      toast('やることを更新しました', 'success');
    }
  } else {
    if (await api('/api/task/create', { title, summary })) {
      toast('やることを追加しました', 'success');
    }
  }
  hideTF();
  await refresh();
}

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
    wrap.innerHTML = '<div class="import-empty">仕様やメモを貼ると、追加されるやることをここで確認できます。</div>';
    return;
  }

  if (!taskImportPreview) {
    wrap.innerHTML = '<div class="import-empty">入力内容を確認しています。すぐに一覧が出ます。</div>';
    return;
  }

  if (!taskImportPreview.tasks || taskImportPreview.tasks.length === 0) {
    wrap.innerHTML = '<div class="import-empty">やることに分けられる項目がまだ見つかっていません。見出し、箇条書き、JSON を試してください。</div>';
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
      '<span>' + esc(taskImportPreview.tasks.length) + ' 件を確認できます</span>' +
      (taskImportPreview.truncated ? '<span class="import-warn">先頭 40 件までを表示しています</span>' : '') +
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
    toast('仕様やメモを貼ってください', 'warning');
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
    toast('仕様やメモを貼ってください', 'warning');
    return;
  }
  const result = await api('/api/task/import', { specText });
  if (!result) return;
  toast((result.tasks?.length || 0) + ' 件のやることを追加しました', 'success');
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

function queueKindLabel(kind) {
  return kind === 'answer' ? '回答' : 'メモ';
}
function levelLabel(level) {
  return { ok: '正常', warning: '注意', error: '要確認' }[level] || '正常';
}
function levelClass(level) {
  return 'level-' + (level || 'ok');
}

async function saveQuickSettings(event) {
  event.preventDefault();
  const result = await api('/api/settings', {
    taskName: document.getElementById('qTaskName').value.trim(),
    maxIterations: parseInt(document.getElementById('qMaxIter').value, 10),
    idleSeconds: parseInt(document.getElementById('qIdle').value, 10),
    mode: document.getElementById('qMode').value,
  });
  if (result) {
    settingsDirty = false;
    toast('かんたん設定を保存しました', 'success');
    await refresh();
  }
}

async function saveAdvancedSettings(event) {
  event.preventDefault();
  const result = await api('/api/settings', {
    agentCommand: canEditAgent ? document.getElementById('sAgent').value.trim() : undefined,
    agentCwd: document.getElementById('sAgentCwd').value.trim(),
    promptFile: document.getElementById('sPromptFile').value.trim(),
    promptBody: document.getElementById('sPromptBody').value,
    discordNotifyChannelId: document.getElementById('sDiscordChannel').value.trim(),
  });
  if (result) {
    settingsDirty = false;
    toast('高度な設定を保存しました', 'success');
    await refresh();
  }
}

function renderHeader(d) {
  const status = d.status;
  const surface = d.layers?.surface || {};
  const control = d.layers?.control?.run || {};
  const currentTask = d.currentTask;
  const inboxCount = (d.pendingDecisions || []).length + (d.blockers || []).length;

  document.getElementById('topbarProject').textContent = surface.projectName || '作業フォルダを設定してください';
  document.getElementById('topbarProjectPath').textContent = surface.projectPath || '作業フォルダを設定してください';
  document.getElementById('topbarModel').textContent = surface.modelLabel || '確認中';
  document.getElementById('topbarModel').title = surface.modelDetail || '';

  const pill = document.getElementById('pill');
  pill.className = 'pill ' + lcCls(status.lifecycle);
  pill.querySelector('#pillText').textContent = lcLbl(status.lifecycle);

  document.getElementById('heroStatus').textContent = status.thinkingText || status.currentStatusText || '待機しています';
  document.getElementById('heroRequest').textContent = control.requestLabel || status.task || 'まだ設定されていません';
  document.getElementById('heroCurrentTask').textContent = control.currentTaskLabel || currentTask?.title || 'これから決まります';
  document.getElementById('heroNextTask').textContent = control.nextTaskLabel || d.nextTask?.title || '未定';

  const highlights = [];
  if (control.activeTaskCount) highlights.push('進行中 ' + control.activeTaskCount + ' 件');
  if (control.queuedTaskCount) highlights.push('次に控え ' + control.queuedTaskCount + ' 件');
  if (control.completedTaskCount) highlights.push('完了 ' + control.completedTaskCount + ' 件');
  if (control.pendingDecisionCount) highlights.push('確認待ち ' + control.pendingDecisionCount + ' 件');
  if (highlights.length === 0) highlights.push('このまま最初の作業を始められます');
  document.getElementById('heroHighlights').innerHTML = highlights
    .map((item) => '<span class="hero-highlight">' + esc(item) + '</span>')
    .join('');

  const running = ['starting', 'running'].includes(status.lifecycle);
  const paused = ['paused', 'pause_requested'].includes(status.lifecycle);
  const ready = status.task && (status.mode === 'demo' || status.agentCommand);
  const hasTasks = (d.taskBoard || []).length > 0;
  document.getElementById('startBtn').disabled = !hasTasks || !ready || status.phase === 'queued' || running || paused;
  document.getElementById('startBtn').textContent = status.phase === 'queued' ? '準備しています' : status.lifecycle === 'completed' ? 'もう一度はじめる' : 'はじめる';
  document.getElementById('pauseBtn').disabled = !running;
  document.getElementById('resumeBtn').disabled = !paused;
  document.getElementById('abortBtn').disabled = !running && !paused && status.phase !== 'queued';

  const chip = document.getElementById('composerTaskChip');
  if (currentTask) {
    chip.textContent = '今の対象: ' + currentTask.title;
    chip.classList.remove('is-hidden');
  } else {
    chip.textContent = '';
    chip.classList.add('is-hidden');
  }

  const toggleCount = document.getElementById('sidebarToggleCount');
  toggleCount.textContent = String(inboxCount);
  toggleCount.classList.toggle('is-hidden', inboxCount === 0);
}

function renderSession(d) {
  const run = d.layers?.control?.run;
  const el = document.getElementById('sessionPanel');
  if (!run) {
    el.innerHTML = '<div class="empty compact">セッション情報を表示できません</div>';
    return;
  }

  el.innerHTML =
    '<div class="session-card">' +
      '<div class="session-head">' +
        '<div class="session-kicker">現在の run</div>' +
        '<div class="session-runid">' + esc(run.runId || '未開始') + '</div>' +
      '</div>' +
      '<div class="session-request">' + esc(run.requestLabel || '今回の依頼はまだありません') + '</div>' +
      '<div class="session-meta">' +
        '<span>状態: ' + esc(run.lifecycleLabel) + '</span>' +
        '<span>動かし方: ' + esc(run.modeLabel) + '</span>' +
        '<span>更新: ' + esc(fTime(run.updatedAt)) + '</span>' +
      '</div>' +
      '<div class="session-metrics">' +
        '<div class="metric-card"><div class="metric-label">進行中</div><div class="metric-value">' + esc(run.activeTaskCount) + '</div></div>' +
        '<div class="metric-card"><div class="metric-label">次に控え</div><div class="metric-value">' + esc(run.queuedTaskCount) + '</div></div>' +
        '<div class="metric-card"><div class="metric-label">完了</div><div class="metric-value">' + esc(run.completedTaskCount) + '</div></div>' +
        '<div class="metric-card"><div class="metric-label">確認待ち</div><div class="metric-value">' + esc(run.pendingDecisionCount) + '</div></div>' +
      '</div>' +
      '<div class="session-rows">' +
        '<div class="session-row"><span>今の作業</span><strong>' + esc(run.currentTaskLabel) + '</strong></div>' +
        '<div class="session-row"><span>次にやること</span><strong>' + esc(run.nextTaskLabel) + '</strong></div>' +
      '</div>' +
    '</div>';
}

function renderFeed(d) {
  const status = d.status;
  const run = d.layers?.control?.run || {};
  const decisions = d.pendingDecisions || [];
  const answered = (d.answeredQuestions || []).slice(-3).reverse();
  const blockers = (d.blockers || []).slice(0, 3);
  const artifacts = (d.artifacts || []).slice(0, 6);
  const feed = [];

  feed.push(
    '<section class="feed-section">' +
      '<div class="feed-card feed-card-assistant">' +
        '<div class="feed-kicker">Ralph</div>' +
        '<div class="feed-title">' + esc(run.currentTaskLabel || '今の作業を整理しています') + '</div>' +
        '<div class="feed-copy">' + esc(status.thinkingText || status.currentStatusText || '待機しています') + '</div>' +
        '<div class="feed-meta">状態: ' + esc(lcLbl(status.lifecycle)) + ' / 次: ' + esc(run.nextTaskLabel || '未定') + ' / 更新: ' + esc(fTime(status.updatedAt)) + '</div>' +
      '</div>' +
    '</section>'
  );

  if (abortCardOpen) {
    feed.push(
      '<section class="feed-section" id="abortCard">' +
        '<div class="decision-card decision-danger">' +
          '<div class="decision-label">確認が必要です</div>' +
          '<div class="decision-title">この作業をここで止めますか？</div>' +
          '<div class="decision-copy">途中までの状態は残りますが、この run は止まります。</div>' +
          '<div class="decision-actions">' +
            '<button class="btn btn-red btn-sm" data-abort-confirm="1">この作業をやめる</button>' +
            '<button class="btn btn-ghost btn-sm" data-abort-cancel="1">戻る</button>' +
          '</div>' +
        '</div>' +
      '</section>'
    );
  }

  if (decisions.length > 0) {
    feed.push(
      '<section class="feed-section" id="decisionSection">' +
        '<div class="feed-section-title">確認カード</div>' +
        decisions.map(decision => (
          '<div class="decision-card" id="decision_' + esc(decision.id) + '">' +
            '<div class="decision-label">確認が必要です</div>' +
            '<div class="decision-title">' + esc(decision.title) + '</div>' +
            '<div class="decision-copy"><strong>おすすめ:</strong> ' + esc(decision.recommendedAnswer) + '</div>' +
            '<div class="decision-copy"><strong>未回答のままなら:</strong> ' + esc(decision.fallbackAnswer) + '</div>' +
            '<div class="decision-actions">' +
              decision.choices.map(choice => (
                choice.kind === 'custom'
                  ? '<button class="btn btn-ghost btn-sm" data-focus-answer-qid="' + esc(enc(decision.id)) + '">' + esc(choice.label) + '</button>'
                  : '<button class="btn ' + esc(choice.id === 'recommended' ? 'btn-cyan' : 'btn-ghost') + ' btn-sm" data-answer-qid="' + esc(enc(decision.id)) + '" data-answer-value="' + esc(enc(choice.answer || '')) + '">' + esc(choice.label) + '</button>'
              )).join('') +
            '</div>' +
            '<div class="decision-form">' +
              '<textarea id="ans_' + esc(decision.id) + '" rows="2" placeholder="別の希望があればここに書いてください"></textarea>' +
              '<button class="btn btn-cyan btn-sm" data-answer-qid="' + esc(enc(decision.id)) + '">送信</button>' +
            '</div>' +
          '</div>'
        )).join('') +
      '</section>'
    );
  }

  if (blockers.length > 0) {
    feed.push(
      '<section class="feed-section" id="blockerSection">' +
        '<div class="feed-section-title">止まりそうな点</div>' +
        blockers.map(blocker => (
          '<div class="artifact-card tone-warning" id="blocker_' + esc(blocker.id) + '">' +
            '<div class="artifact-title">' + esc(blocker.id) + '</div>' +
            '<div class="artifact-copy">' + esc(blocker.text) + '</div>' +
            '<div class="artifact-actions"><button class="btn btn-ghost btn-sm" data-prefill-note="' + esc(enc(blocker.id + ' について: ' + blocker.text)) + '">状況を伝える</button></div>' +
          '</div>'
        )).join('') +
      '</section>'
    );
  }

  if (artifacts.length > 0) {
    feed.push(
      '<section class="feed-section">' +
        '<div class="feed-section-title">成果と更新</div>' +
        '<div class="artifact-grid">' +
          artifacts.map(artifact => (
            '<div class="artifact-card tone-' + esc(artifact.tone) + '">' +
              '<div class="artifact-title">' + esc(artifact.title) + '</div>' +
              '<div class="artifact-copy">' + esc(artifact.summary) + '</div>' +
              '<div class="artifact-meta">' + esc(fTime(artifact.timestamp)) + '</div>' +
            '</div>'
          )).join('') +
        '</div>' +
      '</section>'
    );
  }

  if (answered.length > 0) {
    feed.push(
      '<section class="feed-section" id="historySection">' +
        '<div class="feed-section-title">最近決めたこと</div>' +
        answered.map(item => (
          '<div class="history-card">' +
            '<div class="history-label">確認済み</div>' +
            '<div class="history-title">' + esc(item.text) + '</div>' +
            '<div class="history-answer">' + esc(item.answer?.answer || '回答を保存しました') + '</div>' +
          '</div>'
        )).join('') +
      '</section>'
    );
  }

  document.getElementById('conversationFeed').innerHTML = feed.join('');
}

function humanizeEvent(event) {
  const tone = event.level === 'error' ? 'warning' : event.level === 'warning' ? 'warning' : 'info';
  const type = String(event.type || '');
  const message = String(event.message || '');
  if (['agent.thinking', 'agent.status', 'agent.output', 'run.requested', 'question.created', 'blocker.created'].includes(type)) {
    return null;
  }
  if (type === 'task.completed') {
    return { title: 'やることが完了しました', summary: stripPrefix(message), meta: fTime(event.timestamp), tone: 'success' };
  }
  if (type === 'task.created') {
    return { title: 'やることを追加しました', summary: stripPrefix(message), meta: fTime(event.timestamp), tone: 'info' };
  }
  if (type === 'task.imported') {
    return { title: 'やることをまとめて追加しました', summary: message, meta: fTime(event.timestamp), tone: 'success' };
  }
  if (type === 'task.reordered') {
    return { title: '順番を整えました', summary: stripPrefix(message), meta: fTime(event.timestamp), tone: 'info' };
  }
  if (type === 'task.updated') {
    return { title: 'やることを更新しました', summary: stripPrefix(message), meta: fTime(event.timestamp), tone: 'info' };
  }
  if (type === 'run.started') {
    return { title: '作業を始めました', summary: message, meta: fTime(event.timestamp), tone: 'info' };
  }
  if (type === 'run.completed') {
    return { title: '作業が完了しました', summary: message, meta: fTime(event.timestamp), tone: 'success' };
  }
  if (type === 'run.pause') {
    return { title: '作業を止めています', summary: 'いつでも再開できます', meta: fTime(event.timestamp), tone: 'warning' };
  }
  if (type === 'run.resume') {
    return { title: '作業を再開しました', summary: '続きから進めます', meta: fTime(event.timestamp), tone: 'info' };
  }
  if (type === 'run.error') {
    return { title: '作業が止まりました', summary: message, meta: fTime(event.timestamp), tone: 'warning' };
  }
  if (type === 'note.enqueued') {
    return { title: '伝えた内容を受け取りました', summary: '次のターンに反映します', meta: fTime(event.timestamp), tone: 'info' };
  }
  if (type === 'settings.updated') {
    return { title: '設定を更新しました', summary: '次の作業から反映されます', meta: fTime(event.timestamp), tone };
  }
  return null;
}

function renderInbox(d) {
  const decisions = d.pendingDecisions || [];
  const blockers = d.blockers || [];
  const items = [];

  items.push('<div class="inbox-headline">未対応の確認</div>');
  if (decisions.length === 0 && blockers.length === 0) {
    items.push('<div class="empty compact">いま返答が必要なものはありません</div>');
  }

  decisions.forEach(decision => {
    items.push(
      '<div class="inbox-item">' +
        '<div class="inbox-meta"><span class="inbox-badge">確認待ち</span><span>' + esc(fTime(decision.createdAt)) + '</span></div>' +
        '<div class="inbox-title">' + esc(decision.title) + '</div>' +
        '<div class="inbox-copy">おすすめ: ' + esc(decision.recommendedAnswer) + '</div>' +
        '<div class="inbox-actions"><button class="btn btn-ghost btn-sm" data-scroll-target="' + esc('decision_' + decision.id) + '">会話で見る</button></div>' +
      '</div>'
    );
  });

  blockers.forEach(blocker => {
    items.push(
      '<div class="inbox-item inbox-warning">' +
        '<div class="inbox-meta"><span class="inbox-badge tone-warning">要対応</span><span>' + esc(fTime(blocker.createdAt)) + '</span></div>' +
        '<div class="inbox-title">' + esc(blocker.text) + '</div>' +
        '<button class="btn btn-ghost btn-sm" data-scroll-target="' + esc('blocker_' + blocker.id) + '">内容を見る</button>' +
      '</div>'
    );
  });

  document.getElementById('inboxList').innerHTML = items.join('');
}

function renderTasks(d) {
  const items = d.taskBoard || [];
  const openItems = items.filter(item => item.displayStatus !== 'completed');
  const completedCount = items.filter(item => item.displayStatus === 'completed').length;
  const currentId = d.currentTask?.id;
  const nextId = d.nextTask?.id;
  const el = document.getElementById('taskList');

  if (!items.length) {
    el.innerHTML = '<div class="empty"><div class="empty-title">やることはまだありません</div><div class="empty-copy">ひとつ追加すると作業を始められます。</div><button class="btn btn-cyan" onclick="showAddTask()">やることを追加</button></div>';
    return;
  }

  const list = openItems.length
    ? openItems.map(item => {
        const isCurrent = currentId === item.id;
        const isNext = nextId === item.id;
        const taskId = esc(enc(item.id));
        return '<div class="tl-item' + (isCurrent ? ' is-cur' : '') + (isNext ? ' is-nxt' : '') + '">' +
          '<div class="tl-body">' +
            '<div class="tl-head"><span class="tl-id">' + esc(item.id) + '</span>' +
            (isCurrent ? '<span class="tl-badge badge-cur">今</span>' : '') +
            (isNext ? '<span class="tl-badge badge-nxt">次</span>' : '') +
            '</div>' +
            '<div class="tl-title">' + esc(item.title) + '</div>' +
            (item.summary && item.summary !== item.title ? '<div class="tl-summary">' + esc(item.summary) + '</div>' : '') +
            '<div class="tl-actions">' +
              '<button class="btn btn-ghost btn-sm" data-act="complete" data-task-id="' + taskId + '">完了</button>' +
              (!isCurrent ? '<button class="btn btn-ghost btn-sm" data-act="move-front" data-task-id="' + taskId + '">先に進める</button>' : '') +
              '<button class="btn btn-ghost btn-sm" data-act="move-back" data-task-id="' + taskId + '">あとでやる</button>' +
              '<button class="btn btn-ghost btn-sm" data-act="edit" data-task-id="' + taskId + '" data-task-title="' + esc(enc(item.title)) + '" data-task-summary="' + esc(enc(item.summary || '')) + '">編集</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('')
    : '<div class="empty compact">進行中のやることはありません</div>';

  el.innerHTML =
    '<div class="task-summary">' +
      '<span>進めるやること ' + esc(openItems.length) + ' 件</span>' +
      '<span>完了済み ' + esc(completedCount) + ' 件</span>' +
    '</div>' +
    list;
}

function renderPreviewQueue(d) {
  const items = d.layers?.control?.previewQueue || d.promptInjectionQueue || [];
  const el = document.getElementById('previewList');

  if (!items.length) {
    el.innerHTML = '<div class="empty compact">次のターンに反映する内容はありません</div>';
    return;
  }

  el.innerHTML =
    '<div class="inbox-headline">次のターンで反映されます</div>' +
    items.map(item => (
      '<div class="preview-item">' +
        '<div class="preview-meta"><span class="preview-kind">' + esc(queueKindLabel(item.kind)) + '</span><span>' + esc(fTime(item.createdAt)) + '</span></div>' +
        '<div class="preview-title">' + esc(item.label || queueKindLabel(item.kind)) + '</div>' +
        '<div class="preview-copy">' + esc(item.text) + '</div>' +
      '</div>'
    )).join('');
}

function renderPower(d) {
  const surface = d.layers?.surface || {};
  const power = d.layers?.power || {};
  const resources = power.resources || [];
  const diagnostics = power.diagnostics || [];

  document.getElementById('resourceList').innerHTML = resources.length
    ? resources.map(item => (
      '<div class="resource-item ' + esc(levelClass(item.level)) + '">' +
        '<div class="resource-head">' +
          '<div class="resource-label">' + esc(item.label) + '</div>' +
          '<span class="resource-level ' + esc(levelClass(item.level)) + '">' + esc(levelLabel(item.level)) + '</span>' +
        '</div>' +
        '<div class="resource-value">' + esc(item.value) + '</div>' +
        (item.detail ? '<div class="resource-detail">' + esc(item.detail) + '</div>' : '') +
      '</div>'
    )).join('')
    : '<div class="empty compact">表示できる実行環境情報がありません</div>';

  document.getElementById('diagnosticList').innerHTML = diagnostics.length
    ? diagnostics.map(item => (
      '<div class="diagnostic-item ' + esc(levelClass(item.level)) + '">' +
        '<div class="diagnostic-head">' +
          '<div class="diagnostic-key">' + esc(item.key) + '</div>' +
          '<span class="resource-level ' + esc(levelClass(item.level)) + '">' + esc(levelLabel(item.level)) + '</span>' +
        '</div>' +
        '<div class="diagnostic-message">' + esc(item.message) + '</div>' +
      '</div>'
    )).join('')
    : '<div class="empty compact">診断結果はありません</div>';

  document.getElementById('advancedSummary').innerHTML =
    '<div class="advanced-pills">' +
      '<span class="settings-tag">モデル: ' + esc(surface.modelLabel || '確認中') + '</span>' +
      '<span class="settings-tag">' + esc(power.canEditAgentCommand ? 'コマンド変更可' : 'コマンド固定') + '</span>' +
    '</div>' +
    '<div class="advanced-copy">' + esc(surface.modelDetail || '実行条件を確認できます') + '</div>' +
    '<div class="advanced-copy">指示ソース: ' + esc(power.promptSource || '未設定') + '</div>';
}

function renderSettings(d) {
  if (settingsDirty || !d.settings) {
    return;
  }

  const settings = d.settings;
  const power = d.layers?.power || {};
  document.getElementById('qTaskName').value = settings.taskName || '';
  document.getElementById('qMaxIter').value = settings.maxIterations || 1;
  document.getElementById('qIdle').value = settings.idleSeconds || 1;
  document.getElementById('qMode').value = settings.mode || 'command';

  document.getElementById('sAgent').value = settings.agentCommand || '';
  document.getElementById('sAgentCwd').value = settings.agentCwd || '';
  document.getElementById('sPromptFile').value = settings.promptFile || '';
  document.getElementById('sPromptBody').value = settings.promptBody || '';
  document.getElementById('sDiscordChannel').value = settings.discordNotifyChannelId || '';
  document.getElementById('sAgent').disabled = !canEditAgent;
  document.getElementById('sAgentHint').textContent = canEditAgent
    ? '次の作業から反映されます'
    : '起動時の設定を使っているため、ここからは変更できません';
  document.getElementById('advancedSummary').dataset.panelUrl = power.panelUrl || '';
}

function renderLogs(d) {
  const events = (d.recentEvents || []).slice(0, 10);
  const log = d.agentLogTail || [];
  const eventHtml = events.length
    ? events.map(event => {
        const card = humanizeEvent(event);
        return '<div class="ev-row">' +
          '<div class="ev-time">' + esc(fTime(event.timestamp)) + '</div>' +
          '<div class="ev-body">' +
            '<div class="ev-type">' + esc(card?.title || '詳細ログ') + '</div>' +
            '<div class="ev-msg">' + esc(card?.summary || trimLines(event.message, 2)) + '</div>' +
          '</div>' +
        '</div>';
      }).join('')
    : '<div class="empty compact">まだ動きはありません</div>';
  document.getElementById('evList').innerHTML = eventHtml;
  document.getElementById('agentLog').textContent = log.join('\\n') || '(出力なし)';
}

async function refresh() {
  try {
    const response = await fetch('/api/dashboard');
    dashboardData = await response.json();
    canEditAgent = dashboardData.layers?.power?.canEditAgentCommand || dashboardData.capabilities?.canEditAgentCommand || false;
    renderHeader(dashboardData);
    renderSession(dashboardData);
    renderInbox(dashboardData);
    renderTasks(dashboardData);
    renderPreviewQueue(dashboardData);
    renderPower(dashboardData);
    renderFeed(dashboardData);
    renderSettings(dashboardData);
    renderLogs(dashboardData);
  } catch (error) {
    console.error(error);
  }
}

document.getElementById('taskList').addEventListener('click', event => {
  if (!(event.target instanceof HTMLElement)) return;
  const button = event.target.closest('[data-act]');
  if (!(button instanceof HTMLElement)) return;
  const taskId = dec(button.dataset.taskId || '');
  if (!taskId) return;
  const action = button.dataset.act || '';
  if (action === 'complete') { void completeTask(taskId); return; }
  if (action === 'move-front') { void moveTask(taskId, 'front'); return; }
  if (action === 'move-back') { void moveTask(taskId, 'back'); return; }
  if (action === 'edit') { editTask(taskId, dec(button.dataset.taskTitle || ''), dec(button.dataset.taskSummary || '')); }
});

document.getElementById('conversationFeed').addEventListener('click', event => {
  if (!(event.target instanceof HTMLElement)) return;
  const answerButton = event.target.closest('[data-answer-qid]');
  if (answerButton instanceof HTMLElement) {
    const questionId = dec(answerButton.dataset.answerQid || '');
    const value = answerButton.dataset.answerValue ? dec(answerButton.dataset.answerValue) : undefined;
    if (questionId) { void submitDecision(questionId, value); }
    return;
  }
  const focusButton = event.target.closest('[data-focus-answer-qid]');
  if (focusButton instanceof HTMLElement) {
    const questionId = dec(focusButton.dataset.focusAnswerQid || '');
    if (questionId) focusDecisionInput(questionId);
    return;
  }
  const prefillButton = event.target.closest('[data-prefill-note]');
  if (prefillButton instanceof HTMLElement) {
    const value = dec(prefillButton.dataset.prefillNote || '');
    if (value) void sendNote(value);
    return;
  }
  if (event.target.closest('[data-abort-confirm]')) {
    void confirmAbort();
    return;
  }
  if (event.target.closest('[data-abort-cancel]')) {
    abortCardOpen = false;
    renderFeed(dashboardData);
  }
});

document.getElementById('inboxList').addEventListener('click', event => {
  if (!(event.target instanceof HTMLElement)) return;
  const button = event.target.closest('[data-scroll-target]');
  if (!(button instanceof HTMLElement)) return;
  const targetId = button.dataset.scrollTarget || '';
  toggleSidebar(false);
  scrollToCard(targetId);
});

document.getElementById('noteInput').addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    void sendNote();
  }
});
document.getElementById('noteInput').addEventListener('input', () => autosizeComposer());
document.getElementById('taskImportInput').addEventListener('input', () => scheduleTaskImportPreview());
document.querySelectorAll('#quickSettingsForm input, #quickSettingsForm textarea, #quickSettingsForm select, #advancedSettingsForm input, #advancedSettingsForm textarea, #advancedSettingsForm select').forEach(el => {
  el.addEventListener('input', () => settingsDirty = true);
  el.addEventListener('change', () => settingsDirty = true);
});

setInterval(() => refresh().catch(console.error), 4000);
refresh().catch(console.error);
renderTaskImportPreview();
toggleComposerTools(false);
autosizeComposer();
toggleSidebar(window.matchMedia('(min-width: 1180px)').matches);
`;
}
