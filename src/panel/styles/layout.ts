export const panelLayoutStyles = String.raw`
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 14px 18px;
  background: rgba(247, 248, 244, 0.72);
  backdrop-filter: blur(20px);
}
.topbar__brand,
.topbar__center,
.topbar__controls,
.main-stage,
.left-rail,
.right-drawer { min-width: 0; }
.topbar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.topbar__center {
  display: grid;
  gap: 8px;
}
.topbar__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.workspace-shell {
  width: min(1560px, calc(100vw - 24px));
  margin: 0 auto;
  padding: 16px 0 14px;
  display: grid;
  grid-template-columns: 232px minmax(0, 1fr) 332px;
  gap: 18px;
  align-items: start;
  flex: 1;
}
.left-rail,
.right-drawer {
  position: sticky;
  top: 82px;
  display: grid;
  gap: 12px;
}
.app-shell.is-sidebar-collapsed .workspace-shell {
  grid-template-columns: 68px minmax(0, 1fr) 332px;
}
.app-shell.is-sidebar-collapsed .left-rail {
  overflow: hidden;
}
.app-shell.is-sidebar-collapsed .left-rail .rail-panel {
  padding-inline: 8px;
}
.app-shell.is-sidebar-collapsed .left-rail .rail-title,
.app-shell.is-sidebar-collapsed .left-rail .rail-panel__head > div,
.app-shell.is-sidebar-collapsed .left-rail .rail-copy,
.app-shell.is-sidebar-collapsed .left-rail .rail-item__meta,
.app-shell.is-sidebar-collapsed .left-rail .rail-item__copy,
.app-shell.is-sidebar-collapsed .left-rail .rail-item__label {
  display: none;
}
.app-shell.is-sidebar-collapsed .left-rail .rail-item,
.app-shell.is-sidebar-collapsed .left-rail .rail-linkish {
  justify-content: center;
  padding-inline: 0;
}
.app-shell.is-sidebar-collapsed .left-rail .rail-item__icon {
  margin-right: 0;
}
.app-shell.is-drawer-collapsed .workspace-shell {
  grid-template-columns: 232px minmax(0, 1fr);
}
.app-shell.is-drawer-collapsed .right-drawer {
  display: none;
}
.main-stage {
  display: grid;
}
.composer-shell {
  position: sticky;
  bottom: 0;
  z-index: 35;
  padding: 0 12px 12px;
}

@media (max-width: 1260px) {
  .topbar {
    grid-template-columns: minmax(0, 1fr);
  }
  .topbar__controls {
    justify-content: flex-start;
  }
  .workspace-shell,
  .app-shell.is-sidebar-collapsed .workspace-shell {
    grid-template-columns: 220px minmax(0, 1fr);
  }
  .right-drawer {
    display: none;
  }
}

@media (max-width: 920px) {
  .workspace-shell,
  .app-shell.is-sidebar-collapsed .workspace-shell,
  .app-shell.is-drawer-collapsed .workspace-shell {
    width: min(100vw - 16px, 100%);
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .left-rail,
  .right-drawer {
    position: static;
  }
  .left-rail {
    order: 2;
  }
  .main-stage {
    order: 1;
  }
  .topbar {
    padding: 12px;
  }
}

@media (max-width: 520px) {
  .workspace-shell,
  .app-shell.is-sidebar-collapsed .workspace-shell,
  .app-shell.is-drawer-collapsed .workspace-shell {
    width: min(100vw - 10px, 100%);
    gap: 10px;
    padding-top: 10px;
  }
  .composer-shell {
    padding: 0 8px 8px;
  }
}
`;
