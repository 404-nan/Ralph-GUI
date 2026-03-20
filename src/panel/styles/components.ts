export const panelComponentStyles = String.raw`
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(223, 229, 218, 0.92);
  font-size: .86rem;
  font-weight: 800;
  letter-spacing: -.02em;
}
.topbar__project-name {
  font-size: .95rem;
  font-weight: 800;
  letter-spacing: -.02em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topbar__project-path {
  font-size: .76rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.eyebrow,
.meta-label,
.section-kicker {
  margin: 0 0 4px;
  color: var(--text-muted);
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.meta-value {
  font-size: .8rem;
  font-weight: 700;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: .76rem;
  font-weight: 800;
}
.status-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.pill-idle { color: var(--text-muted); background: var(--surface-muted); border-color: var(--line); }
.pill-idle .status-pill__dot { background: var(--text-muted); }
.pill-running { color: var(--accent); background: var(--accent-soft); border-color: rgba(18, 128, 91, 0.16); }
.pill-running .status-pill__dot { background: var(--accent); }
.pill-paused { color: var(--warn); background: var(--warn-soft); border-color: rgba(184, 116, 21, 0.16); }
.pill-paused .status-pill__dot { background: var(--warn); }
.pill-error { color: var(--danger); background: var(--danger-soft); border-color: rgba(195, 79, 66, 0.16); }
.pill-error .status-pill__dot { background: var(--danger); }
.pill-done { color: var(--ok); background: var(--ok-soft); border-color: rgba(24, 123, 72, 0.16); }
.pill-done .status-pill__dot { background: var(--ok); }

.main-surface,
.side-surface,
.rail-card,
.secondary-panel,
.composer-bar {
  background: rgba(255,255,255,0.84);
  border: 1px solid rgba(223, 229, 218, 0.86);
  box-shadow: var(--shadow-sm);
  border-radius: 22px;
}
.main-surface,
.side-surface,
.secondary-panel {
  padding: 18px;
}
.rail-card {
  padding: 12px;
}
.rail-card--sticky {
  display: grid;
  gap: 10px;
}
.rail-title {
  font-size: .78rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: .08em;
  text-transform: uppercase;
}
.rail-nav {
  display: grid;
  gap: 4px;
}
.rail-link {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 12px;
  color: var(--text-dim);
  font-weight: 700;
}
.rail-link:hover,
.rail-link.is-active {
  background: rgba(18, 128, 91, 0.08);
  color: var(--accent);
}
.surface-head,
.section-head,
.secondary-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.surface-head {
  margin-bottom: 16px;
}
.surface-head.compact,
.section-head {
  margin-bottom: 12px;
}
.surface-title,
.section-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -.02em;
}
.surface-title--small {
  font-size: .94rem;
}
.metric-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.metric-chip {
  min-width: 84px;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--surface-soft);
}
.metric-chip__label {
  display: block;
  font-size: .66rem;
  color: var(--text-muted);
  font-weight: 700;
}
.metric-chip__value {
  display: block;
  font-size: .94rem;
  font-weight: 800;
}
.mission-block {
  display: grid;
  gap: 6px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(223, 229, 218, 0.7);
}
.mission-status {
  font-size: clamp(1.15rem, 2vw, 1.68rem);
  font-weight: 800;
  letter-spacing: -.03em;
  line-height: 1.35;
}
.mission-line {
  color: var(--text-dim);
  font-size: .95rem;
}
.mission-line--next {
  color: var(--text);
  font-weight: 700;
}
.main-section {
  padding-top: 18px;
  border-top: 1px solid rgba(223, 229, 218, 0.62);
}
.main-section:first-of-type {
  border-top: 0;
  padding-top: 18px;
}
.task-shell,
.side-stack,
.timeline,
.snapshot-grid,
.quick-actions,
.task-columns,
.inbox-stack,
.settings-stack,
.log-stack,
.form-stack,
.task-meta {
  display: grid;
  gap: 10px;
}
.task-shell {
  gap: 12px;
}
.task-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.task-title {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.4;
}
.task-copy,
.empty-copy,
.entry-copy,
.log-copy,
.settings-copy,
.queue-copy {
  color: var(--text-dim);
}
.task-meta,
.entry-meta,
.log-meta,
.settings-meta {
  color: var(--text-muted);
  font-size: .78rem;
}
.inline-chip,
.queue-chip,
.preset-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(223, 229, 218, 0.92);
  background: var(--surface-soft);
  font-size: .73rem;
  font-weight: 700;
  color: var(--text-dim);
}
.entry-card,
.task-row,
.snapshot-card,
.form-card,
.settings-card,
.log-card {
  background: rgba(247, 248, 244, 0.72);
  border-radius: 16px;
  padding: 12px;
}
.entry-card.is-warning,
.log-card.is-warning { background: rgba(184, 116, 21, 0.08); }
.entry-card.is-danger,
.log-card.is-danger { background: rgba(195, 79, 66, 0.08); }
.entry-title,
.log-title,
.settings-title {
  font-size: .94rem;
  font-weight: 800;
  line-height: 1.45;
}
.entry-actions,
.task-actions,
.surface-actions,
.quick-actions,
.form-actions,
.settings-actions,
.composer-input-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.snapshot-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.snapshot-card {
  gap: 4px;
}
.snapshot-label {
  color: var(--text-muted);
  font-size: .66rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.snapshot-value {
  font-size: 1rem;
  font-weight: 800;
}
.quick-actions {
  margin-bottom: 14px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-size: .83rem;
  font-weight: 700;
}
.btn:disabled {
  opacity: .46;
  cursor: not-allowed;
}
.btn-primary {
  color: white;
  background: var(--accent);
}
.btn-ghost {
  color: var(--text-dim);
  background: rgba(255,255,255,0.7);
  border-color: rgba(223, 229, 218, 0.92);
}
.btn-danger {
  color: #96382d;
  background: var(--danger-soft);
  border-color: rgba(195, 79, 66, 0.18);
}
.btn-small {
  min-height: 32px;
  padding: 0 10px;
  font-size: .76rem;
}
textarea,
input,
select {
  width: 100%;
  border: 1px solid rgba(223, 229, 218, 0.92);
  border-radius: 14px;
  background: rgba(255,255,255,0.9);
  padding: 10px 12px;
  color: var(--text);
  outline: 0;
}
textarea:focus,
input:focus,
select:focus {
  border-color: rgba(18, 128, 91, 0.26);
  box-shadow: 0 0 0 4px rgba(18, 128, 91, 0.1);
}
.empty-state {
  display: grid;
  gap: 8px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(247, 248, 244, 0.74);
}
.empty-title {
  font-size: .92rem;
  font-weight: 800;
}
.task-columns {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.task-column {
  gap: 10px;
}
.task-column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.task-column-title {
  font-size: .82rem;
  font-weight: 800;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: .08em;
}
.task-row {
  display: grid;
  gap: 8px;
}
.task-row.is-current { background: rgba(18, 128, 91, 0.08); }
.task-row.is-next { background: rgba(71, 111, 206, 0.08); }
.task-row-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}
.task-id {
  color: var(--text-muted);
  font-family: var(--mono);
  font-size: .72rem;
}
.secondary-tab {
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(223, 229, 218, 0.92);
  background: rgba(255,255,255,0.7);
  font-weight: 700;
  color: var(--text-dim);
}
.secondary-tab.is-active {
  background: rgba(18, 128, 91, 0.1);
  border-color: rgba(18, 128, 91, 0.18);
  color: var(--accent);
}
.composer-bar {
  width: min(920px, calc(100vw - 28px));
  margin: 0 auto;
  padding: 12px;
  display: grid;
  gap: 10px;
  box-shadow: var(--shadow-md);
}
.composer-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.composer-context {
  font-size: .74rem;
  font-weight: 700;
  color: var(--text-muted);
}
.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.preset-chip {
  cursor: pointer;
}
.composer-input-row textarea {
  min-height: 42px;
  max-height: 130px;
  resize: vertical;
}
.field,
.form-grid {
  display: grid;
  gap: 10px;
}
.field label {
  font-size: .78rem;
  font-weight: 700;
  color: var(--text-dim);
}
.field-hint {
  font-size: .74rem;
  color: var(--text-muted);
}
.form-grid.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.field.full { grid-column: 1 / -1; }
.log-pre {
  margin: 0;
  max-height: 240px;
  overflow: auto;
  padding: 12px;
  border-radius: 14px;
  background: #162019;
  color: #e6eee9;
  font-family: var(--mono);
  font-size: .75rem;
  white-space: pre-wrap;
  word-break: break-word;
}
details.fold {
  border-radius: 14px;
  background: rgba(247, 248, 244, 0.74);
  padding: 10px 12px;
}
summary.fold__title {
  cursor: pointer;
  font-weight: 700;
  color: var(--text-dim);
}
.toast-stack {
  position: fixed;
  top: 14px;
  right: 14px;
  z-index: 60;
  display: grid;
  gap: 8px;
}
.toast {
  min-width: 220px;
  max-width: min(420px, calc(100vw - 24px));
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255,255,255,0.96);
  border: 1px solid rgba(223, 229, 218, 0.92);
  box-shadow: var(--shadow-md);
}
.toast.success { border-color: rgba(24, 123, 72, 0.2); }
.toast.warning { border-color: rgba(184, 116, 21, 0.2); }
.toast.error { border-color: rgba(195, 79, 66, 0.2); }
.is-hidden { display: none !important; }

@media (max-width: 860px) {
  .main-surface,
  .side-surface,
  .secondary-panel { padding: 14px; }
  .metric-row { justify-content: flex-start; }
  .task-columns,
  .form-grid.two-col,
  .snapshot-grid { grid-template-columns: 1fr; }
  .composer-bar {
    width: min(100vw - 20px, 100%);
  }
}

@media (max-width: 520px) {
  .topbar__project-name,
  .topbar__project-path {
    white-space: normal;
    overflow: visible;
  }
  .surface-actions,
  .entry-actions,
  .task-actions,
  .quick-actions,
  .settings-actions,
  .composer-input-row {
    display: grid;
    grid-template-columns: 1fr;
  }
  .btn,
  .secondary-tab {
    width: 100%;
  }
  .composer-meta {
    display: grid;
  }
}
`;
