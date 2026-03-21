import { useState } from 'react';
import { UploadCloud, ArrowLeft } from 'lucide-react';
import { apiClient } from '../api/client.ts';

interface SpecImportProps {
  onImportSuccess: () => void;
  onClose?: () => void;
  embedded?: boolean;
}

export function SpecImport({ onImportSuccess, onClose, embedded }: SpecImportProps) {
  const [text, setText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    if (!text.trim()) return;
    setIsImporting(true);
    setError('');
    try {
      await apiClient.importTasksFromSpec(text);
      onImportSuccess();
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'インポートに失敗しました');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={embedded ? '' : 'flex-1 flex items-center justify-center p-6 bg-slate-50 dark:bg-[#0f1015]'}>
      <div className={`bg-white dark:bg-[#16171d] rounded-xl p-6 ${embedded ? 'w-full' : 'max-w-2xl w-full border border-slate-200 dark:border-[#2e303a] shadow-sm'}`}>
        {onClose && (
          <button onClick={onClose} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-4">
            <ArrowLeft size={14} /> 戻る
          </button>
        )}
        <div className="text-center mb-5">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/10 rounded-lg flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400">
            <UploadCloud size={20} />
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">仕様書からTask を一括作成</h2>
          <p className="text-slate-500 text-xs">仕様書やプロンプトを貼り付けると、Task を自動的に抽出します。</p>
        </div>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="仕様書の内容をここに貼り付けてください..."
          className="w-full h-48 p-3 rounded-lg border border-slate-200 dark:border-[#2e303a] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-slate-50 dark:bg-[#1a1b22] text-sm text-slate-800 dark:text-slate-200 resize-none mb-3 font-mono"
        />

        {error && <p className="text-xs text-rose-500 mb-3">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            disabled={!text.trim() || isImporting}
            onClick={handleImport}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2"
          >
            {isImporting ? 'インポート中...' : 'Task を生成'}
          </button>
        </div>
      </div>
    </div>
  );
}
