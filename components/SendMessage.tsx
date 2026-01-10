import React, { useState } from 'react';

export const SendMessage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const username = 'Ok_Working9906';
    const subjectParam = encodeURIComponent(subject);
    const messageParam = encodeURIComponent(message);
    const redditUrl = `https://www.reddit.com/message/compose/?to=${username}&subject=${subjectParam}&message=${messageParam}`;
    
    window.open(redditUrl, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-y-auto custom-scrollbar">
      <div className="p-6 border-b border-gray-100 dark:border-slate-800">
         <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">Contact Developer</h1>
         <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Send a direct message to u/Ok_Working9906 on Reddit.</p>
      </div>
      
      <div className="p-6 max-w-2xl mx-auto w-full">
        <div className="bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700 rounded-lg p-8 shadow-sm">
            
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Subject</label>
                <input 
                    type="text" 
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    placeholder="Feedback regarding EDI Insight"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />
            </div>

            <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Message</label>
                <textarea 
                    className="w-full h-40 px-4 py-3 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                ></textarea>
            </div>

            <button 
                onClick={handleSend}
                disabled={!subject || !message}
                className="w-full flex items-center justify-center gap-2 bg-[#FF4500] hover:bg-[#ff571a] text-white py-3 rounded-md font-bold transition-transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
                Send via Reddit
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-slate-500 mt-4">
                This will open a new tab to reddit.com with the message pre-filled. You will need to be logged in.
            </p>
        </div>
      </div>
    </div>
  );
};