export const panelScriptUtils = String.raw`
const state = {
  dashboardData: null,
  canEditAgent: false,
  settingsDirty: false,
  editingTaskId: '',
  taskImportPreview: null,
  taskImportPreviewTimer: null,
  taskFormVisible: false,
  taskImportVisible: false,
  secondaryTab: 'tasks',
  abortConfirmOpen: false,
  activeNavTarget: 'workspace',
  sidebarCollapsed: false,
  drawerCollapsed: false,
  fixtureMode: new URLSearchParams(window.location.search).get('fixture') || 'live',
  fixtureSwitcherVisible: new URLSearchParams(window.location.search).get('fixtures') === '1' || new URLSearchParams(window.location.search).has('fixture'),
  composerMode: 'note',
  selectedDecisionId: '',
};

function $(id) {
  return document.getElementById(id);
}

function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = String(options.text);
  if (options.html !== undefined) node.innerHTML = String(options.html);
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) node.setAttribute(key, String(value));
    });
  }
  if (options.dataset) {
    Object.entries(options.dataset).forEach(([key, value]) => {
      if (value !== undefined && value !== null) node.dataset[key] = String(value);
    });
  }
  const list = Array.isArray(children) ? children : [children];
  list.filter(Boolean).forEach((child) => {
    if (typeof child === 'string') {
      node.append(document.createTextNode(child));
      return;
    }
    node.append(child);
  });
  return node;
}

function renderInto(target, children) {
  if (!target) return;
  const list = Array.isArray(children) ? children : [children];
  target.replaceChildren(...list.filter(Boolean));
}

function fTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(value);
  }
}

function lcLbl(value) {
  return {
    idle: '待機',
    starting: '準備中',
    running: '作業中',
    paused: '一時停止',
    pause_requested: '停止待ち',
    completed: '完了',
    aborted: '中断',
    failed: '要確認',
  }[value] || '待機';
}

function lcCls(value) {
  if (['starting', 'running'].includes(value)) return 'pill-running';
  if (['paused', 'pause_requested'].includes(value)) return 'pill-paused';
  if (value === 'completed') return 'pill-done';
  if (['failed', 'aborted'].includes(value)) return 'pill-error';
  return 'pill-idle';
}

function queueKindLabel(kind) {
  return kind === 'answer' ? '回答' : 'メモ';
}

function levelLabel(level) {
  return { ok: '正常', warning: '注意', error: '要確認' }[level] || '正常';
}

function levelTone(level) {
  if (level === 'error') return 'is-danger';
  if (level === 'warning') return 'is-warning';
  return '';
}

function humanizeEvent(event) {
  const message = String(event?.message || '');
  const summary = message.includes(':') ? message.slice(message.indexOf(':') + 1).trim() : message;
  const preset = {
    'task.completed': ['やることが完了しました', summary || '完了しました'],
    'task.created': ['やることを追加しました', summary || '追加しました'],
    'task.imported': ['やることをまとめて追加しました', message || '追加しました'],
    'task.reordered': ['task の順番を変更しました', summary || '順番を調整しました'],
    'task.updated': ['やることを更新しました', summary || '更新しました'],
    'run.started': ['run を開始しました', message || '開始しました'],
    'run.completed': ['run が完了しました', message || '完了しました'],
    'run.pause': ['run を停止しました', 'いつでも再開できます'],
    'run.resume': ['run を再開しました', '続きから進めます'],
    'run.error': ['run が止まりました', message || '確認が必要です'],
    'note.enqueued': ['manual note を投入しました', '次ターンで反映されます'],
    'settings.updated': ['設定を更新しました', '次の run から反映されます'],
  }[String(event?.type || '')];

  if (!preset) {
    if (['agent.thinking', 'agent.status', 'agent.output', 'run.requested', 'question.created', 'blocker.created'].includes(String(event?.type || ''))) {
      return null;
    }
    return { title: '詳細ログ', summary: summary || message || String(event?.type || 'event'), meta: fTime(event?.timestamp) };
  }
  return { title: preset[0], summary: preset[1], meta: fTime(event?.timestamp) };
}

const TOAST_LIMIT = 5;
function toast(message, tone = 'info') {
  const host = $('toasts');
  const item = el('div', { className: 'toast ' + tone, text: message });
  host.append(item);
  while (host.childNodes.length > TOAST_LIMIT) {
    host.removeChild(host.firstChild);
  }
  window.setTimeout(() => item.remove(), 3200);
}

function autosizeComposer() {
  const input = $('noteInput');
  if (!(input instanceof HTMLTextAreaElement)) return;
  input.style.height = '0px';
  input.style.height = Math.min(input.scrollHeight, 150) + 'px';
}

function openSecondaryTab(tab) {
  state.secondaryTab = tab;
  document.querySelectorAll('[data-secondary-tab]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.secondaryTab === tab);
  });
  document.querySelectorAll('[data-secondary-panel]').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.secondaryPanel === tab);
  });
}

function setTaskFormVisible(value) {
  state.taskFormVisible = value;
  if (!value) state.editingTaskId = '';
  renderTaskBoard(state.dashboardData);
}

function setTaskImportVisible(value) {
  state.taskImportVisible = value;
  renderTaskBoard(state.dashboardData);
}

function toggleTaskImportPanel() {
  state.taskImportVisible = !state.taskImportVisible;
  openSecondaryTab('tasks');
  renderTaskBoard(state.dashboardData);
}

function setActiveNav(targetId) {
  state.activeNavTarget = targetId;
}

function setSidebarCollapsed(value) {
  state.sidebarCollapsed = value;
  document.querySelector('.app-shell')?.classList.toggle('is-sidebar-collapsed', value);
}

function setDrawerCollapsed(value) {
  state.drawerCollapsed = value;
  document.querySelector('.app-shell')?.classList.toggle('is-drawer-collapsed', value);
  const button = $('drawerToggleBtn');
  if (button) button.textContent = value ? 'Context を開く' : 'Context';
}

function setComposerMode(mode) {
  state.composerMode = mode;
  document.querySelectorAll('[data-composer-mode]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.composerMode === mode);
  });
  const input = $('noteInput');
  const send = $('sendNoteBtn');
  if (!(input instanceof HTMLTextAreaElement) || !(send instanceof HTMLButtonElement)) return;
  if (mode === 'task') {
    input.placeholder = '1行目に task title、2行目以降に summary / done definition';
    send.textContent = 'task 追加';
    return;
  }
  if (mode === 'decision') {
    input.placeholder = 'decision への回答内容を書く';
    send.textContent = 'decision 送信';
    return;
  }
  input.placeholder = '補足・判断・依頼を短く送る';
  send.textContent = '送信';
}

function isFixtureMode() {
  return state.fixtureMode && state.fixtureMode !== 'live';
}


function showFixtureSwitcher() {
  return state.fixtureSwitcherVisible || isFixtureMode();
}

function setFixtureMode(mode) {
  state.fixtureMode = mode;
  const url = new URL(window.location.href);
  state.fixtureSwitcherVisible = mode !== 'live' || url.searchParams.get('fixtures') === '1';
  if (mode === 'live') {
    url.searchParams.delete('fixture');
  } else {
    url.searchParams.set('fixture', mode);
  }
  window.history.replaceState({}, '', url);
  renderFixtureSwitcher();
  void refresh();
}

function firstPendingDecisionId(dashboard) {
  return dashboard?.pendingDecisions?.[0]?.id || '';
}
`;
