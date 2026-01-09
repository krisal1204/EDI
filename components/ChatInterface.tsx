import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { askEdiQuestion } from '../services/geminiService';
import { ChatMessage } from '../types';

interface Props {
  rawEdi: string;
}

export const ChatInterface: React.FC<Props> = ({ rawEdi }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  const initialMessage: ChatMessage = {
      id: '1',
      role: 'model',
      text: 'Hello! I am connected to your local Ollama instance. I have context of the loaded EDI file. Ask me about coverage, dates, or errors.',
      timestamp: new Date()
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !rawEdi) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Convert internal message format to history format expected by service
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await askEdiQuestion(input, rawEdi, history);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "I couldn't generate a response.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages([initialMessage]);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-brand-600 hover:bg-brand-500 text-white rounded-full p-4 shadow-lg shadow-brand-600/30 transition-transform hover:scale-105 z-50 flex items-center gap-2 font-medium"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        <span>Ask Local AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col border border-gray-200 dark:border-slate-700 z-50 overflow-hidden animate-fade-in-up transition-colors duration-200">
      {/* Header */}
      <div className="bg-slate-900 dark:bg-slate-950 p-4 flex justify-between items-center cursor-pointer border-b border-gray-200 dark:border-slate-800" onClick={() => setIsOpen(false)}>
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <h3 className="text-white font-semibold text-sm">Local EDI Assistant</h3>
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={handleClear}
                className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded transition-colors"
                title="Clear History"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-white/10"
              title="Minimize"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-slate-950 space-y-4 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] rounded-lg p-3 text-sm leading-relaxed shadow-sm
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-bl-none'
                }`}
            >
              {msg.role === 'model' ? (
                 <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 dark:prose-invert">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                 </div>
              ) : (
                 <div className="whitespace-pre-wrap">{msg.text}</div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
        <div className="relative">
          <input
            type="text"
            className="w-full pl-4 pr-10 py-2.5 bg-gray-100 dark:bg-slate-800 border-0 rounded-full text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors placeholder-gray-400 dark:placeholder-slate-500"
            placeholder="Ask about coverage, errors..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 top-1.5 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};