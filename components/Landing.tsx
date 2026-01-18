
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onEnter?: (industry: 'healthcare' | 'manufacturing') => void;
  onContact?: () => void;
  onLearn?: () => void;
  onCodes?: () => void;
}

export const Landing: React.FC<Props> = ({ onEnter, onContact, onLearn, onCodes }) => {
  const navigate = useNavigate();

  const handleEnter = (industry: 'healthcare' | 'manufacturing') => {
      navigate('/editor', { state: { industry } });
  };

  const handleCodes = () => {
      navigate('/editor', { state: { viewMode: 'reference' } });
  };

  const handleGuide = () => {
      navigate('/guide');
  };

  const handleContact = () => {
      navigate('/editor', { state: { viewMode: 'contact' } });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-950 p-6 text-center animate-fade-in">
        <div className="mb-12">
            <div className="w-16 h-16 bg-black dark:bg-brand-500 rounded-lg flex items-center justify-center shadow-lg mx-auto mb-6">
                <span className="text-white font-mono font-bold text-2xl">X12</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                EDI Insight
            </h1>
            
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed mb-10 font-light mx-auto">
                The minimalist, privacy-focused X12 inspector. <br/>
                Parse, validate, and generate EDI transactions entirely in your browser.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <button 
                    onClick={() => handleEnter('healthcare')}
                    className="group relative flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl transition-all duration-200 w-64 hover:shadow-xl hover:-translate-y-1"
                >
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Healthcare</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 mt-2">Claims, Eligibility, Enrollment</span>
                </button>

                <button 
                    onClick={() => handleEnter('manufacturing')}
                    className="group relative flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 rounded-2xl transition-all duration-200 w-64 hover:shadow-xl hover:-translate-y-1"
                >
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 mb-4 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">Supply Chain</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400 mt-2">Orders, Invoices, Shipments</span>
                </button>
            </div>
            
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-500 dark:text-slate-400">
                <button 
                    onClick={handleGuide}
                    className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <span className="w-6 h-6 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px]">📖</span>
                    Read the Guide
                </button>
                <button 
                    onClick={handleCodes}
                    className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <span className="w-6 h-6 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px]">🔍</span>
                    Browse Code Library
                </button>
            </div>
        </div>

        <footer className="mt-auto py-6 text-xs text-gray-400 dark:text-slate-600 flex items-center justify-center gap-4">
            <span>&copy; {new Date().getFullYear()} EDI Insight. Privacy First.</span>
            <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full"></span>
            <button onClick={handleContact} className="hover:text-gray-600 dark:hover:text-slate-400 hover:underline transition-colors">
                Contact Developer
            </button>
        </footer>
    </div>
  );
};
