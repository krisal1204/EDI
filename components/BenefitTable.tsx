
import React, { useState, useMemo } from 'react';
import { BenefitRow } from '../services/ediMapper';

export const BenefitTable = ({ benefits }: { benefits: BenefitRow[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState('All');
  const [filterService, setFilterService] = useState('All');

  // --- Extract Unique Options for Dropdowns ---
  const uniqueEntities = useMemo(() => Array.from(new Set(benefits.map(b => b.reference))).sort(), [benefits]);
  const uniqueServices = useMemo(() => Array.from(new Set(benefits.map(b => b.service))).sort(), [benefits]);

  // --- Filtering Logic ---
  const filteredBenefits = useMemo(() => {
    return benefits.filter(b => {
      // Text Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        searchTerm === '' ||
        b.service.toLowerCase().includes(searchLower) ||
        b.type.toLowerCase().includes(searchLower) ||
        b.messages.some(m => m.toLowerCase().includes(searchLower)) ||
        b.coverage.toLowerCase().includes(searchLower);

      // Dropdown Filters
      const matchesEntity = filterEntity === 'All' || b.reference === filterEntity;
      // Service filter is tricky with repeats; check includes if "All" is not selected
      const matchesService = filterService === 'All' || b.service.includes(filterService);

      return matchesSearch && matchesEntity && matchesService;
    });
  }, [benefits, searchTerm, filterEntity, filterService]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterEntity('All');
    setFilterService('All');
  };

  if (!benefits || benefits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900 m-4 border border-gray-100 dark:border-slate-800 rounded">
         <p className="text-sm">No benefit information found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative">
      
      {/* --- Filter Bar --- */}
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex flex-wrap gap-2 items-center">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[150px]">
           <input
             type="text"
             className="block w-full pl-3 pr-3 py-1.5 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-sm text-sm placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-slate-500 focus:bg-white dark:focus:bg-slate-800 transition-colors"
             placeholder="Search..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        {/* Entity Filter */}
        <select 
          value={filterEntity} 
          onChange={(e) => setFilterEntity(e.target.value)}
          className="block w-32 py-1.5 pl-2 pr-6 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-sm text-sm focus:outline-none focus:border-gray-400 dark:focus:border-slate-500"
        >
           <option value="All">All Entities</option>
           {uniqueEntities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>

        {/* Reset */}
        {(searchTerm || filterEntity !== 'All' || filterService !== 'All') && (
            <button 
                onClick={clearFilters}
                className="text-xs text-gray-500 dark:text-slate-400 hover:text-black dark:hover:text-white font-medium px-2"
            >
                ✕
            </button>
        )}
      </div>

      {/* --- Table Area --- */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 relative custom-scrollbar">
        <div className="absolute inset-0">
            <table className="min-w-full text-left text-xs divide-y divide-gray-100 dark:divide-slate-800">
                <thead className="bg-white dark:bg-slate-900 sticky top-0 z-10">
                <tr>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 w-24">Entity</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 w-32">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">Service</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 w-32">Coverage</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-right">Limit/Copay</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">Info</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredBenefits.length > 0 ? (
                    filteredBenefits.map((b, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap align-top text-gray-500 dark:text-slate-400">
                            {b.reference}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-slate-200 align-top font-medium">{b.type}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400 align-top text-xs leading-relaxed min-w-[200px]">
                            {b.service}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400 align-top">{b.coverage}</td>
                        
                        <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-slate-300 align-top">
                            <div className="flex flex-col items-end">
                                {b.amount && <span className="font-semibold">${b.amount}</span>}
                                {b.percent && <span className="font-semibold">{(parseFloat(b.percent) * 100).toFixed(0)}%</span>}
                                {b.quantity && <span className="text-[10px] text-gray-500 dark:text-slate-500">{b.quantity} {b.quantityQualifier}</span>}
                                {!b.amount && !b.percent && !b.quantity && <span className="text-gray-300 dark:text-slate-600">-</span>}
                            </div>
                        </td>

                        <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-[11px] align-top">
                             {b.dates.map((d, idx) => (
                                 <div key={idx} className="whitespace-nowrap text-gray-400 dark:text-slate-500">
                                    {d}
                                 </div>
                             ))}
                             {b.messages.length > 0 && (
                                 <div className="mt-1 text-gray-500 dark:text-slate-400 italic">
                                     {b.messages.join(' ')}
                                 </div>
                             )}
                             {b.network && b.network !== 'Unknown' && (
                                 <div className="mt-1">
                                     {b.network === 'Yes' ? <span className="text-gray-900 dark:text-slate-200 font-medium">In Network</span> : <span className="text-gray-900 dark:text-slate-200 font-medium">Out of Network</span>}
                                 </div>
                             )}
                        </td>
                    </tr>
                ))
                ) : (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                            No results match
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
