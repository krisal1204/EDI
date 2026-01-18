
import React, { useState, useRef, useEffect } from 'react';
import { askGeneralQuestion, getModelName } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

export const Guide: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const navigate = useNavigate();
  const [industry, setIndustry] = useState<'healthcare' | 'manufacturing'>('healthcare');
  const [activeFlow, setActiveFlow] = useState<'step1' | 'step2' | 'step3'>('step1');
  
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

  const handleBack = () => {
      if (onBack) onBack();
      else navigate(-1);
  };

  const steps = industry === 'healthcare' ? [
    { id: 'step1', label: '1. Check-In', sub: 'Eligibility' },
    { id: 'step2', label: '2. Billing', sub: 'Claims' },
    { id: 'step3', label: '3. Payment', sub: 'Remittance' }
  ] : [
    { id: 'step1', label: '1. Order', sub: 'PO (850)' },
    { id: 'step2', label: '2. Ship', sub: 'ASN (856)' },
    { id: 'step3', label: '3. Bill', sub: 'Invoice (810)' }
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 dark:text-slate-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">EDI Crash Course</h1>
        </div>
        
        {/* Industry Toggle */}
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
            <button 
                onClick={() => { setIndustry('healthcare'); setActiveFlow('step1'); }}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${industry === 'healthcare' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
            >
                Healthcare
            </button>
            <button 
                onClick={() => { setIndustry('manufacturing'); setActiveFlow('step1'); }}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${industry === 'manufacturing' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
            >
                Supply Chain
            </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 w-full space-y-24 pb-32">
        
        {/* Section 1: The Players (Dynamic) */}
        <section>
            <div className="mb-10">
                <span className={`font-bold tracking-wider text-xs uppercase mb-2 block ${industry === 'healthcare' ? 'text-blue-600' : 'text-orange-600'}`}>The Ecosystem</span>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                    {industry === 'healthcare' ? 'The Healthcare Triangle' : 'The Supply Chain Flow'}
                </h2>
                <p className="text-lg text-gray-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                    {industry === 'healthcare' 
                        ? "Unlike buying a coffee, paying for healthcare is a complex B2B data exchange. Three main parties must stay in perfect sync using EDI files."
                        : "Moving goods from manufacturer to retailer involves tight synchronization. EDI replaces paper orders and invoices to speed up the global supply chain."
                    }
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Entity A */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all shadow-sm hover:shadow-md group">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">
                                {industry === 'healthcare' ? 'The Provider' : 'The Buyer'}
                            </h3>
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {industry === 'healthcare' ? 'Service' : 'Retailer'}
                            </span>
                        </div>
                        <div className="w-10 h-10 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <span className="text-xl">
                                {industry === 'healthcare' ? '🏥' : '🛒'}
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                        {industry === 'healthcare' 
                            ? "Doctors, Hospitals, Labs. They provide care but must 'bill' an insurance company to get paid."
                            : "Retailers (e.g. Walmart) or Manufacturers ordering raw materials. They initiate the demand."}
                    </p>
                    <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                        Sends: {industry === 'healthcare' ? '837 Claims, 270 Inquiry' : '850 Purchase Order'}
                    </div>
                </div>

                {/* Entity B */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all shadow-sm hover:shadow-md group">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">
                                {industry === 'healthcare' ? 'The Payer' : 'The Seller'}
                            </h3>
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {industry === 'healthcare' ? 'Finance' : 'Supplier'}
                            </span>
                        </div>
                        <div className="w-10 h-10 bg-green-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                            <span className="text-xl">
                                {industry === 'healthcare' ? '🏢' : '🏭'}
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                        {industry === 'healthcare'
                            ? "Insurance Companies. They hold the funds and decide coverage rules."
                            : "Vendors or Distributors. They fulfill the orders, ship the goods, and send the bill."}
                    </p>
                    <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                        Sends: {industry === 'healthcare' ? '835 Payment, 271 Response' : '810 Invoice, 856 ASN'}
                    </div>
                </div>

                {/* Entity C */}
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all shadow-sm hover:shadow-md group">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white transition-colors">
                                {industry === 'healthcare' ? 'The Patient' : 'Logistics'}
                            </h3>
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded">
                                {industry === 'healthcare' ? 'Beneficiary' : 'Transport'}
                            </span>
                        </div>
                        <div className="w-10 h-10 bg-purple-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <span className="text-xl">
                                {industry === 'healthcare' ? '🧍' : '🚚'}
                            </span>
                        </div>
                    </div>
                    <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                        {industry === 'healthcare'
                            ? "You. You have the policy. You are responsible for Co-pays and Deductibles."
                            : "Carriers (FedEx, UPS, Trucking). They physically move the goods from Seller to Buyer."}
                    </p>
                    <div className="text-xs text-gray-400 dark:text-slate-500 font-mono">
                        {industry === 'healthcare' ? 'ID: Member ID / SSN' : 'Tracking: PRO / BOL Number'}
                    </div>
                </div>
            </div>
        </section>

        {/* Section 2: Anatomy of an EDI File (Common) */}
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
                            <span className="text-sm text-gray-500 dark:text-slate-400">Groups similar transaction types (e.g., a batch of {industry === 'healthcare' ? 'claims' : 'orders'}).</span>
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
                            <span className="text-gray-400">... {industry === 'healthcare' ? 'CLM' : 'PO1'}*... (Details)</span><br/>
                            <span className="text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-1 rounded">SE</span>*45*0001~
                        </div>
                        <span className="text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20 px-1 rounded mt-2 inline-block">GE</span>*1*1~
                    </div>
                    <span className="text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 px-1 rounded mt-2 inline-block">IEA</span>*1*0001~
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
                {industry === 'healthcare' ? (
                    <>
                        <div className="border border-gray-200 dark:border-slate-800 p-5 rounded-xl hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-2"><span className="text-lg font-mono font-bold px-2 py-1 rounded text-blue-600 bg-blue-50 dark:bg-blue-900/20">837</span></div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Claim</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">The Bill. Provider asking Payer for money.</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-800 p-5 rounded-xl hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-2"><span className="text-lg font-mono font-bold px-2 py-1 rounded text-green-600 bg-green-50 dark:bg-green-900/20">835</span></div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Remittance</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">The Receipt. Payer explaining payment details.</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-800 p-5 rounded-xl hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-2"><span className="text-lg font-mono font-bold px-2 py-1 rounded text-purple-600 bg-purple-50 dark:bg-purple-900/20">270/271</span></div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Eligibility</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">The Check. Is this patient insured?</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-800 p-5 rounded-xl hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-2"><span className="text-lg font-mono font-bold px-2 py-1 rounded text-orange-600 bg-orange-50 dark:bg-orange-900/20">276/277</span></div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Status</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">The Update. Is the claim paid yet?</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-800 p-5 rounded-xl hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-2"><span className="text-lg font-mono font-bold px-2 py-1 rounded text-teal-600 bg-teal-50 dark:bg-teal-900/20">834</span></div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Enrollment</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">The Membership. Employer adding new hires.</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="border border-gray-200 dark:border-slate-800 p-5 rounded-xl hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-2"><span className="text-lg font-mono font-bold px-2 py-1 rounded text-blue-600 bg-blue-50 dark:bg-blue-900/20">850</span></div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Purchase Order</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">The Offer. Buyer requesting goods from Seller.</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-800 p-5 rounded-xl hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-2"><span className="text-lg font-mono font-bold px-2 py-1 rounded text-green-600 bg-green-50 dark:bg-green-900/20">810</span></div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Invoice</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">The Bill. Seller requesting payment.</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-800 p-5 rounded-xl hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-2"><span className="text-lg font-mono font-bold px-2 py-1 rounded text-purple-600 bg-purple-50 dark:bg-purple-900/20">856</span></div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">ASN</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Advance Ship Notice. "Your package is on the way".</p>
                        </div>
                        <div className="border border-gray-200 dark:border-slate-800 p-5 rounded-xl hover:shadow-sm transition-shadow bg-white dark:bg-slate-900">
                            <div className="flex items-center justify-between mb-2"><span className="text-lg font-mono font-bold px-2 py-1 rounded text-orange-600 bg-orange-50 dark:bg-orange-900/20">997</span></div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-1">Ack</h4>
                            <p className="text-sm text-gray-500 dark:text-slate-400">Functional Acknowledgment. "I received your file".</p>
                        </div>
                    </>
                )}
            </div>
        </section>

        {/* Section 5: Common Errors */}
        <section>
            <div className="mb-8">
                <span className="text-brand-600 dark:text-brand-400 font-bold tracking-wider text-xs uppercase mb-2 block">Troubleshooting</span>
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Common Errors</h2>
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
                        {industry === 'healthcare' ? (
                            <>
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
                            </>
                        ) : (
                            <>
                                <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-mono font-bold text-red-600">PO1*Price</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">Price Mismatch</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">Invoice price does not match Purchase Order price.</td>
                                </tr>
                                <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-mono font-bold text-red-600">SN1*Qty</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">Short Shipment</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">ASN quantity is less than Ordered quantity.</td>
                                </tr>
                                <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-mono font-bold text-red-600">LIN*UP</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">Unknown Product</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">UPC or SKU code not found in buyer's system.</td>
                                </tr>
                            </>
                        )}
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
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
                    {industry === 'healthcare' ? "The Life of a Patient Visit" : "The Life of an Order"}
                </h2>
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
                    
                    {/* Node A */}
                    <div className="flex flex-col items-center z-10 gap-3 group">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-gray-100 dark:border-slate-800 flex items-center justify-center shadow-sm group-hover:border-gray-300 transition-colors">
                            <span className="text-2xl">{industry === 'healthcare' ? '🏥' : '🛒'}</span>
                        </div>
                        <span className="font-medium text-sm text-gray-600 dark:text-slate-300">
                            {industry === 'healthcare' ? 'Provider' : 'Buyer'}
                        </span>
                    </div>

                    {/* Connection Line */}
                    <div className="flex-1 mx-6 h-px bg-gray-200 dark:bg-slate-800 relative">
                        {/* Animated Packet */}
                        <div className={`absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 
                            bg-white dark:bg-slate-800 border shadow-lg px-4 py-2 rounded-lg text-xs font-mono font-bold
                            flex items-center gap-2 z-20 min-w-[120px] justify-center
                            ${activeFlow === 'step1' ? 'border-blue-200 text-blue-600' : ''}
                            ${activeFlow === 'step2' ? 'border-orange-200 text-orange-600' : ''}
                            ${activeFlow === 'step3' ? 'border-green-200 text-green-600' : ''}
                        `}>
                            {industry === 'healthcare' ? (
                                <>
                                    {activeFlow === 'step1' && <><span className="animate-pulse">●</span> 270 / 271</>}
                                    {activeFlow === 'step2' && <><span className="animate-pulse">●</span> 837 Claim</>}
                                    {activeFlow === 'step3' && <><span className="animate-pulse">●</span> 835 Remit</>}
                                </>
                            ) : (
                                <>
                                    {activeFlow === 'step1' && <><span className="animate-pulse">●</span> 850 PO</>}
                                    {activeFlow === 'step2' && <><span className="animate-pulse">●</span> 856 ASN</>}
                                    {activeFlow === 'step3' && <><span className="animate-pulse">●</span> 810 Inv</>}
                                </>
                            )}
                        </div>
                        
                        {/* Arrow Direction Indicators */}
                        <div className={`absolute -top-3 w-full flex justify-center text-gray-300 dark:text-slate-700 text-[10px] tracking-widest uppercase transition-opacity duration-500
                             ${(industry === 'healthcare' && activeFlow === 'step3') || (industry === 'manufacturing' && activeFlow === 'step1') ? 'opacity-0' : 'opacity-100'}
                        `}>
                            ⟶ Sending ⟶
                        </div>
                        <div className={`absolute -bottom-5 w-full flex justify-center text-gray-300 dark:text-slate-700 text-[10px] tracking-widest uppercase transition-opacity duration-500
                             ${(industry === 'healthcare' && activeFlow === 'step3') || (industry === 'manufacturing' && activeFlow === 'step1') ? 'opacity-100' : 'opacity-0'}
                        `}>
                            ⟵ Sending ⟵
                        </div>
                    </div>

                    {/* Node B */}
                    <div className="flex flex-col items-center z-10 gap-3 group">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl border-2 border-gray-100 dark:border-slate-800 flex items-center justify-center shadow-sm group-hover:border-gray-300 transition-colors">
                            <span className="text-2xl">{industry === 'healthcare' ? '🏢' : '🏭'}</span>
                        </div>
                        <span className="font-medium text-sm text-gray-600 dark:text-slate-300">
                            {industry === 'healthcare' ? 'Payer' : 'Seller'}
                        </span>
                    </div>
                </div>

                {/* Info Content - Minimal List */}
                <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl p-8 max-w-2xl mx-auto">
                    <h3 className="text-center font-bold text-gray-900 dark:text-white mb-6">
                        {industry === 'healthcare' ? (
                            <>
                                {activeFlow === 'step1' && "Scenario: Front Desk Check-In"}
                                {activeFlow === 'step2' && "Scenario: Submitting the Bill"}
                                {activeFlow === 'step3' && "Scenario: Getting Paid"}
                            </>
                        ) : (
                            <>
                                {activeFlow === 'step1' && "Scenario: Placing an Order"}
                                {activeFlow === 'step2' && "Scenario: Shipping Goods"}
                                {activeFlow === 'step3' && "Scenario: Sending Invoice"}
                            </>
                        )}
                    </h3>
                    
                    <div className="space-y-4">
                        {/* --- HEALTHCARE FLOWS --- */}
                        {industry === 'healthcare' && activeFlow === 'step1' && (
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
                            </>
                        )}

                        {industry === 'healthcare' && activeFlow === 'step2' && (
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
                            </>
                        )}

                        {industry === 'healthcare' && activeFlow === 'step3' && (
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
                            </>
                        )}

                        {/* --- SUPPLY CHAIN FLOWS --- */}
                        {industry === 'manufacturing' && activeFlow === 'step1' && (
                            <>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Header</span>
                                    <code className="text-sm font-bold text-blue-600">BEG*00*SA</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">New Order PO-12345</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Item</span>
                                    <code className="text-sm font-bold text-blue-600">PO1*1*100</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">100 Units of Widget X</span>
                                </div>
                            </>
                        )}

                        {industry === 'manufacturing' && activeFlow === 'step2' && (
                            <>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Shipment</span>
                                    <code className="text-sm font-bold text-orange-600">BSN*00</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">Shipment 987654 Sent</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Packaging</span>
                                    <code className="text-sm font-bold text-orange-600">TD1*CTN25</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">25 Cartons on 1 Pallet</span>
                                </div>
                            </>
                        )}

                        {industry === 'manufacturing' && activeFlow === 'step3' && (
                            <>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Header</span>
                                    <code className="text-sm font-bold text-green-600">BIG*...</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">Invoice INV-5555</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <span className="text-sm text-gray-500">Total</span>
                                    <code className="text-sm font-bold text-green-600">TDS*150000</code>
                                    <span className="text-sm text-gray-900 dark:text-white font-medium">Total Amount: $1,500.00</span>
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
