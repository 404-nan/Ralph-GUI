import { useState } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { Header } from './Header.tsx';
import { TaskWorkspace } from './TaskWorkspace.tsx';
import { SpecImport } from './SpecImport.tsx';
import { Composer } from './Composer.tsx';
import { ToastContainer } from './Toast.tsx';
import { useDashboard } from '../hooks/useDashboard.ts';
import { useToast } from '../hooks/useToast.ts';

export function AppShell() {
  const { data: dashboard, refresh, isConnected } = useDashboard();
  const { toasts, removeToast } = useToast();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-[#0f1015]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">ダッシュボードを読み込み中...</p>
        </div>
      </div>
    );
  }

  const validTaskIds = new Set(dashboard.taskBoard.map(t => t.id));
  const effectiveTaskId = activeTaskId && validTaskIds.has(activeTaskId) ? activeTaskId : (dashboard.currentTask?.id || null);
  const activeTask = dashboard.taskBoard.find(t => t.id === effectiveTaskId);

  const hasNoTasks = dashboard.taskBoard.length === 0;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-[#0f1015]">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        tasks={dashboard.taskBoard}
        activeTaskId={effectiveTaskId}
        onSelectTask={setActiveTaskId}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header dashboard={dashboard} isConnected={isConnected} onAction={refresh} />

        {hasNoTasks ? (
          <SpecImport onImportSuccess={refresh} />
        ) : (
          <>
            <TaskWorkspace dashboard={dashboard} activeTask={activeTask} onAction={refresh} />
            <Composer pendingDecisions={dashboard.pendingDecisions} onAction={refresh} />
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
