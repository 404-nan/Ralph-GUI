import { RunActions } from '../actions/run-actions.ts';
import type { AppConfig } from '../config.ts';
import { loadConfig } from '../config.ts';
import { DiscordBridge } from '../discord/bridge.ts';
import { startPanelServer } from '../panel/server.ts';
import { ConsoleNotifier, CompositeNotifier, NoopNotifier } from '../shared/notifier.ts';
import { FileStateStore } from '../state/store.ts';
import { Supervisor } from '../supervisor/supervisor.ts';

export interface BootstrapOptions {
  startPanel: boolean;
  startSupervisor: boolean;
  startDiscord: boolean;
  autoStartRun?: boolean;
  config?: AppConfig;
}

export async function bootstrapSystem(options: BootstrapOptions) {
  const config = options.config ?? loadConfig();
  const store = new FileStateStore(config);
  await store.ensureInitialized();
  const actions = new RunActions(store, config);
  actions.getRuntimeSettings();
  await actions.recoverInterruptedRun({ source: 'bootstrap' });

  const notifiers = [new ConsoleNotifier()];
  let supervisor: Supervisor | null = null;
  const hooks = {
    onAbort: () => supervisor?.abortCurrentTurn('abort command received'),
    onDiscordReconnect: async () => {
      if (!discordBridge) {
        throw new Error('Discord bridge は現在起動していません');
      }
      await discordBridge.restart();
    },
    waitForIdle: async () => {
      await supervisor?.waitUntilIdle();
    },
  };
  let discordBridge: DiscordBridge | null = null;
  if (options.startDiscord && config.discordEnabled) {
    discordBridge = new DiscordBridge(config, actions, hooks);
    notifiers.push(discordBridge);
  }

  const notifier =
    notifiers.length === 0 ? new NoopNotifier() : new CompositeNotifier(notifiers);
  supervisor = new Supervisor(config, actions, notifier);
  let panelServer = null;

  if (options.startPanel) {
    panelServer = startPanelServer(config, actions, hooks);
  }

  if (discordBridge) {
    await discordBridge.start();
  }

  if (options.startSupervisor) {
    void supervisor.watch();
  }

  if (options.autoStartRun) {
    const result = await actions.requestRunStart({ source: 'cli' });
    console.log(`[run.request] ${result.message}`);
  }

  return { config, store, actions, supervisor, discordBridge, panelServer };
}
