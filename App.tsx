import React, { useState, useEffect, useMemo } from 'react';
import { DragDropInput } from './components/DragDropInput';
import { SegmentTree } from './components/SegmentTree';
import { SegmentDetail } from './components/SegmentDetail';
import { EdiGenerator } from './components/EdiGenerator';
import { ChatInterface } from './components/ChatInterface';
import { CodeSearch } from './components/CodeSearch';
import { Settings } from './components/Settings';
import { parseEdi, flattenTree } from './services/ediParser';
import { EdiDocument, EdiSegment } from './types';
import { FormData270, FormData276, build270, build276 } from './services/ediBuilder';
import { mapEdiToForm, mapEdiToForm276, mapEdiToBenefits, BenefitRow, mapEdiToClaimStatus, ClaimStatusRow } from './services/ediMapper';
import { analyzeSegmentOffline } from './services/offlineAnalyzer';
import { useAppStore } from './store/useAppStore';

// Default Data 270 (For Demo Initialization)
const INITIAL_FORM_DATA: FormData270 = {
    payerName: 'CMS MEDICARE',
    payerId: 'CMS001',
    providerName: 'GENERAL HOSPITAL',
    providerNpi: '1234567890',
    subscriberFirstName: 'JOHN',
    subscriberLastName: 'DOE',
    subscriberId: 'MBI123456789',
    subscriberDob: '1955-05-12',
    serviceDate: new Date().toISOString().slice(0, 10),
    serviceTypeCode: '30',
    hasDependent: false,
    dependentFirstName: 'JANE',
    dependentLastName: 'DOE',
    dependentDob: '2015-08-20',
    dependentGender: 'F'
};

// Default Data 276 (For Demo Initialization)
const INITIAL_FORM_DATA_276: FormData276 = {
    payerName: 'CMS MEDICARE',
    payerId: 'CMS001',
    providerName: 'GENERAL HOSPITAL',
    providerNpi: '1234567890',
    subscriberFirstName: 'JOHN',
    subscriberLastName: 'DOE',
    subscriberId: 'MBI123456789',
    hasDependent: false,
    dependentFirstName: 'JANE',
    dependentLastName: 'DOE',
    claimId: 'CLM0012345',
    chargeAmount: '150.00',
    serviceDate: new Date().toISOString().slice(0, 10)
};

// Empty State 270 (For Resetting on Load)
const EMPTY_FORM_DATA_270: FormData270 = {
    payerName: '',
    payerId: '',
    providerName: '',
    providerNpi: '',
    subscriberFirstName: '',
    subscriberLastName: '',
    subscriberId: '',
    subscriberDob: '',
    serviceDate: '',
    serviceTypeCode: '',
    hasDependent: false,
    dependentFirstName: '',
    dependentLastName: '',
    dependentDob: '',
    dependentGender: ''
};

// Empty State 276 (For Resetting on Load)
const EMPTY_FORM_DATA_276: FormData276 = {
    payerName: '',
    payerId: '',
    providerName: '',
    providerNpi: '',
    subscriberFirstName: '',
    subscriberLastName: '',
    subscriberId: '',
    hasDependent: false,
    dependentFirstName: '',
    dependentLastName: '',
    claimId: '',
    chargeAmount: '',
    serviceDate: ''
};

