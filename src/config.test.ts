import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import { assessConfig, type AppConfig } from './config.ts';

function createBaseConfig(): AppConfig {
  const rootDir = mkdtempSync(join(tmpdir(), 'ralph-config-'));
  const promptFile = join(rootDir, 'prompt.md');
  writeFileSync(promptFile, '# prompt\n', 'utf8');

  return {
    rootDir,
    promptFile,
    taskCatalogFile: '',
    stateDir: join(rootDir, 'state'),
    logDir: join(rootDir, 'logs'),
    agentCommand: 'codex exec --full-auto --skip-git-repo-check',
    agentCwd: rootDir,
    mode: 'command',
    maxIterations: 20,
    idleSeconds: 5,
    panelPort: 8787,
    panelHost: '127.0.0.1',
    panelUsername: '',
    panelPassword: '',
    allowRuntimeAgentCommandOverride: false,
    taskName: 'release check',
    discordToken: '',
    discordNotifyChannelId: '',
    discordDmUserId: '',
    discordAppName: 'RalphLoop',
    discordAllowedUserIds: [],
    discordGuildId: '',
    discordApplicationId: '',
    discordEnabled: false,
  };
}

test('assessConfig reports a healthy command-mode setup as releasable', () => {
  const config = createBaseConfig();
  const assessment = assessConfig(config);

  assert.equal(assessment.ok, true);
  assert.equal(assessment.summary.error, 0);
  assert.match(
    assessment.items.find((item) => item.key === 'promptFile')?.message || '',
    /promptFile:/,
  );
});

test('assessConfig warns about partial auth and empty task catalog without failing', () => {
  const config = createBaseConfig();
  config.panelUsername = 'ralph';

  const assessment = assessConfig(config);

  assert.equal(assessment.ok, true);
  assert.ok(assessment.summary.warning >= 2);
  assert.equal(
    assessment.items.find((item) => item.key === 'panelAuth')?.level,
    'warning',
  );
});

test('assessConfig fails when prompt or command settings are invalid', () => {
  const config = createBaseConfig();
  config.promptFile = join(config.rootDir, 'missing-prompt.md');
  config.agentCommand = '';

  const assessment = assessConfig(config);

  assert.equal(assessment.ok, false);
  assert.ok(assessment.summary.error >= 2);
  assert.equal(
    assessment.items.find((item) => item.key === 'agentCommand')?.level,
    'error',
  );
  assert.equal(
    assessment.items.find((item) => item.key === 'promptFile')?.level,
    'error',
  );
});

test('assessConfig fails when the execution directory is invalid', () => {
  const config = createBaseConfig();
  config.agentCwd = join(config.rootDir, 'missing-workspace');

  const assessment = assessConfig(config);

  assert.equal(assessment.ok, false);
  assert.equal(
    assessment.items.find((item) => item.key === 'agentCwd')?.level,
    'error',
  );
});

test('assessConfig warns when runtime agent command override is enabled without protections', () => {
  const config = createBaseConfig();
  config.allowRuntimeAgentCommandOverride = true;
  config.discordToken = 'token';
  config.discordEnabled = true;

  const assessment = assessConfig(config);

  assert.equal(
    assessment.items.find((item) => item.key === 'runtimeAgentCommand')?.level,
    'warning',
  );
  assert.equal(
    assessment.items.find((item) => item.key === 'runtimeAgentCommandPanelRisk')?.level,
    'warning',
  );
  assert.equal(
    assessment.items.find((item) => item.key === 'runtimeAgentCommandDiscordRisk')?.level,
    'warning',
  );
});

test('assessConfig fails when task catalog JSON is malformed', () => {
  const config = createBaseConfig();
  config.taskCatalogFile = join(config.rootDir, 'broken-task-catalog.json');
  writeFileSync(config.taskCatalogFile, '{ not json', 'utf8');

  const assessment = assessConfig(config);

  assert.equal(assessment.ok, false);
  assert.equal(
    assessment.items.find((item) => item.key === 'taskCatalog')?.level,
    'error',
  );
  assert.match(
    assessment.items.find((item) => item.key === 'taskCatalog')?.message || '',
    /task catalog を読み取れません/,
  );
});

test('assessConfig honors persisted prompt overrides when runtime settings are supplied', () => {
  const config = createBaseConfig();
  config.promptFile = join(config.rootDir, 'missing-prompt.md');

  const assessment = assessConfig(config, {
    promptFile: config.promptFile,
    promptBody: 'inline prompt override',
  });

  assert.equal(assessment.ok, true);
  assert.equal(
    assessment.items.find((item) => item.key === 'promptFile')?.level,
    'ok',
  );
  assert.match(
    assessment.items.find((item) => item.key === 'promptFile')?.message || '',
    /prompt 上書き/,
  );
});

test('assessConfig honors persisted Discord notify channel overrides when runtime settings are supplied', () => {
  const config = createBaseConfig();
  config.discordToken = 'token';
  config.discordEnabled = true;

  const assessment = assessConfig(config, {
    discordNotifyChannelId: 'channel-2',
  });

  assert.equal(
    assessment.items.find((item) => item.key === 'discordTarget')?.level,
    'ok',
  );
});
