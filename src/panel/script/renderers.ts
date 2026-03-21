export const panelScriptRenderers = String.raw`
function createMetric(label, value) {
  return el('div', { className: 'metric-chip' }, [
    el('span', { className: 'metric-chip__label', text: label }),
    el('span', { className: 'metric-chip__value', text: value }),
  ]);
}

function createEmptyState(title, copy, actions = []) {
  const actionList = Array.isArray(actions) ? actions : [actions];
  return el('div', { className: 'empty-state' }, [
    el('div', { className: 'empty-title', text: title }),
    el('div', { className: 'empty-copy', text: copy }),
    ...actionList.filter(Boolean),
  ]);
}

function createInlineChip(text, className = '') {
  return el('span', { className: ['inline-chip', className].filter(Boolean).join(' '), text });
}

function createActionButton(text, dataset, className = 'btn btn-ghost btn-small') {
  return el('button', { className, text, dataset, attrs: { type: 'button' } });
}

function formatTaskStatus(task) {
  const map = {
    active: '進行中',
    queued: '待機',
    blocked: '停止中',
    completed: '完了',
  };
  return map[task?.displayStatus || 'queued'] || '待機';
}

function missionCopy(dashboard) {
  const currentTask = dashboard.currentTask;
  const nextTask = dashboard.nextTask;
  const decisions = dashboard.pendingDecisions || [];
  const blockers = dashboard.blockers || [];
  const taskCount = (dashboard.taskBoard || []).length;

  const summary = dashboard.workspace?.goal
    || (currentTask
      ? '現在は「' + currentTask.title + '」を深く進める workspace です。'
      : '現在の task を決める workspace です。');

  let next = '次アクションを整理中です。';
  if (decisions.length > 0) {
    next = '次に、pending decision へ回答してください。';
  } else if (blockers.length > 0) {
    next = '次に、blocker を解除する判断が必要です。';
  } else if (nextTask) {
    next = '次に続く task は「' + nextTask.title + '」です。';
  } else if (taskCount === 0) {
    next = '最初の task を追加すると開始できます。';
  }

  return {
    status: dashboard.workspace?.scenarioLabel || dashboard.status?.thinkingText || dashboard.status?.currentStatusText || '待機しています。',
    summary,
    next,
  };
}

function deriveWorkspace(dashboard) {
  const fallbackSource = dashboard.settings?.promptBody?.trim()
    ? dashboard.settings.promptBody.trim()
    : dashboard.settings?.promptFile || 'source spec is not configured';
  return dashboard.workspace || {
    scenarioLabel: 'Live workspace',
    goal: dashboard.currentTask?.summary || '現在の task を進めるための context を整理する。',
    doneDefinition: dashboard.currentTask?.acceptanceCriteria?.join(' / ') || dashboard.currentTask?.summary || '次アクションが明確であること。',
    sourceSpec: fallbackSource,
    primaryAction: dashboard.pendingDecisions?.[0]
      ? { label: 'decision に答える', dataset: { useDecision: dashboard.pendingDecisions[0].id }, className: 'btn btn-primary btn-small' }
      : { label: 'Tasks を確認', dataset: { secondaryTab: 'tasks' }, className: 'btn btn-primary btn-small' },
    relations: [
      { label: 'parent · ' + (dashboard.settings?.taskName || 'workspace root'), tone: '' },
      { label: 'child · ' + ((dashboard.nextTask && dashboard.nextTask.title) || 'none'), tone: '' },
      { label: 'blocked-by · ' + ((dashboard.blockers?.[0] && dashboard.blockers[0].text) || 'none'), tone: dashboard.blockers?.length ? 'is-blocked' : '' },
      { label: 'related · Inbox / Tasks / Decisions', tone: '' },
    ],
    chat: [
      { role: 'system', label: 'mission', copy: dashboard.status?.currentStatusText || 'workspace を確認しています。', meta: 'run status' },
      { role: 'agent', label: 'next action', copy: dashboard.currentTask ? '現在の task は「' + dashboard.currentTask.title + '」です。' : 'active task はありません。', meta: 'derived summary' },
    ],
  };
}

function createRelationChip(item) {
  return el('span', { className: ['relation-chip', item.tone || ''].filter(Boolean).join(' '), text: item.label });
}

function createContextCard(label, value) {
  return el('article', { className: 'context-card' }, [
    el('div', { className: 'context-card__label', text: label }),
    el('div', { className: 'context-card__value', text: value }),
  ]);
}

function createChatBubble(entry) {
  return el('article', { className: 'chat-bubble chat-bubble--' + (entry.role || 'system') }, [
    el('div', { className: 'chat-bubble__meta', text: (entry.label || 'note') + ' · ' + (entry.meta || '') }),
    el('div', { className: 'chat-bubble__copy', text: entry.copy || '' }),
  ]);
}

function createTaskSummary(task, options = {}) {
  if (!task) {
    return createEmptyState(
      options.emptyTitle || 'task はありません',
      options.emptyCopy || '次の操作を選んでください。',
      options.emptyActions || [],
    );
  }

  const actions = [];
  if (task.displayStatus === 'completed') {
    actions.push(createActionButton('未完了に戻す', { reopenTask: task.id }));
  } else {
    actions.push(createActionButton('完了', { completeTask: task.id }));
  }
  if (options.allowPrioritize && task.displayStatus !== 'completed') {
    actions.push(createActionButton('先頭へ', { moveTask: task.id, movePosition: 'front' }));
    actions.push(createActionButton('後ろへ', { moveTask: task.id, movePosition: 'back' }));
  }
  actions.push(createActionButton('編集', { editTask: task.id }));

  return el('div', { className: 'task-shell' }, [
    el('div', { className: 'task-title-row' }, [
      el('div', {}, [
        el('div', { className: 'task-id', text: task.id }),
        el('div', { className: 'task-title', text: task.title }),
      ]),
      createInlineChip(formatTaskStatus(task)),
    ]),
    task.summary && task.summary !== task.title ? el('div', { className: 'task-copy', text: task.summary }) : null,
    el('div', { className: 'task-meta' }, [
      el('div', { text: '更新: ' + fTime(task.updatedAt) }),
      el('div', { text: 'source: ' + String(task.source || 'manual') }),
    ]),
    el('div', { className: 'task-actions' }, actions),
  ]);
}

function createDecisionEntry(decision) {
  return el('article', { className: 'entry-card' }, [
    el('div', { className: 'entry-title', text: decision.title }),
    el('div', { className: 'entry-copy', text: '推奨: ' + decision.recommendedAnswer }),
    el('div', { className: 'entry-copy', text: '保留時: ' + decision.fallbackAnswer }),
    el('div', { className: 'entry-actions' }, [
      ...decision.choices.map((choice) => {
        if (choice.kind === 'custom') {
          return createActionButton(choice.label, { useDecision: decision.id });
        }
        return createActionButton(
          choice.label,
          { answerQuestion: decision.id, answerValue: choice.answer || '' },
          choice.id === 'recommended' ? 'btn btn-primary btn-small' : 'btn btn-ghost btn-small',
        );
      }),
    ]),
    el('textarea', { attrs: { rows: '2', id: 'decisionAnswer_' + decision.id, placeholder: '別案があればここに記入' } }),
    el('div', { className: 'entry-actions' }, [
      createActionButton('composer で答える', { useDecision: decision.id }),
      createActionButton('この内容で送信', { submitQuestion: decision.id }, 'btn btn-ghost btn-small'),
    ]),
  ]);
}

function createBlockerEntry(blocker) {
  return el('article', { className: 'entry-card is-danger' }, [
    el('div', { className: 'entry-title', text: blocker.text || blocker.id }),
    el('div', { className: 'entry-meta', text: 'Blocker ID: ' + blocker.id + ' / ' + fTime(blocker.createdAt) }),
    el('div', { className: 'entry-actions' }, [
      createActionButton('この件をメモする', { prefillNote: blocker.id + ' について: ' + blocker.text }),
      createActionButton('Inbox へ移動', { secondaryTab: 'inbox' }),
    ]),
  ]);
}

function createTimelineEntry(item) {
  return el('article', { className: 'entry-card' }, [
    el('div', { className: 'entry-title', text: item.title }),
    el('div', { className: 'entry-copy', text: item.summary }),
    el('div', { className: 'entry-meta', text: item.meta }),
  ]);
}

function renderFixtureSwitcher() {
  renderInto($('fixtureSwitcher'), FIXTURE_MODES.map((mode) => createActionButton(
    mode === 'live' ? 'live data' : mode,
    { fixtureMode: mode },
    'fixture-chip' + (state.fixtureMode === mode ? ' is-active' : ''),
  )));
}

function renderHeader(dashboard) {
  const status = dashboard.status || {};
  const surface = dashboard.layers?.surface || {};
  const diagnostics = dashboard.layers?.power?.diagnostics || [];
  const warnings = diagnostics.filter((item) => item.level === 'warning').length;
  const errors = diagnostics.filter((item) => item.level === 'error').length;
  const decisions = (dashboard.pendingDecisions || []).length;
  const blockers = (dashboard.blockers || []).length;

  $('topbarProject').textContent = surface.projectName || 'プロジェクト未設定';
  $('topbarProjectPath').textContent = surface.projectPath || '作業フォルダ未設定';
  $('topbarModel').textContent = surface.modelLabel || '確認中';
  $('topbarModel').title = surface.modelDetail || '';
  $('healthSummary').textContent = 'decision ' + decisions + ' / blocker ' + blockers + ' / error ' + errors + ' / warn ' + warnings;

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
  const run = dashboard.layers?.control?.run || {};
  const mission = missionCopy(dashboard);
  const workspace = deriveWorkspace(dashboard);
  state.selectedDecisionId = state.selectedDecisionId || firstPendingDecisionId(dashboard);

  renderInto($('summaryMetrics'), [
    createMetric('進行中', run.activeTaskCount || 0),
    createMetric('待機', run.queuedTaskCount || 0),
    createMetric('判断待ち', (dashboard.pendingDecisions || []).length + (dashboard.blockers || []).length),
    createMetric('完了', run.completedTaskCount || 0),
  ]);

  $('workspaceEyebrow').textContent = workspace.scenarioLabel || 'task workspace';
  $('workspaceHeading').textContent = dashboard.currentTask?.title || dashboard.settings?.taskName || 'Task workspace';
  $('workspaceSummary').textContent = mission.summary + ' ' + mission.next;

  renderInto($('workspaceHeader'), el('div', { className: 'workspace-header__meta' }, [
    el('div', { className: 'workspace-header__chips' }, [
      createInlineChip('status · ' + mission.status),
      createInlineChip('current · ' + (dashboard.currentTask?.id || 'none')),
      createInlineChip('next · ' + (dashboard.nextTask?.id || 'none')),
    ]),
    el('div', { className: 'workspace-header__id', text: dashboard.currentTask?.id || 'WORKSPACE' }),
    el('div', { className: 'workspace-header__title', text: dashboard.currentTask?.title || dashboard.settings?.taskName || 'Task workspace' }),
    el('div', { className: 'workspace-header__summary', text: dashboard.currentTask?.summary || mission.summary }),
    el('div', { className: 'workspace-relations' }, (workspace.relations || []).map(createRelationChip)),
  ]));

  renderInto($('taskContextStrip'), [
    el('div', { className: 'section-head' }, [
      el('div', {}, [
        el('p', { className: 'section-kicker', text: 'sticky context' }),
        el('h2', { className: 'section-title', text: 'goal / done definition / source spec' }),
      ]),
    ]),
    el('div', { className: 'context-strip__items' }, [
      createContextCard('task goal', workspace.goal || '—'),
      createContextCard('done definition', workspace.doneDefinition || '—'),
      createContextCard('source spec', workspace.sourceSpec || '—'),
    ]),
  ]);

  renderInto($('workspacePrimaryAction'), workspace.primaryAction
    ? createActionButton(workspace.primaryAction.label, workspace.primaryAction.dataset, workspace.primaryAction.className)
    : []);
  renderInto($('workspaceTimeline'), (workspace.chat || []).map(createChatBubble));

  const composerContext = $('composerContext');
  const composerLabel = state.composerMode === 'decision'
    ? 'decision target: ' + (state.selectedDecisionId || firstPendingDecisionId(dashboard) || 'none')
    : dashboard.currentTask
      ? 'current task: ' + dashboard.currentTask.title
      : 'task を選択してください';
  composerContext.textContent = composerLabel;
  composerContext.classList.remove('is-hidden');

  renderInto($('railMission'), [
    el('button', { className: 'rail-linkish', dataset: { secondaryTab: 'tasks' }, attrs: { type: 'button' } }, [
      el('span', { className: 'rail-item__icon is-current' }),
      el('span', {}, [
        el('div', { className: 'rail-item__label', text: workspace.scenarioLabel || 'workspace' }),
        el('div', { className: 'rail-copy', text: mission.next }),
      ]),
    ]),
    el('button', { className: 'rail-linkish', dataset: { fixtureMode: 'plan-review' }, attrs: { type: 'button' } }, [
      el('span', { className: 'rail-item__icon' }),
      el('span', {}, [
        el('div', { className: 'rail-item__label', text: 'plan review' }),
        el('div', { className: 'rail-copy', text: 'spec import 後の構図を確認' }),
      ]),
    ]),
    el('button', { className: 'rail-linkish', dataset: { fixtureMode: 'active-workspace' }, attrs: { type: 'button' } }, [
      el('span', { className: 'rail-item__icon is-next' }),
      el('span', {}, [
        el('div', { className: 'rail-item__label', text: 'active task' }),
        el('div', { className: 'rail-copy', text: '1 task = 1 chat の主画面' }),
      ]),
    ]),
    el('button', { className: 'rail-linkish', dataset: { fixtureMode: 'blocked-waiting' }, attrs: { type: 'button' } }, [
      el('span', { className: 'rail-item__icon is-blocked' }),
      el('span', {}, [
        el('div', { className: 'rail-item__label', text: 'blocked' }),
        el('div', { className: 'rail-copy', text: 'decision / blocker を前に出す' }),
      ]),
    ]),
  ]);

  renderInto($('railTaskList'), (dashboard.taskBoard || []).slice(0, 6).map((task) => el('article', {
    className: 'rail-item',
  }, [
    el('span', { className: 'rail-item__icon ' + (task.id === dashboard.currentTask?.id ? 'is-current' : task.displayStatus === 'blocked' ? 'is-blocked' : task.id === dashboard.nextTask?.id ? 'is-next' : '') }),
    el('div', {}, [
      el('div', { className: 'rail-item__label', text: task.id + ' · ' + task.title }),
      el('div', { className: 'rail-item__meta', text: formatTaskStatus(task) + ' / ' + (task.source || 'manual') }),
    ]),
  ])));
}

function renderActionRail(dashboard) {
  const decisionHost = $('decisionRail');
  const quickHost = $('quickActionsPanel');
  const queueHost = $('queueSnapshotPanel');
  const decisions = dashboard.pendingDecisions || [];
  const blockers = dashboard.blockers || [];
  const run = dashboard.layers?.control?.run || {};
  const taskBoard = dashboard.taskBoard || [];
  const blockedTasks = taskBoard.filter((task) => task.displayStatus === 'blocked').length;

  const decisionNodes = [];
  if (state.abortConfirmOpen) {
    decisionNodes.push(el('article', { className: 'entry-card is-danger' }, [
      el('div', { className: 'entry-title', text: 'この run を中断しますか？' }),
      el('div', { className: 'entry-copy', text: '途中状態は残りますが、現在の run は停止します。' }),
      el('div', { className: 'entry-actions' }, [
        createActionButton('中断する', { confirmAbort: '1' }, 'btn btn-danger btn-small'),
        createActionButton('戻る', { cancelAbort: '1' }),
      ]),
    ]));
  }

  if (decisions.length === 0 && blockers.length === 0) {
    decisionNodes.push(createEmptyState(
      'pending decision はありません',
      '判断待ちや blocker が出たときだけここを開けば十分です。',
      createActionButton('Inbox を見る', { secondaryTab: 'inbox' }),
    ));
  } else {
    decisions.slice(0, 3).forEach((decision) => decisionNodes.push(createDecisionEntry(decision)));
    blockers.slice(0, 2).forEach((blocker) => decisionNodes.push(createBlockerEntry(blocker)));
  }
  renderInto(decisionHost, el('div', { className: 'side-stack' }, decisionNodes));

  renderInto(quickHost, el('div', { className: 'quick-actions' }, [
    createActionButton('task 追加', { openTaskCreate: '1' }, 'btn btn-primary btn-small'),
    createActionButton('spec から追加', { toggleTaskImport: '1' }),
    createActionButton('Tasks を開く', { secondaryTab: 'tasks' }),
    createActionButton('Inbox を開く', { secondaryTab: 'inbox' }),
  ]));

  renderInto(queueHost, el('div', { className: 'snapshot-grid' }, [
    el('div', { className: 'snapshot-card' }, [
      el('div', { className: 'snapshot-label', text: 'queued' }),
      el('div', { className: 'snapshot-value', text: run.queuedTaskCount || 0 }),
    ]),
    el('div', { className: 'snapshot-card' }, [
      el('div', { className: 'snapshot-label', text: 'in progress' }),
      el('div', { className: 'snapshot-value', text: run.activeTaskCount || 0 }),
    ]),
    el('div', { className: 'snapshot-card' }, [
      el('div', { className: 'snapshot-label', text: 'done' }),
      el('div', { className: 'snapshot-value', text: run.completedTaskCount || 0 }),
    ]),
    el('div', { className: 'snapshot-card' }, [
      el('div', { className: 'snapshot-label', text: 'blocked' }),
      el('div', { className: 'snapshot-value', text: blockedTasks }),
    ]),
  ]));
}

function createTaskColumn(title, items, currentId, nextId, emptyStateNode) {
  return el('section', { className: 'task-column' }, [
    el('div', { className: 'task-column-head' }, [
      el('div', { className: 'task-column-title', text: title }),
      createInlineChip(String(items.length)),
    ]),
    ...(items.length ? items.map((task) => el('article', {
      className: ['task-row', task.id === currentId ? 'is-current' : '', task.id === nextId ? 'is-next' : ''].filter(Boolean).join(' '),
    }, [
      el('div', { className: 'task-row-head' }, [
        el('div', {}, [
          el('div', { className: 'task-id', text: task.id }),
          el('div', { className: 'entry-title', text: task.title }),
        ]),
        createInlineChip(formatTaskStatus(task)),
      ]),
      task.summary && task.summary !== task.title ? el('div', { className: 'task-copy', text: task.summary }) : null,
      el('div', { className: 'task-actions' }, [
        task.displayStatus === 'completed'
          ? createActionButton('reopen', { reopenTask: task.id })
          : createActionButton('complete', { completeTask: task.id }),
        task.displayStatus === 'completed' ? null : createActionButton('up', { moveTask: task.id, movePosition: 'front' }),
        task.displayStatus === 'completed' ? null : createActionButton('down', { moveTask: task.id, movePosition: 'back' }),
        createActionButton('edit', { editTask: task.id }),
      ].filter(Boolean)),
    ]))) : [emptyStateNode]),
  ]);
}

function renderTaskBoard(dashboard) {
  if (!dashboard) return;
  const host = $('taskBoardPanel');
  const items = dashboard.taskBoard || [];
  const currentId = dashboard.currentTask?.id;
  const nextId = dashboard.nextTask?.id;
  const currentItems = items.filter((task) => task.id === currentId);
  const queuedItems = items.filter((task) => task.displayStatus !== 'completed' && task.id !== currentId).slice(0, 5);
  const doneItems = items.filter((task) => task.displayStatus === 'completed').slice(0, 5);

  const sections = [];
  if (state.taskFormVisible) {
    const task = items.find((item) => item.id === state.editingTaskId);
    const form = el('form', { className: 'form-card form-grid', attrs: { id: 'taskForm' } }, [
      el('div', { className: 'entry-title', text: task ? 'task を編集' : 'task を追加' }),
      el('div', { className: 'field' }, [
        el('label', { attrs: { for: 'taskFormTitle' }, text: 'task 名' }),
        el('input', { attrs: { id: 'taskFormTitle', value: task?.title || '', placeholder: '何を進めるか' } }),
      ]),
      el('div', { className: 'field' }, [
        el('label', { attrs: { for: 'taskFormSummary' }, text: '補足 / 完了条件' }),
        el('textarea', { attrs: { id: 'taskFormSummary', rows: '3', placeholder: '完了の目安や補足' } }, task?.summary || ''),
      ]),
      el('div', { className: 'form-actions' }, [
        createActionButton(task ? '更新する' : '追加する', {}, 'btn btn-primary'),
        createActionButton('閉じる', { closeTaskForm: '1' }),
      ]),
    ]);
    form.querySelector('.btn.btn-primary').setAttribute('type', 'submit');
    form.addEventListener('submit', submitTaskForm);
    sections.push(form);
  }

  if (state.taskImportVisible) {
    const preview = state.taskImportPreview;
    const importBlock = el('div', { className: 'form-card form-stack' }, [
      el('div', { className: 'entry-title', text: '仕様やメモから task を追加' }),
      el('textarea', { attrs: { id: 'taskImportInput', rows: '6', placeholder: 'README / issue / 仕様メモを貼り付ける' } }),
      el('div', { className: 'form-actions' }, [
        createActionButton('プレビュー', { previewTaskImport: '1' }),
        createActionButton('追加', { importTasks: '1' }, 'btn btn-primary btn-small'),
        createActionButton('閉じる', { closeTaskImport: '1' }),
      ]),
    ]);
    const previewHost = el('div', { className: 'timeline' });
    if (!preview) {
      previewHost.append(createEmptyState('まだプレビューしていません', '内容を確認すると、追加される task がここに出ます。'));
    } else if (!(preview.tasks || []).length) {
      previewHost.append(createEmptyState('抽出できる task がありません', '見出し・箇条書き・JSON を試してください。'));
    } else {
      preview.tasks.slice(0, 5).forEach((task, index) => {
        previewHost.append(el('article', { className: 'entry-card' }, [
          el('div', { className: 'entry-meta', text: '候補 ' + String(index + 1) }),
          el('div', { className: 'entry-title', text: task.title }),
          el('div', { className: 'entry-copy', text: task.summary || task.title }),
        ]));
      });
    }
    importBlock.append(previewHost);
    sections.push(importBlock);
    queueMicrotask(() => {
      const input = $('taskImportInput');
      if (input instanceof HTMLTextAreaElement) {
        input.value = taskImportText();
        input.addEventListener('input', scheduleTaskImportPreview);
      }
    });
  }

  if (!items.length) {
    sections.push(createEmptyState(
      'task はまだありません',
      '最初の task を追加するか、仕様からまとめて追加してください。',
      el('div', { className: 'entry-actions' }, [
        createActionButton('最初の task を追加', { openTaskCreate: '1' }, 'btn btn-primary btn-small'),
        createActionButton('まとめて追加', { toggleTaskImport: '1' }),
        createActionButton('サンプルで始める', { notePreset: '最初の task 候補を3件提案してください' }),
      ]),
    ));
    renderInto(host, sections);
    return;
  }

  sections.push(el('div', { className: 'task-columns' }, [
    createTaskColumn('current', currentItems, currentId, nextId, createEmptyState('current はありません', 'queue から task を選んで開始してください。')),
    createTaskColumn('queued', queuedItems, currentId, nextId, createEmptyState('queued はありません', '続きの task を追加してください。')),
    createTaskColumn('done', doneItems, currentId, nextId, createEmptyState('done はありません', '完了した task はここに並びます。')),
  ]));

  if (items.filter((task) => task.displayStatus !== 'completed' && task.id !== currentId).length > queuedItems.length) {
    sections.push(el('div', { className: 'settings-meta', text: 'queued の残り ' + String(items.filter((task) => task.displayStatus !== 'completed' && task.id !== currentId).length - queuedItems.length) + ' 件は順に保持されています。' }));
  }
  renderInto(host, sections);
}

function renderInboxHistory(dashboard) {
  if (!dashboard) return;
  const host = $('inboxHistoryPanel');
  const queue = dashboard.layers?.control?.previewQueue || dashboard.promptInjectionQueue || [];
  const answered = (dashboard.answeredQuestions || []).slice(-5).reverse();
  const blockers = (dashboard.blockers || []).slice(0, 5);

  renderInto(host, el('div', { className: 'inbox-stack' }, [
    el('div', { className: 'settings-title', text: '最近回答した decision' }),
    ...(answered.length
      ? answered.map((item) => el('article', { className: 'entry-card' }, [
          el('div', { className: 'entry-title', text: item.text }),
          el('div', { className: 'entry-copy', text: item.answer?.answer || '回答を保存しました' }),
        ]))
      : [createEmptyState('履歴はまだありません', '回答済みの decision がここに表示されます。')]),
    el('div', { className: 'settings-title', text: '次ターン投入待ち' }),
    ...(queue.length
      ? queue.map((item) => el('article', { className: 'entry-card' }, [
          el('div', { className: 'entry-meta', text: queueKindLabel(item.kind) + ' / ' + fTime(item.createdAt) }),
          el('div', { className: 'entry-title', text: item.label || queueKindLabel(item.kind) }),
          el('div', { className: 'entry-copy', text: item.text }),
        ]))
      : [createEmptyState('キューは空です', 'manual note や回答を送るとここに並びます。')]),
    el('div', { className: 'settings-title', text: '最近の blocker' }),
    ...(blockers.length
      ? blockers.map((blocker) => createBlockerEntry(blocker))
      : [createEmptyState('blocker はありません', '発生するとここに履歴として残ります。')]),
  ]));
}

function buildQuickSettingsCard(dashboard) {
  const settings = dashboard.settings || {};
  const form = el('form', { className: 'settings-card form-grid two-col', attrs: { id: 'quickSettingsForm' } }, [
    el('div', { className: 'field full' }, [
      el('label', { attrs: { for: 'qTaskName' }, text: '今回の依頼' }),
      el('input', { attrs: { id: 'qTaskName', value: settings.taskName || '', placeholder: '何を進めるか' } }),
    ]),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'qMaxIter' }, text: 'max steps' }),
      el('input', { attrs: { id: 'qMaxIter', type: 'number', min: '1', value: String(settings.maxIterations || 1) } }),
    ]),
    el('div', { className: 'field' }, [
      el('label', { attrs: { for: 'qIdle' }, text: 'idle seconds' }),
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
  form.addEventListener('submit', saveQuickSettings);
  queueMicrotask(() => { $('qMode').value = settings.mode || 'command'; });
  return form;
}

function buildAdvancedSettingsCard(dashboard) {
  const settings = dashboard.settings || {};
  const power = dashboard.layers?.power || {};
  const details = el('details', { className: 'fold', attrs: { open: '' } }, [
    el('summary', { className: 'fold__title', text: '詳細設定' }),
    el('form', { className: 'settings-card form-grid', attrs: { id: 'advancedSettingsForm' } }, [
      el('div', { className: 'field' }, [
        el('label', { attrs: { for: 'sAgent' }, text: 'runtime agent command' }),
        el('input', { attrs: { id: 'sAgent', value: settings.agentCommand || '' } }),
        el('div', { className: 'field-hint', text: state.canEditAgent ? '次の run から反映されます' : '起動時設定のため変更できません' }),
      ]),
      el('div', { className: 'field' }, [
        el('label', { attrs: { for: 'sAgentCwd' }, text: 'project path' }),
        el('input', { attrs: { id: 'sAgentCwd', value: settings.agentCwd || '' } }),
      ]),
      el('div', { className: 'field' }, [
        el('label', { attrs: { for: 'sPromptFile' }, text: 'prompt file' }),
        el('input', { attrs: { id: 'sPromptFile', value: settings.promptFile || '' } }),
      ]),
      el('div', { className: 'field' }, [
        el('label', { attrs: { for: 'sPromptBody' }, text: '追加の指示' }),
        el('textarea', { attrs: { id: 'sPromptBody', rows: '3' } }, settings.promptBody || ''),
      ]),
      el('div', { className: 'field' }, [
        el('label', { attrs: { for: 'sDiscordChannel' }, text: 'discord notify channel' }),
        el('input', { attrs: { id: 'sDiscordChannel', value: settings.discordNotifyChannelId || '' } }),
      ]),
      el('div', { className: 'settings-actions' }, [
        createActionButton('Discord 再接続', { reconnectDiscord: '1' }),
        el('button', { className: 'btn btn-primary', text: '詳細設定を保存', attrs: { type: 'submit' } }),
      ]),
      el('div', { className: 'settings-meta', text: '指示ソース: ' + (power.promptSource || '未設定') }),
    ]),
  ]);
  details.querySelector('#advancedSettingsForm').addEventListener('submit', saveAdvancedSettings);
  queueMicrotask(() => {
    const input = $('sAgent');
    if (input instanceof HTMLInputElement) input.disabled = !state.canEditAgent;
  });
  return details;
}

function renderSettings(dashboard) {
  if (!dashboard) return;
  if (state.settingsDirty && $('settingsPanel')?.childNodes?.length) return;
  const surface = dashboard.layers?.surface || {};
  const power = dashboard.layers?.power || {};
  renderInto($('settingsPanel'), el('div', { className: 'settings-stack' }, [
    el('article', { className: 'settings-card settings-stack' }, [
      el('div', { className: 'settings-title', text: '運用コンテキスト' }),
      el('div', { className: 'settings-copy', text: 'project: ' + (surface.projectPath || '未設定') }),
      el('div', { className: 'settings-copy', text: 'model: ' + (surface.modelLabel || '確認中') }),
      el('div', { className: 'settings-meta', text: surface.modelDetail || '' }),
    ]),
    buildQuickSettingsCard(dashboard),
    buildAdvancedSettingsCard(dashboard),
    el('article', { className: 'settings-card settings-stack' }, [
      el('div', { className: 'settings-title', text: '診断サマリ' }),
      ...((power.diagnostics || []).filter((item) => item.level !== 'ok').length
        ? power.diagnostics.filter((item) => item.level !== 'ok').map((item) => el('div', { className: 'entry-card ' + levelTone(item.level) }, [
            el('div', { className: 'entry-title', text: item.key + ' · ' + levelLabel(item.level) }),
            el('div', { className: 'entry-copy', text: item.message }),
          ]))
        : [createEmptyState('warning / error はありません', '詳細が必要なときだけここを確認してください。')]),
    ]),
  ]));

  document.querySelectorAll('#settingsPanel input, #settingsPanel textarea, #settingsPanel select').forEach((input) => {
    input.addEventListener('input', () => { state.settingsDirty = true; });
    input.addEventListener('change', () => { state.settingsDirty = true; });
  });
}

function renderLogs(dashboard) {
  if (!dashboard) return;
  const host = $('logsPanel');
  const priorityEvents = (dashboard.recentEvents || []).filter((event) => event.level !== 'info').slice(0, 8);
  const fallbackEvents = (dashboard.recentEvents || []).slice(0, 6);
  const events = priorityEvents.length ? priorityEvents : fallbackEvents;
  renderInto(host, el('div', { className: 'log-stack' }, [
    ...(events.length
      ? events.map((event) => {
          const card = humanizeEvent(event);
          return el('article', { className: 'log-card ' + levelTone(event.level) }, [
            el('div', { className: 'log-title', text: card?.title || event.type || 'event' }),
            el('div', { className: 'log-copy', text: card?.summary || String(event.message || '') }),
            el('div', { className: 'log-meta', text: fTime(event.timestamp) }),
          ]);
        })
      : [createEmptyState('表示するログはありません', 'warning / error が発生するとここに優先表示します。')]),
    el('details', { className: 'fold' }, [
      el('summary', { className: 'fold__title', text: 'raw output tail を表示' }),
      el('pre', { className: 'log-pre', text: (dashboard.agentLogTail || []).join('\n') || '(出力なし)' }),
    ]),
  ]));
}
`;
