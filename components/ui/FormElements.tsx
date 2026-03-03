
import React, { useState } from 'react';

export const InputField = ({ label, value, onChange, onFocus, type = 'text', className = '', placeholder, id }: { label: string, value: string, onChange: (val: string) => void, onFocus?: () => void, type?: string, className?: string, placeholder?: string, id?: string }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide" htmlFor={id}>{label}</label>
    <input
      id={id}
      type={type}
      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-500 focus:ring-1 focus:ring-black dark:focus:ring-brand-500 transition-colors"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onFocus={onFocus}
      placeholder={placeholder}
    />
  </div>
);

export const SelectField = ({ label, value, onChange, onFocus, options, className = '', id }: { label: string, value: string, onChange: (val: string) => void, onFocus?: () => void, options: {value: string, label: string}[], className?: string, id?: string }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide" htmlFor={id}>{label}</label>
    <div className="relative">
      <select
        id={id}
        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-500 focus:ring-1 focus:ring-black dark:focus:ring-brand-500 transition-colors appearance-none cursor-pointer"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
      >
          {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-slate-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

export const MultiSelectField = ({ label, values = [], onChange, options, id, onFocus, align = 'left' }: { label: string, values: string[], onChange: (vals: string[]) => void, options: Record<string, string>, id?: string, onFocus?: () => void, align?: 'left' | 'right' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const handleAdd = (val: string) => {
        if (!values.includes(val)) {
            onChange([...values, val]);
        }
        setSearchTerm('');
    };

    const handleRemove = (val: string) => {
        onChange(values.filter((v: string) => v !== val));
    };

    const filteredOptions = Object.entries(options).filter(([code, desc]) => 
        code.toLowerCase().includes(searchTerm.toLowerCase()) || 
        desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide" htmlFor={id}>{label}</label>
            
            <div className="flex flex-wrap gap-2 mb-2">
                {values.map((val: string) => (
                    <span key={val} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800">
                        <span className="font-bold">{val}</span>
                        <span className="opacity-75 max-w-[150px] truncate hidden sm:inline">- {options[val] || ''}</span>
                        <button 
                            onClick={(e) => { e.preventDefault(); handleRemove(val); }} 
                            className="ml-1 hover:text-brand-900 dark:hover:text-brand-100 font-bold"
                        >
                            ×
                        </button>
                    </span>
                ))}
            </div>

            <div className="relative">
                <div className="relative">
                    <input
                        id={id}
                        type="text"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-500 focus:ring-1 focus:ring-black dark:focus:ring-brand-500 transition-colors placeholder-gray-400"
                        value={searchTerm}
                        onChange={e => {
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => {
                            setIsOpen(true);
                            if (onFocus) onFocus();
                        }}
                        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                        placeholder="+ Add Service Type..."
                        autoComplete="off"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-slate-400">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
                
                {isOpen && (
                    <div className={`absolute z-50 ${align === 'right' ? 'right-0' : 'left-0'} min-w-full w-[90vw] sm:w-[400px] mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-md max-h-80 overflow-y-auto`}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(([code, desc]) => {
                                const isSelected = values.includes(code);
                                return (
                                    <div 
                                        key={code} 
                                        className={`px-4 py-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0 ${isSelected ? 'bg-gray-50 dark:bg-slate-700/50 opacity-50 cursor-default' : 'hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer'}`}
                                        onClick={() => !isSelected && handleAdd(code)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{code}</span>
                                            <span className="text-xs text-gray-600 dark:text-slate-300 whitespace-normal leading-tight">{desc}</span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-3 py-4 text-center text-xs text-gray-500 dark:text-slate-400">
                                No matching service types found
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export const AutocompleteField = ({ label, value, onChange, onFocus, options, placeholder, id }: { label: string, value: string, onChange: (val: string) => void, onFocus?: () => void, options: Record<string, string>, placeholder?: string, id?: string }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const safeValue = value || '';
    const filtered = Object.entries(options)
        .filter(([code, desc]) => 
            code.toLowerCase().includes(safeValue.toLowerCase()) || 
            desc.toLowerCase().includes(safeValue.toLowerCase())
        )
        .slice(0, 8);

    return (
        <div className="mb-4 relative">
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide" htmlFor={id}>{label}</label>
            <input
                id={id}
                type="text"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-500 focus:ring-1 focus:ring-black dark:focus:ring-brand-500 transition-colors"
                value={safeValue}
                placeholder={placeholder}
                onChange={e => {
                    onChange(e.target.value);
                    setShowSuggestions(true);
                }}
                onFocus={() => {
                    if (onFocus) onFocus();
                    setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                autoComplete="off"
            />
            {showSuggestions && safeValue && filtered.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-md max-h-48 overflow-y-auto">
                    {filtered.map(([code, desc]) => (
                        <div 
                            key={code} 
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-50 dark:border-slate-700/50 last:border-0"
                            onClick={() => {
                                onChange(code);
                                setShowSuggestions(false);
                            }}
                        >
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs font-bold text-gray-900 dark:text-white mr-2">{code}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{desc}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const SectionHeader = ({ title, action }: { title: string, action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mt-6 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
        {title}
      </h3>
      {action}
  </div>
);

// Shared Options
export const GENDER_OPTIONS = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'U', label: 'Unknown' }
];
