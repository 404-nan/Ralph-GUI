export const panelComponentStyles = String.raw`
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255,255,255,0.78);
  border: 1px solid rgba(214, 220, 211, 0.94);
  font-size: .82rem;
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
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.72);
  box-shadow: var(--shadow-sm);
}
.icon-btn span {
  display: block;
  width: 14px;
  height: 1.5px;
  border-radius: 999px;
  background: var(--text-dim);
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
  font-size: .68rem;
  font-weight: 800;
  letter-spacing: .09em;
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
.context-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid rgba(214, 220, 211, 0.92);
  background: rgba(255,255,255,0.7);
  font-size: .74rem;
  font-weight: 700;
  color: var(--text-dim);
}
.fixture-chip.is-active,
.composer-mode.is-active {
  color: var(--accent);
  border-color: rgba(63, 99, 221, 0.22);
  background: var(--accent-soft);
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
.pill-idle { color: var(--text-muted); background: var(--surface-muted); }
.pill-idle .status-pill__dot { background: var(--text-muted); }
.pill-running { color: var(--accent); background: var(--accent-soft); border-color: rgba(63,99,221,0.16); }
.pill-running .status-pill__dot { background: var(--accent); }
.pill-paused { color: var(--warn); background: var(--warn-soft); border-color: rgba(179,122,36,0.18); }
.pill-paused .status-pill__dot { background: var(--warn); }
.pill-error { color: var(--danger); background: var(--danger-soft); border-color: rgba(196,76,59,0.18); }
.pill-error .status-pill__dot { background: var(--danger); }
.pill-done { color: var(--ok); background: var(--ok-soft); border-color: rgba(24,119,77,0.18); }
.pill-done .status-pill__dot { background: var(--ok); }

.workspace-surface,
.drawer-surface,
.rail-panel,
.secondary-panel,
.composer-bar {
  background: var(--surface);
  border: 1px solid rgba(214, 220, 211, 0.88);
  box-shadow: var(--shadow-sm);
  border-radius: 24px;
}
.workspace-surface,
.drawer-surface,
.secondary-panel {
  padding: 16px;
}
.workspace-surface {
  display: grid;
  gap: 14px;
}
.rail-panel {
  display: grid;
  gap: 12px;
  padding: 12px;
}
.rail-panel--muted {
  background: rgba(242, 244, 239, 0.86);
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
  font-size: .74rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: .08em;
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
  font-size: clamp(1.55rem, 3vw, 2.4rem);
  line-height: 1.08;
  letter-spacing: -.05em;
}
.workspace-summary {
  margin: 8px 0 0;
  color: var(--text-dim);
  font-size: .97rem;
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
.context-strip,
.context-strip__items,
.rail-stack,
.timeline,
.task-columns,
.task-meta,
.inbox-stack,
.settings-stack,
.log-stack,
.form-stack,
.workspace-timeline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.metric-row { justify-content: flex-end; }
.metric-chip {
  min-width: 92px;
  padding: 8px 10px;
  border-radius: 14px;
  background: var(--surface-soft);
  border: 1px solid rgba(214,220,211,0.62);
}
.metric-chip__label {
  display: block;
  font-size: .65rem;
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
  padding: 14px;
  background: linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,249,245,0.92));
  border: 1px solid rgba(214,220,211,0.72);
  border-radius: 22px;
}
.workspace-header__meta {
  display: grid;
  gap: 10px;
}
.workspace-header__id {
  color: var(--text-muted);
  font-size: .73rem;
  font-family: var(--mono);
}
.workspace-header__title {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.35;
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
  background: var(--surface-soft);
}
.relation-chip.is-blocked {
  color: var(--danger);
  background: var(--danger-soft);
  border-color: rgba(196,76,59,0.18);
}
.relation-chip.is-decision {
  color: var(--warn);
  background: var(--warn-soft);
  border-color: rgba(179,122,36,0.18);
}
.context-strip {
  position: sticky;
  top: 82px;
  z-index: 18;
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 20px;
  border: 1px solid rgba(214,220,211,0.84);
  background: rgba(244,246,241,0.94);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.85);
}
.context-strip__items {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.context-card {
  padding: 12px;
  border-radius: 16px;
  background: rgba(255,255,255,0.72);
  border: 1px solid rgba(214,220,211,0.68);
}
.context-card__label {
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: .66rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.context-card__value {
  font-size: .9rem;
  line-height: 1.55;
}
.workspace-section,
.utility-shell {
  padding-top: 12px;
  border-top: 1px solid rgba(214,220,211,0.64);
}
.section-head--workspace {
  align-items: center;
}
.workspace-timeline {
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
  background: rgba(247, 248, 244, 0.84);
  border: 1px solid rgba(214,220,211,0.62);
}
.chat-bubble {
  display: grid;
  gap: 8px;
}
.chat-bubble--agent {
  background: rgba(247, 248, 244, 0.92);
}
.chat-bubble--system {
  background: rgba(240, 243, 237, 0.9);
}
.chat-bubble--decision {
  background: rgba(179, 122, 36, 0.1);
  border-color: rgba(179,122,36,0.18);
}
.chat-bubble--blocked {
  background: rgba(196, 76, 59, 0.08);
  border-color: rgba(196,76,59,0.16);
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
.log-card.is-warning { background: rgba(179,122,36,0.1); }
.entry-card.is-danger,
.log-card.is-danger { background: rgba(196,76,59,0.08); }
.task-shell,
.side-stack,
.snapshot-grid,
.form-grid {
  display: grid;
  gap: 10px;
}
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
  font-size: .8rem;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: .08em;
  text-transform: uppercase;
}
.task-row.is-current {
  border-color: rgba(63,99,221,0.22);
  background: rgba(63,99,221,0.06);
}
.task-row.is-next {
  border-color: rgba(24,119,77,0.18);
}
.snapshot-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.snapshot-label {
  color: var(--text-muted);
  font-size: .65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
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
  border: 1px solid transparent;
  font-size: .82rem;
  font-weight: 700;
  transition: background-color .18s var(--ease), border-color .18s var(--ease), color .18s var(--ease);
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
  background: rgba(255,255,255,0.74);
  border-color: rgba(214,220,211,0.92);
}
.btn-danger {
  color: #8f382d;
  background: var(--danger-soft);
  border-color: rgba(196,76,59,0.18);
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
  border: 1px solid rgba(214,220,211,0.92);
  border-radius: 14px;
  background: rgba(255,255,255,0.92);
  padding: 10px 12px;
  color: var(--text);
  outline: 0;
}
textarea:focus,
input:focus,
select:focus {
  border-color: rgba(63,99,221,0.28);
  box-shadow: 0 0 0 4px rgba(63,99,221,0.1);
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
}
.rail-item__icon {
  width: 10px;
  height: 10px;
  margin-top: 6px;
  border-radius: 999px;
  background: var(--line-strong);
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
.secondary-tab {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid rgba(214,220,211,0.92);
  background: rgba(255,255,255,0.7);
  font-size: .76rem;
  font-weight: 700;
  color: var(--text-dim);
}
.secondary-tab.is-active {
  color: var(--accent);
  background: var(--accent-soft);
  border-color: rgba(63,99,221,0.2);
}
.secondary-panel { display: none; }
.secondary-panel.is-active { display: block; }
.composer-bar {
  padding: 12px;
  display: grid;
  gap: 10px;
  background: rgba(248,249,245,0.92);
}
.composer-context {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255,255,255,0.76);
  border: 1px solid rgba(214,220,211,0.88);
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
  background: rgba(24, 32, 24, 0.92);
  color: white;
  box-shadow: var(--shadow-md);
}
.toast.success { background: #195c46; }
.toast.warning { background: #8b631e; }
.toast.error { background: #963b30; }
.fold {
  border-radius: 16px;
  border: 1px solid rgba(214,220,211,0.7);
  background: rgba(255,255,255,0.68);
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
