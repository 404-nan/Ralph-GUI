import { panelScriptActions } from './actions.ts';
import { panelScriptRenderers } from './renderers.ts';
import { panelScriptUtils } from './utils.ts';

const panelScriptInit = String.raw`
function bindGlobalActions() {
  $('startBtn').addEventListener('click', () => { void doStart(); });
  $('pauseBtn').addEventListener('click', () => { void doPause(); });
  $('resumeBtn').addEventListener('click', () => { void doResume(); });
  $('abortBtn').addEventListener('click', () => doAbort());
  $('sendNoteBtn').addEventListener('click', () => { void sendNote(); });
  $('openTaskFormBtn').addEventListener('click', () => openTaskCreate());
  $('toggleTaskImportBtn').addEventListener('click', () => toggleTaskImportPanel());
  $('noteInput').addEventListener('input', autosizeComposer);
  $('noteInput').addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void sendNote();
    }
  });

  document.body.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest('button') : null;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.secondaryTab) {
      openSecondaryTab(target.dataset.secondaryTab);
      if (target.dataset.navTarget) return;
      const panelId = 'secondaryPanel' + target.dataset.secondaryTab.charAt(0).toUpperCase() + target.dataset.secondaryTab.slice(1);
      scrollToPanel(panelId);
      return;
    }
    if (target.dataset.navTarget) {
      setActiveNav(target.dataset.navTarget);
      scrollToPanel(target.dataset.navTarget);
      return;
    }
    if (target.dataset.notePreset) {
      void sendNote(target.dataset.notePreset);
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
    if (target.dataset.focusDecision) {
      const input = $('decisionAnswer_' + target.dataset.focusDecision);
      if (input instanceof HTMLTextAreaElement) input.focus();
      return;
    }
    if (target.dataset.prefillNote) {
      void sendNote(target.dataset.prefillNote);
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
      scrollToPanel('secondaryPanelTasks');
      return;
    }
    if (target.dataset.openTaskCreate) {
      openTaskCreate();
      openSecondaryTab('tasks');
      scrollToPanel('secondaryPanelTasks');
      return;
    }
    if (target.dataset.toggleTaskImport) {
      toggleTaskImportPanel();
      openSecondaryTab('tasks');
      scrollToPanel('secondaryPanelTasks');
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

  window.addEventListener('scroll', updateActiveNavFromScroll, { passive: true });
}

async function refresh() {
  try {
    const response = await fetch('/api/dashboard');
    if (!response.ok) throw new Error(await response.text());
    state.dashboardData = await response.json();
    state.canEditAgent = state.dashboardData.layers?.power?.canEditAgentCommand
      || state.dashboardData.capabilities?.canEditAgentCommand
      || false;
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
setActiveNav('missionPanel');
autosizeComposer();
void refresh();
window.setInterval(() => { void refresh(); }, 4000);
`;

export function renderPanelScript(): string {
  return [panelScriptUtils, panelScriptActions, panelScriptRenderers, panelScriptInit].join('\n');
}
