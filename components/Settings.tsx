import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export const Settings: React.FC = () => {
  const { theme, toggleTheme, ollamaHost, ollamaModel, setOllamaConfig } = useAppStore();
  
  const [host, setHost] = useState(ollamaHost);
  const [model, setModel] = useState(ollamaModel);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHost(ollamaHost);
    setModel(ollamaModel);
  }, [ollamaHost, ollamaModel]);

  const handleSave = () => {
    setOllamaConfig(host, model);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-gray-100 dark:border-slate-800">
         <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Configuration</h1>
         <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Manage application appearance and AI connections.</p>
      </div>
      
      <div className="p-6 max-w-2xl space-y-8">
        
        {/* Appearance Section */}
        <section>
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-200 uppercase tracking-wider mb-4">Appearance</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700 rounded-lg">
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500' : 'bg-yellow-400 text-white'}`}>
                 {theme === 'dark' ? (
                   <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                   </svg>
                 ) : (
                   <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                   </svg>
                 )}
               </div>
               <div>
                 <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                 <p className="text-xs text-gray-500 dark:text-slate-400">Switch between light and dark themes</p>
               </div>
             </div>
             
             <button 
               onClick={toggleTheme}
               className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${theme === 'dark' ? 'bg-brand-600' : 'bg-gray-200'}`}
             >
               <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
             </button>
          </div>
        </section>

        {/* AI Configuration Section */}
        <section>
           <h2 className="text-sm font-bold text-gray-900 dark:text-slate-200 uppercase tracking-wider mb-4">Local AI (Ollama)</h2>
           <div className="bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700 rounded-lg p-6 space-y-6">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Host URL</label>
                <input 
                  type="text" 
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">The address where your Ollama instance is running.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Model Name</label>
                <input 
                  type="text" 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="qwen3:8b"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white dark:bg-slate-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-600"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-500">Ensure this model is pulled in Ollama (<code>ollama pull {model || 'modelname'}</code>).</p>
              </div>

              <div className="pt-2 flex items-center justify-end">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-black dark:bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-brand-500 transition-colors text-sm font-medium shadow-sm"
                  >
                    {saved ? (
                        <>
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                           Saved
                        </>
                    ) : (
                        "Save Configuration"
                    )}
                  </button>
              </div>
           </div>
        </section>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs leading-relaxed">
           <strong>Privacy Note:</strong> All processing happens locally or via your configured Ollama instance. No data is sent to external cloud servers.
        </div>

      </div>
    </div>
  );
};