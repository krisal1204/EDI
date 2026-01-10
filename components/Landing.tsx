import React from 'react';

interface Props {
  onEnter: () => void;
  onContact: () => void;
}

export const Landing: React.FC<Props> = ({ onEnter, onContact }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-950 p-6 text-center animate-fade-in">
        <div className="mb-8">
            <div className="w-16 h-16 bg-black dark:bg-brand-500 rounded-lg flex items-center justify-center shadow-lg mx-auto mb-6">
                <span className="text-white font-mono font-bold text-2xl">X12</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                EDI Insight
            </h1>
            
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed mb-10 font-light">
                The minimalist, privacy-focused X12 inspector. <br/>
                Parse, validate, and generate healthcare EDI transactions entirely in your browser.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-12">
                {['834 Enrollment', '270/271 Eligibility', '837 Claims', '276/277 Status'].map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-xs font-medium uppercase tracking-wider">
                        {tag}
                    </span>
                ))}
            </div>

            <button 
                onClick={onEnter}
                className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-semibold text-white transition-all duration-200 bg-black dark:bg-brand-600 rounded-full hover:bg-gray-800 dark:hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black dark:focus:ring-brand-500 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
                Get Started
                <svg className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl text-left">
             <div className="p-6 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4 text-brand-500 dark:text-brand-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instant Parsing</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                    Drop raw X12 files to instantly visualize hierarchical structures, definitions, and values without sending data to any server.
                </p>
             </div>
             
             <div className="p-6 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4 text-brand-500 dark:text-brand-400">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Generative Lab</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                    Create valid 270/276/837/834 test files with a simple form interface. Perfect for testing APIs and clearinghouses.
                </p>
             </div>
             
             <div className="p-6 rounded-2xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4 text-brand-500 dark:text-brand-400">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Local AI Assistant</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                    Connect to your local Ollama instance to analyze files, explain codes, and debug errors privately.
                </p>
             </div>
        </div>
        
        <footer className="mt-20 text-xs text-gray-400 dark:text-slate-600 flex items-center gap-4">
            <span>&copy; {new Date().getFullYear()} EDI Insight. Privacy First.</span>
            <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full"></span>
            <button onClick={onContact} className="hover:text-gray-600 dark:hover:text-slate-400 hover:underline transition-colors">
                Contact Developer
            </button>
        </footer>
    </div>
  );
};