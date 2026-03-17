export const panelStyles = `
:root {
  --bg: #f7f7f3;
  --bg-subtle: #f1f1ec;
  --surface: #ffffff;
  --surface-soft: #fbfbf8;
  --surface-muted: #f4f4f0;
  --line: #e7e5dd;
  --line-strong: #d8d5cb;
  --text: #1f1f1a;
  --text-dim: #44443c;
  --text-muted: #74746a;
  --accent: #10a37f;
  --accent-soft: rgba(16, 163, 127, 0.12);
  --accent-strong: rgba(16, 163, 127, 0.2);
  --amber: #c7881a;
  --amber-soft: rgba(199, 136, 26, 0.12);
  --red: #d4554b;
  --red-soft: rgba(212, 85, 75, 0.1);
  --blue: #5577d9;
  --blue-soft: rgba(85, 119, 217, 0.1);
  --emerald: #1f9a62;
  --emerald-soft: rgba(31, 154, 98, 0.1);
  --shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.04);
  --shadow: 0 8px 30px rgba(16, 24, 40, 0.06);
  --r-sm: 10px;
  --r: 16px;
  --r-lg: 22px;
  --sans: 'Manrope', 'Noto Sans JP', sans-serif;
  --mono: 'IBM Plex Mono', monospace;
  --ease: cubic-bezier(.22,.61,.36,1);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { height: 100%; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
body {
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(16, 163, 127, 0.04), transparent 22%),
    linear-gradient(180deg, #fafaf7, var(--bg));
  color: var(--text);
  font-family: var(--sans);
  font-size: 14px;
  line-height: 1.6;
}
button { font: inherit; border: none; background: none; color: inherit; cursor: pointer; }
input, textarea, select { font: inherit; color: inherit; }

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  padding: 12px 18px;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  background: rgba(247, 247, 243, 0.9);
  border-bottom: 1px solid rgba(231, 229, 221, 0.84);
}
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.topbar-brand-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.topbar-logo {
  font-size: .94rem;
  font-weight: 800;
  letter-spacing: -.03em;
  color: var(--text);
}
.topbar-project {
  font-size: .92rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topbar-subtle {
  color: var(--text-muted);
  font-size: .74rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topbar-meta {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}
.topbar-meta-block {
  display: grid;
  gap: 2px;
  justify-items: end;
}
.topbar-meta-label {
  font-size: .62rem;
  letter-spacing: .08em;
  color: var(--text-muted);
}

.icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.66);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
  transition: transform .16s var(--ease), border-color .16s var(--ease), background .16s var(--ease);
}
.icon-btn:hover {
  transform: translateY(-1px);
  border-color: var(--line-strong);
  background: #fff;
}
.icon-btn.active,
.icon-btn:focus-visible {
  outline: none;
  border-color: var(--accent-strong);
  box-shadow: 0 0 0 4px rgba(16, 163, 127, 0.1);
}
.icon-btn-mark { font-size: 1rem; line-height: 1; }
.icon-btn-count {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--amber);
  color: white;
  font-size: .66rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.icon-btn-muted {
  width: 42px;
  height: 42px;
  background: var(--surface-muted);
}

.mini-pill,
.pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border-radius: 999px;
  white-space: nowrap;
}
.mini-pill {
  padding: 6px 10px;
  font-size: .72rem;
  font-weight: 700;
  color: var(--text-dim);
  border: 1px solid var(--line);
  background: var(--surface);
}
.pill {
  padding: 6px 11px;
  font-size: .72rem;
  font-weight: 800;
  border: 1px solid transparent;
}
.pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.pill-idle { color: var(--text-muted); background: var(--surface-muted); border-color: var(--line); }
.pill-idle .dot { background: var(--text-muted); }
.pill-running { color: var(--accent); background: var(--accent-soft); border-color: rgba(16, 163, 127, 0.16); }
.pill-running .dot { background: var(--accent); box-shadow: 0 0 0 4px rgba(16, 163, 127, 0.12); }
.pill-paused { color: var(--amber); background: var(--amber-soft); border-color: rgba(199, 136, 26, 0.14); }
.pill-paused .dot { background: var(--amber); }
.pill-error { color: var(--red); background: var(--red-soft); border-color: rgba(212, 85, 75, 0.14); }
.pill-error .dot { background: var(--red); }
.pill-done { color: var(--emerald); background: var(--emerald-soft); border-color: rgba(31, 154, 98, 0.14); }
.pill-done .dot { background: var(--emerald); }

.app-shell {
  position: relative;
  display: flex;
  flex: 1;
}

.sidebar-panel {
  position: fixed;
  top: 76px;
  left: 16px;
  bottom: 16px;
  z-index: 35;
  width: min(320px, calc(100vw - 24px));
  transform: translateX(calc(-100% - 18px));
  transition: transform .22s var(--ease);
}
.sidebar-panel.open { transform: translateX(0); }
.sidebar-scroll {
  height: 100%;
  overflow: auto;
  padding-right: 4px;
  display: grid;
  gap: 12px;
}
.sidebar-scrim {
  position: fixed;
  inset: 64px 0 0;
  z-index: 30;
  background: rgba(31, 31, 26, 0.1);
  opacity: 0;
  pointer-events: none;
  transition: opacity .16s var(--ease);
}
.sidebar-scrim.open {
  opacity: 1;
  pointer-events: auto;
}

.sidebar-head,
.panel,
.status-panel,
.conversation-panel,
.composer-panel {
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.82);
  box-shadow: var(--shadow-sm);
}
.panel,
.status-panel,
.conversation-panel,
.composer-panel {
  border-radius: var(--r-lg);
}
.sidebar-head {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sidebar-copy,
.sidebar-group-copy {
  font-size: .76rem;
  color: var(--text-muted);
}
.sidebar-group {
  display: grid;
  gap: 3px;
  padding: 0 4px;
}
.sidebar-group-label {
  font-size: .68rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: .06em;
}

.main-col {
  width: min(880px, calc(100% - 36px));
  margin: 0 auto;
  padding: 20px 18px 28px;
  display: grid;
  gap: 16px;
  transition: width .22s var(--ease), margin-left .22s var(--ease);
}
.panel-pad { padding: 20px; }

.section-label,
.panel-title {
  font-size: .7rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: .06em;
  margin-bottom: 10px;
}

.status-panel {
  padding: 22px;
  display: grid;
  gap: 16px;
}
.hero-status {
  font-size: clamp(1.22rem, 2.1vw, 1.76rem);
  font-weight: 800;
  line-height: 1.34;
  letter-spacing: -.03em;
}
.hero-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.hero-highlight {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--text-dim);
  font-size: .74rem;
  font-weight: 700;
}
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.status-box {
  padding: 14px;
  border-radius: var(--r);
  border: 1px solid var(--line);
  background: var(--surface-soft);
}
.status-label {
  font-size: .68rem;
  color: var(--text-muted);
  font-weight: 700;
  margin-bottom: 6px;
}
.status-value {
  font-size: .94rem;
  font-weight: 700;
  line-height: 1.45;
  word-break: break-word;
}
.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-size: .84rem;
  font-weight: 700;
  transition: transform .16s var(--ease), background .16s var(--ease), border-color .16s var(--ease), opacity .16s var(--ease);
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: .45; cursor: not-allowed; }
.btn-sm { padding: 7px 11px; font-size: .76rem; }
.btn-cyan {
  background: var(--accent);
  color: white;
  box-shadow: 0 6px 16px rgba(16, 163, 127, 0.14);
}
.btn-ghost {
  background: var(--surface);
  border-color: var(--line);
  color: var(--text-dim);
}
.btn-amber {
  background: var(--amber-soft);
  border-color: rgba(199, 136, 26, 0.12);
  color: #8a6112;
}
.btn-red {
  background: var(--red-soft);
  border-color: rgba(212, 85, 75, 0.12);
  color: #9d433a;
}

.conversation-panel {
  padding: 20px;
}
.conversation-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.conversation-copy {
  color: var(--text-muted);
  font-size: .84rem;
}
.conversation-feed {
  display: grid;
  gap: 16px;
}
.feed-section {
  display: grid;
  gap: 12px;
}
.feed-section-title {
  font-size: .8rem;
  font-weight: 800;
  color: var(--text-dim);
}
.feed-card,
.artifact-card,
.decision-card,
.history-card {
  border-radius: var(--r);
  border: 1px solid var(--line);
  background: var(--surface);
  padding: 16px;
}
.feed-card-assistant {
  background: linear-gradient(180deg, #ffffff, #fafaf7);
}
.feed-kicker,
.history-label,
.decision-label {
  font-size: .72rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: .06em;
  margin-bottom: 8px;
}
.feed-title,
.decision-title,
.history-title,
.artifact-title {
  font-size: .98rem;
  font-weight: 800;
  line-height: 1.42;
  word-break: break-word;
}
.feed-copy,
.decision-copy,
.history-answer,
.artifact-copy {
  color: var(--text-dim);
  margin-top: 8px;
  word-break: break-word;
}
.feed-meta,
.artifact-meta {
  color: var(--text-muted);
  font-size: .76rem;
  margin-top: 10px;
}

.artifact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.artifact-card.tone-info { background: linear-gradient(180deg, #ffffff, #fafaf8); }
.artifact-card.tone-success { background: linear-gradient(180deg, #ffffff, #f7fbf8); }
.artifact-card.tone-warning { background: linear-gradient(180deg, #ffffff, #fbfaf6); }
.artifact-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.decision-card {
  background: linear-gradient(180deg, #fffdf8, #ffffff);
  border-color: #efe4c9;
}
.decision-danger {
  background: linear-gradient(180deg, #fff8f7, #ffffff);
  border-color: #f0d8d5;
}
.decision-label { color: #96680f; }
.decision-actions {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.decision-form {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}
.decision-form textarea,
.composer-row textarea,
.import-input,
.tf input,
.tf textarea,
.field input,
.field textarea,
.field select {
  width: 100%;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fff;
  color: var(--text);
  padding: 11px 13px;
  outline: none;
}
.decision-form textarea:focus,
.composer-row textarea:focus,
.import-input:focus,
.tf input:focus,
.tf textarea:focus,
.field input:focus,
.field textarea:focus,
.field select:focus {
  border-color: rgba(16, 163, 127, 0.26);
  box-shadow: 0 0 0 4px rgba(16, 163, 127, 0.1);
}
.history-card {
  background: linear-gradient(180deg, #ffffff, #f8fbf9);
}

.composer-panel {
  padding: 16px 18px 18px;
  position: sticky;
  bottom: 14px;
}
.composer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}
.composer-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: end;
}
.composer-row textarea {
  min-height: 52px;
  max-height: 180px;
  resize: vertical;
}
.composer-tools {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.task-chip {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: .74rem;
  font-weight: 700;
  background: var(--surface-muted);
  color: var(--text-dim);
  border: 1px solid var(--line);
}

.section-toggle {
  width: 100%;
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  font-size: .8rem;
  font-weight: 800;
  color: var(--text-dim);
  border-bottom: 1px solid var(--line);
}
.section-toggle .arrow {
  margin-left: auto;
  transition: transform .16s var(--ease);
}
.section-toggle.open .arrow { transform: rotate(180deg); }
.section-body { display: none; padding: 16px 18px 18px; }
.section-body.open { display: block; }
.settings-tag {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: .62rem;
  color: var(--text-muted);
  background: var(--surface-muted);
  border: 1px solid var(--line);
}

.sidebar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.inline-panel { margin-bottom: 12px; }
.task-summary {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: .76rem;
  color: var(--text-muted);
  margin-bottom: 10px;
}
.tl-item {
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  margin-bottom: 8px;
}
.tl-item.is-cur { border-left: 3px solid var(--accent); }
.tl-item.is-nxt { border-left: 3px solid var(--amber); }
.tl-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}
.tl-id {
  font-size: .68rem;
  color: var(--text-muted);
  font-family: var(--mono);
}
.tl-badge {
  font-size: .62rem;
  font-weight: 800;
  border-radius: 999px;
  padding: 2px 8px;
}
.badge-cur { background: var(--accent-soft); color: var(--accent); }
.badge-nxt { background: var(--amber-soft); color: #8a6112; }
.tl-title { font-weight: 800; }
.tl-summary { font-size: .8rem; color: var(--text-dim); margin-top: 4px; }
.tl-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.tf {
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface-soft);
  padding: 14px;
  margin-bottom: 12px;
}
.tf-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
  font-size: .84rem;
  font-weight: 800;
}
.tf textarea { min-height: 70px; resize: vertical; }

.import-box {
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  padding: 14px;
}
.import-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
  margin-bottom: 10px;
}
.import-copy { color: var(--text-dim); font-size: .8rem; }
.import-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.import-foot {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.import-preview {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}
.import-empty {
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed var(--line);
  color: var(--text-dim);
}
.import-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--text-dim);
  font-size: .76rem;
}
.import-pill {
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--blue-soft);
  color: #3851a8;
  font-weight: 800;
}
.import-item {
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fff;
}
.import-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.import-item-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent);
  font-family: var(--mono);
  font-size: .68rem;
  font-weight: 800;
}
.import-item-title { font-weight: 800; }
.import-item-summary { color: var(--text-dim); font-size: .8rem; }
.import-item-criteria {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.import-chip {
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--surface-muted);
  border: 1px solid var(--line);
  color: var(--text-dim);
  font-size: .68rem;
}
.import-more,
.import-warn { color: var(--text-muted); font-size: .76rem; }

.field {
  display: grid;
  gap: 5px;
}
.field.full { grid-column: 1 / -1; }
.field label {
  font-size: .66rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: .06em;
}
.field textarea { min-height: 72px; resize: vertical; }
.field input:disabled,
.field textarea:disabled,
.field select:disabled { opacity: .5; }
.field-hint {
  font-size: .72rem;
  color: var(--text-muted);
}
.s-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.quick-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.session-card,
.preview-item,
.resource-item,
.diagnostic-item,
.inbox-item {
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  display: grid;
  gap: 8px;
}
.session-head,
.resource-head,
.diagnostic-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.session-kicker {
  font-size: .7rem;
  color: var(--text-muted);
  font-weight: 800;
}
.session-runid {
  font-family: var(--mono);
  font-size: .72rem;
  color: var(--text-muted);
}
.session-request {
  font-size: .94rem;
  font-weight: 800;
  line-height: 1.45;
}
.session-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  color: var(--text-muted);
  font-size: .74rem;
}
.session-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.metric-card {
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fff;
}
.metric-label {
  font-size: .66rem;
  color: var(--text-muted);
  font-weight: 800;
}
.metric-value {
  margin-top: 4px;
  font-size: .98rem;
  font-weight: 800;
}
.session-rows {
  display: grid;
  gap: 8px;
}
.session-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: var(--text-dim);
  font-size: .8rem;
}
.session-row span { color: var(--text-muted); }
.session-row strong { text-align: right; font-size: .82rem; color: var(--text); }

.inbox-headline {
  font-size: .78rem;
  font-weight: 800;
  color: var(--text-dim);
  margin-bottom: 10px;
}
.inbox-warning { background: #fffbf4; }
.inbox-meta,
.preview-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: .72rem;
}
.inbox-badge,
.preview-kind,
.resource-level {
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 800;
  border: 1px solid transparent;
}
.inbox-badge {
  background: var(--blue-soft);
  color: #3851a8;
}
.inbox-badge.tone-warning {
  background: var(--amber-soft);
  color: #8a6112;
}
.inbox-title,
.preview-title {
  font-size: .9rem;
  font-weight: 700;
  line-height: 1.45;
}
.inbox-copy,
.preview-copy,
.resource-detail,
.diagnostic-message,
.advanced-copy {
  color: var(--text-dim);
  font-size: .8rem;
}
.inbox-actions {
  display: flex;
  gap: 8px;
}
.preview-kind {
  background: var(--surface-muted);
  color: var(--text-dim);
  border-color: var(--line);
}

.resource-label,
.diagnostic-key {
  font-size: .82rem;
  font-weight: 800;
}
.resource-value {
  font-family: var(--mono);
  font-size: .74rem;
  color: var(--text-dim);
  word-break: break-all;
}
.resource-level.level-ok,
.level-ok .resource-level {
  background: var(--emerald-soft);
  color: #1f7d53;
  border-color: rgba(31, 154, 98, 0.12);
}
.resource-level.level-warning,
.level-warning .resource-level {
  background: var(--amber-soft);
  color: #8a6112;
  border-color: rgba(199, 136, 26, 0.12);
}
.resource-level.level-error,
.level-error .resource-level {
  background: var(--red-soft);
  color: #9d433a;
  border-color: rgba(212, 85, 75, 0.12);
}
.resource-item.level-warning,
.diagnostic-item.level-warning { background: #fffbf5; }
.resource-item.level-error,
.diagnostic-item.level-error { background: #fff8f7; }

.advanced-summary {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--surface-soft);
}
.advanced-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.log-stack { display: grid; gap: 16px; }
.ev-row {
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
}
.ev-row:last-child { border-bottom: none; }
.ev-time {
  color: var(--text-muted);
  font-family: var(--mono);
  font-size: .68rem;
}
.ev-type {
  font-size: .74rem;
  color: var(--text-dim);
  font-weight: 800;
}
.ev-msg {
  color: var(--text-muted);
  font-size: .78rem;
}
.log-pre {
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  padding: 14px;
  min-height: 180px;
  max-height: 360px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--mono);
  font-size: .74rem;
  color: var(--text-dim);
}

.empty {
  padding: 28px 16px;
  text-align: center;
  color: var(--text-muted);
}
.empty.compact { padding: 14px 8px; }
.empty-title {
  font-size: .96rem;
  font-weight: 800;
  color: var(--text-dim);
  margin-bottom: 4px;
}
.empty-copy { font-size: .82rem; margin-bottom: 12px; }
.is-hidden { display: none !important; }

.toast-container {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 100;
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;
  pointer-events: none;
}
.toast {
  padding: 10px 16px;
  border-radius: 14px;
  border: 1px solid transparent;
  font-size: .82rem;
  font-weight: 800;
  pointer-events: auto;
  opacity: 0;
  transform: translateY(10px);
  animation: toastIn .24s var(--ease) forwards;
}
.toast.out { animation: toastOut .2s var(--ease) forwards; }
.toast-success { background: #effaf6; color: #1f7d53; border-color: rgba(31, 154, 98, 0.14); }
.toast-warning { background: #fff8ee; color: #8a6112; border-color: rgba(199, 136, 26, 0.14); }
.toast-error { background: #fff5f4; color: #9d433a; border-color: rgba(212, 85, 75, 0.14); }
.toast-info { background: white; color: var(--text); border-color: var(--line); }
@keyframes toastIn { to { opacity: 1; transform: translateY(0); } }
@keyframes toastOut { to { opacity: 0; transform: translateY(10px); } }

::-webkit-scrollbar { width: 7px; height: 7px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(68,68,60,0.14); border-radius: 999px; }

@media (min-width: 1180px) {
  body.sidebar-open .main-col {
    width: min(880px, calc(100% - 386px));
    margin-left: calc(320px + 34px);
    margin-right: 20px;
  }
  body.sidebar-open .sidebar-scrim {
    opacity: 0;
    pointer-events: none;
  }
}

@media (max-width: 980px) {
  .status-grid,
  .artifact-grid,
  .s-grid,
  .quick-grid,
  .session-metrics {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .main-col { width: calc(100% - 20px); padding: 16px 10px 20px; }
  .topbar-subtle,
  .topbar-meta-label { display: none; }
  .composer-row { grid-template-columns: auto 1fr; }
  .composer-row .btn { grid-column: 1 / -1; }
  .import-head,
  .import-foot,
  .session-row {
    flex-direction: column;
    align-items: stretch;
  }
  .session-row strong { text-align: left; }
}
`;
