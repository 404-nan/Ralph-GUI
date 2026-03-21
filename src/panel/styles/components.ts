export const panelComponentStyles = String.raw`
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.56);
  box-shadow: var(--shadow-xs), var(--shadow-inset);
  font-size: .8rem;
  font-weight: 800;
  letter-spacing: -.02em;
}
.icon-btn {
  display: inline-grid;
  place-items: center;
  gap: 3px;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: rgba(255,255,255,0.46);
  box-shadow: var(--shadow-xs), var(--shadow-inset);
}
.icon-btn span {
  display: block;
  width: 14px;
  height: 1.5px;
  border-radius: 999px;
  background: rgba(55, 67, 56, 0.9);
}
.icon-btn--small {
  width: 32px;
  height: 32px;
}
.topbar__project {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.topbar__project-name {
  font-size: .96rem;
  font-weight: 800;
  letter-spacing: -.03em;
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
  font-size: .67rem;
  font-weight: 800;
  letter-spacing: .11em;
  text-transform: uppercase;
}
.meta-strip,
.fixture-switcher {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.meta-pair {
  display: grid;
  gap: 2px;
}
.meta-value {
  font-size: .8rem;
  font-weight: 700;
}
.status-pill,
.fixture-chip,
.inline-chip,
.queue-chip,
.preset-chip,
.composer-mode,
.relation-chip,
.context-pill,
.secondary-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.44);
  box-shadow: var(--shadow-xs), var(--shadow-inset);
  font-size: .74rem;
  font-weight: 700;
  color: var(--text-dim);
}
.fixture-chip.is-active,
.composer-mode.is-active,
.secondary-tab.is-active {
  color: var(--accent);
  background: rgba(67, 100, 223, 0.12);
  box-shadow: inset 0 0 0 1px rgba(67, 100, 223, 0.04);
}
.status-pill {
  gap: 8px;
  min-height: 36px;
  font-size: .76rem;
  font-weight: 800;
}
.status-pill__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.pill-idle { color: var(--text-muted); background: rgba(239,241,236,0.74); }
.pill-idle .status-pill__dot { background: var(--text-muted); }
.pill-running { color: var(--accent); background: var(--accent-soft); }
.pill-running .status-pill__dot { background: var(--accent); }
.pill-paused { color: var(--warn); background: var(--warn-soft); }
.pill-paused .status-pill__dot { background: var(--warn); }
.pill-error { color: var(--danger); background: var(--danger-soft); }
.pill-error .status-pill__dot { background: var(--danger); }
.pill-done { color: var(--ok); background: var(--ok-soft); }
.pill-done .status-pill__dot { background: var(--ok); }

.workspace-surface,
.drawer-surface,
.rail-panel,
.secondary-panel,
.composer-bar {
  background: var(--surface);
  box-shadow: var(--shadow-sm), var(--shadow-inset);
  border-radius: 26px;
}
.workspace-surface,
.drawer-surface,
.secondary-panel {
  padding: 18px;
}
.workspace-surface {
  display: grid;
  gap: 16px;
}
.drawer-surface {
  background: rgba(250,251,248,0.68);
}
.rail-panel {
  display: grid;
  gap: 12px;
  padding: 12px;
  background: rgba(246,247,243,0.68);
}
.rail-panel--muted {
  background: rgba(241,243,238,0.76);
}
.rail-panel__head,
.surface-head,
.section-head,
.secondary-head,
.workspace-hero,
.workspace-card__head,
.composer-topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.surface-head {
  margin-bottom: 10px;
}
.surface-head.compact,
.section-head,
.secondary-head {
  margin-bottom: 8px;
}
.rail-title,
.surface-title,
.section-title,
.workspace-card__title,
.entry-title,
.log-title,
.settings-title {
  margin: 0;
  font-weight: 800;
  letter-spacing: -.02em;
}
.rail-title {
  font-size: .72rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: .1em;
}
.surface-title,
.section-title {
  font-size: 1rem;
}
.surface-title--small {
  font-size: .92rem;
}
.workspace-title {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2.5rem);
  line-height: 1.05;
  letter-spacing: -.055em;
}
.workspace-summary {
  margin: 10px 0 0;
  color: var(--text-dim);
  font-size: .98rem;
  max-width: 68ch;
}
.metric-row,
.surface-actions,
.entry-actions,
.task-actions,
.quick-actions,
.form-actions,
.settings-actions,
.composer-input-row,
.composer-mode-row,
.preset-row,
.workspace-header__chips,
.workspace-relations,
.rail-stack,
.timeline,
.task-columns,
.task-meta,
.inbox-stack,
.settings-stack,
.log-stack,
.form-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.metric-row { justify-content: flex-end; }
.metric-chip {
  min-width: 88px;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(255,255,255,0.4);
  box-shadow: var(--shadow-xs), var(--shadow-inset);
}
.metric-chip__label {
  display: block;
  font-size: .64rem;
  font-weight: 700;
  color: var(--text-muted);
}
.metric-chip__value {
  display: block;
  font-size: .96rem;
  font-weight: 800;
}
.workspace-header {
  display: grid;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(180deg, rgba(255,255,255,0.58), rgba(245,247,242,0.76));
  box-shadow: var(--shadow-xs), var(--shadow-inset);
  border-radius: 24px;
}
.workspace-header__meta {
  display: grid;
  gap: 10px;
}
.workspace-header__id {
  color: var(--text-muted);
  font-size: .72rem;
  font-family: var(--mono);
}
.workspace-header__title {
  font-size: 1.18rem;
  font-weight: 800;
  line-height: 1.34;
}
.workspace-header__summary,
.task-copy,
.empty-copy,
.entry-copy,
.log-copy,
.settings-copy,
.queue-copy,
.chat-bubble__copy,
.rail-copy,
.context-card__value {
  color: var(--text-dim);
}
.workspace-relations {
  gap: 6px;
}
.relation-chip {
  justify-content: flex-start;
  padding-inline: 12px;
  background: rgba(255,255,255,0.42);
}
.relation-chip.is-blocked {
  color: var(--danger);
  background: var(--danger-soft);
}
.relation-chip.is-decision {
  color: var(--warn);
  background: var(--warn-soft);
}
.context-strip {
  position: sticky;
  top: 82px;
  z-index: 18;
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 22px;
  background: rgba(243,245,240,0.88);
  box-shadow: var(--shadow-sm), var(--shadow-inset);
}
.context-strip__items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.context-card {
  padding: 12px;
  border-radius: 18px;
  background: rgba(255,255,255,0.48);
  box-shadow: var(--shadow-xs), var(--shadow-inset);
}
.context-card__label {
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: .65rem;
  font-weight: 800;
  letter-spacing: .09em;
  text-transform: uppercase;
}
.context-card__value {
  font-size: .9rem;
  line-height: 1.55;
}
.workspace-section,
.utility-shell {
  padding-top: 14px;
}
.utility-shell {
  margin-top: 6px;
}
.section-head--workspace {
  align-items: center;
}
.workspace-timeline,
.side-stack,
.snapshot-grid,
.form-grid {
  display: grid;
  gap: 10px;
}
.chat-bubble,
.entry-card,
.task-row,
.snapshot-card,
.form-card,
.settings-card,
.log-card,
.rail-item,
.empty-state {
  padding: 12px;
  border-radius: 18px;
  background: rgba(255,255,255,0.42);
  box-shadow: var(--shadow-xs), var(--shadow-inset);
}
.chat-bubble {
  display: grid;
  gap: 8px;
}
.chat-bubble--agent {
  background: rgba(255,255,255,0.5);
}
.chat-bubble--system {
  background: rgba(241,243,238,0.82);
}
.chat-bubble--decision {
  background: rgba(182, 122, 33, 0.11);
}
.chat-bubble--blocked {
  background: rgba(198, 82, 65, 0.08);
}
.chat-bubble__meta,
.task-meta,
.entry-meta,
.log-meta,
.settings-meta,
.rail-item__meta {
  color: var(--text-muted);
  font-size: .76rem;
}
.entry-card.is-warning,
.log-card.is-warning { background: rgba(182,122,33,0.11); }
.entry-card.is-danger,
.log-card.is-danger { background: rgba(198,82,65,0.08); }
.task-title-row,
.task-row-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.task-title,
.workspace-card__title,
.entry-title,
.log-title,
.settings-title {
  font-size: .95rem;
  line-height: 1.45;
}
.task-id,
.rail-item__label,
.workspace-header__id {
  font-size: .72rem;
  font-family: var(--mono);
}
.task-column {
  display: grid;
  gap: 10px;
  min-width: min(320px, 100%);
  flex: 1 1 260px;
}
.task-column-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.task-column-title {
  font-size: .78rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: .1em;
  text-transform: uppercase;
}
.task-row.is-current {
  background: rgba(67,100,223,0.08);
}
.task-row.is-next {
  background: rgba(27,122,80,0.06);
}
.snapshot-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.snapshot-label {
  color: var(--text-muted);
  font-size: .64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
}
.snapshot-value {
  font-size: 1rem;
  font-weight: 800;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: .82rem;
  font-weight: 700;
  transition: background-color .18s var(--ease), color .18s var(--ease), transform .18s var(--ease);
}
.btn:hover { transform: translateY(-1px); }
.btn:disabled {
  opacity: .46;
  cursor: not-allowed;
  transform: none;
}
.btn-primary {
  color: white;
  background: var(--accent);
  box-shadow: 0 10px 20px rgba(67,100,223,0.22);
}
.btn-ghost {
  color: var(--text-dim);
  background: rgba(255,255,255,0.48);
  box-shadow: var(--shadow-xs), var(--shadow-inset);
}
.btn-danger {
  color: #92392e;
  background: var(--danger-soft);
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
  border: 0;
  border-radius: 16px;
  background: rgba(255,255,255,0.62);
  box-shadow: var(--shadow-xs), inset 0 0 0 1px rgba(255,255,255,0.42);
  padding: 11px 13px;
  color: var(--text);
  outline: 0;
}
textarea:focus,
input:focus,
select:focus {
  box-shadow: var(--shadow-xs), 0 0 0 3px rgba(67,100,223,0.1);
}
.empty-state {
  display: grid;
  gap: 8px;
}
.empty-title {
  font-size: .92rem;
  font-weight: 800;
}
.quick-actions,
.settings-stack,
.log-stack,
.inbox-stack,
.side-stack,
.rail-stack,
.timeline,
.form-stack {
  display: grid;
  gap: 10px;
}
.rail-item,
.rail-linkish {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
}
.rail-linkish {
  width: 100%;
  padding: 10px 12px;
  border-radius: 18px;
  background: rgba(255,255,255,0.34);
  box-shadow: var(--shadow-xs), var(--shadow-inset);
}
.rail-item__icon {
  width: 8px;
  height: 8px;
  margin-top: 7px;
  border-radius: 999px;
  background: rgba(112,123,113,0.6);
  flex: 0 0 auto;
}
.rail-item__icon.is-current { background: var(--accent); }
.rail-item__icon.is-next { background: var(--ok); }
.rail-item__icon.is-blocked { background: var(--danger); }
.secondary-tabs {
  display: inline-grid;
  grid-template-columns: repeat(4, minmax(0, max-content));
  gap: 8px;
}
.secondary-panel { display: none; }
.secondary-panel.is-active { display: block; }
.composer-bar {
  padding: 12px;
  display: grid;
  gap: 10px;
  background: rgba(248,249,245,0.88);
}
.composer-context {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.48);
  box-shadow: var(--shadow-xs), var(--shadow-inset);
  font-size: .74rem;
  color: var(--text-dim);
}
.is-hidden { display: none !important; }
.toast-stack {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 60;
  display: grid;
  gap: 8px;
}
.toast {
  min-width: 220px;
  max-width: min(360px, calc(100vw - 32px));
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(24, 32, 24, 0.9);
  color: white;
  box-shadow: var(--shadow-md);
}
.toast.success { background: #195c46; }
.toast.warning { background: #8b631e; }
.toast.error { background: #963b30; }
.fold {
  border-radius: 18px;
  background: rgba(255,255,255,0.38);
  box-shadow: var(--shadow-xs), var(--shadow-inset);
  padding: 10px 12px;
}
.fold__title {
  cursor: pointer;
  font-weight: 800;
}
.log-pre {
  margin: 10px 0 0;
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  font-family: var(--mono);
  font-size: .75rem;
}
.field {
  display: grid;
  gap: 6px;
}
.field.full { grid-column: 1 / -1; }
.field-hint {
  color: var(--text-muted);
  font-size: .73rem;
}
.form-grid.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.queue-snapshot {
  margin-top: 12px;
}

@media (max-width: 920px) {
  .context-strip {
    top: 12px;
  }
  .context-strip__items {
    grid-template-columns: 1fr;
  }
  .secondary-tabs {
    width: 100%;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .workspace-surface,
  .drawer-surface,
  .secondary-panel {
    padding: 12px;
  }
  .metric-row,
  .surface-actions,
  .entry-actions,
  .task-actions,
  .quick-actions,
  .composer-input-row,
  .composer-mode-row,
  .preset-row,
  .workspace-relations {
    display: flex;
    flex-wrap: wrap;
  }
  .btn {
    width: 100%;
  }
  .topbar__controls .btn {
    width: auto;
    flex: 1 1 calc(50% - 4px);
  }
}
`;
