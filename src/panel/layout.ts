export function renderPanelLayout(styles: string, script: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Ralph | task-first orchestration loop panel</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet"/>
<style>${styles}</style>
</head>
<body>
<div id="toasts" class="toast-stack" aria-live="polite" aria-atomic="true"></div>
<div class="app-shell">
  <header class="topbar">
    <div class="topbar__identity">
      <div class="brand-mark">Ralph Loop</div>
      <div class="topbar__project">
        <div id="topbarProject" class="topbar__project-name">プロジェクトを確認しています</div>
        <div id="topbarProjectPath" class="topbar__project-path">作業フォルダを確認しています</div>
      </div>
    </div>

    <div class="topbar__context">
      <div class="topbar__meta">
        <span class="meta-label">model</span>
        <span id="topbarModel" class="meta-value">確認中</span>
      </div>
      <div id="lifecyclePill" class="status-pill pill-idle">
        <span class="status-pill__dot"></span>
        <span id="lifecycleText">待機</span>
      </div>
    </div>

    <div class="topbar__controls" aria-label="primary controls">
      <button id="startBtn" class="btn btn-primary" type="button">開始</button>
      <button id="pauseBtn" class="btn btn-secondary" type="button">一時停止</button>
      <button id="resumeBtn" class="btn btn-secondary" type="button">再開</button>
      <button id="abortBtn" class="btn btn-danger" type="button">中断</button>
    </div>
  </header>

  <main class="workspace">
    <section class="primary-grid" aria-label="primary area">
      <section class="panel summary-panel" aria-labelledby="summaryHeading">
        <div class="panel__header">
          <div>
            <p class="eyebrow">status summary</p>
            <h1 id="summaryHeading" class="panel__title">今何をしていて、次に何が必要か</h1>
          </div>
          <div id="summaryMetrics" class="metric-row"></div>
        </div>
        <div class="summary-lead">
          <div id="summaryStatus" class="summary-status">読み込み中...</div>
          <div id="summaryRequest" class="summary-request">依頼内容を確認しています。</div>
        </div>
        <div class="summary-grid">
          <section class="focus-card focus-card--current" aria-labelledby="currentTaskHeading">
            <p class="focus-card__label">current task</p>
            <h2 id="currentTaskHeading" class="focus-card__title">現在の task</h2>
            <div id="currentTaskCard"></div>
          </section>
          <section class="focus-card focus-card--next" aria-labelledby="nextTaskHeading">
            <p class="focus-card__label">next task</p>
            <h2 id="nextTaskHeading" class="focus-card__title">次の task</h2>
            <div id="nextTaskCard"></div>
          </section>
        </div>
      </section>

      <section class="panel hero-panel" aria-labelledby="decisionHeading">
        <div class="panel__header compact">
          <div>
            <p class="eyebrow">decision inbox</p>
            <h2 id="decisionHeading" class="panel__title">未回答の判断と blockers</h2>
          </div>
          <button class="btn btn-ghost btn-small only-mobile" type="button" data-secondary-tab="inbox">履歴を見る</button>
        </div>
        <div id="decisionsHero" class="hero-stack"></div>
        <div id="blockersHero" class="hero-stack hero-stack--subtle"></div>
      </section>

      <section class="panel updates-panel" aria-labelledby="updatesHeading">
        <div class="panel__header compact">
          <div>
            <p class="eyebrow">recent updates</p>
            <h2 id="updatesHeading" class="panel__title">最近の更新</h2>
          </div>
        </div>
        <div id="recentUpdatesHero" class="updates-list"></div>
      </section>
    </section>

    <section class="panel composer-panel" aria-labelledby="composerHeading">
      <div class="panel__header compact">
        <div>
          <p class="eyebrow">manual note</p>
          <h2 id="composerHeading" class="panel__title">手動メモを送る</h2>
        </div>
        <div id="composerContext" class="context-chip is-hidden"></div>
      </div>
      <div class="composer-layout">
        <textarea id="noteInput" rows="3" placeholder="Ralph に渡したい判断・補足・依頼を書いてください"></textarea>
        <div class="composer-actions">
          <button id="sendNoteBtn" class="btn btn-primary" type="button">送信</button>
          <button id="composerTaskShortcut" class="btn btn-ghost" type="button">task を追加</button>
          <button id="composerDecisionShortcut" class="btn btn-ghost" type="button">decision を確認</button>
          <button id="composerSettingsShortcut" class="btn btn-ghost" type="button">設定を開く</button>
        </div>
      </div>
    </section>

    <section class="secondary-area" aria-label="secondary area">
      <div class="secondary-tabs only-mobile" role="tablist" aria-label="secondary tabs">
        <button class="secondary-tab is-active" type="button" role="tab" data-secondary-tab="tasks">Tasks</button>
        <button class="secondary-tab" type="button" role="tab" data-secondary-tab="inbox">Inbox</button>
        <button class="secondary-tab" type="button" role="tab" data-secondary-tab="settings">Settings</button>
        <button class="secondary-tab" type="button" role="tab" data-secondary-tab="logs">Logs</button>
      </div>

      <div class="secondary-grid">
        <section id="secondaryPanelTasks" class="panel secondary-panel is-active" data-secondary-panel="tasks" aria-labelledby="tasksHeading">
          <div class="panel__header">
            <div>
              <p class="eyebrow">task board</p>
              <h2 id="tasksHeading" class="panel__title">task 操作</h2>
            </div>
            <div class="panel__actions">
              <button id="openTaskFormBtn" class="btn btn-primary btn-small" type="button">追加</button>
              <button id="toggleTaskImportBtn" class="btn btn-ghost btn-small" type="button">まとめて追加</button>
            </div>
          </div>
          <div id="taskBoardPanel"></div>
        </section>

        <section id="secondaryPanelInbox" class="panel secondary-panel" data-secondary-panel="inbox" aria-labelledby="inboxHeading">
          <div class="panel__header">
            <div>
              <p class="eyebrow">inbox / history</p>
              <h2 id="inboxHeading" class="panel__title">確認履歴と次ターン投入待ち</h2>
            </div>
          </div>
          <div id="inboxHistoryPanel"></div>
        </section>

        <section id="secondaryPanelSettings" class="panel secondary-panel" data-secondary-panel="settings" aria-labelledby="settingsHeading">
          <div class="panel__header">
            <div>
              <p class="eyebrow">settings</p>
              <h2 id="settingsHeading" class="panel__title">運用設定</h2>
            </div>
          </div>
          <div id="settingsPanel"></div>
        </section>

        <section id="secondaryPanelLogs" class="panel secondary-panel" data-secondary-panel="logs" aria-labelledby="logsHeading">
          <div class="panel__header">
            <div>
              <p class="eyebrow">logs / diagnostics</p>
              <h2 id="logsHeading" class="panel__title">診断とログ</h2>
            </div>
          </div>
          <div id="logsPanel"></div>
        </section>
      </div>
    </section>
  </main>
</div>
<script>
${script}
</script>
</body>
</html>`;
}
