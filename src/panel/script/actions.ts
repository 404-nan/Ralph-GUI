export const panelScriptActions = String.raw`
async function api(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });

  if (!response.ok) {
    toast((await response.text()) || 'エラーが発生しました', 'error');
    return null;
  }

  return response.json().catch(() => ({}));
}

async function doStart() {
  const result = await api('/api/start');
  if (!result) return;
  state.abortConfirmOpen = false;
  toast(result.message || '作業を開始します', result.started ? 'success' : 'warning');
  await refresh();
}

async function doPause() {
  if (await api('/api/pause')) {
    toast('作業を一時停止しました', 'warning');
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
  state.abortConfirmOpen = true;
  renderPrimary(state.dashboardData);
}

async function confirmAbort() {
  if (await api('/api/abort')) {
    state.abortConfirmOpen = false;
    toast('作業を中断しました', 'warning');
    await refresh();
  }
}

async function doDiscordReconnect() {
  if (await api('/api/discord/reconnect')) {
    toast('Discord を再接続しました', 'success');
    await refresh();
  }
}

async function sendNote(prefill) {
  const input = $('noteInput');
  if (!(input instanceof HTMLTextAreaElement)) return;

  if (prefill) {
    input.value = prefill;
    autosizeComposer();
    input.focus();
    return;
  }

  const note = input.value.trim();
  if (!note) {
    toast('送信するメモを書いてください', 'warning');
    return;
  }

  if (await api('/api/note', { note })) {
    input.value = '';
    autosizeComposer();
    toast('手動メモを受け付けました', 'success');
    await refresh();
  }
}

async function submitDecision(questionId, presetValue) {
  const input = $('decisionAnswer_' + questionId);
  const answer = presetValue || (input instanceof HTMLTextAreaElement ? input.value.trim() : '');
  if (!answer) {
    toast('回答内容を入力してください', 'warning');
    return;
  }

  if (await api('/api/answer', { questionId, answer })) {
    toast('回答を保存しました', 'success');
    await refresh();
  }
}

async function completeTask(taskId) {
  if (await api('/api/task/complete', { taskId })) {
    toast('task を完了にしました', 'success');
    await refresh();
  }
}

async function reopenTask(taskId) {
  if (await api('/api/task/reopen', { taskId })) {
    toast('task を未完了に戻しました', 'success');
    await refresh();
  }
}

async function moveTask(taskId, position) {
  if (await api('/api/task/move', { taskId, position })) {
    toast(position === 'front' ? 'task を先頭側へ移動しました' : 'task を後方へ移動しました', 'success');
    await refresh();
  }
}

function openTaskCreate() {
  state.editingTaskId = '';
  state.taskFormVisible = true;
  state.taskImportVisible = false;
  openSecondaryTab('tasks');
  renderTaskBoard(state.dashboardData);
}

function openTaskEdit(taskId) {
  state.editingTaskId = taskId;
  state.taskFormVisible = true;
  state.taskImportVisible = false;
  openSecondaryTab('tasks');
  renderTaskBoard(state.dashboardData);
}

async function submitTaskForm(event) {
  event.preventDefault();
  const title = $('taskFormTitle')?.value?.trim?.() || '';
  const summary = $('taskFormSummary')?.value?.trim?.() || '';
  if (!title) {
    toast('task 名を入力してください', 'warning');
    return;
  }

  const result = state.editingTaskId
    ? await api('/api/task/update', { taskId: state.editingTaskId, title, summary })
    : await api('/api/task/create', { title, summary });

  if (!result) return;
  toast(state.editingTaskId ? 'task を更新しました' : 'task を追加しました', 'success');
  state.taskFormVisible = false;
  state.editingTaskId = '';
  await refresh();
}

function taskImportText() {
  const input = $('taskImportInput');
  return input instanceof HTMLTextAreaElement ? input.value : '';
}

function resetTaskImportPreview() {
  if (state.taskImportPreviewTimer) {
    clearTimeout(state.taskImportPreviewTimer);
    state.taskImportPreviewTimer = null;
  }
  state.taskImportPreview = null;
}

async function previewTaskImport() {
  const specText = taskImportText().trim();
  if (!specText) {
    state.taskImportPreview = null;
    renderTaskBoard(state.dashboardData);
    return;
  }
  const result = await api('/api/task/import/preview', { specText });
  if (!result) return;
  state.taskImportPreview = result;
  renderTaskBoard(state.dashboardData);
}

function scheduleTaskImportPreview() {
  resetTaskImportPreview();
  if (!taskImportText().trim()) {
    renderTaskBoard(state.dashboardData);
    return;
  }
  state.taskImportPreviewTimer = window.setTimeout(() => {
    void previewTaskImport();
  }, 420);
}

async function importTasksFromSpec() {
  const specText = taskImportText().trim();
  if (!specText) {
    toast('仕様やメモを貼り付けてください', 'warning');
    return;
  }
  const result = await api('/api/task/import', { specText });
  if (!result) return;
  state.taskImportPreview = null;
  const input = $('taskImportInput');
  if (input instanceof HTMLTextAreaElement) input.value = '';
  toast(String(result.tasks?.length || 0) + ' 件の task を追加しました', 'success');
  await refresh();
}

async function saveQuickSettings(event) {
  event.preventDefault();
  const result = await api('/api/settings', {
    taskName: $('qTaskName')?.value?.trim?.() || '',
    maxIterations: Number.parseInt(String($('qMaxIter')?.value || ''), 10),
    idleSeconds: Number.parseInt(String($('qIdle')?.value || ''), 10),
    mode: $('qMode')?.value || 'command',
  });
  if (!result) return;
  state.settingsDirty = false;
  toast('基本設定を保存しました', 'success');
  await refresh();
}

async function saveAdvancedSettings(event) {
  event.preventDefault();
  const result = await api('/api/settings', {
    agentCommand: state.canEditAgent ? $('sAgent')?.value?.trim?.() || '' : undefined,
    agentCwd: $('sAgentCwd')?.value?.trim?.() || '',
    promptFile: $('sPromptFile')?.value?.trim?.() || '',
    promptBody: $('sPromptBody')?.value || '',
    discordNotifyChannelId: $('sDiscordChannel')?.value?.trim?.() || '',
  });
  if (!result) return;
  state.settingsDirty = false;
  toast('詳細設定を保存しました', 'success');
  await refresh();
}
`;
