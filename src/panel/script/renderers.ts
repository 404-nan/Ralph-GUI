export const panelScriptRenderers = String.raw`
function createMetric(label, value) {
  return el('div', { className: 'metric-chip' }, [
    el('span', { className: 'metric-chip__label', text: label }),
    el('span', { className: 'metric-chip__value', text: value }),
  ]);
}

function createEmptyState(title, copy, action) {
  const children = [
    el('div', { className: 'empty-title', text: title }),
    el('div', { className: 'empty-copy', text: copy }),
  ];
  if (action) children.push(action);
  return el('div', { className: 'empty-state' }, children);
}

function createBadge(text, className = '') {
  return el('span', { className: ['inline-chip', className].filter(Boolean).join(' '), text });
}

function createTaskSpotlight(task, fallbackTitle, fallbackCopy) {
  if (!task) {
    return createEmptyState(fallbackTitle, fallbackCopy);
  }

  return el('div', { className: 'task-spotlight' }, [
    el('div', { className: 'task-spotlight__title', text: task.title || task.id }),
    task.summary && task.summary !== task.title ? el('div', { className: 'task-spotlight__summary', text: task.summary }) : null,
    el('div', { className: 'task-spotlight__meta', text: 'Task ID: ' + task.id }),
  ]);
}

function createDecisionCard(decision) {
  const card = el('article', { className: 'stack-card', attrs: { id: 'decisionCard_' + decision.id } }, [
    el('div', { className: 'stack-card__title', text: decision.title }),
    el('div', { className: 'stack-copy', text: 'おすすめ: ' + decision.recommendedAnswer }),
    el('div', { className: 'stack-copy', text: '未回答時: ' + decision.fallbackAnswer }),
    el('div', { className: 'stack-card__actions' }, decision.choices.map((choice) => {
      if (choice.kind === 'custom') {
        return el('button', {
          className: 'btn btn-ghost btn-small',
          text: choice.label,
          dataset: { focusDecision: decision.id },
        });
      }
      return el('button', {
        className: choice.id === 'recommended' ? 'btn btn-primary btn-small' : 'btn btn-ghost btn-small',
        text: choice.label,
        dataset: { answerQuestion: decision.id, answerValue: choice.answer || '' },
      });
    })),
    el('textarea', {
      attrs: { rows: '2', placeholder: '別案で答える場合はここに記入' , id: 'decisionAnswer_' + decision.id },
    }),
    el('div', { className: 'inline-actions' }, [
      el('button', {
        className: 'btn btn-inline-accent btn-small',
        text: 'この内容で送信',
        dataset: { submitQuestion: decision.id },
      }),
    ]),
  ]);
  return card;
}

function createBlockerCard(blocker) {
  return el('article', { className: 'stack-card is-warning' }, [
    el('div', { className: 'stack-card__title', text: blocker.text || blocker.id }),
    el('div', { className: 'stack-copy', text: 'Blocker ID: ' + blocker.id }),
    el('div', { className: 'stack-card__actions' }, [
      el('button', {
        className: 'btn btn-ghost btn-small',
        text: 'この件をメモする',
        dataset: { prefillNote: blocker.id + ' について: ' + blocker.text },
      }),
      el('button', {
        className: 'btn btn-ghost btn-small',
        text: 'Inbox で確認',
        dataset: { jumpTab: 'inbox' },
      }),
    ]),
  ]);
}

function createUpdateCard(item) {
  return el('article', { className: 'update-card' }, [
    el('div', { className: 'update-card__title', text: item.title }),
    el('div', { className: 'update-card__copy', text: item.summary }),
    el('div', { className: 'event-meta', text: item.meta }),
  ]);
}

function renderHeader(dashboard) {
  const status = dashboard.status || {};
  const surface = dashboard.layers?.surface || {};
  const run = dashboard.layers?.control?.run || {};
  $('topbarProject').textContent = surface.projectName || 'プロジェクト未設定';
  $('topbarProjectPath').textContent = surface.projectPath || '作業フォルダ未設定';
  $('topbarModel').textContent = surface.modelLabel || '確認中';
  $('topbarModel').title = surface.modelDetail || '';

  const pill = $('lifecyclePill');
  pill.className = 'status-pill ' + lcCls(status.lifecycle);
  $('lifecycleText').textContent = lcLbl(status.lifecycle);

  const running = ['starting', 'running'].includes(status.lifecycle);
  const paused = ['paused', 'pause_requested'].includes(status.lifecycle);
  const ready = Boolean(status.task) && (status.mode === 'demo' || status.agentCommand);
  const hasTasks = (dashboard.taskBoard || []).length > 0;

  $('startBtn').disabled = !hasTasks || !ready || status.phase === 'queued' || running || paused;
  $('pauseBtn').disabled = !running;
  $('resumeBtn').disabled = !paused;
  $('abortBtn').disabled = !running && !paused && status.phase !== 'queued';
}

function renderPrimary(dashboard) {
  const status = dashboard.status || {};
  const run = dashboard.layers?.control?.run || {};
  const currentTask = dashboard.currentTask;
  const nextTask = dashboard.nextTask;
  const metrics = [
    createMetric('進行中', run.activeTaskCount || 0),
    createMetric('次に控え', run.queuedTaskCount || 0),
    createMetric('確認待ち', run.pendingDecisionCount || 0),
    createMetric('完了', run.completedTaskCount || 0),
  ];
  renderInto($('summaryMetrics'), metrics);

  $('summaryStatus').textContent = status.thinkingText || status.currentStatusText || '待機しています';
  $('summaryRequest').textContent = '依頼: ' + (run.requestLabel || status.task || 'まだ設定されていません');
  renderInto(
    $('currentTaskCard'),
    createTaskSpotlight(currentTask, '現在進行中の task はありません', '最初の task を決めると run を開始できます。'),
  );
  renderInto(
    $('nextTaskCard'),
    createTaskSpotlight(nextTask, '次の task はまだありません', 'task board で優先順位を整えるとここに表示されます。'),
  );

  const decisionHost = $('decisionsHero');
  const blockerHost = $('blockersHero');
  const decisions = dashboard.pendingDecisions || [];
  const blockers = dashboard.blockers || [];
  const decisionNodes = [];

  if (state.abortConfirmOpen) {
    decisionNodes.push(el('article', { className: 'stack-card is-danger' }, [
      el('div', { className: 'stack-card__title', text: 'この run を中断しますか？' }),
      el('div', { className: 'stack-copy', text: '途中状態は残りますが、現在の orchestration loop は停止します。' }),
      el('div', { className: 'stack-card__actions' }, [
        el('button', { className: 'btn btn-danger btn-small', text: '中断する', dataset: { confirmAbort: '1' } }),
        el('button', { className: 'btn btn-ghost btn-small', text: '戻る', dataset: { cancelAbort: '1' } }),
      ]),
    ]));
  }

  if (decisions.length === 0) {
    decisionNodes.push(createEmptyState('未回答の decision はありません', '確認が発生するとここに最短導線で表示されます。'));
  } else {
    decisions.slice(0, 3).forEach((decision) => decisionNodes.push(createDecisionCard(decision)));
  }
  renderInto(decisionHost, decisionNodes);

  if (blockers.length === 0) {
    renderInto(blockerHost, createEmptyState('blocker はありません', '止まりそうな点が出たらここに集約します。'));
  } else {
    renderInto(blockerHost, blockers.slice(0, 3).map((blocker) => createBlockerCard(blocker)));
  }

  const updates = [];
  const artifacts = (dashboard.artifacts || []).slice(0, 4).map((artifact) => ({
    title: artifact.title,
    summary: artifact.summary,
    meta: fTime(artifact.timestamp),
  }));
  const events = (dashboard.recentEvents || []).map(humanizeEvent).filter(Boolean).slice(0, 4);
  [...artifacts, ...events].slice(0, 5).forEach((item) => updates.push(createUpdateCard(item)));
  if (updates.length === 0) {
    updates.push(createEmptyState('最近の更新はありません', 'run が動くと更新がここに表示されます。'));
  }
  renderInto($('recentUpdatesHero'), updates);

  const composerContext = $('composerContext');
  if (currentTask) {
    composerContext.textContent = '今の対象: ' + currentTask.title;
    composerContext.classList.remove('is-hidden');
  } else {
    composerContext.textContent = '';
    composerContext.classList.add('is-hidden');
  }
}

function createTaskForm(dashboard) {
  const task = (dashboard.taskBoard || []).find((item) => item.id === state.editingTaskId);
  const form = el('form', { className: 'form-card form-grid', attrs: { id: 'taskForm' } }, [
    el('div', { className: 'form-card__header' }, [
      el('div', { className: 'task-card__title', text: task ? 'task を編集' : 'task を追加' }),
      el('button', { className: 'btn btn-ghost btn-small', text: '閉じる', attrs: { type: 'button' }, dataset: { closeTaskForm: '1' } }),
    ]),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'taskFormTitle' }, text: 'task 名' }),
      el('input', { attrs: { id: 'taskFormTitle', value: task?.title || '', placeholder: '何を進める task か' } }),
    ]),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'taskFormSummary' }, text: '補足 / 完了条件' }),
      el('textarea', { attrs: { id: 'taskFormSummary', rows: '3', placeholder: '完了の目安や補足' } }, task?.summary || ''),
    ]),
    el('div', { className: 'inline-actions' }, [
      el('button', { className: 'btn btn-primary', text: task ? '更新する' : '追加する', attrs: { type: 'submit' } }),
    ]),
  ]);
  form.addEventListener('submit', submitTaskForm);
  queueMicrotask(() => {
    const input = $('taskFormTitle');
    if (input instanceof HTMLInputElement) input.focus();
  });
  return form;
}

function createTaskImport() {
  const preview = state.taskImportPreview;
  const block = el('div', { className: 'form-card import-block' }, [
    el('div', { className: 'form-card__header' }, [
      el('div', { className: 'task-card__title', text: '仕様やメモから task をまとめて追加' }),
      el('button', { className: 'btn btn-ghost btn-small', text: '閉じる', attrs: { type: 'button' }, dataset: { closeTaskImport: '1' } }),
    ]),
    el('textarea', { attrs: { id: 'taskImportInput', rows: '8', placeholder: 'README、要件メモ、issue、仕様テキストを貼り付ける' } }),
    el('div', { className: 'inline-actions' }, [
      el('button', { className: 'btn btn-ghost btn-small', text: '内容を確認', attrs: { type: 'button' }, dataset: { previewTaskImport: '1' } }),
      el('button', { className: 'btn btn-primary btn-small', text: 'task として追加', attrs: { type: 'button' }, dataset: { importTasks: '1' } }),
      el('button', { className: 'btn btn-ghost btn-small', text: 'クリア', attrs: { type: 'button' }, dataset: { clearTaskImport: '1' } }),
    ]),
  ]);

  const previewHost = el('div', { className: 'stack-list' });
  if (!preview) {
    previewHost.append(createEmptyState('プレビュー待ち', '入力内容を確認すると、分割された task 候補がここに出ます。'));
  } else if (!(preview.tasks || []).length) {
    previewHost.append(createEmptyState('抽出できる task がありません', '見出し、箇条書き、JSON の形式を試してください。'));
  } else {
    previewHost.append(el('div', { className: 'settings-meta', text: (preview.format || 'unknown') + ' / ' + String(preview.tasks.length) + ' 件' }));
    preview.tasks.slice(0, 6).forEach((task, index) => {
      previewHost.append(el('article', { className: 'preview-card' }, [
        el('div', { className: 'preview-meta', text: '候補 ' + String(index + 1) }),
        el('div', { className: 'task-card__title', text: task.title }),
        el('div', { className: 'list-copy', text: task.summary || task.title }),
      ]));
    });
  }
  block.append(previewHost);
  queueMicrotask(() => {
    const input = $('taskImportInput');
    if (input instanceof HTMLTextAreaElement) {
      input.value = taskImportText();
      input.addEventListener('input', scheduleTaskImportPreview);
    }
  });
  return block;
}

function createTaskCard(task, currentId, nextId) {
  const isCurrent = task.id === currentId;
  const isNext = task.id === nextId;
  const actions = [];

  if (task.displayStatus === 'completed') {
    actions.push(el('button', { className: 'btn btn-ghost btn-small', text: '未完了に戻す', dataset: { reopenTask: task.id } }));
  } else {
    actions.push(el('button', { className: 'btn btn-ghost btn-small', text: '完了', dataset: { completeTask: task.id } }));
    if (!isCurrent) actions.push(el('button', { className: 'btn btn-ghost btn-small', text: '先頭へ', dataset: { moveTask: task.id, movePosition: 'front' } }));
    actions.push(el('button', { className: 'btn btn-ghost btn-small', text: '後ろへ', dataset: { moveTask: task.id, movePosition: 'back' } }));
  }
  actions.push(el('button', { className: 'btn btn-ghost btn-small', text: '編集', dataset: { editTask: task.id } }));

  const badgeNodes = [];
  if (isCurrent) badgeNodes.push(createBadge('current'));
  if (isNext) badgeNodes.push(createBadge('next'));
  if (task.displayStatus === 'completed') badgeNodes.push(createBadge('completed'));

  return el('article', {
    className: ['task-card', isCurrent ? 'is-current' : '', isNext ? 'is-next' : ''].filter(Boolean).join(' '),
  }, [
    el('div', { className: 'task-card__header' }, [
      el('div', {}, [
        el('div', { className: 'task-card__id', text: task.id }),
        el('div', { className: 'task-card__title', text: task.title }),
      ]),
      el('div', { className: 'task-card__badges' }, badgeNodes),
    ]),
    task.summary && task.summary !== task.title ? el('div', { className: 'task-card__summary', text: task.summary }) : null,
    el('div', { className: 'task-card__actions' }, actions),
  ]);
}

function renderTaskBoard(dashboard) {
  if (!dashboard) return;
  const host = $('taskBoardPanel');
  const items = dashboard.taskBoard || [];
  const currentId = dashboard.currentTask?.id;
  const nextId = dashboard.nextTask?.id;
  const openItems = items.filter((item) => item.displayStatus !== 'completed');
  const completedItems = items.filter((item) => item.displayStatus === 'completed');

  const sections = [];
  if (state.taskFormVisible) sections.push(createTaskForm(dashboard));
  if (state.taskImportVisible) sections.push(createTaskImport());

  if (!items.length) {
    sections.push(createEmptyState('task はまだありません', '追加すると run を開始できます。', el('button', {
      className: 'btn btn-primary btn-small',
      text: '最初の task を追加',
      dataset: { openTaskCreate: '1' },
    })));
    renderInto(host, sections);
    return;
  }

  const lanes = el('div', { className: 'task-lanes' }, [
    el('section', { className: 'task-lane' }, [
      el('div', { className: 'task-lane__header' }, [
        el('div', { className: 'task-lane__title', text: '進行対象 ' + String(openItems.length) + ' 件' }),
        createBadge('current / next を強調表示'),
      ]),
      ...(openItems.length ? openItems.map((task) => createTaskCard(task, currentId, nextId)) : [createEmptyState('進行中の task はありません', '完了済みのみが存在します。')]),
    ]),
    el('section', { className: 'task-lane' }, [
      el('div', { className: 'task-lane__header' }, [
        el('div', { className: 'task-lane__title', text: '完了済み ' + String(completedItems.length) + ' 件' }),
      ]),
      ...(completedItems.length ? completedItems.slice(0, 8).map((task) => createTaskCard(task, currentId, nextId)) : [createEmptyState('完了済み task はまだありません', '完了した task はここにまとまります。')]),
    ]),
  ]);

  sections.push(lanes);
  renderInto(host, sections);
}

function renderInboxHistory(dashboard) {
  if (!dashboard) return;
  const host = $('inboxHistoryPanel');
  const decisions = dashboard.pendingDecisions || [];
  const blockers = dashboard.blockers || [];
  const answered = (dashboard.answeredQuestions || []).slice(-5).reverse();
  const queue = dashboard.layers?.control?.previewQueue || dashboard.promptInjectionQueue || [];

  const sections = [
    el('section', { className: 'history-block' }, [
      el('div', { className: 'task-lane__header' }, [
        el('div', { className: 'task-lane__title', text: '未対応 inbox' }),
      ]),
      ...(decisions.length || blockers.length
        ? [
            ...decisions.map((decision) => el('article', { className: 'inbox-card' }, [
              el('div', { className: 'inbox-card__title', text: decision.title }),
              el('div', { className: 'inbox-card__copy', text: 'おすすめ: ' + decision.recommendedAnswer }),
              el('div', { className: 'stack-card__actions' }, [
                el('button', { className: 'btn btn-primary btn-small', text: 'ここで回答', dataset: { jumpDecision: decision.id } }),
              ]),
            ])),
            ...blockers.map((blocker) => el('article', { className: 'inbox-card is-warning' }, [
              el('div', { className: 'inbox-card__title', text: blocker.text }),
              el('div', { className: 'list-meta', text: 'Blocker ID: ' + blocker.id }),
              el('div', { className: 'stack-card__actions' }, [
                el('button', { className: 'btn btn-ghost btn-small', text: 'メモする', dataset: { prefillNote: blocker.id + ' について: ' + blocker.text } }),
              ]),
            ])),
          ]
        : [createEmptyState('inbox は空です', '未回答の decision や blocker はありません。')]),
    ]),
    el('section', { className: 'history-block' }, [
      el('div', { className: 'task-lane__header' }, [
        el('div', { className: 'task-lane__title', text: '最近決めたこと' }),
      ]),
      ...(answered.length
        ? answered.map((item) => el('article', { className: 'inbox-card' }, [
            el('div', { className: 'inbox-card__title', text: item.text }),
            el('div', { className: 'inbox-card__copy', text: item.answer?.answer || '回答を保存しました' }),
          ]))
        : [createEmptyState('履歴はまだありません', '回答済みの decision がここに並びます。')]),
    ]),
    el('section', { className: 'history-block' }, [
      el('div', { className: 'task-lane__header' }, [
        el('div', { className: 'task-lane__title', text: '次ターン投入待ち' }),
      ]),
      ...(queue.length
        ? queue.map((item) => el('article', { className: 'preview-card' }, [
            el('div', { className: 'preview-meta', text: queueKindLabel(item.kind) + ' / ' + fTime(item.createdAt) }),
            el('div', { className: 'task-card__title', text: item.label || queueKindLabel(item.kind) }),
            el('div', { className: 'list-copy', text: item.text }),
          ]))
        : [createEmptyState('キューは空です', '手動メモや回答を送ると次ターン投入待ちが表示されます。')]),
    ]),
  ];

  renderInto(host, sections);
}

function buildQuickSettingsCard(dashboard) {
  const settings = dashboard.settings || {};
  const card = el('form', { className: 'settings-card form-grid two-col', attrs: { id: 'quickSettingsForm' } }, [
    el('div', { className: 'field full' }, [
      el('label', { attrs: { for: 'qTaskName' }, text: '今回の依頼' }),
      el('input', { attrs: { id: 'qTaskName', value: settings.taskName || '', placeholder: '何を進めるか' } }),
    ]),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'qMaxIter' }, text: '最大反復数' }),
      el('input', { attrs: { id: 'qMaxIter', type: 'number', min: '1', value: String(settings.maxIterations || 1) } }),
    ]),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'qIdle' }, text: '待機秒' }),
      el('input', { attrs: { id: 'qIdle', type: 'number', min: '1', value: String(settings.idleSeconds || 1) } }),
    ]),
    el('div', { className: 'field full' }, [
      el('label', { attrs: { for: 'qMode' }, text: 'mode' }),
      el('select', { attrs: { id: 'qMode' } }, [
        el('option', { attrs: { value: 'command' }, text: '通常' }),
        el('option', { attrs: { value: 'demo' }, text: 'デモ' }),
      ]),
    ]),
    el('div', { className: 'field full' }, [
      el('button', { className: 'btn btn-primary', text: '基本設定を保存', attrs: { type: 'submit' } }),
    ]),
  ]);
  card.addEventListener('submit', saveQuickSettings);
  queueMicrotask(() => {
    $('qMode').value = settings.mode || 'command';
  });
  return card;
}

function buildAdvancedSettingsCard(dashboard) {
  const settings = dashboard.settings || {};
  const power = dashboard.layers?.power || {};
  const card = el('form', { className: 'settings-card form-grid', attrs: { id: 'advancedSettingsForm' } }, [
    el('div', { className: 'settings-copy', text: '詳細設定は前面には出さず、必要時だけ調整できるようにしています。' }),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'sAgent' }, text: '実行コマンド' }),
      el('input', { attrs: { id: 'sAgent', value: settings.agentCommand || '' } }),
      el('div', { className: 'field-hint', attrs: { id: 'sAgentHint' }, text: state.canEditAgent ? '次の作業から反映されます' : '起動時設定のためここでは変更できません' }),
    ]),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'sAgentCwd' }, text: '作業フォルダ' }),
      el('input', { attrs: { id: 'sAgentCwd', value: settings.agentCwd || '', placeholder: '/abs/path/to/repo' } }),
    ]),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'sPromptFile' }, text: '指示ファイル' }),
      el('input', { attrs: { id: 'sPromptFile', value: settings.promptFile || '' } }),
    ]),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'sPromptBody' }, text: '追加の指示' }),
      el('textarea', { attrs: { id: 'sPromptBody', rows: '4' } }, settings.promptBody || ''),
    ]),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'sDiscordChannel' }, text: 'Discord 通知先' }),
      el('input', { attrs: { id: 'sDiscordChannel', value: settings.discordNotifyChannelId || '', placeholder: '123456789012345678' } }),
    ]),
    el('div', { className: 'settings-meta', text: '指示ソース: ' + (power.promptSource || '未設定') }),
    el('div', { className: 'settings-actions' }, [
      el('button', { className: 'btn btn-ghost', text: 'Discord 再接続', attrs: { type: 'button' }, dataset: { reconnectDiscord: '1' } }),
      el('button', { className: 'btn btn-primary', text: '詳細設定を保存', attrs: { type: 'submit' } }),
    ]),
  ]);
  card.addEventListener('submit', saveAdvancedSettings);
  queueMicrotask(() => {
    $('sAgent').disabled = !state.canEditAgent;
  });
  return card;
}

function renderSettings(dashboard) {
  if (!dashboard) return;
  if (state.settingsDirty && $('settingsPanel')?.childNodes?.length) return;
  const host = $('settingsPanel');
  const surface = dashboard.layers?.surface || {};
  const power = dashboard.layers?.power || {};

  const content = [
    el('div', { className: 'settings-switcher' }, [
      el('button', { className: 'btn btn-ghost btn-small' + (state.settingsMode === 'quick' ? ' is-active' : ''), text: '基本設定', attrs: { type: 'button' }, dataset: { settingsMode: 'quick' } }),
      el('button', { className: 'btn btn-ghost btn-small' + (state.settingsMode === 'advanced' ? ' is-active' : ''), text: '詳細設定', attrs: { type: 'button' }, dataset: { settingsMode: 'advanced' } }),
    ]),
    el('div', { className: 'settings-card settings-stack' }, [
      el('div', { className: 'task-card__title', text: '運用コンテキスト' }),
      el('div', { className: 'settings-copy', text: 'Project: ' + (surface.projectName || '未設定') }),
      el('div', { className: 'settings-copy', text: 'Model: ' + (surface.modelLabel || '確認中') }),
      el('div', { className: 'settings-meta', text: surface.modelDetail || '' }),
    ]),
    state.settingsMode === 'quick' ? buildQuickSettingsCard(dashboard) : buildAdvancedSettingsCard(dashboard),
    el('div', { className: 'settings-card settings-stack' }, [
      el('div', { className: 'task-card__title', text: '実行環境の健全性' }),
      ...((power.resources || []).length
        ? power.resources.map((item) => el('article', { className: 'resource-card ' + levelTone(item.level) }, [
            el('div', { className: 'resource-card__title', text: item.label + ' · ' + levelLabel(item.level) }),
            el('div', { className: 'resource-card__copy', text: item.value }),
            item.detail ? el('div', { className: 'settings-meta', text: item.detail }) : null,
          ]))
        : [createEmptyState('実行環境情報はありません', '利用可能な情報があるとここに表示されます。')]),
    ]),
  ];

  renderInto(host, content);
  if (!state.settingsDirty) {
    document.querySelectorAll('#settingsPanel input, #settingsPanel textarea, #settingsPanel select').forEach((input) => {
      input.addEventListener('input', () => { state.settingsDirty = true; });
      input.addEventListener('change', () => { state.settingsDirty = true; });
    });
  }
}

function renderLogs(dashboard) {
  if (!dashboard) return;
  const host = $('logsPanel');
  const diagnostics = dashboard.layers?.power?.diagnostics || [];
  const events = (dashboard.recentEvents || []).slice(0, 12);
  const eventCards = events.map((event) => {
    const humanized = humanizeEvent(event);
    return el('article', {
      className: 'log-card ' + levelTone(event.level),
    }, [
      el('div', { className: 'log-card__title', text: humanized?.title || event.type || 'event' }),
      el('div', { className: 'log-card__copy', text: humanized?.summary || String(event.message || '') }),
      el('div', { className: 'log-meta', text: fTime(event.timestamp) }),
    ]);
  });

  renderInto(host, [
    el('section', { className: 'logs-stack' }, [
      el('div', { className: 'task-lane__header' }, [
        el('div', { className: 'task-lane__title', text: '診断' }),
      ]),
      ...((diagnostics || []).length
        ? diagnostics.map((item) => el('article', { className: 'log-card ' + levelTone(item.level) }, [
            el('div', { className: 'log-card__title', text: item.key + ' · ' + levelLabel(item.level) }),
            el('div', { className: 'log-card__copy', text: item.message }),
          ]))
        : [createEmptyState('診断結果はありません', '問題が見つかるとここに表示されます。')]),
    ]),
    el('section', { className: 'logs-stack' }, [
      el('div', { className: 'task-lane__header' }, [
        el('div', { className: 'task-lane__title', text: '最近のログ' }),
      ]),
      ...(eventCards.length ? eventCards : [createEmptyState('ログはまだありません', 'run のイベントがここに並びます。')]),
    ]),
    el('section', { className: 'logs-stack' }, [
      el('div', { className: 'task-lane__header' }, [
        el('div', { className: 'task-lane__title', text: 'agent output tail' }),
      ]),
      el('pre', { className: 'log-pre', text: (dashboard.agentLogTail || []).join('\n') || '(出力なし)' }),
    ]),
  ]);
}
`;
