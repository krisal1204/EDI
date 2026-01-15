
import React, { useState, useCallback, useMemo } from 'react';
import { 
    sample270, 
    sample271, 
    sample276, 
    sample277, 
    sample834, 
    sample835, 
    sample837Inst, 
    sample837Prof,
    ADVANCED_SAMPLES,
    SampleScenario
} from '../sample-data/samples';

interface Props {
  onProcess: (text: string) => void;
}

const ButtonGroup = ({ title, children, scenarios, onScenarioSelect }: { 
    title: string, 
    children?: React.ReactNode, 
    scenarios?: SampleScenario[],
    onScenarioSelect?: (content: string) => void
}) => (
    <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">{title}</h3>
        <div className="flex flex-col gap-2">
            {children}
            {scenarios && scenarios.length > 0 && onScenarioSelect && (
                <select 
                    className="w-full px-2 py-1.5 bg-gray-50 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded text-xs text-gray-600 dark:text-slate-400 focus:outline-none focus:border-brand-500 cursor-pointer transition-colors shadow-sm"
                    onChange={(e) => {
                        if(e.target.value) onScenarioSelect(e.target.value);
                        e.target.value = "";
                    }}
                    defaultValue=""
                >
                    <option value="" disabled>More Examples...</option>
                    {scenarios.map((s, i) => (
                        <option key={i} value={s.content}>{s.label}</option>
                    ))}
                </select>
            )}
        </div>
    </div>
);

const SampleButton = ({ code, label, onClick }: { code: string, label: string, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 rounded-md transition-all group text-left shadow-sm"
    >
        <span className="text-xs text-gray-600 dark:text-slate-300 font-medium">{label}</span>
        <span className="text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{code}</span>
    </button>
);

export const DragDropInput: React.FC<Props> = ({ onProcess }) => {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setText(content);
        onProcess(content);
      };
      reader.readAsText(file);
    }
  }, [onProcess]);

  const handleProcess = () => {
    if (text.trim()) onProcess(text);
  };

  const handleScenarioSelect = (content: string) => {
      setText(content);
      onProcess(content);
  };

  const scenarios = useMemo(() => {
      return {
          enrollment: ADVANCED_SAMPLES.filter(s => s.type === '834'),
          eligibility: ADVANCED_SAMPLES.filter(s => s.type === '270' || s.type === '271'),
          claims: ADVANCED_SAMPLES.filter(s => s.type === '837'),
          status: ADVANCED_SAMPLES.filter(s => s.type === '276' || s.type === '277'),
          payment: ADVANCED_SAMPLES.filter(s => s.type === '835'),
      };
  }, []);

  return (
    <div className="h-full flex flex-col p-8 bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col justify-center">
        
        <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">X12 EDI Inspector</h2>
            <p className="text-gray-500 dark:text-slate-400 text-lg font-light">
                Paste your EDI content below or drop a file to instantly parse, validate, and analyze.
            </p>
        </div>

        <div 
          className={`
            relative rounded-xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center min-h-[300px] mb-10 group
            ${isDragging 
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' 
              : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 hover:border-brand-400 dark:hover:border-brand-600'
            }
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <textarea
            className="w-full h-full absolute inset-0 bg-transparent p-6 resize-none focus:outline-none font-mono text-sm text-gray-800 dark:text-slate-300 z-10 text-center placeholder-gray-400 dark:placeholder-slate-600 focus:text-left focus:placeholder-transparent transition-all"
            placeholder="Paste X12 EDI content here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          
          {!text && (
             <div className="pointer-events-none flex flex-col items-center text-gray-400 dark:text-slate-500 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Drag & Drop file or Paste Text</span>
             </div>
          )}
          
          {text && (
             <div className="absolute bottom-4 right-4 z-20">
                 <button 
                    onClick={handleProcess}
                    className="bg-black dark:bg-brand-600 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:bg-gray-800 dark:hover:bg-brand-500 transition-all transform hover:scale-105"
                 >
                    Analyze
                 </button>
             </div>
          )}
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 pt-8">
            <p className="text-center text-xs text-gray-400 dark:text-slate-500 mb-6 font-medium uppercase tracking-widest">Or load a sample transaction</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
                <ButtonGroup title="Enrollment" scenarios={scenarios.enrollment} onScenarioSelect={handleScenarioSelect}>
                    <SampleButton code="834" label="Maintenance" onClick={() => { setText(sample834); onProcess(sample834); }} />
                </ButtonGroup>

                <ButtonGroup title="Eligibility" scenarios={scenarios.eligibility} onScenarioSelect={handleScenarioSelect}>
                    <SampleButton code="270" label="Inquiry" onClick={() => { setText(sample270); onProcess(sample270); }} />
                    <SampleButton code="271" label="Response" onClick={() => { setText(sample271); onProcess(sample271); }} />
                </ButtonGroup>

                <ButtonGroup title="File Claims" scenarios={scenarios.claims} onScenarioSelect={handleScenarioSelect}>
                    <SampleButton code="837P" label="Professional" onClick={() => { setText(sample837Prof); onProcess(sample837Prof); }} />
                    <SampleButton code="837I" label="Institutional" onClick={() => { setText(sample837Inst); onProcess(sample837Inst); }} />
                </ButtonGroup>
                
                <ButtonGroup title="Claim Status" scenarios={scenarios.status} onScenarioSelect={handleScenarioSelect}>
                    <SampleButton code="276" label="Status Req" onClick={() => { setText(sample276); onProcess(sample276); }} />
                    <SampleButton code="277" label="Status Resp" onClick={() => { setText(sample277); onProcess(sample277); }} />
                </ButtonGroup>

                <ButtonGroup title="Payment" scenarios={scenarios.payment} onScenarioSelect={handleScenarioSelect}>
                    <SampleButton code="835" label="Remittance" onClick={() => { setText(sample835); onProcess(sample835); }} />
                </ButtonGroup>
            </div>
        </div>
      </div>
    </div>
  );
};
