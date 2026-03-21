import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Bot, RotateCcw } from 'lucide-react';
import type { DashboardData, AgentProfile } from '../../../src/shared/types.ts';
import { apiClient } from '../api/client.ts';

interface SettingsPanelProps {
  dashboard: DashboardData;
  onAction: () => void;
}

interface ResetNotice {
  type: 'success' | 'error';
  text: string;
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
  const [profiles, setProfiles] = useState<AgentProfile[]>(settings.agentProfiles || []);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<ResetNotice | null>(null);
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
    setProfiles(settings.agentProfiles || []);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.updateSettings({ ...form, agentProfiles: profiles });
      onAction();
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleReset = async () => {
    if (!window.confirm('state と logs の運用データを初期化します。実行中の run は停止待ちのあとに初期化します。')) {
      return;
    }

    setResetting(true);
    setResetNotice(null);
    try {
      await apiClient.resetState();
      onAction();
      setResetNotice({ type: 'success', text: 'state を初期化しました。' });
    } catch (error) {
      console.error(error);
      setResetNotice({
        type: 'error',
        text: error instanceof Error ? error.message : 'state を初期化できませんでした。',
      });
    } finally {
      setResetting(false);
    }
  };

  const addProfile = () => {
    const id = `agent-${Date.now()}`;
    setProfiles(prev => [...prev, { id, label: '', command: '', description: '' }]);
  };

  const updateProfile = (index: number, patch: Partial<AgentProfile>) => {
    setProfiles(prev => prev.map((p, i) => i === index ? { ...p, ...patch } : p));
  };

  const removeProfile = (index: number) => {
    setProfiles(prev => prev.filter((_, i) => i !== index));
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
          className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 resize-none font-mono"
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
    <div className="max-w-2xl space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">基本設定</h3>
        {field('タスク名', 'taskName')}
        <div className="grid grid-cols-2 gap-3">
          {field('最大反復回数', 'maxIterations', 'number')}
          {field('待機秒数', 'idleSeconds', 'number')}
        </div>
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
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Bot size={15} className="text-indigo-500" />
            エージェントプロファイル
          </h3>
          <button
            onClick={addProfile}
            className="px-2.5 py-1 text-xs font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1"
          >
            <Plus size={12} /> 追加
          </button>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          複数のエージェントを登録し、Task ごとに割り当てられます。コマンド内の {'{PROMPT_FILE}'} はプロンプトファイルのパスに展開されます。
        </p>

        {profiles.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
            プロファイルがありません。既定のエージェントコマンドが全 Task に使用されます。
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile, index) => (
              <div key={profile.id} className="border border-slate-200 dark:border-[#2e303a] rounded-lg p-3 bg-slate-50 dark:bg-[#1a1b22]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-0.5">ラベル</label>
                      <input
                        value={profile.label}
                        onChange={e => updateProfile(index, { label: e.target.value })}
                        placeholder="例: Claude Code"
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-slate-400 mb-0.5">説明</label>
                      <input
                        value={profile.description || ''}
                        onChange={e => updateProfile(index, { description: e.target.value })}
                        placeholder="例: 設計・レビュー向け"
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      />
                    </div>
                  </div>
                  <button onClick={() => removeProfile(index)} className="p-1 text-slate-400 hover:text-rose-500 mt-3">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-0.5">コマンド</label>
                  <input
                    value={profile.command}
                    onChange={e => updateProfile(index, { command: e.target.value })}
                    placeholder='例: claude code --print "{PROMPT_FILE}"'
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {showAdvanced ? '詳細設定を隠す' : '詳細設定を表示'}
        </button>

        {showAdvanced && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">詳細設定</h3>
            {field('既定エージェントコマンド', 'agentCommand', 'text', { disabled: !capabilities.canEditAgentCommand })}
            {field('実行ディレクトリ', 'agentCwd')}
            {field('プロンプトファイル', 'promptFile')}
            {field('追加指示', 'promptBody', 'text', { rows: 4 })}
            {field('Discord 通知チャンネル ID', 'discordNotifyChannelId')}
          </div>
        )}
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
      >
        <Save size={14} /> {saving ? '保存中...' : '設定を保存'}
      </button>

      <section className="border border-rose-200 dark:border-rose-900/60 rounded-lg p-4 bg-rose-50/70 dark:bg-rose-950/20">
        <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-2">state 初期化</h3>
        <p className="text-xs text-rose-700/90 dark:text-rose-300/80 mb-3">
          質問・回答・ノート・Task・runtime settings・logs を初期化します。run 実行中なら停止完了を待ってから続行します。
        </p>
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-4 py-2 text-sm bg-rose-600 text-white rounded-md hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RotateCcw size={14} /> {resetting ? '初期化中...' : 'state を初期化'}
        </button>
        {resetNotice && (
          <p
            className={`mt-3 text-xs ${
              resetNotice.type === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-700 dark:text-rose-300'
            }`}
          >
            {resetNotice.text}
          </p>
        )}
      </section>
    </div>
  );
}
