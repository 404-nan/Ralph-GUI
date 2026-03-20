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
  settingsMode: 'quick',
  abortConfirmOpen: false,
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

function clearNode(node) {
  if (!node) return;
  node.replaceChildren();
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
    'task.completed': ['やることが完了しました', summary || '完了しました', 'success'],
    'task.created': ['やることを追加しました', summary || '追加しました', 'info'],
    'task.imported': ['やることをまとめて追加しました', message || '追加しました', 'success'],
    'task.reordered': ['task の順番を変更しました', summary || '順番を調整しました', 'info'],
    'task.updated': ['やることを更新しました', summary || '更新しました', 'info'],
    'run.started': ['run を開始しました', message || '開始しました', 'info'],
    'run.completed': ['run が完了しました', message || '完了しました', 'success'],
    'run.pause': ['run を停止しました', 'いつでも再開できます', 'warning'],
    'run.resume': ['run を再開しました', '続きから進めます', 'info'],
    'run.error': ['run が止まりました', message || '確認が必要です', 'warning'],
    'note.enqueued': ['手動メモをキューに追加しました', '次のターンで反映されます', 'info'],
    'settings.updated': ['設定を更新しました', '次の作業から反映されます', event?.level === 'warning' ? 'warning' : 'info'],
  }[String(event?.type || '')];

  if (!preset) {
    if (['agent.thinking', 'agent.status', 'agent.output', 'run.requested', 'question.created', 'blocker.created'].includes(String(event?.type || ''))) {
      return null;
    }
    return {
      title: '詳細ログ',
      summary: summary || message || String(event?.type || 'イベント'),
      tone: event?.level === 'error' ? 'warning' : event?.level === 'warning' ? 'warning' : 'info',
      meta: fTime(event?.timestamp),
    };
  }

  return {
    title: preset[0],
    summary: preset[1],
    tone: preset[2],
    meta: fTime(event?.timestamp),
  };
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
  input.style.height = Math.min(input.scrollHeight, 200) + 'px';
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

function scrollToPanel(id) {
  const target = $(id);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setSettingsMode(mode) {
  state.settingsMode = mode;
  renderSettings(state.dashboardData);
}

function setTaskFormVisible(value) {
  state.taskFormVisible = value;
  if (!value) {
    state.editingTaskId = '';
  }
  renderTaskBoard(state.dashboardData);
}

function setTaskImportVisible(value) {
  state.taskImportVisible = value;
  renderTaskBoard(state.dashboardData);
}
`;
