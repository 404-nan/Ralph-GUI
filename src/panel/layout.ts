export function renderPanelLayout(styles: string, script: string): string {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Ralph | LuLOS panel-v2</title>
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
      <button id="sidebarToggleBtn" class="icon-btn" type="button" aria-label="Toggle sidebar">
        <span></span><span></span><span></span>
      </button>
      <div class="brand-mark">Ralph / LuLOS</div>
      <div class="topbar__project">
        <div id="topbarProject" class="topbar__project-name">workspace を確認しています</div>
        <div id="topbarProjectPath" class="topbar__project-path">作業フォルダを確認しています</div>
      </div>
    </div>

    <div class="topbar__center">
      <div class="meta-strip">
        <div class="meta-pair">
          <span class="meta-label">model</span>
          <span id="topbarModel" class="meta-value">確認中</span>
        </div>
        <div class="meta-pair">
          <span class="meta-label">health</span>
          <span id="healthSummary" class="meta-value">確認中</span>
        </div>
        <div id="lifecyclePill" class="status-pill pill-idle">
          <span class="status-pill__dot"></span>
          <span id="lifecycleText">待機</span>
        </div>
      </div>
      <div id="fixtureSwitcher" class="fixture-switcher" aria-label="fixture switcher"></div>
    </div>

    <div class="topbar__controls" aria-label="primary controls">
      <button id="startBtn" class="btn btn-primary" type="button">開始</button>
      <button id="pauseBtn" class="btn btn-ghost" type="button">一時停止</button>
      <button id="resumeBtn" class="btn btn-ghost" type="button">再開</button>
      <button id="abortBtn" class="btn btn-danger" type="button">中断</button>
      <button id="drawerToggleBtn" class="btn btn-ghost" type="button">Context</button>
    </div>
  </header>

  <main class="workspace-shell">
    <aside id="leftRail" class="left-rail" aria-label="task navigation">
      <div class="rail-panel">
        <div class="rail-panel__head">
          <div>
            <p class="eyebrow">workspace flow</p>
            <h2 class="surface-title surface-title--small">薄い入口</h2>
          </div>
          <button id="sidebarCollapseBtn" class="icon-btn icon-btn--small" type="button" aria-label="Collapse sidebar">
            <span></span><span></span><span></span>
          </button>
        </div>
        <div id="railMission" class="rail-stack"></div>
      </div>
      <div class="rail-panel rail-panel--muted">
        <div class="rail-title">task graph</div>
        <div id="railTaskList" class="rail-stack"></div>
      </div>
    </aside>

    <section class="main-stage">
      <article class="workspace-surface" aria-labelledby="workspaceHeading">
        <div class="workspace-hero">
          <div class="workspace-hero__main">
            <p id="workspaceEyebrow" class="eyebrow">task workspace</p>
            <h1 id="workspaceHeading" class="workspace-title">task を選択しています</h1>
            <p id="workspaceSummary" class="workspace-summary">次アクションを整理しています。</p>
          </div>
          <div id="summaryMetrics" class="metric-row"></div>
        </div>

        <div id="workspaceHeader" class="workspace-header"></div>
        <div id="taskContextStrip" class="context-strip"></div>

        <section class="workspace-section" aria-labelledby="chatHeading">
          <div class="section-head section-head--workspace">
            <div>
              <p class="section-kicker">task chat</p>
              <h2 id="chatHeading" class="section-title">1 task = 1 chat</h2>
            </div>
            <div id="workspacePrimaryAction" class="surface-actions"></div>
          </div>
          <div id="workspaceTimeline" class="workspace-timeline"></div>
        </section>

        <section class="utility-shell" aria-label="secondary panels">
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
                  <p class="eyebrow">task graph</p>
                  <h2 id="tasksHeading" class="surface-title">queue を調整する</h2>
                </div>
                <div class="surface-actions">
                  <button id="openTaskFormBtn" class="btn btn-primary btn-small" type="button">task 追加</button>
                  <button id="toggleTaskImportBtn" class="btn btn-ghost btn-small" type="button">spec から追加</button>
                </div>
              </div>
              <div id="taskBoardPanel"></div>
            </section>

            <section id="secondaryPanelInbox" class="secondary-panel" data-secondary-panel="inbox" aria-labelledby="inboxHeading">
              <div class="surface-head compact secondary-head">
                <div>
                  <p class="eyebrow">human loop</p>
                  <h2 id="inboxHeading" class="surface-title">回答履歴と次ターン待ち</h2>
                </div>
              </div>
              <div id="inboxHistoryPanel"></div>
            </section>

            <section id="secondaryPanelLogs" class="secondary-panel" data-secondary-panel="logs" aria-labelledby="logsHeading">
              <div class="surface-head compact secondary-head">
                <div>
                  <p class="eyebrow">diagnostics</p>
                  <h2 id="logsHeading" class="surface-title">warning / error 優先</h2>
                </div>
              </div>
              <div id="logsPanel"></div>
            </section>

            <section id="secondaryPanelSettings" class="secondary-panel" data-secondary-panel="settings" aria-labelledby="settingsHeading">
              <div class="surface-head compact secondary-head">
                <div>
                  <p class="eyebrow">settings</p>
                  <h2 id="settingsHeading" class="surface-title">奥に置く設定</h2>
                </div>
              </div>
              <div id="settingsPanel"></div>
            </section>
          </div>
        </section>
      </article>
    </section>

    <aside id="rightDrawer" class="right-drawer" aria-label="context drawer">
      <article id="decisionsPanel" class="drawer-surface" aria-labelledby="decisionsHeading">
        <div class="surface-head compact">
          <div>
            <p class="eyebrow">pending decisions</p>
            <h2 id="decisionsHeading" class="surface-title">判断待ち / blocker</h2>
          </div>
        </div>
        <div id="decisionRail"></div>
      </article>

      <article class="drawer-surface" aria-labelledby="quickActionsHeading">
        <div class="surface-head compact">
          <div>
            <p class="eyebrow">support context</p>
            <h2 id="quickActionsHeading" class="surface-title">queue / actions</h2>
          </div>
        </div>
        <div id="quickActionsPanel"></div>
        <div id="queueSnapshotPanel" class="queue-snapshot"></div>
      </article>
    </aside>
  </main>

  <section class="composer-shell" aria-labelledby="composerHeading">
    <div class="composer-bar">
      <div class="composer-topline">
        <div>
          <p class="eyebrow">unified composer</p>
          <h2 id="composerHeading" class="surface-title surface-title--small">note / task / decision</h2>
        </div>
        <div id="composerContext" class="composer-context is-hidden"></div>
      </div>
      <div class="composer-mode-row" role="tablist" aria-label="composer mode">
        <button class="composer-mode is-active" type="button" data-composer-mode="note">Note</button>
        <button class="composer-mode" type="button" data-composer-mode="task">Task</button>
        <button class="composer-mode" type="button" data-composer-mode="decision">Decision</button>
      </div>
      <div class="preset-row">
        <button class="preset-chip" type="button" data-note-preset="方針優先で進めてください">方針優先</button>
        <button class="preset-chip" type="button" data-note-preset="まず実装してから調整してください">まず実装</button>
        <button class="preset-chip" type="button" data-note-preset="まず原因調査から進めてください">まず原因調査</button>
        <button class="preset-chip" type="button" data-note-preset="UIだけでなく構造も直してください">構造も直す</button>
      </div>
      <div class="composer-input-row">
        <textarea id="noteInput" rows="1" placeholder="note: 補足や判断 / task: 1行目タイトル + 2行目以降補足 / decision: 回答内容"></textarea>
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
