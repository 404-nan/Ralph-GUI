export function fTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return iso; }
}

export function fDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

export function fRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return 'たった今';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}分前`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}時間前`;
    return `${Math.floor(diff / 86_400_000)}日前`;
  } catch { return iso; }
}

export function lifecycleLabel(lc: string): string {
  return ({
    idle: '待機中',
    starting: '準備中',
    running: '作業中',
    paused: '一時停止',
    pause_requested: '停止待ち',
    completed: '完了',
    aborted: '中断',
    failed: '要確認',
  } as Record<string, string>)[lc] ?? lc;
}

export function lifecycleColor(lc: string): string {
  return ({
    idle: 'bg-slate-400',
    starting: 'bg-blue-500',
    running: 'bg-emerald-500',
    paused: 'bg-amber-500',
    pause_requested: 'bg-amber-500',
    completed: 'bg-emerald-500',
    aborted: 'bg-rose-500',
    failed: 'bg-rose-500',
  } as Record<string, string>)[lc] ?? 'bg-slate-400';
}

export function taskStatusLabel(status: string): string {
  return ({
    active: '進行中',
    queued: '待機中',
    blocked: 'ブロック',
    completed: '完了',
  } as Record<string, string>)[status] ?? status;
}

export function taskStatusColor(status: string): string {
  return ({
    active: 'bg-indigo-500',
    queued: 'bg-slate-400',
    blocked: 'bg-amber-500',
    completed: 'bg-emerald-500',
  } as Record<string, string>)[status] ?? 'bg-slate-400';
}
