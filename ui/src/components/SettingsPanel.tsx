import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type { DashboardData } from '../../../src/shared/types.ts';
import { apiClient } from '../api/client.ts';

interface SettingsPanelProps {
  dashboard: DashboardData;
  onAction: () => void;
}

export function SettingsPanel({ dashboard, onAction }: SettingsPanelProps) {
  const { settings, capabilities } = dashboard;
  const [form, setForm] = useState({
    taskName: settings.taskName,
    maxIterations: settings.maxIterations,
    idleSeconds: settings.idleSeconds,
    mode: settings.mode,
    agentCommand: settings.agentCommand,
    agentCwd: settings.agentCwd,
    promptFile: settings.promptFile,
    promptBody: settings.promptBody,
    discordNotifyChannelId: settings.discordNotifyChannelId,
  });
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setForm({
      taskName: settings.taskName,
      maxIterations: settings.maxIterations,
      idleSeconds: settings.idleSeconds,
      mode: settings.mode,
      agentCommand: settings.agentCommand,
      agentCwd: settings.agentCwd,
      promptFile: settings.promptFile,
      promptBody: settings.promptBody,
      discordNotifyChannelId: settings.discordNotifyChannelId,
    });
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.updateSettings(form);
      onAction();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const field = (label: string, key: keyof typeof form, type: 'text' | 'number' = 'text', opts?: { disabled?: boolean; rows?: number }) => (
    <div className="mb-3">
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      {opts?.rows ? (
        <textarea
          value={String(form[key])}
          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
          rows={opts.rows}
          disabled={opts?.disabled}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 resize-none"
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(prev => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
          disabled={opts?.disabled}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
        />
      )}
    </div>
  );

  return (
    <div className="max-w-lg">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">基本設定</h3>
      {field('タスク名', 'taskName')}
      {field('最大反復回数', 'maxIterations', 'number')}
      {field('待機秒数', 'idleSeconds', 'number')}
      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-500 mb-1">モード</label>
        <select
          value={form.mode}
          onChange={e => setForm(prev => ({ ...prev, mode: e.target.value as 'command' | 'demo' }))}
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="command">通常 (command)</option>
          <option value="demo">デモ (demo)</option>
        </select>
      </div>

      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
      >
        {showAdvanced ? '詳細設定を隠す' : '詳細設定を表示'}
      </button>

      {showAdvanced && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">詳細設定</h3>
          {field('エージェントコマンド', 'agentCommand', 'text', { disabled: !capabilities.canEditAgentCommand })}
          {field('実行ディレクトリ', 'agentCwd')}
          {field('プロンプトファイル', 'promptFile')}
          {field('追加指示', 'promptBody', 'text', { rows: 4 })}
          {field('Discord 通知チャンネル ID', 'discordNotifyChannelId')}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
      >
        <Save size={14} /> {saving ? '保存中...' : '設定を保存'}
      </button>
    </div>
  );
}
