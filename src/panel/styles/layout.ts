export const panelLayoutStyles = String.raw`
.app-shell {
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) auto auto;
  gap: 16px;
  align-items: center;
  padding: 14px 20px;
  background: rgba(245, 246, 242, 0.9);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(223, 229, 218, 0.9);
}
.topbar__identity,
.topbar__project,
.topbar__context,
.topbar__controls {
  min-width: 0;
}
.topbar__identity {
  display: flex;
  align-items: center;
  gap: 14px;
}
.brand-mark {
  flex: none;
  display: inline-flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--line);
  font-weight: 800;
  letter-spacing: -.02em;
  box-shadow: var(--shadow-sm);
}
.topbar__project {
  display: grid;
  gap: 3px;
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
  color: var(--text-muted);
  font-size: .76rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topbar__context {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}
.topbar__meta {
  display: grid;
  gap: 2px;
  justify-items: end;
}
.workspace {
  width: min(1400px, calc(100vw - 24px));
  margin: 0 auto;
  padding: 18px 0 28px;
  display: grid;
  gap: 16px;
}
.primary-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, .92fr);
  grid-template-areas:
    "summary hero"
    "updates hero";
  gap: 16px;
}
.summary-panel { grid-area: summary; }
.hero-panel { grid-area: hero; }
.updates-panel { grid-area: updates; }
.secondary-area {
  display: grid;
  gap: 12px;
}
.secondary-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, .95fr);
  gap: 16px;
  align-items: start;
}
.secondary-grid > :nth-child(1) { grid-column: 1; }
.secondary-grid > :nth-child(2) { grid-column: 2; }
.secondary-grid > :nth-child(3) { grid-column: 1; }
.secondary-grid > :nth-child(4) { grid-column: 2; }
.only-mobile { display: none !important; }

@media (max-width: 1080px) {
  .topbar {
    grid-template-columns: minmax(0, 1fr);
  }
  .topbar__context,
  .topbar__controls {
    justify-content: flex-start;
  }
  .topbar__meta {
    justify-items: start;
  }
  .primary-grid,
  .secondary-grid {
    grid-template-columns: 1fr;
    grid-template-areas: none;
  }
  .summary-panel,
  .hero-panel,
  .updates-panel { grid-area: auto; }
}

@media (max-width: 720px) {
  .workspace {
    width: min(100vw - 16px, 100%);
    padding-top: 12px;
    gap: 12px;
  }
  .topbar {
    padding: 12px;
    gap: 12px;
  }
  .topbar__controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .secondary-tabs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  .only-mobile { display: initial !important; }
  .secondary-grid {
    display: block;
  }
  .secondary-panel {
    display: none;
  }
  .secondary-panel.is-active {
    display: block;
  }
}
`;
