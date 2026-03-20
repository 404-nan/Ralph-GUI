export function renderPanelLayout(styles: string, script: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Ralph | LuLOS panel</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet"/>
<style>${styles}</style>
</head>
<body>
<div id="toasts" class="toast-stack" aria-live="polite" aria-atomic="true"></div>
<div class="app-shell">
  <header class="topbar">
    <div class="topbar__brand">
      <div class="brand-mark">Ralph</div>
      <div class="topbar__project">
        <div id="topbarProject" class="topbar__project-name">プロジェクトを確認しています</div>
        <div id="topbarProjectPath" class="topbar__project-path">作業フォルダを確認しています</div>
      </div>
    </div>

    <div class="topbar__summary">
      <div class="topbar__meta-group">
        <div class="meta-pair">
          <span class="meta-label">model</span>
          <span id="topbarModel" class="meta-value">確認中</span>
        </div>
        <div class="meta-pair">
          <span class="meta-label">health</span>
          <span id="healthSummary" class="meta-value">確認中</span>
        </div>
      </div>
      <div id="lifecyclePill" class="status-pill pill-idle">
        <span class="status-pill__dot"></span>
        <span id="lifecycleText">待機</span>
      </div>
    </div>

    <div class="topbar__controls" aria-label="primary controls">
      <button id="startBtn" class="btn btn-primary" type="button">開始</button>
      <button id="pauseBtn" class="btn btn-ghost" type="button">一時停止</button>
      <button id="resumeBtn" class="btn btn-ghost" type="button">再開</button>
      <button id="abortBtn" class="btn btn-danger" type="button">中断</button>
    </div>
  </header>

  <main class="workspace">
    <div class="shell-grid">
      <aside class="left-rail" aria-label="section navigation">
        <div class="rail-card rail-card--sticky">
          <div class="rail-title">Operations</div>
          <div class="rail-nav">
            <button class="rail-link is-active" type="button" data-nav-target="missionPanel">Mission</button>
            <button class="rail-link" type="button" data-nav-target="decisionsPanel">Decisions</button>
            <button class="rail-link" type="button" data-nav-target="updatesPanel">Updates</button>
            <button class="rail-link" type="button" data-secondary-tab="tasks">Tasks</button>
            <button class="rail-link" type="button" data-secondary-tab="inbox">Inbox</button>
            <button class="rail-link" type="button" data-secondary-tab="settings">Settings</button>
          </div>
        </div>
      </aside>

      <section class="main-stage">
        <article id="missionPanel" class="main-surface" aria-labelledby="missionHeading">
          <div class="surface-head">
            <div>
              <p class="eyebrow">mission</p>
              <h1 id="missionHeading" class="surface-title">今何をしていて、次に何が必要か</h1>
            </div>
            <div id="summaryMetrics" class="metric-row"></div>
          </div>

          <section class="mission-block">
            <div id="summaryStatus" class="mission-status">読み込み中...</div>
            <div id="missionNow" class="mission-line">現在の状況を確認しています。</div>
            <div id="missionNext" class="mission-line mission-line--next">次アクションを整理しています。</div>
          </section>

          <section class="main-section" aria-labelledby="currentTaskHeading">
            <div class="section-head">
              <div>
                <p class="section-kicker">current task</p>
                <h2 id="currentTaskHeading" class="section-title">現在の task</h2>
              </div>
            </div>
            <div id="currentTaskPanel"></div>
          </section>

          <section class="main-section" aria-labelledby="nextTaskHeading">
            <div class="section-head">
              <div>
                <p class="section-kicker">next task</p>
                <h2 id="nextTaskHeading" class="section-title">次の task</h2>
              </div>
            </div>
            <div id="nextTaskPanel"></div>
          </section>

          <section id="updatesPanel" class="main-section" aria-labelledby="updatesHeading">
            <div class="section-head">
              <div>
                <p class="section-kicker">recent updates</p>
                <h2 id="updatesHeading" class="section-title">最近の更新</h2>
              </div>
            </div>
            <div id="recentUpdatesPanel"></div>
          </section>
        </article>
      </section>

      <aside class="action-stage">
        <article id="decisionsPanel" class="side-surface" aria-labelledby="decisionsHeading">
          <div class="surface-head compact">
            <div>
              <p class="eyebrow">pending decisions</p>
              <h2 id="decisionsHeading" class="surface-title">人の返答が必要なもの</h2>
            </div>
          </div>
          <div id="decisionRail"></div>
        </article>

        <article class="side-surface" aria-labelledby="quickActionsHeading">
          <div class="surface-head compact">
            <div>
              <p class="eyebrow">quick actions</p>
              <h2 id="quickActionsHeading" class="surface-title">すぐやる操作</h2>
            </div>
          </div>
          <div id="quickActionsPanel"></div>
          <div id="queueSnapshotPanel" class="queue-snapshot"></div>
        </article>
      </aside>
    </div>

    <section class="secondary-shell" aria-label="secondary panels">
      <div class="secondary-tabs" role="tablist" aria-label="secondary tabs">
        <button class="secondary-tab is-active" type="button" role="tab" data-secondary-tab="tasks">Tasks</button>
        <button class="secondary-tab" type="button" role="tab" data-secondary-tab="inbox">Inbox</button>
        <button class="secondary-tab" type="button" role="tab" data-secondary-tab="logs">Logs</button>
        <button class="secondary-tab" type="button" role="tab" data-secondary-tab="settings">Settings</button>
      </div>

      <div class="secondary-panels">
        <section id="secondaryPanelTasks" class="secondary-panel is-active" data-secondary-panel="tasks" aria-labelledby="tasksHeading">
          <div class="surface-head compact secondary-head">
            <div>
              <p class="eyebrow">task board</p>
              <h2 id="tasksHeading" class="surface-title">queue を調整する</h2>
            </div>
            <div class="surface-actions">
              <button id="openTaskFormBtn" class="btn btn-primary btn-small" type="button">task 追加</button>
              <button id="toggleTaskImportBtn" class="btn btn-ghost btn-small" type="button">まとめて追加</button>
            </div>
          </div>
          <div id="taskBoardPanel"></div>
        </section>

        <section id="secondaryPanelInbox" class="secondary-panel" data-secondary-panel="inbox" aria-labelledby="inboxHeading">
          <div class="surface-head compact secondary-head">
            <div>
              <p class="eyebrow">inbox / history</p>
              <h2 id="inboxHeading" class="surface-title">回答履歴と次ターン待ち</h2>
            </div>
          </div>
          <div id="inboxHistoryPanel"></div>
        </section>

        <section id="secondaryPanelLogs" class="secondary-panel" data-secondary-panel="logs" aria-labelledby="logsHeading">
          <div class="surface-head compact secondary-head">
            <div>
              <p class="eyebrow">logs</p>
              <h2 id="logsHeading" class="surface-title">warning / error 優先ログ</h2>
            </div>
          </div>
          <div id="logsPanel"></div>
        </section>

        <section id="secondaryPanelSettings" class="secondary-panel" data-secondary-panel="settings" aria-labelledby="settingsHeading">
          <div class="surface-head compact secondary-head">
            <div>
              <p class="eyebrow">settings</p>
              <h2 id="settingsHeading" class="surface-title">設定と詳細情報</h2>
            </div>
          </div>
          <div id="settingsPanel"></div>
        </section>
      </div>
    </section>
  </main>

  <section class="composer-shell" aria-labelledby="composerHeading">
    <div class="composer-bar">
      <div class="composer-meta">
        <div>
          <p class="eyebrow">manual note</p>
          <h2 id="composerHeading" class="surface-title surface-title--small">手動メモ</h2>
        </div>
        <div id="composerContext" class="composer-context is-hidden"></div>
      </div>
      <div class="preset-row">
        <button class="preset-chip" type="button" data-note-preset="方針優先で進めてください">方針優先</button>
        <button class="preset-chip" type="button" data-note-preset="まず実装してから調整してください">まず実装</button>
        <button class="preset-chip" type="button" data-note-preset="まず原因調査から進めてください">まず原因調査</button>
        <button class="preset-chip" type="button" data-note-preset="UIだけでなく構造も直してください">構造も直す</button>
      </div>
      <div class="composer-input-row">
        <textarea id="noteInput" rows="1" placeholder="補足・判断・依頼を短く送る"></textarea>
        <button id="sendNoteBtn" class="btn btn-primary" type="button">送信</button>
      </div>
    </div>
  </section>
</div>
<script>
${script}
</script>
</body>
</html>`;
}
