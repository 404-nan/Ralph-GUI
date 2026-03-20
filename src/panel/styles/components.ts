export const panelComponentStyles = String.raw`
.panel {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: var(--shadow-sm);
  border-radius: var(--radius-lg);
  padding: 18px;
}
.panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.panel__header.compact {
  margin-bottom: 14px;
}
.panel__title {
  margin: 0;
  font-size: 1.08rem;
  font-weight: 800;
  letter-spacing: -.02em;
}
.panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.eyebrow,
.meta-label,
.focus-card__label,
.section-label {
  margin: 0 0 4px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: .67rem;
  font-weight: 800;
}
.meta-value {
  font-size: .8rem;
  font-weight: 700;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: .76rem;
  font-weight: 800;
}
.status-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}
.pill-idle { color: var(--text-muted); background: var(--surface-muted); border-color: var(--line); }
.pill-idle .status-pill__dot { background: var(--text-muted); }
.pill-running { color: var(--accent); background: var(--accent-soft); border-color: rgba(18, 128, 91, 0.15); }
.pill-running .status-pill__dot { background: var(--accent); box-shadow: 0 0 0 4px rgba(18, 128, 91, 0.1); }
.pill-paused { color: var(--warn); background: var(--warn-soft); border-color: rgba(184, 116, 21, 0.14); }
.pill-paused .status-pill__dot { background: var(--warn); }
.pill-error { color: var(--danger); background: var(--danger-soft); border-color: rgba(195, 79, 66, 0.14); }
.pill-error .status-pill__dot { background: var(--danger); }
.pill-done { color: var(--ok); background: var(--ok-soft); border-color: rgba(24, 123, 72, 0.14); }
.pill-done .status-pill__dot { background: var(--ok); }
.metric-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.metric-chip {
  padding: 8px 10px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  min-width: 92px;
}
.metric-chip__label {
  display: block;
  color: var(--text-muted);
  font-size: .66rem;
  font-weight: 700;
}
.metric-chip__value {
  display: block;
  font-size: .94rem;
  font-weight: 800;
}
.summary-lead {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}
.summary-status {
  font-size: clamp(1.16rem, 2vw, 1.72rem);
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: -.03em;
}
.summary-request {
  color: var(--text-dim);
  font-size: .95rem;
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.focus-card {
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: linear-gradient(180deg, var(--surface), var(--surface-soft));
  padding: 16px;
  display: grid;
  gap: 10px;
  min-height: 180px;
}
.focus-card--current {
  border-color: rgba(18, 128, 91, 0.22);
  box-shadow: inset 0 0 0 1px rgba(18, 128, 91, 0.06);
}
.focus-card--next {
  border-color: rgba(71, 111, 206, 0.18);
}
.focus-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
}
.task-spotlight {
  display: grid;
  gap: 10px;
}
.task-spotlight__title {
  font-size: 1.06rem;
  font-weight: 800;
}
.task-spotlight__summary,
.note-copy,
.stack-copy,
.list-copy,
.empty-copy,
.settings-copy,
.log-copy,
.event-copy {
  color: var(--text-dim);
}
.task-spotlight__meta,
.list-meta,
.event-meta,
.preview-meta,
.settings-meta,
.log-meta {
  color: var(--text-muted);
  font-size: .78rem;
}
.hero-stack,
.updates-list,
.stack-list,
.settings-stack,
.logs-stack {
  display: grid;
  gap: 10px;
}
.hero-stack--subtle {
  margin-top: 12px;
}
.stack-card,
.task-card,
.inbox-card,
.update-card,
.log-card,
.resource-card,
.preview-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  padding: 14px;
  display: grid;
  gap: 8px;
}
.stack-card.is-warning,
.inbox-card.is-warning,
.log-card.is-warning { border-color: rgba(184, 116, 21, 0.24); background: #fffdf8; }
.stack-card.is-danger,
.log-card.is-danger { border-color: rgba(195, 79, 66, 0.24); background: #fffaf8; }
.stack-card__title,
.task-card__title,
.inbox-card__title,
.update-card__title,
.log-card__title,
.resource-card__title {
  font-size: .96rem;
  font-weight: 800;
  line-height: 1.4;
}
.stack-card__actions,
.inline-actions,
.task-card__actions,
.settings-actions,
.log-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  font-size: .84rem;
  font-weight: 700;
  transition: transform .16s var(--ease), background .16s var(--ease), border-color .16s var(--ease), opacity .16s var(--ease);
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:disabled { opacity: .46; cursor: not-allowed; }
.btn-small { min-height: 34px; padding: 7px 11px; font-size: .76rem; }
.btn-primary { background: var(--accent); color: #fff; box-shadow: 0 8px 18px rgba(18, 128, 91, 0.15); }
.btn-secondary,
.btn-ghost { background: var(--surface); border-color: var(--line); color: var(--text-dim); }
.btn-danger { background: var(--danger-soft); border-color: rgba(195, 79, 66, 0.16); color: #94392e; }
.btn-inline-accent { background: var(--accent-soft); color: var(--accent); border-color: rgba(18, 128, 91, 0.16); }
textarea,
input,
select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fff;
  padding: 11px 12px;
  outline: 0;
}
textarea:focus,
input:focus,
select:focus {
  border-color: rgba(18, 128, 91, 0.24);
  box-shadow: 0 0 0 4px rgba(18, 128, 91, 0.1);
}
.composer-panel {
  position: sticky;
  bottom: 12px;
  z-index: 10;
  box-shadow: var(--shadow-md);
}
.composer-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: end;
}
.composer-actions {
  display: grid;
  gap: 8px;
}
.context-chip,
.inline-chip,
.tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--text-dim);
  font-size: .74rem;
  font-weight: 700;
}
.secondary-tab {
  min-height: 40px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--surface);
  font-weight: 700;
}
.secondary-tab.is-active {
  border-color: rgba(18, 128, 91, 0.2);
  background: var(--accent-soft);
  color: var(--accent);
}
.section-stack,
.task-lanes,
.history-block,
.form-grid,
.import-block {
  display: grid;
  gap: 12px;
}
.task-lane {
  display: grid;
  gap: 10px;
}
.task-lane__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.task-lane__title {
  font-size: .88rem;
  font-weight: 800;
}
.task-card.is-current { border-color: rgba(18, 128, 91, 0.24); background: #f7fcfa; }
.task-card.is-next { border-color: rgba(71, 111, 206, 0.24); background: #f8fbff; }
.task-card__header {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}
.task-card__id {
  font-family: var(--mono);
  font-size: .72rem;
  color: var(--text-muted);
}
.task-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.task-card__summary,
.inbox-card__copy,
.update-card__copy,
.log-card__copy,
.resource-card__copy { color: var(--text-dim); }
.empty-state {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: var(--radius-md);
  border: 1px dashed var(--line-strong);
  background: var(--surface-soft);
}
.empty-title {
  font-size: .92rem;
  font-weight: 800;
}
.form-card,
.settings-card {
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  padding: 14px;
}
.form-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.form-grid.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.field {
  display: grid;
  gap: 6px;
}
.field label {
  font-size: .78rem;
  font-weight: 700;
  color: var(--text-dim);
}
.field.full { grid-column: 1 / -1; }
.field-hint {
  color: var(--text-muted);
  font-size: .74rem;
}
.settings-switcher {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.settings-switcher .btn.is-active {
  background: var(--accent-soft);
  border-color: rgba(18, 128, 91, 0.16);
  color: var(--accent);
}
.log-pre {
  margin: 0;
  padding: 14px;
  border-radius: var(--radius-md);
  background: #162019;
  color: #e5efe8;
  font-family: var(--mono);
  font-size: .76rem;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 320px;
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
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.96);
  box-shadow: var(--shadow-md);
}
.toast.success { border-color: rgba(24, 123, 72, 0.22); }
.toast.warning { border-color: rgba(184, 116, 21, 0.22); }
.toast.error { border-color: rgba(195, 79, 66, 0.22); }
.is-hidden { display: none !important; }

@media (max-width: 720px) {
  .panel { padding: 14px; border-radius: 18px; }
  .summary-grid,
  .form-grid.two-col,
  .composer-layout {
    grid-template-columns: 1fr;
  }
  .metric-row {
    justify-content: flex-start;
  }
  .composer-panel {
    position: static;
  }
  .stack-card__actions,
  .task-card__actions,
  .inline-actions,
  .composer-actions,
  .panel__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .btn,
  .secondary-tab { width: 100%; }
}

@media (max-width: 420px) {
  .stack-card__actions,
  .task-card__actions,
  .inline-actions,
  .composer-actions,
  .panel__actions {
    grid-template-columns: 1fr;
  }
  .brand-mark {
    padding-inline: 10px;
    font-size: .84rem;
  }
  .topbar__project-name,
  .topbar__project-path {
    white-space: normal;
    overflow: visible;
  }
}
`;