// --- Nav Button Component ---
const NavTab = ({ active, onClick, disabled, icon, label }: { active: boolean, onClick: () => void, disabled?: boolean, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 select-none
      ${active 
        ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
        : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/50'
      }
      ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
    `}
  >
    {icon}
    <span>{label}</span>
  </button>
);

function App() {
  const { theme } = useAppStore();

  const [formData, setFormData] = useState<FormData270>(INITIAL_FORM_DATA);
  const [formData276, setFormData276] = useState<FormData276>(INITIAL_FORM_DATA_276);
  
  const [rawEdi, setRawEdi] = useState<string>('');
  const [doc, setDoc] = useState<EdiDocument | null>(null);
  const [benefits, setBenefits] = useState<BenefitRow[]>([]);
  const [claims, setClaims] = useState<ClaimStatusRow[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<EdiSegment | null>(null);
  const [viewMode, setViewMode] = useState<'inspector' | 'raw' | 'json' | 'reference' | 'settings'>('inspector');
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // Track which generator is currently active (if not viewing a parsed file)
  const [generatorMode, setGeneratorMode] = useState<'270' | '276'>('270');

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [lastTransactionType, setLastTransactionType] = useState<string>('Unknown');

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Handle Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const windowWidth = window.innerWidth;
      const minWidth = windowWidth * 0.2;
      const maxWidth = windowWidth * 0.8;
      
      let newWidth = e.clientX;
      if (newWidth < minWidth) newWidth = minWidth; 
      if (newWidth > maxWidth) newWidth = maxWidth; 
      
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const processEdi = (edi: string, shouldMapToForm: boolean) => {
    try {
      const parsed = parseEdi(edi);
      setDoc(parsed);
      
      if (parsed.transactionType !== lastTransactionType) {
          const windowWidth = window.innerWidth;
          const maxWidth = windowWidth * 0.8;

          if (parsed.transactionType === '271' || parsed.transactionType === '277') {
              setSidebarWidth(Math.min(550, maxWidth)); 
          } else {
              setSidebarWidth(Math.min(350, maxWidth)); 
          }
          setLastTransactionType(parsed.transactionType);
      }

      if (!selectedSegment && parsed.segments.length > 0) {
        setSelectedSegment(parsed.segments[0]);
      }

      // Handle Transaction Specific Logic
      if (parsed.transactionType === '271') {
          setBenefits(mapEdiToBenefits(parsed));
          setClaims([]);
      } else if (parsed.transactionType === '277') {
          setClaims(mapEdiToClaimStatus(parsed));
          setBenefits([]);
      } else {
          setBenefits([]);
          setClaims([]);
      }

      if (shouldMapToForm) {
        if (parsed.transactionType === '270') {
            const mappedData = mapEdiToForm(parsed);
            // Merge mapped data with EMPTY state to avoid stale defaults
            setFormData({ ...EMPTY_FORM_DATA_270, ...mappedData });
            setGeneratorMode('270');
        } else if (parsed.transactionType === '276') {
             const mappedData = mapEdiToForm276(parsed);
             // Merge mapped data with EMPTY state to avoid stale defaults
             setFormData276({ ...EMPTY_FORM_DATA_276, ...mappedData });
             setGeneratorMode('276');
        }
      }
    } catch (e) {
      console.error("Parse error", e);
    }
  };

  const handleFormChange = (newData: FormData270) => {
    setFormData(newData);
    const newEdi = build270(newData);
    setRawEdi(newEdi);
    processEdi(newEdi, false); 
  };

  const handleForm276Change = (newData: FormData276) => {
    setFormData276(newData);
    const newEdi = build276(newData);
    setRawEdi(newEdi);
    processEdi(newEdi, false);
  }

  // Handle manual switching of generator mode
  const handleGeneratorModeChange = (mode: '270' | '276') => {
      setGeneratorMode(mode);
      let newEdi = '';
      if (mode === '270') {
          newEdi = build270(formData);
      } else {
          newEdi = build276(formData276);
      }
      setRawEdi(newEdi);
      processEdi(newEdi, false);
  };

  const handleClear = () => {
    setFormData(INITIAL_FORM_DATA);
    setFormData276(INITIAL_FORM_DATA_276);
    setRawEdi('');
    setDoc(null);
    setBenefits([]);
    setClaims([]);
    setViewMode('inspector');
    setSidebarWidth(350); 
    setLastTransactionType('Unknown');
    setGeneratorMode('270');
  };

  const handleCopy = async (content: string) => {
    try {
        await navigator.clipboard.writeText(content);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
        console.error('Failed to copy', err);
    }
  };

  const handleFieldFocus = (fieldName: string) => {
    if (!doc) return;
    const flat = flattenTree(doc.segments);
    
    let found: EdiSegment | undefined;

    if (['payerName', 'payerId'].includes(fieldName)) {
        found = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
    } else if (['providerName', 'providerNpi'].includes(fieldName)) {
        found = flat.find(s => s.tag === 'NM1' && (s.elements[0]?.value === '1P' || s.elements[0]?.value === '41'));
    } else if (fieldName.startsWith('subscriber')) {
        if (fieldName === 'subscriberDob') {
             const subNm1Index = flat.findIndex(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
             if (subNm1Index !== -1) {
                 found = flat.slice(subNm1Index).find(s => s.tag === 'DMG');
             }
        } else {
            found = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
        }
    } else if (fieldName.startsWith('dependent')) {
        if (['dependentDob', 'dependentGender'].includes(fieldName)) {
             const depNm1Index = flat.findIndex(s => s.tag === 'NM1' && s.elements[0]?.value === '03');
             if (depNm1Index !== -1) {
                 found = flat.slice(depNm1Index).find(s => s.tag === 'DMG');
             }
        } else {
            found = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === '03');
        }
    } else if (fieldName === 'serviceDate') {
        found = flat.find(s => s.tag === 'DTP' && (s.elements[0]?.value === '291' || s.elements[0]?.value === '472'));
    } else if (fieldName === 'claimId') {
        found = flat.find(s => s.tag === 'TRN' && s.elements[0]?.value === '1');
    } else if (fieldName === 'chargeAmount') {
        found = flat.find(s => s.tag === 'AMT' && s.elements[0]?.value === 'T3');
    } else if (fieldName === 'serviceTypeCode') {
        found = flat.find(s => s.tag === 'EQ');
    }

    if (found) {
        setSelectedSegment(found);
    }
  };

  // Generate Enriched JSON on the fly
  const enrichedJson = useMemo(() => {
    if (!doc) return '';

    const enrichSegment = (seg: EdiSegment): any => {
        const analysis = analyzeSegmentOffline(seg);
        return {
            tag: seg.tag,
            summary: analysis.summary,
            raw: seg.raw.trim(),
            elements: analysis.fields.map(f => ({
                id: f.code,
                name: f.description,
                value: f.value,
                definition: f.definition !== '-' ? f.definition : undefined
            })),
            children: seg.children && seg.children.length > 0 ? seg.children.map(enrichSegment) : undefined
        };
    };

    const structure = doc.segments.map(enrichSegment);
    return JSON.stringify(structure, null, 2);
  }, [doc]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-200">
      {/* Minimalist Top Bar */}
      <header className="flex-none h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 z-30 transition-colors duration-200">
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-black dark:bg-brand-500 rounded-sm flex items-center justify-center shadow-sm">
                    <span className="text-white font-mono font-bold text-xs">X12</span>
                </div>
                <span className="font-medium text-sm tracking-tight text-gray-900 dark:text-white">EDI Insight</span>
            </div>
            {doc?.transactionType && doc.transactionType !== 'Unknown' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-mono">
                    {doc.transactionType}
                </span>
            )}
        </div>
        
        <div className="flex items-center space-x-4">
          <nav className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-lg border border-gray-200 dark:border-slate-700">
             <NavTab 
                active={viewMode === 'inspector'} 
                onClick={() => setViewMode('inspector')}
                label="Inspector"
                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}
             />
             <NavTab 
                active={viewMode === 'json'} 
                onClick={() => setViewMode('json')}
                label="JSON"
                disabled={!doc}
                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
             />
             <NavTab 
                active={viewMode === 'raw'} 
                onClick={() => setViewMode('raw')}
                label="Editor"
                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
             />
             
             <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1"></div>
             
             <NavTab 
                active={viewMode === 'reference'} 
                onClick={() => setViewMode('reference')}
                label="Codes"
                icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
             />
          </nav>
          
          <div className="flex items-center gap-3">
             <button 
                onClick={handleClear}
                className="text-xs px-3 py-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-md text-gray-500 dark:text-slate-400 transition-colors font-medium"
                title="Clear All"
              >
                Clear
              </button>
              
              <div className="w-px h-4 bg-gray-200 dark:bg-slate-700"></div>

              <button 
                onClick={() => setViewMode('settings')}
                className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'settings' ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400 ring-1 ring-brand-200 dark:ring-brand-800' : 'text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                title="Settings"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Pane 1: Generator/Benefits/Claims (Resizable) - Hide if Fullscreen Mode */}
        {(viewMode !== 'reference' && viewMode !== 'settings') && (
            <div 
                className="flex-none bg-white dark:bg-slate-900 z-20 border-r border-gray-200 dark:border-slate-800 relative"
                style={{ width: sidebarWidth }}
            >
            <EdiGenerator 
                formData={formData} 
                onChange={handleFormChange}
                formData276={formData276}
                onChange276={handleForm276Change}
                transactionType={doc?.transactionType} 
                generatorMode={generatorMode}
                onSetGeneratorMode={handleGeneratorModeChange}
                benefits={benefits}
                claims={claims}
                selectedSegment={selectedSegment}
                onFieldFocus={handleFieldFocus}
            />
            </div>
        )}

        {/* Drag Handle - Hide if Fullscreen Mode */}
        {(viewMode !== 'reference' && viewMode !== 'settings') && (
            <div 
                className="flex-none w-1 -ml-1 cursor-col-resize z-30 relative group hover:bg-blue-500 transition-colors"
                onMouseDown={() => setIsResizing(true)}
            ></div>
        )}

        {/* Pane 2 & 3: Viewer Area */}
        <div className="flex-1 flex min-w-0 bg-white dark:bg-slate-950 relative">
          
          {/* Settings Mode Overrides Everything */}
          {viewMode === 'settings' ? (
              <div className="w-full h-full">
                  <Settings />
              </div>
          ) : viewMode === 'reference' ? (
              <div className="w-full h-full">
                  <CodeSearch />
              </div>
          ) : (
            <>
                {!doc && !rawEdi ? (
                    <div className="w-full h-full">
                    <DragDropInput onProcess={(txt) => {
                        setRawEdi(txt);
                        processEdi(txt, true);
                    }} />
                    </div>
                ) : (
                    <>
                        {viewMode === 'inspector' && (
                        <>
                            {/* Pane 2: Tree */}
                            <div className="w-1/3 min-w-[250px] max-w-sm border-r border-gray-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900">
                            {doc && (
                                <SegmentTree 
                                    segments={doc.segments} 
                                    selectedId={selectedSegment?.id || null} 
                                    onSelect={setSelectedSegment} 
                                />
                            )}
                            </div>

                            {/* Pane 3: Details */}
                            <div className="flex-1 bg-white dark:bg-slate-950 h-full overflow-hidden">
                            {selectedSegment ? (
                                <SegmentDetail segment={selectedSegment} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-300 dark:text-slate-600 text-sm">
                                Select a segment to view details
                                </div>
                            )}
                            </div>
                        </>
                        )}

                        {viewMode === 'raw' && (
                        /* Raw View */
                        <div className="w-full h-full bg-white dark:bg-slate-950 overflow-hidden flex flex-col relative">
                            <div className="absolute top-2 right-4 z-10">
                                <button
                                    onClick={() => handleCopy(rawEdi)}
                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 ${
                                        copyFeedback 
                                            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' 
                                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white shadow-sm'
                                    }`}
                                >
                                    {copyFeedback ? (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            <span>Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                            <textarea 
                                className="flex-1 w-full p-8 bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-200 font-mono text-sm resize-none focus:outline-none leading-relaxed custom-scrollbar"
                                value={rawEdi}
                                onChange={(e) => {
                                    setRawEdi(e.target.value);
                                    processEdi(e.target.value, true);
                                }}
                                spellCheck={false}
                            />
                        </div>
                        )}

                        {viewMode === 'json' && (
                            /* JSON View */
                            <div className="w-full h-full bg-white dark:bg-slate-950 overflow-hidden flex flex-col relative">
                                <div className="absolute top-2 right-4 z-10">
                                    <button
                                        onClick={() => handleCopy(enrichedJson)}
                                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 ${
                                            copyFeedback 
                                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' 
                                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white shadow-sm'
                                        }`}
                                    >
                                        {copyFeedback ? (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <span>Copy JSON</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-gray-50 dark:bg-slate-900">
                                    <pre className="text-xs font-mono text-gray-800 dark:text-slate-200 whitespace-pre-wrap">{enrichedJson}</pre>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </>
          )}
        </div>
      </div>

      {/* Floating Chat Interface */}
      {doc && viewMode !== 'reference' && viewMode !== 'settings' && <ChatInterface rawEdi={rawEdi} />}
    </div>
  );
}

export default App;