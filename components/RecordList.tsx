
import React from 'react';
import { EdiRecord } from '../services/recordService';

interface RecordListProps {
  records: EdiRecord[];
  selectedId: string | null;
  onSelect: (record: EdiRecord) => void;
}

export const RecordList: React.FC<RecordListProps> = ({ records, selectedId, onSelect }) => {
  if (records.length <= 1) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 w-64">
      <div className="p-4 border-b border-gray-100 dark:border-slate-800">
         <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            Records ({records.length})
         </h3>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {records.map((rec) => (
            <button
                key={rec.id}
                onClick={() => onSelect(rec)}
                className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-all border ${
                    selectedId === rec.id
                        ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
            >
                <div className="flex justify-between items-center mb-0.5">
                    <span className="font-semibold truncate pr-2">{rec.label}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">
                        {rec.type}
                    </span>
                </div>
                {rec.value && (
                    <div className="text-xs text-gray-500 dark:text-slate-500 font-mono">
                        {rec.value}
                    </div>
                )}
            </button>
        ))}
      </div>
    </div>
  );
};
