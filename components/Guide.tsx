
import React, { useState, useRef, useEffect } from 'react';
import { askGeneralQuestion, getModelName } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export const Guide: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeFlow, setActiveFlow] = useState<'eligibility' | 'claim' | 'payment'>('claim');
  
  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'model', text: string}[]>([
      { role: 'model', text: `Hi! I'm your local EDI Tutor (running on ${getModelName()}). Ask me anything about X12 standards, loops, or segments!` }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim()) return;

      const userMsg = { role: 'user' as const, text: chatInput };
      setChatHistory(prev => [...prev, userMsg]);
      setChatInput('');
      setChatLoading(true);

      const historyForApi = chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const response = await askGeneralQuestion(chatInput, historyForApi);

      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
      setChatLoading(false);
  };

  const handleClearChat = () => {
      setChatHistory([
          { role: 'model', text: `Hi! I'm your local EDI Tutor (running on ${getModelName()}). Ask me anything about X12 standards, loops, or segments!` }
      ]);
  };

  const steps = [
    { id: 'eligibility', label: '1. Check-In', sub: 'Eligibility' },
    { id: 'claim', label: '2. Billing', sub: 'Claims' },
    { id: 'payment', label: '3. Payment', sub: 'Remittance' }
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 dark:text-slate-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Healthcare EDI Crash Course</h1>
        </div>
        <div className="hidden md:flex gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">HIPAA Compliant</span>
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">X12 Standard</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 w-full space-y-24 pb-32">
        
        {/* Section 1: The US Healthcare System (Simplified) */}
        <section>
            <div className="mb-10">
                <span className="text-brand-600 dark:text-brand-400 font-bold tracking-wider text-xs uppercase mb-2 block">The Players</span>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">The Healthcare Triangle</h2>
                <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                    Unlike buying a coffee, paying for healthcare is a complex B2B data exchange. Three main parties must stay in perfect sync using EDI files.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Provider Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all shadow-sm hover:shadow-md group">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">The Provider</h3>
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">Service</span>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                        Doctors, Hospitals, Labs. They provide care but must "bill" an insurance company to get paid.
                    </p>
                    <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                        Sends: 837 Claims, 270 Inquiry
                    </div>
                </div>

                {/* Payer Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all shadow-sm hover:shadow-md group">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">The Payer</h3>
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">Finance</span>
                        </div>
                        <div className="w-10 h-10 bg-green-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.5 1L2 6v6c0 5.55 3.84 10.74 9 12 2.39-.58 4.51-1.81 6.24-3.56l-1.38-1.48C14.47 20.37 12.82 21.36 11.5 21.68 7.37 20.6 4 16.32 4 12V7l7.5-3.95L19 7v4h2V6l-9.5-5z"/></svg>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                        Insurance Companies (Aetna, UHC, Medicare). They hold the funds and decide coverage rules.
                    </p>
                    <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                        Sends: 835 Payment, 271 Response
                    </div>
                </div>

                {/* Patient Card */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all shadow-sm hover:shadow-md group">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">The Patient</h3>
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">Beneficiary</span>
                        </div>
                        <div className="w-10 h-10 bg-purple-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                        You. You have the policy. You are responsible for Co-pays and Deductibles not covered by the Payer.
                    </p>
                    <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                        ID: Member ID / SSN
                    </div>
                </div>
            </div>
        </section>

        {/* Section 2: Anatomy of an EDI File */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
                <span className="text-brand-600 dark:text-brand-400 font-bold tracking-wider text-xs uppercase mb-2 block">Structure</span>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Anatomy of X12</h2>
                <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-6">
                    EDI looks like a chaotic string of text, but it's actually a highly organized hierarchy of "envelopes".
                </p>
                <ul className="space-y-4">
                    <li className="flex items-start gap-4">
                        <div className="mt-1 w-6 h-6 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">1</div>
                        <div>
                            <strong className="text-gray-900 dark:text-white block">ISA Header (The Envelope)</strong>
                            <span className="text-sm text-gray-500 dark:text-slate-400">Wraps the entire file. Defines sender, receiver, and separators.</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <div className="mt-1 w-6 h-6 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold">2</div>
                        <div>
                            <strong className="text-gray-900 dark:text-white block">GS Group (The Folder)</strong>
                            <span className="text-sm text-gray-500 dark:text-slate-400">Groups similar transaction types (e.g., a batch of claims).</span>
                        </div>
                    </li>
                    <li className="flex items-start gap-4">
                        <div className="mt-1 w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">3</div>
                        <div>
                            <strong className="text-gray-900 dark:text-white block">ST Transaction (The Document)</strong>
                            <span className="text-sm text-gray-500 dark:text-slate-400">The actual form content. Contains the Loops and Segments.</span>
                        </div>
                    </li>
                </ul>
            </div>

            {/* Visual Structure */}
            <div className="bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-8 font-mono text-sm shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <svg className="w-32 h-32" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.9 2 2 2h8v-8h8V4c0-1.1-.9-2-2-2zm-2 16H8v-2h4v2zm0-4H8v-2h4v2zm0-4H8V8h4v2zm6 2h-4V8h4v4zm0 2v4l-4-4h4z"/></svg>
                </div>
                
                {/* ISA */}
                <div className="border-l-2 border-blue-500 pl-4 py-2 mb-2 relative">
                    <span className="text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 px-1 rounded">ISA</span>*00*...
                    {/* GS */}
                    <div className="border-l-2 border-orange-500 pl-4 py-2 mt-2 ml-2">
                        <span className="text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20 px-1 rounded">GS</span>*HC*...
                        {/* ST */}
                        <div className="border-l-2 border-green-500 pl-4 py-2 mt-2 ml-2 bg-white dark:bg-slate-900 rounded shadow-sm border border-gray-100 dark:border-slate-800">
                            <span className="text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-1 rounded">ST</span>*837*0001~<br/>
                            <span className="text-gray-400">... BHT*... (Header)</span><br/>
                            <span className="text-gray-400">... NM1*... (Names)</span><br/>
                            <span className="text-gray-400">... CLM*... (Details)</span><br/>
                            <span className="text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-1 rounded">SE</span>*45*0001~
                        </div>
                        <span className="text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20 px-1 rounded mt-2 inline-block">GE</span>*1*1~
                    </div>
                    <span className="text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 px-1 rounded mt-2 inline-block">IEA</span>*1*0001~
                </div>
            </div>
        </section>

        {/* Section 3: Understanding Loops & Hierarchy */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
                <span className="text-brand-600 dark:text-brand-400 font-bold tracking-wider text-xs uppercase mb-2 block">The Backbone</span>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">Loops & Hierarchy</h2>
                
                <div className="prose dark:prose-invert text-sm text-gray-600 dark:text-slate-300 space-y-4">
                    <p>
                        EDI isn't just a flat list of lines. It's a <strong>nested hierarchy</strong>, similar to folders on your computer or JSON objects.
                    </p>
                    <p>
                        In X12, these groups are called <strong>Loops</strong>. A loop is a collection of segments that repeat together.
                    </p>
                    
                    <h4 className="font-bold text-gray-900 dark:text-white pt-2">The "HL" Segment</h4>
                    <p>
                        In complex transactions like Claims (837) or Eligibility (270), the <strong>HL (Hierarchical Level)</strong> segment acts as the connector.
                    </p>
                    <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-lg font-mono text-xs border-l-4 border-brand-500">
                        HL * ID * ParentID * LevelCode
                    </div>
                    <ul className="list-disc pl-4 space-y-1 mt-2">
                        <li><strong>ID:</strong> Unique number for this node.</li>
                        <li><strong>ParentID:</strong> Who this node belongs to.</li>
                        <li><strong>LevelCode:</strong> What this node is (20=Source, 21=Receiver, 22=Subscriber, 23=Dependent).</li>
                    </ul>
                </div>
            </div>

            <div className="lg:col-span-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
                </div>

                <h3 className="text-center font-bold text-gray-900 dark:text-white mb-6">Visualizing the 837 Claim Structure</h3>
                
                {/* Visual Tree */}
                <div className="space-y-4 relative z-10">
                    
                    {/* Level 1: Information Source */}
                    <div className="border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 ml-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Loop 2000A</span>
                            <span className="font-bold text-gray-800 dark:text-blue-100 text-sm">Billing Provider</span>
                        </div>
                        <div className="text-xs text-blue-600 dark:text-blue-300 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                            Dr. Smith's Practice (The entity getting paid)
                        </div>
                    </div>

                    {/* Level 2: Subscriber (Child of Provider in some formats, or nested under Receiver) */}
                    <div className="border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/10 rounded-lg p-3 ml-8 relative">
                        <div className="absolute -left-4 top-1/2 w-4 h-px bg-gray-300 dark:bg-slate-600"></div>
                        <div className="absolute -left-4 top-[-20px] bottom-1/2 w-px bg-gray-300 dark:bg-slate-600"></div>
                        
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Loop 2000B</span>
                            <span className="font-bold text-gray-800 dark:text-purple-100 text-sm">Subscriber</span>
                        </div>
                        <div className="text-xs text-purple-600 dark:text-purple-300 pl-2 border-l-2 border-purple-200 dark:border-purple-800">
                            John Doe (The policy holder)
                        </div>

                        {/* Level 3: Claim (Nested under Subscriber) */}
                        <div className="mt-4 border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-900/10 rounded-lg p-3 relative">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">Loop 2300</span>
                                <span className="font-bold text-gray-800 dark:text-orange-100 text-sm">Claim</span>
                            </div>
                            <div className="text-xs text-orange-600 dark:text-orange-300 mb-2">
                                Invoice #12345 • Total: $150.00 • Cough (R05)
                            </div>

                            {/* Level 4: Service Lines (Nested under Claim) */}
                            <div className="mt-2 space-y-2">
                                <div className="border border-green-200 dark:border-green-900 bg-white dark:bg-slate-800 rounded p-2 flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 rounded">Loop 2400</span>
                                        <span className="font-mono text-gray-700 dark:text-gray-300">99213 (Office Visit)</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">$100.00</span>
                                </div>
                                <div className="border border-green-200 dark:border-green-900 bg-white dark:bg-slate-800 rounded p-2 flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 rounded">Loop 2400</span>
                                        <span className="font-mono text-gray-700 dark:text-gray-300">85025 (Blood Count)</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">$50.00</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Section 4: Transaction Dictionary */}
        <section>
            <div className="mb-8">
                <span className="text-brand-600 dark:text-brand-400 font-bold tracking-wider text-xs uppercase mb-2 block">Cheat Sheet</span>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Transaction Dictionary</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { code: "837", name: "Claim", desc: "The Bill. Provider asking Payer for money.", color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20" },
                    { code: "835", name: "Remittance", desc: "The Receipt. Payer explaining payment details.", color: "text-green-600 bg-green-50 dark:bg-green-900/20" },
                    { code: "270/271", name: "Eligibility", desc: "The Coverage Check. Is this patient insured?", color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20" },
                    { code: "276/277", name: "Status", desc: "The Status Update. Is the claim paid yet?", color: "text-orange-600 bg-orange-50 dark:bg-orange-900/20" },
                    { code: "834", name: "Enrollment", desc: "The Membership. Employer adding new hires.", color: "text-teal-600 bg-teal-50 dark:bg-teal-900/20" },
                ].map(t => (
                    <div key={t.code} className="border border-gray-200 dark:border-slate-800 p-5 rounded-xl hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-lg font-mono font-bold px-2 py-1 rounded ${t.color}`}>{t.code}</span>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{t.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{t.desc}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* Section 5: Common Errors */}
        <section>
            <div className="mb-8">
                <span className="text-brand-600 dark:text-brand-400 font-bold tracking-wider text-xs uppercase mb-2 block">Troubleshooting</span>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Common Rejection Codes</h2>
            </div>
            <div className="overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-sm">
                <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-900 dark:text-white w-32">Code</th>
                            <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Meaning</th>
                            <th className="px-6 py-4 font-bold text-gray-900 dark:text-white">Solution</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-mono font-bold text-red-600">AAA*62</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-slate-300">Patient Not Found</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-slate-400">Check Member ID, Date of Birth, and Name spelling.</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-mono font-bold text-red-600">AAA*71</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-slate-300">DOB Mismatch</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-slate-400">The Date of Birth sent does not match payer records.</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-mono font-bold text-red-600">AAA*42</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-slate-300">Unable to Respond</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-slate-400">Payer system is down or timed out. Try again later.</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-mono font-bold text-red-600">999 Reject</td>
                            <td className="px-6 py-4 text-gray-600 dark:text-slate-300">Syntax Error</td>
                            <td className="px-6 py-4 text-gray-500 dark:text-slate-400">The file structure is invalid (e.g., missing mandatory segment).</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>

        {/* Section 6: Interactive Workflows */}
        <section className="py-8">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">The Life of a Patient Visit</h2>
                <div className="flex items-center justify-center gap-2 text-sm bg-gray-100 dark:bg-slate-800 p-1 rounded-full w-fit mx-auto">
                    {steps.map((step) => {
                        const isActive = activeFlow === step.id;
                        return (
                            <button
                                key={step.id}
                                onClick={() => setActiveFlow(step.id as any)}
                                className={`px-6 py-2 rounded-full transition-all duration-300 font-medium
                                    ${isActive 
                                        ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
                                    }`}
                            >
                                {step.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Minimalist Diagram */}
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between relative mb-16 px-4 md:px-12">
                    
                    {/* Provider Node */}
                    <div className="flex flex-col items-center z-10 gap-3 group">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-gray-100 dark:border-slate-800 flex items-center justify-center shadow-sm group-hover:border-gray-300 transition-colors">
                            <span className="text-2xl">🏥</span>
                        </div>
                        <span className="font-medium text-sm text-gray-600 dark:text-slate-300">Provider</span>
                    </div>

                    {/* Connection Line */}
                    <div className="flex-1 mx-6 h-px bg-gray-200 dark:bg-slate-800 relative">
                        {/* Animated Packet */}
                        <div className={`absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 
                            bg-white dark:bg-slate-800 border shadow-lg px-4 py-2 rounded-lg text-xs font-mono font-bold
                            flex items-center gap-2 z-20 min-w-[120px] justify-center
                            ${activeFlow === 'eligibility' ? 'border-blue-200 text-blue-600' : ''}
                            ${activeFlow === 'claim' ? 'border-orange-200 text-orange-600' : ''}
                            ${activeFlow === 'payment' ? 'border-green-200 text-green-600' : ''}
                        `}>
                            {activeFlow === 'eligibility' && <><span className="animate-pulse">●</span> 270 / 271</>}
                            {activeFlow === 'claim' && <><span className="animate-pulse">●</span> 837 Claim</>}
                            {activeFlow === 'payment' && <><span className="animate-pulse">●</span> 835 Remit</>}
                        </div>
                        
                        {/* Arrow Direction Indicators */}
                        <div className={`absolute -top-3 w-full flex justify-center text-gray-300 dark:text-slate-700 text-[10px] tracking-widest uppercase transition-opacity duration-500
                             ${activeFlow === 'payment' ? 'opacity-0' : 'opacity-100'}
                        `}>
                            ⟶ Sending ⟶
                        </div>
                        <div className={`absolute -bottom-5 w-full flex justify-center text-gray-300 dark:text-slate-700 text-[10px] tracking-widest uppercase transition-opacity duration-500
                             ${activeFlow === 'payment' ? 'opacity-100' : 'opacity-0'}
                        `}>
                            ⟵ Paying ⟵
                        </div>
                    </div>

                    {/* Payer Node */}
                    <div className="flex flex-col items-center z-10 gap-3 group">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-gray-100 dark:border-slate-800 flex items-center justify-center shadow-sm group-hover:border-gray-300 transition-colors">
                            <span className="text-2xl">🏢</span>
                        </div>
                        <span className="font-medium text-sm text-gray-600 dark:text-slate-300">Payer</span>
                    </div>
                </div>

                {/* Info Content - Minimal List */}
                <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-8 max-w-2xl mx-auto">
                    <h3 className="text-center font-bold text-gray-900 dark:text-white mb-6">
                        {activeFlow === 'eligibility' && "Scenario: Front Desk Check-In"}
                        {activeFlow === 'claim' && "Scenario: Submitting the Bill"}
                        {activeFlow === 'payment' && "Scenario: Getting Paid"}
                    </h3>
                    
                    <div className="space-y-4">
                        {activeFlow === 'eligibility' && (
                            <>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Query</span>
                                    <code className="text-sm font-bold text-blue-600">NM1*IL</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">Is John Doe covered?</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Response</span>
                                    <code className="text-sm font-bold text-green-600">EB*1</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">Yes, Active Coverage.</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Detail</span>
                                    <code className="text-sm font-bold text-gray-600 dark:text-gray-400">EB*C</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">$500 Deductible Remaining.</span>
                                </div>
                            </>
                        )}

                        {activeFlow === 'claim' && (
                            <>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Header</span>
                                    <code className="text-sm font-bold text-orange-600">CLM*150</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">Total Bill: $150.00</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Diagnosis</span>
                                    <code className="text-sm font-bold text-orange-600">HI*ABK:R05</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">Patient has a Cough (R05).</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Procedure</span>
                                    <code className="text-sm font-bold text-orange-600">SV1*HC:99213</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">Office Visit (15 min).</span>
                                </div>
                            </>
                        )}

                        {activeFlow === 'payment' && (
                            <>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Status</span>
                                    <code className="text-sm font-bold text-green-600">CLP*1</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">Claim Processed as Primary.</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Breakdown</span>
                                    <span className="text-xs font-mono text-gray-400">150 - 50 - 20 = 80</span>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">Paid $80.00</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Adjust</span>
                                    <code className="text-sm font-bold text-red-500">CAS*CO*45</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">$50 Discount (Contract).</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>

        {/* Section 7: AI Tutor Chat (Minimalist Redesign) */}
        <section className="mt-24 mb-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="md:w-1/3 pt-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">AI EDI Tutor</h2>
                    <p className="text-gray-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                        Connects to your local Ollama instance to answer questions about segments, codes, and structure.
                    </p>
                    <div className="inline-flex items-center gap-2 text-[10px] font-mono bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-900/30">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        Running: {getModelName()}
                    </div>
                </div>

                <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col h-[500px]">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide">Chat Session</span>
                        <button 
                            onClick={handleClearChat}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Clear History
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white dark:bg-slate-900">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                    ? 'bg-black dark:bg-white text-white dark:text-black rounded-2xl rounded-tr-sm px-4 py-2' 
                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 rounded-2xl rounded-tl-sm px-4 py-2'
                                }`}>
                                    {msg.role === 'model' ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start animate-pulse">
                                <span className="text-gray-400 text-xs ml-2">Thinking...</span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <div className="relative">
                            <input 
                                type="text" 
                                className="w-full pl-4 pr-12 py-3 bg-gray-50 dark:bg-slate-800 border border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-gray-200 dark:focus:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-0 transition-all shadow-sm"
                                placeholder="Ask a question..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                            />
                            <button 
                                type="submit"
                                disabled={!chatInput.trim() || chatLoading}
                                className="absolute right-2 top-2 p-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>

      </div>
    </div>
  );
};
