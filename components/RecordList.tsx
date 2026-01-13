
import React from 'react';
import { EdiRecord } from '../services/recordService';

interface RecordListProps {
  records: EdiRecord[];
  selectedId: string | null;
  onSelect: (record: EdiRecord) => void;
  onResetAll: () => void;
  onResetRecord: (index: number) => void;
  onAddRecord?: () => void;
  onDeleteRecord?: (index: number) => void;
  isModified: boolean;
}

export const RecordList: React.FC<RecordListProps> = ({ 
    records, 
    selectedId, 
    onSelect, 
    onResetAll, 
    onResetRecord,
    onAddRecord,
    onDeleteRecord,
    isModified 
}) => {
  if (records.length === 0) return null;

  const handleResetAllWrapper = () => {
      if (window.confirm("Are you sure you want to reset ALL records to their original state? This cannot be undone.")) {
          onResetAll();
      }
  };

  const handleResetRecordWrapper = (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      if (window.confirm("Revert this record's changes?")) {
          onResetRecord(index);
      }
  };

  const handleDeleteRecordWrapper = (e: React.MouseEvent, index: number) => {
      e.stopPropagation();
      if (records.length <= 1) {
          alert("Cannot delete the only record.");
          return;
      }
      if (window.confirm("Are you sure you want to delete this record?")) {
          if (onDeleteRecord) onDeleteRecord(index);
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 w-64">
      <div className="p-4 border-b border-gray-100 dark:border-slate-800">
         <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                Records ({records.length})
            </h3>
            {isModified && (
                <button 
                    onClick={handleResetAllWrapper}
                    className="text-[10px] px-2 py-1 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:hover:bg-yellow-900/60 text-yellow-700 dark:text-yellow-400 rounded transition-colors font-medium border border-yellow-200 dark:border-yellow-800/50"
                    title="Revert all changes to the original file"
                >
                    Reset All
                </button>
            )}
         </div>
         {onAddRecord && (
             <button 
                onClick={onAddRecord}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs font-medium text-gray-700 dark:text-slate-300 hover:border-brand-500 dark:hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 transition-all shadow-sm"
             >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Add New Record
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
                    className="w-full pl-3 pr-16 py-2.5 text-left focus:outline-none"
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
                
                {/* Action Buttons - Visible on Group Hover */}
                <div className={`absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${selectedId === rec.id ? 'opacity-100' : ''}`}>
                    <button
                        onClick={(e) => handleResetRecordWrapper(e, index)}
                        className={`p-1 rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-900/50 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400`}
                        title="Reset this record"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    {onDeleteRecord && records.length > 1 && (
                        <button
                            onClick={(e) => handleDeleteRecordWrapper(e, index)}
                            className={`p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-400 hover:text-red-600 dark:hover:text-red-400`}
                            title="Delete this record"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
