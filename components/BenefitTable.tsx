
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BenefitRow } from '../services/ediMapper';

const FilterDropdown = ({ 
    label, 
    options, 
    selected, 
    onChange 
}: { 
    label: string, 
    options: string[], 
    selected: string[], 
    onChange: (vals: string[]) => void 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(s => s !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    selected.length > 0 
                        ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300' 
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
            >
                <span>{label}</span>
                {selected.length > 0 && (
                    <span className="flex items-center justify-center w-4 h-4 text-[9px] bg-brand-500 text-white rounded-full">
                        {selected.length}
                    </span>
                )}
                <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto custom-scrollbar">
                    <div className="p-2 space-y-1">
                        {options.length === 0 ? (
                            <div className="px-2 py-1 text-xs text-gray-400 italic">No options</div>
                        ) : (
                            options.map(opt => (
                                <label key={opt} className="flex items-start gap-2 px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-700 rounded cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={selected.includes(opt)}
                                        onChange={() => toggleOption(opt)}
                                        className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <span className="text-xs text-gray-700 dark:text-slate-300 break-words leading-tight">{opt}</span>
                                </label>
                            ))
                        )}
                    </div>
                    {selected.length > 0 && (
                        <div className="p-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                            <button 
                                onClick={() => onChange([])}
                                className="w-full text-xs text-center text-gray-500 hover:text-gray-900 dark:hover:text-slate-200"
                            >
                                Clear Selection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const BenefitTable = ({ benefits }: { benefits: BenefitRow[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Multi-select states
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCoverages, setSelectedCoverages] = useState<string[]>([]);

  // --- Extract Unique Options ---
  const uniqueEntities = useMemo(() => Array.from(new Set(benefits.map(b => b.reference || 'Unknown'))).sort(), [benefits]);
  const uniqueTypes = useMemo(() => Array.from(new Set(benefits.map(b => b.type || 'Unknown'))).sort(), [benefits]);
  const uniqueServices = useMemo(() => Array.from(new Set(benefits.map(b => b.service || 'Unknown'))).sort(), [benefits]);
  const uniqueCoverages = useMemo(() => Array.from(new Set(benefits.map(b => b.coverage || 'Unknown'))).sort(), [benefits]);

  // --- Filtering Logic ---
  const filteredBenefits = useMemo(() => {
    return benefits.filter(b => {
      // Text Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        searchTerm === '' ||
        (b.service && b.service.toLowerCase().includes(searchLower)) ||
        (b.type && b.type.toLowerCase().includes(searchLower)) ||
        (b.messages && b.messages.some(m => m.toLowerCase().includes(searchLower))) ||
        (b.coverage && b.coverage.toLowerCase().includes(searchLower));

      // Multi-select Filters
      const matchesEntity = selectedEntities.length === 0 || selectedEntities.includes(b.reference || 'Unknown');
      const matchesType = selectedTypes.length === 0 || selectedTypes.includes(b.type || 'Unknown');
      const matchesService = selectedServices.length === 0 || selectedServices.includes(b.service || 'Unknown');
      const matchesCoverage = selectedCoverages.length === 0 || selectedCoverages.includes(b.coverage || 'Unknown');

      return matchesSearch && matchesEntity && matchesType && matchesService && matchesCoverage;
    });
  }, [benefits, searchTerm, selectedEntities, selectedTypes, selectedServices, selectedCoverages]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedEntities([]);
    setSelectedTypes([]);
    setSelectedServices([]);
    setSelectedCoverages([]);
  };

  const hasActiveFilters = searchTerm || selectedEntities.length > 0 || selectedTypes.length > 0 || selectedServices.length > 0 || selectedCoverages.length > 0;

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
      <div className="p-3 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex flex-wrap gap-2 items-center z-20 relative">
        
        {/* Search */}
        <div className="relative w-48">
           <input
             type="text"
             className="block w-full pl-3 pr-8 py-1.5 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-md text-xs placeholder-gray-400 dark:placeholder-slate-500 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 dark:focus:border-brand-500 transition-colors"
             placeholder="Search..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
           {searchTerm && (
               <button 
                   onClick={() => setSearchTerm('')}
                   className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
               >
                   ×
               </button>
           )}
        </div>

        <div className="h-4 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>

        <FilterDropdown label="Entity" options={uniqueEntities} selected={selectedEntities} onChange={setSelectedEntities} />
        <FilterDropdown label="Type" options={uniqueTypes} selected={selectedTypes} onChange={setSelectedTypes} />
        <FilterDropdown label="Service" options={uniqueServices} selected={selectedServices} onChange={setSelectedServices} />
        <FilterDropdown label="Coverage" options={uniqueCoverages} selected={selectedCoverages} onChange={setSelectedCoverages} />

        {/* Reset */}
        {hasActiveFilters && (
            <button 
                onClick={clearFilters}
                className="ml-auto text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
                Clear Filters
            </button>
        )}
      </div>

      {/* --- Table Area --- */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 relative custom-scrollbar">
        <div className="absolute inset-0">
            <table className="min-w-full text-left text-xs divide-y divide-gray-100 dark:divide-slate-800">
                <thead className="bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 min-w-[120px]">Entity</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 min-w-[200px]">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 min-w-[200px]">Service</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 min-w-[150px]">Coverage</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-right min-w-[100px]">Limit/Copay</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 min-w-[200px]">Info</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredBenefits.length > 0 ? (
                    filteredBenefits.map((b, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-4 py-3 whitespace-nowrap align-top text-gray-500 dark:text-slate-400 font-medium">
                            {b.reference}
                        </td>
                        <td className="px-4 py-3 text-gray-900 dark:text-slate-200 align-top font-medium">{b.type}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400 align-top text-xs leading-relaxed min-w-[200px]">
                            {b.service}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-400 align-top">{b.coverage}</td>
                        
                        <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-slate-300 align-top">
                            <div className="flex flex-col items-end">
                                {b.amount && <span className="font-semibold text-brand-600 dark:text-brand-400">${b.amount}</span>}
                                {b.percent && <span className="font-semibold text-brand-600 dark:text-brand-400">{(parseFloat(b.percent) * 100).toFixed(0)}%</span>}
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
                                     {b.network === 'Yes' ? <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">In Network</span> : <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Out of Network</span>}
                                 </div>
                             )}
                             {b.contacts && b.contacts.length > 0 && (
                                 <div className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                                     {b.contacts.map((c, idx) => (
                                         <div key={idx} className="text-brand-600 dark:text-brand-400 font-medium">
                                             📞 {c}
                                         </div>
                                     ))}
                                 </div>
                             )}
                        </td>
                    </tr>
                ))
                ) : (
                    <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-slate-500">
                            <div className="flex flex-col items-center gap-2">
                                <svg className="w-8 h-8 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                <span>No results match your filters</span>
                                <button onClick={clearFilters} className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium text-xs mt-1">Clear all filters</button>
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
