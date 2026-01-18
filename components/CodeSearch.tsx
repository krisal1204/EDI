
import React, { useState, useMemo } from 'react';
import { PROCEDURE_CODES, ICD10_CODES, TAXONOMY_CODES } from '../services/referenceData';

export const CodeSearch: React.FC = () => {
    const [tab, setTab] = useState<'procedures' | 'diagnoses' | 'taxonomy'>('procedures');
    const [search, setSearch] = useState('');

    const data = tab === 'procedures' ? PROCEDURE_CODES : tab === 'diagnoses' ? ICD10_CODES : TAXONOMY_CODES;
    
    const entries = useMemo(() => {
        return Object.entries(data).map(([code, desc]) => ({ code, desc }));
    }, [data]);

    const filtered = useMemo(() => {
        if (!search) return entries;
        const lower = search.toLowerCase();
        return entries.filter(item => 
            item.code.toLowerCase().includes(lower) || 
            item.desc.toLowerCase().includes(lower)
        );
    }, [entries, search]);

    const getPlaceholder = () => {
        if (tab === 'procedures') return 'Search procedures (CPT/HCPCS)...';
        if (tab === 'diagnoses') return 'Search diagnoses (ICD-10)...';
        return 'Search taxonomy codes (NUCC)...';
    };

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-10">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Reference Codes</h1>
                    <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded border border-gray-100 dark:border-slate-700">
                        {filtered.length} results
                    </span>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                     <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
                        <button 
                            onClick={() => setTab('procedures')} 
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${tab === 'procedures' ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                        >
                            Procedures (CPT/HCPCS)
                        </button>
                        <button 
                            onClick={() => setTab('diagnoses')} 
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${tab === 'diagnoses' ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                        >
                            Diagnoses (ICD-10)
                        </button>
                        <button 
                            onClick={() => setTab('taxonomy')} 
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${tab === 'taxonomy' ? 'bg-white dark:bg-slate-700 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                        >
                            Taxonomy (NUCC)
                        </button>
                     </div>
                     
                     <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder={getPlaceholder()}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-black dark:focus:border-slate-500 focus:ring-1 focus:ring-black dark:focus:ring-slate-500 transition-colors"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <svg className="w-5 h-5 text-gray-400 dark:text-slate-500 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {search && (
                            <button 
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-2.5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-gray-50 dark:bg-slate-950 p-6 custom-scrollbar">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
                        <thead className="bg-gray-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-32 border-b border-gray-200 dark:border-slate-800">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider border-b border-gray-200 dark:border-slate-800">Description</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                            {filtered.length > 0 ? (
                                filtered.map((item) => (
                                    <tr key={item.code} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-3 whitespace-nowrap text-sm font-mono font-medium text-blue-600 dark:text-blue-400 align-top">
                                            {item.code}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-700 dark:text-slate-300 align-top leading-relaxed">
                                            {item.desc}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-6 py-16 text-center text-gray-400 dark:text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <svg className="w-8 h-8 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>No codes found matching "{search}"</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
