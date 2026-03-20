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
  $('composerTaskShortcut').addEventListener('click', () => {
    openSecondaryTab('tasks');
    openTaskCreate();
    scrollToPanel('secondaryPanelTasks');
  });
  $('composerDecisionShortcut').addEventListener('click', () => {
    openSecondaryTab('inbox');
    scrollToPanel('secondaryPanelInbox');
  });
  $('composerSettingsShortcut').addEventListener('click', () => {
    openSecondaryTab('settings');
    scrollToPanel('secondaryPanelSettings');
  });
  $('openTaskFormBtn').addEventListener('click', () => openTaskCreate());
  $('toggleTaskImportBtn').addEventListener('click', () => {
    state.taskImportVisible = !state.taskImportVisible;
    renderTaskBoard(state.dashboardData);
  });
  $('noteInput').addEventListener('input', autosizeComposer);
  $('noteInput').addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void sendNote();
    }
  });

  document.body.addEventListener('click', (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest('button,[data-jump-tab]') : null;
    if (!(target instanceof HTMLElement)) return;

    const secondaryTab = target.dataset.secondaryTab;
    if (secondaryTab) {
      openSecondaryTab(secondaryTab);
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
    if (target.dataset.jumpDecision) {
      openSecondaryTab('tasks');
      scrollToPanel('decisionCard_' + target.dataset.jumpDecision);
      return;
    }
    if (target.dataset.jumpTab) {
      openSecondaryTab(target.dataset.jumpTab);
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
      return;
    }
    if (target.dataset.openTaskCreate) {
      openTaskCreate();
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
    if (target.dataset.clearTaskImport) {
      resetTaskImportPreview();
      const input = $('taskImportInput');
      if (input instanceof HTMLTextAreaElement) input.value = '';
      renderTaskBoard(state.dashboardData);
      return;
    }
    if (target.dataset.settingsMode) {
      setSettingsMode(target.dataset.settingsMode);
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
      renderPrimary(state.dashboardData);
    }
  });
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
autosizeComposer();
void refresh();
window.setInterval(() => { void refresh(); }, 4000);
`;

export function renderPanelScript(): string {
  return [panelScriptUtils, panelScriptActions, panelScriptRenderers, panelScriptInit].join('\n');
}
