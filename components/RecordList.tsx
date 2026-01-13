
import React from 'react';
import { EdiRecord } from '../services/recordService';

interface RecordListProps {
  records: EdiRecord[];
  selectedId: string | null;
  onSelect: (record: EdiRecord) => void;
  onResetAll: () => void;
  onResetRecord: (index: number) => void;
  isModified: boolean;
}

export const RecordList: React.FC<RecordListProps> = ({ 
    records, 
    selectedId, 
    onSelect, 
    onResetAll, 
    onResetRecord, 
    isModified 
}) => {
  if (records.length <= 1) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 w-64">
      <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
         <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
            Records ({records.length})
         </h3>
         {isModified && (
             <button 
                onClick={onResetAll}
                className="text-[10px] px-2 py-1 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 text-yellow-700 dark:text-yellow-400 rounded transition-colors font-medium border border-yellow-200 dark:border-yellow-800/50"
             >
                Reset All
             </button>
         )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
        {records.map((rec, index) => (
            <div 
                key={rec.id}
                className={`relative group w-full text-left rounded-md text-sm transition-all border ${
                    selectedId === rec.id
                        ? 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 font-medium shadow-sm'
                        : 'border-transparent text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
            >
                <button
                    onClick={() => onSelect(rec)}
                    className="w-full pl-3 pr-8 py-2.5 text-left focus:outline-none"
                >
                    <div className="flex justify-between items-center mb-0.5">
                        <span className="font-semibold truncate pr-2">{rec.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${selectedId === rec.id ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                            {rec.type}
                        </span>
                    </div>
                    {rec.value && (
                        <div className={`text-xs font-mono ${selectedId === rec.id ? 'text-blue-600/80 dark:text-blue-400/80' : 'text-gray-500 dark:text-slate-500'}`}>
                            {rec.value}
                        </div>
                    )}
                </button>
                
                {/* Individual Reset Button - Visible on Group Hover */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onResetRecord(index);
                    }}
                    className={`absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200
                        ${selectedId === rec.id ? 'hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-500 dark:text-blue-300' : 'hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-500'}
                    `}
                    title="Reset this record"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};
