import { Play, Pause, RotateCcw, Square, Wifi, WifiOff } from 'lucide-react';
import type { DashboardData } from '../../../src/shared/types.ts';
import { StatusPill } from './StatusPill.tsx';
import { apiClient } from '../api/client.ts';

interface HeaderProps {
  dashboard: DashboardData;
  isConnected: boolean;
  onAction: () => void;
}

export function Header({ dashboard, isConnected, onAction }: HeaderProps) {
  const { status, settings } = dashboard;
  const lc = status.lifecycle;
  const canStart = ['idle', 'completed', 'aborted', 'failed'].includes(lc);
  const canPause = ['starting', 'running'].includes(lc);
  const canResume = lc === 'paused' || lc === 'pause_requested';
  const canAbort = ['starting', 'running', 'paused', 'pause_requested'].includes(lc) || status.phase === 'queued';

  const wrap = (fn: () => Promise<unknown>) => async () => { try { await fn(); onAction(); } catch (e) { console.error(e); } };

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#16171d] flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{settings.taskName || 'Ralph'}</span>
        <span className="text-xs text-slate-400 truncate hidden sm:inline">{settings.agentCwd.split('/').pop()}</span>
        <StatusPill lifecycle={lc} />
        {status.iteration > 0 && (
          <span className="text-xs text-slate-400 font-mono">{status.iteration}/{status.maxIterations}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span title={isConnected ? 'WebSocket 接続中' : 'ポーリング中'} className="text-slate-400">
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
        </span>

        {canStart && (
          <button onClick={wrap(() => apiClient.startRun())} className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5">
            <Play size={13} /> 開始
          </button>
        )}
        {canPause && (
          <button onClick={wrap(() => apiClient.pauseRun())} className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1.5">
            <Pause size={13} /> 一時停止
          </button>
        )}
        {canResume && (
          <button onClick={wrap(() => apiClient.resumeRun())} className="px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center gap-1.5">
            <RotateCcw size={13} /> 再開
          </button>
        )}
        {canAbort && (
          <button onClick={wrap(() => apiClient.abortRun())} className="px-3 py-1.5 text-xs font-medium rounded-md bg-rose-600 text-white hover:bg-rose-700 flex items-center gap-1.5">
            <Square size={13} /> 中断
          </button>
        )}
      </div>
    </header>
  );
}
