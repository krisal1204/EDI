import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface DatePickerProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    className?: string;
    placeholder?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, onFocus, className = '', placeholder = 'YYYY-MM-DD' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    
    // Parse value YYYY-MM-DD safely
    const parseDate = (val: string) => {
        if(!val) return new Date();
        const [y, m, d] = val.split('-').map(Number);
        if(!y || !m || !d) return new Date();
        return new Date(y, m - 1, d);
    };

    const [viewDate, setViewDate] = useState(parseDate(value));

    // Update viewDate when reopening or value changes
    useEffect(() => {
        if (isOpen) {
             const d = parseDate(value);
             // If invalid date, default to today
             setViewDate(isNaN(d.getTime()) ? new Date() : d);
             
             // Calculate position
             if (containerRef.current) {
                 const rect = containerRef.current.getBoundingClientRect();
                 const windowHeight = window.innerHeight;
                 
                 // Default to bottom
                 let top = rect.bottom + 5;
                 let left = rect.left;
                 
                 // Flip to top if not enough space
                 if (top + 320 > windowHeight) {
                     top = rect.top - 310;
                 }
                 
                 setCoords({ top, left });
             }
        }
    }, [isOpen, value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
             const calendarEl = document.getElementById('datepicker-popup');
             if (containerRef.current && !containerRef.current.contains(event.target as Node) && 
                 calendarEl && !calendarEl.contains(event.target as Node)) {
                 setIsOpen(false);
             }
        };
        if (isOpen) {
             document.addEventListener('mousedown', handleClickOutside);
             // Close on scroll to avoid floating issues since we use fixed positioning
             document.addEventListener('scroll', () => setIsOpen(false), true); 
        }
        return () => {
             document.removeEventListener('mousedown', handleClickOutside);
             document.removeEventListener('scroll', () => setIsOpen(false), true);
        };
    }, [isOpen]);

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const handleDayClick = (day: number) => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth() + 1;
        const formatted = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        onChange(formatted);
        setIsOpen(false);
    };

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYear = new Date().getFullYear();
    // Range: 1920 to 2030 roughly
    const years = Array.from({length: 110}, (_, i) => currentYear - 90 + i); 

    const Calendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const days = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        
        const grid = [];
        for (let i = 0; i < startDay; i++) {
            grid.push(<div key={`empty-${i}`} />);
        }
        for (let d = 1; d <= days; d++) {
            const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            const isSelected = value === dateStr;
            const isToday = new Date().toDateString() === new Date(year, month, d).toDateString();
            grid.push(
                <button
                    key={d}
                    onClick={() => handleDayClick(d)}
                    className={`h-8 w-8 rounded-full text-xs flex items-center justify-center transition-colors
                        ${isSelected ? 'bg-black dark:bg-brand-500 text-white font-bold' : 
                          isToday ? 'bg-gray-100 dark:bg-slate-700 text-brand-600 dark:text-brand-400 font-bold' : 
                          'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200'}
                    `}
                >
                    {d}
                </button>
            );
        }

        return createPortal(
            <div 
                id="datepicker-popup"
                className="fixed z-[9999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl w-72 p-4 select-none animate-fade-in-up"
                style={{ top: coords.top, left: coords.left }}
            >
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-500 dark:text-slate-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{monthNames[month]}</span>
                        <select 
                            value={year} 
                            onChange={(e) => setViewDate(new Date(parseInt(e.target.value), month, 1))}
                            className="bg-transparent text-sm font-medium text-gray-500 dark:text-slate-400 focus:outline-none cursor-pointer appearance-none text-right hover:text-black dark:hover:text-white transition-colors"
                        >
                            {years.map(y => <option key={y} value={y} className="text-black">{y}</option>)}
                        </select>
                    </div>
                    <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-500 dark:text-slate-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {grid}
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className={`mb-4 ${className}`} ref={containerRef}>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
            <div className="relative group">
                <input
                    type="text"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-500 focus:ring-1 focus:ring-black dark:focus:ring-brand-500 transition-colors cursor-pointer"
                    value={value}
                    placeholder={placeholder}
                    readOnly
                    onClick={() => {
                        setIsOpen(!isOpen);
                        if(onFocus && !isOpen) onFocus();
                    }}
                />
                 <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none group-hover:text-brand-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                {isOpen && <Calendar />}
            </div>
        </div>
    );
};