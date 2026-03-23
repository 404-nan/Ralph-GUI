import { Bot } from 'lucide-react';

import type {
  DashboardData,
  QuickTestResult,
  RuntimeSettings,
} from '../../../src/shared/types.ts';
import { Alert, Card } from './PanelPrimitives.tsx';
import type { SettingsDraft } from './mission-support.ts';

export function SetupView(props: {
  dashboard: DashboardData;
  settingsDraft: SettingsDraft;
  settingsDirty: boolean;
  setupAdvanced: boolean;
  quickTestResult: QuickTestResult | null;
  busySave: boolean;
  busySaveAndQuickTest: boolean;
  busyReset: boolean;
  onChangeSettings: (patch: Partial<SettingsDraft>) => void;
  onToggleAdvanced: () => void;
  onSave: () => void;
  onSaveAndQuickTest: () => void;
  onReset: () => void;
  onApplyPreset: (command: string, label: string) => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-6">
        <Card title="最初にやること" subtitle="ここだけ埋めれば、とりあえず動かせます。">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-sm font-medium text-slate-100">1. agent の preset を選ぶ</div>
              <div className="mt-3 grid gap-3">
                {props.dashboard.setupDiagnostics.presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => props.onApplyPreset(preset.command, preset.label)}
                    className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-left hover:border-slate-700 hover:bg-slate-900"
                  >
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                      <Bot className="h-4 w-4 text-sky-400" />
                      {preset.label}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">{preset.description}</div>
                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 font-mono text-xs text-slate-300">
                      {preset.command}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="text-sm font-medium text-slate-100">2. 直すべき項目を確認する</div>
              <div className="mt-3 space-y-2">
                {props.dashboard.setupDiagnostics.items.map((item) => (
                  <div
                    key={item.key}
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      item.level === 'error'
                        ? 'border-rose-800 bg-rose-950/50 text-rose-100'
                        : item.level === 'warning'
                          ? 'border-amber-800 bg-amber-950/50 text-amber-100'
                          : 'border-emerald-800 bg-emerald-950/50 text-emerald-100'
                    }`}
                  >
                    {item.message}
                  </div>
                ))}
              </div>
            </div>

            {props.quickTestResult && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                <Alert
                  tone={props.quickTestResult.ok ? 'success' : 'error'}
                  title={props.quickTestResult.ok ? '接続テストに成功しました' : '接続テストに失敗しました'}
                  message={props.quickTestResult.summary}
                />
                {props.quickTestResult.output.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {props.quickTestResult.output.map((line) => (
                      <div key={line} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-300">
                        {line}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card
        title="最低限設定"
        subtitle="入力中の内容を保存してからテストできます。"
        actions={(
          <div className="flex gap-2">
            <button
              type="button"
              onClick={props.onToggleAdvanced}
              className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:border-slate-700 hover:bg-slate-900"
            >
              {props.setupAdvanced ? '詳細を隠す' : '詳細を開く'}
            </button>
            <button
              type="button"
              onClick={props.onSave}
              disabled={props.busySave}
              className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-200 hover:border-slate-700 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              保存
            </button>
            <button
              type="button"
              onClick={props.onSaveAndQuickTest}
              disabled={props.busySaveAndQuickTest}
              className="rounded-xl border border-sky-700 bg-sky-950 px-3 py-2 text-sm font-medium text-sky-100 hover:bg-sky-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              保存してテスト
            </button>
          </div>
        )}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">タスク名</label>
            <input
              value={props.settingsDraft.taskName}
              onChange={(event) => props.onChangeSettings({ taskName: event.target.value })}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">Agent command</label>
            <input
              value={props.settingsDraft.agentCommand}
              onChange={(event) => props.onChangeSettings({ agentCommand: event.target.value })}
              disabled={!props.dashboard.capabilities.canEditAgentCommand}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none focus:border-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">Workspace</label>
            <input
              value={props.settingsDraft.agentCwd}
              onChange={(event) => props.onChangeSettings({ agentCwd: event.target.value })}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-300">Prompt file</label>
            <input
              value={props.settingsDraft.promptFile}
              onChange={(event) => props.onChangeSettings({ promptFile: event.target.value })}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
            />
          </div>
        </div>

        {props.settingsDirty && <div className="mt-4 text-sm text-amber-300">未保存の変更があります。</div>}

        {props.setupAdvanced && (
          <div className="mt-6 space-y-6 border-t border-slate-800 pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Mode</label>
                <select
                  value={props.settingsDraft.mode}
                  onChange={(event) => props.onChangeSettings({ mode: event.target.value as RuntimeSettings['mode'] })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                >
                  <option value="command">command</option>
                  <option value="demo">demo</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Max iterations</label>
                <input
                  type="number"
                  value={props.settingsDraft.maxIterations}
                  onChange={(event) => props.onChangeSettings({ maxIterations: Number(event.target.value) })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Idle seconds</label>
                <input
                  type="number"
                  value={props.settingsDraft.idleSeconds}
                  onChange={(event) => props.onChangeSettings({ idleSeconds: Number(event.target.value) })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">Prompt override</label>
                <textarea
                  value={props.settingsDraft.promptBody}
                  onChange={(event) => props.onChangeSettings({ promptBody: event.target.value })}
                  rows={5}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-300">Discord notify channel</label>
                <input
                  value={props.settingsDraft.discordNotifyChannelId}
                  onChange={(event) => props.onChangeSettings({ discordNotifyChannelId: event.target.value })}
                  className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-sky-700"
                />
              </div>
            </div>

            <div>
              <div className="mb-3 text-sm font-semibold text-slate-100">Agent Profiles</div>
              <div className="space-y-3">
                {props.settingsDraft.agentProfiles.map((profile) => (
                  <div key={profile.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="text-sm font-medium text-slate-100">{profile.label || profile.id}</div>
                    {profile.description && <div className="mt-1 text-sm text-slate-400">{profile.description}</div>}
                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 font-mono text-xs text-slate-300">
                      {profile.command}
                    </div>
                  </div>
                ))}
                {props.settingsDraft.agentProfiles.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-500">
                    Agent profile はまだありません。
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <button
                type="button"
                onClick={props.onReset}
                disabled={props.busyReset}
                className="rounded-2xl border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm font-medium text-rose-100 hover:bg-rose-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                state を初期化する
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
