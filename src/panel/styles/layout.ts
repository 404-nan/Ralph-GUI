export const panelLayoutStyles = String.raw`
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) auto auto;
  gap: 16px;
  align-items: center;
  padding: 14px 20px;
  background: rgba(245, 246, 242, 0.86);
  backdrop-filter: blur(18px);
  border-bottom: 1px solid rgba(223, 229, 218, 0.72);
}
.topbar__brand,
.topbar__summary,
.topbar__controls { min-width: 0; }
.topbar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar__project {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.topbar__summary {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
}
.topbar__meta-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.meta-pair {
  display: grid;
  gap: 2px;
  justify-items: end;
}
.workspace {
  width: min(1460px, calc(100vw - 28px));
  margin: 0 auto;
  padding: 18px 0 16px;
  display: grid;
  gap: 16px;
  flex: 1;
}
.shell-grid {
  display: grid;
  grid-template-columns: 180px minmax(0, 1fr) minmax(320px, 360px);
  gap: 18px;
  align-items: start;
}
.left-rail,
.main-stage,
.action-stage { min-width: 0; }
.left-rail {
  position: sticky;
  top: 84px;
}
.action-stage {
  display: grid;
  gap: 14px;
  position: sticky;
  top: 84px;
}
.secondary-shell {
  display: grid;
  gap: 12px;
}
.secondary-tabs {
  display: inline-grid;
  grid-template-columns: repeat(4, minmax(0, max-content));
  gap: 8px;
  align-self: start;
}
.secondary-panels {
  display: grid;
}
.secondary-panel {
  display: none;
}
.secondary-panel.is-active {
  display: block;
}
.composer-shell {
  position: sticky;
  bottom: 0;
  z-index: 25;
  padding: 0 14px 14px;
}

@media (max-width: 1180px) {
  .topbar {
    grid-template-columns: minmax(0, 1fr);
  }
  .topbar__summary,
  .topbar__controls {
    justify-content: flex-start;
  }
  .meta-pair {
    justify-items: start;
  }
  .shell-grid {
    grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  }
  .left-rail {
    display: none;
  }
}

@media (max-width: 860px) {
  .workspace {
    width: min(100vw - 18px, 100%);
    gap: 14px;
    padding-top: 14px;
  }
  .shell-grid {
    grid-template-columns: 1fr;
  }
  .action-stage,
  .left-rail {
    position: static;
  }
  .secondary-tabs {
    width: 100%;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .composer-shell {
    padding-inline: 10px;
  }
}

@media (max-width: 520px) {
  .topbar {
    padding: 12px;
    gap: 12px;
  }
  .topbar__meta-group {
    width: 100%;
    justify-content: space-between;
  }
  .topbar__controls {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .workspace {
    width: min(100vw - 12px, 100%);
    gap: 12px;
  }
}
`;
