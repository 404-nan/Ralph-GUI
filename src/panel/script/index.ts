import { panelScriptActions } from './actions.ts';
import { panelScriptFixtures } from './fixtures.ts';
import { panelScriptRenderers } from './renderers.ts';
import { panelScriptUtils } from './utils.ts';

const panelScriptInit = String.raw`
function bindGlobalActions() {
  $('startBtn').addEventListener('click', () => { void doStart(); });
  $('pauseBtn').addEventListener('click', () => { void doPause(); });
  $('resumeBtn').addEventListener('click', () => { void doResume(); });
  $('abortBtn').addEventListener('click', () => doAbort());
  $('sendNoteBtn').addEventListener('click', () => { void sendComposer(); });
  $('openTaskFormBtn').addEventListener('click', () => openTaskCreate());
  $('toggleTaskImportBtn').addEventListener('click', () => toggleTaskImportPanel());
  $('sidebarToggleBtn').addEventListener('click', () => setSidebarCollapsed(!state.sidebarCollapsed));
  $('sidebarCollapseBtn').addEventListener('click', () => setSidebarCollapsed(!state.sidebarCollapsed));
  $('drawerToggleBtn').addEventListener('click', () => setDrawerCollapsed(!state.drawerCollapsed));
  $('noteInput').addEventListener('input', autosizeComposer);
  $('noteInput').addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void sendComposer();
    }
  });

  document.body.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest('button') : null;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.fixtureMode) {
      setFixtureMode(target.dataset.fixtureMode);
      return;
    }
    if (target.dataset.composerMode) {
      setComposerMode(target.dataset.composerMode);
      return;
    }
    if (target.dataset.secondaryTab) {
      openSecondaryTab(target.dataset.secondaryTab);
      return;
    }
    if (target.dataset.notePreset) {
      void sendComposer(target.dataset.notePreset);
      return;
    }
    if (target.dataset.useDecision) {
      state.selectedDecisionId = target.dataset.useDecision;
      setComposerMode('decision');
      $('noteInput')?.focus();
      return;
    }
    if (target.dataset.answerQuestion) {
      void submitDecision(target.dataset.answerQuestion, target.dataset.answerValue || '');
      return;
    }
    if (target.dataset.submitQuestion) {
      void submitDecision(target.dataset.submitQuestion);
      return;
    }
    if (target.dataset.prefillNote) {
      setComposerMode('note');
      void sendComposer(target.dataset.prefillNote);
      return;
    }
    if (target.dataset.completeTask) {
      void completeTask(target.dataset.completeTask);
      return;
    }
    if (target.dataset.reopenTask) {
      void reopenTask(target.dataset.reopenTask);
      return;
    }
    if (target.dataset.moveTask) {
      void moveTask(target.dataset.moveTask, target.dataset.movePosition);
      return;
    }
    if (target.dataset.editTask) {
      openTaskEdit(target.dataset.editTask);
      openSecondaryTab('tasks');
      return;
    }
    if (target.dataset.openTaskCreate) {
      openTaskCreate();
      openSecondaryTab('tasks');
      return;
    }
    if (target.dataset.toggleTaskImport) {
      toggleTaskImportPanel();
      openSecondaryTab('tasks');
      return;
    }
    if (target.dataset.closeTaskForm) {
      setTaskFormVisible(false);
      return;
    }
    if (target.dataset.closeTaskImport) {
      setTaskImportVisible(false);
      return;
    }
    if (target.dataset.previewTaskImport) {
      void previewTaskImport();
      return;
    }
    if (target.dataset.importTasks) {
      void importTasksFromSpec();
      return;
    }
    if (target.dataset.reconnectDiscord) {
      void doDiscordReconnect();
      return;
    }
    if (target.dataset.confirmAbort) {
      void confirmAbort();
      return;
    }
    if (target.dataset.cancelAbort) {
      state.abortConfirmOpen = false;
      renderActionRail(state.dashboardData);
    }
  });
}

async function refresh() {
  try {
    if (isFixtureMode()) {
      if (!state.dashboardData || state.dashboardData.__fixtureMode !== state.fixtureMode) {
        state.dashboardData = getFixtureDashboard(state.fixtureMode);
      }
    } else {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error(await response.text());
      state.dashboardData = await response.json();
    }
    state.canEditAgent = state.dashboardData.layers?.power?.canEditAgentCommand
      || state.dashboardData.capabilities?.canEditAgentCommand
      || false;
    renderFixtureSwitcher();
    renderHeader(state.dashboardData);
    renderPrimary(state.dashboardData);
    renderActionRail(state.dashboardData);
    renderTaskBoard(state.dashboardData);
    renderInboxHistory(state.dashboardData);
    renderSettings(state.dashboardData);
    renderLogs(state.dashboardData);
  } catch (error) {
    console.error(error);
    toast('dashboard の更新に失敗しました', 'error');
  }
}

bindGlobalActions();
openSecondaryTab('tasks');
setComposerMode('note');
autosizeComposer();
setSidebarCollapsed(false);
setDrawerCollapsed(false);
renderFixtureSwitcher();
void refresh();
window.setInterval(() => {
  if (isFixtureMode()) return;
  void refresh();
}, 4000);
`;

export function renderPanelScript(): string {
  return [panelScriptUtils, panelScriptFixtures, panelScriptActions, panelScriptRenderers, panelScriptInit].join('\n');
}
