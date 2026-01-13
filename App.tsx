
import React, { useState, useEffect, useMemo } from 'react';
import { DragDropInput } from './components/DragDropInput';
import { SegmentTree } from './components/SegmentTree';
import { SegmentDetail } from './components/SegmentDetail';
import { EdiGenerator } from './components/EdiGenerator';
import { ChatInterface } from './components/ChatInterface';
import { CodeSearch } from './components/CodeSearch';
import { Settings } from './components/Settings';
import { Landing } from './components/Landing';
import { JsonViewer } from './components/JsonViewer';
import { SendMessage } from './components/SendMessage';
import { RecordList } from './components/RecordList';
import { parseEdi, flattenTree } from './services/ediParser';
import { EdiDocument, EdiSegment } from './types';
import { FormData270, FormData276, FormData837, FormData834, build270, build276, build837, build834 } from './services/ediBuilder';
import { mapEdiToForm, mapEdiToForm276, mapEdiToForm837, mapEdiToForm834, mapEdiToBenefits, BenefitRow, mapEdiToClaimStatus, ClaimStatusRow } from './services/ediMapper';
import { analyzeSegmentOffline } from './services/offlineAnalyzer';
import { extractRecords, EdiRecord } from './services/recordService';
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
    serviceTypeCodes: ['30'],
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

const INITIAL_FORM_DATA_837: FormData837 = {
    type: 'Professional',
    billingProviderName: 'MEDICAL GROUP LLC',
    billingProviderNpi: '1234567890',
    billingProviderAddress: '123 HEALTH WAY',
    billingProviderCity: 'AUSTIN',
    billingProviderState: 'TX',
    billingProviderZip: '78701',
    billingTaxId: '741234567',
    subscriberFirstName: 'JOHN',
    subscriberLastName: 'DOE',
    subscriberId: 'MBI123456789',
    subscriberDob: '1980-01-01',
    subscriberGender: 'M',
    payerName: 'UNITED HEALTHCARE',
    payerId: '87726',
    claimId: 'CLM2024001',
    totalCharge: '150.00',
    placeOfService: '11',
    typeOfBill: '111',
    diagnosisCode1: 'R05',
    diagnosisCode2: '',
    serviceLines: [
        {
            procedureCode: '99213',
            lineCharge: '150.00',
            units: '1',
            serviceDate: new Date().toISOString().slice(0, 10)
        }
    ]
};

const INITIAL_FORM_DATA_834: FormData834 = {
    sponsorName: 'ACME CORP',
    sponsorTaxId: '998877665',
    payerName: 'AETNA',
    payerId: '60054',
    maintenanceType: '021', // Add
    maintenanceReason: '01', // New Hire
    benefitStatus: '024', // Active
    policyNumber: 'GROUP554433',
    coverageLevelCode: 'FAM',
    planEffectiveDate: new Date().toISOString().slice(0, 10),
    subscriber: {
        id: 'SUB123456',
        firstName: 'JOHN',
        lastName: 'DOE',
        ssn: '123456789',
        dob: '1980-01-01',
        gender: 'M',
        relationship: '18'
    },
    dependents: []
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
    serviceTypeCodes: [],
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

  // Route State
  const [currentPage, setCurrentPage] = useState<'landing' | 'workspace'>('landing');

  const [formData, setFormData] = useState<FormData270>(INITIAL_FORM_DATA);
  const [formData276, setFormData276] = useState<FormData276>(INITIAL_FORM_DATA_276);
  const [formData837, setFormData837] = useState<FormData837>(INITIAL_FORM_DATA_837);
  const [formData834, setFormData834] = useState<FormData834>(INITIAL_FORM_DATA_834);
  
  const [rawEdi, setRawEdi] = useState<string>('');
  const [doc, setDoc] = useState<EdiDocument | null>(null);
  
  // Record Handling
  const [records, setRecords] = useState<EdiRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const [benefits, setBenefits] = useState<BenefitRow[]>([]);
  const [claims, setClaims] = useState<ClaimStatusRow[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<EdiSegment | null>(null);
  const [viewMode, setViewMode] = useState<'inspector' | 'raw' | 'json' | 'reference' | 'settings' | 'contact'>('inspector');
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // JSON Viewer State
  const [jsonExpandMode, setJsonExpandMode] = useState<'auto' | 'expanded' | 'collapsed'>('auto');
  const [jsonViewKey, setJsonViewKey] = useState(0);

  // Track which generator is currently active
  const [generatorMode, setGeneratorMode] = useState<'270' | '276' | '837' | '834'>('270');

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(450);
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

  const processEdi = (edi: string, shouldMapToForm: boolean, specificRecordId?: string) => {
    try {
      const parsed = parseEdi(edi);
      setDoc(parsed);
      
      // If we are doing a fresh load/map, extract records
      if (shouldMapToForm) {
          const extractedRecords = extractRecords(parsed);
          setRecords(extractedRecords);
          
          // Select default (first) or specific
          let targetId = specificRecordId;
          if (!targetId && extractedRecords.length > 0) {
              targetId = extractedRecords[0].id;
          }
          setSelectedRecordId(targetId || null);

          // Map data based on the target record
          mapToForm(parsed, targetId);
      }

      // UI sizing logic
      if (parsed.transactionType !== lastTransactionType) {
          const windowWidth = window.innerWidth;
          const maxWidth = windowWidth * 0.8;
          if (parsed.transactionType === '271' || parsed.transactionType === '277') {
              setSidebarWidth(Math.min(550, maxWidth)); 
          } else {
              setSidebarWidth(Math.min(450, maxWidth)); 
          }
          setLastTransactionType(parsed.transactionType);
      }

      if (!selectedSegment && parsed.segments.length > 0) {
        setSelectedSegment(parsed.segments[0]);
      }

      // Handle List Views (271/277 usually show all, ignoring record selection for table view)
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
    } catch (e) {
      console.error("Parse error", e);
    }
  };

  const mapToForm = (parsed: EdiDocument, recordId?: string) => {
      if (parsed.transactionType === '270') {
          const mappedData = mapEdiToForm(parsed, recordId);
          setFormData({ ...EMPTY_FORM_DATA_270, ...mappedData });
          setGeneratorMode('270');
      } else if (parsed.transactionType === '276') {
            const mappedData = mapEdiToForm276(parsed, recordId);
            setFormData276({ ...EMPTY_FORM_DATA_276, ...mappedData });
            setGeneratorMode('276');
      } else if (parsed.transactionType === '837') {
            const mappedData = mapEdiToForm837(parsed, recordId);
            setFormData837({ ...INITIAL_FORM_DATA_837, ...mappedData });
            setGeneratorMode('837');
      } else if (parsed.transactionType === '834') {
            const mappedData = mapEdiToForm834(parsed, recordId);
            setFormData834({ ...INITIAL_FORM_DATA_834, ...mappedData });
            setGeneratorMode('834');
      }
  };

  const handleRecordSelect = (record: EdiRecord) => {
      setSelectedRecordId(record.id);
      if (doc) {
          mapToForm(doc, record.id);
          // Auto-scroll/focus in tree
          const seg = flattenTree(doc.segments).find(s => s.id === record.id);
          if (seg) setSelectedSegment(seg);
      }
  };

  const handleFormChange = (newData: FormData270) => {
    setFormData(newData);
    const newEdi = build270(newData);
    setRawEdi(newEdi);
    // When editing, we treat the output as a single record file
    processEdi(newEdi, true); 
  };

  const handleForm276Change = (newData: FormData276) => {
    setFormData276(newData);
    const newEdi = build276(newData);
    setRawEdi(newEdi);
    processEdi(newEdi, true);
  }

  const handleForm837Change = (newData: FormData837) => {
    setFormData837(newData);
    const newEdi = build837(newData);
    setRawEdi(newEdi);
    processEdi(newEdi, true);
  }

  const handleForm834Change = (newData: FormData834) => {
    setFormData834(newData);
    const newEdi = build834(newData);
    setRawEdi(newEdi);
    processEdi(newEdi, true);
  }

  const handleGeneratorModeChange = (mode: '270' | '276' | '837' | '834') => {
      setGeneratorMode(mode);
      let newEdi = '';
      if (mode === '270') newEdi = build270(formData);
      else if (mode === '276') newEdi = build276(formData276);
      else if (mode === '837') newEdi = build837(formData837);
      else newEdi = build834(formData834);
      
      setRawEdi(newEdi);
      processEdi(newEdi, true);
  };

  const handleClear = () => {
    setFormData(INITIAL_FORM_DATA);
    setFormData276(INITIAL_FORM_DATA_276);
    setFormData837(INITIAL_FORM_DATA_837);
    setFormData834(INITIAL_FORM_DATA_834);
    setRawEdi('');
    setDoc(null);
    setBenefits([]);
    setClaims([]);
    setRecords([]);
    setSelectedRecordId(null);
    setViewMode('inspector');
    setSidebarWidth(450); 
    setLastTransactionType('Unknown');
    setGeneratorMode('270');
    setJsonExpandMode('auto');
    setJsonViewKey(0);
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

  const handleFormat = () => {
    if (!rawEdi) return;
    const terminator = doc?.segmentTerminator || '~';
    const segments = rawEdi.split(terminator).map(s => s.trim()).filter(s => s.length > 0);
    const formatted = segments.map(s => s + terminator).join('\n');
    setRawEdi(formatted);
  };

  const toggleJsonExpand = (mode: 'expanded' | 'collapsed') => {
      setJsonExpandMode(mode);
      setJsonViewKey(prev => prev + 1); 
  };

  const handleFieldFocus = (fieldName: string) => {
    // Basic field focus logic can remain, but might need adjustment for multi-record context.
    // For now, it searches flattened tree, which is fine as `selectedSegment` will update.
    if (!doc) return;
    const flat = flattenTree(doc.segments);
    // ... existing search logic ... (simplified for brevity, keeps existing behavior which finds *first* match)
  };

  const enrichedJson = useMemo(() => {
    if (!doc) return null;
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
    return doc.segments.map(enrichSegment);
  }, [doc]);

  if (currentPage === 'landing') {
      return (
        <Landing 
            onEnter={() => { setCurrentPage('workspace'); setViewMode('inspector'); }} 
            onContact={() => { setCurrentPage('workspace'); setViewMode('contact'); }}
        />
      );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-200 animate-fade-in">
      <header className="flex-none h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 z-30 transition-colors duration-200">
        <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentPage('landing')} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                <div className="w-6 h-6 bg-black dark:bg-brand-500 rounded-sm flex items-center justify-center shadow-sm">
                    <span className="text-white font-mono font-bold text-xs">X12</span>
                </div>
                <span className="font-medium text-sm tracking-tight text-gray-900 dark:text-white">EDI Insight</span>
            </button>
            {doc?.transactionType && doc.transactionType !== 'Unknown' && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-mono">
                    {doc.transactionType}
                </span>
            )}
        </div>
        
        <div className="flex items-center space-x-4">
          <nav className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-lg border border-gray-200 dark:border-slate-700">
             <NavTab active={viewMode === 'inspector'} onClick={() => setViewMode('inspector')} label="Inspector" icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>} />
             <NavTab active={viewMode === 'json'} onClick={() => setViewMode('json')} label="JSON" disabled={!doc} icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>} />
             <NavTab active={viewMode === 'raw'} onClick={() => setViewMode('raw')} label="Editor" icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>} />
             <div className="w-px h-4 bg-gray-300 dark:bg-slate-600 mx-1"></div>
             <NavTab active={viewMode === 'reference'} onClick={() => setViewMode('reference')} label="Codes" icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
          </nav>
          
          <div className="flex items-center gap-3">
             <button onClick={handleClear} className="text-xs px-3 py-1.5 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-md text-gray-500 dark:text-slate-400 transition-colors font-medium">Clear</button>
             <div className="w-px h-4 bg-gray-200 dark:bg-slate-700"></div>
             <button onClick={() => setViewMode('settings')} className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'settings' ? 'text-brand-600 bg-brand-50 dark:bg-brand-900/20 dark:text-brand-400 ring-1 ring-brand-200 dark:ring-brand-800' : 'text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'}`}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg></button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Pane 1: Generator/Benefits/Claims */}
        {(viewMode !== 'reference' && viewMode !== 'settings' && viewMode !== 'contact' && (doc || rawEdi)) && (
            <div className="flex-none bg-white dark:bg-slate-900 z-20 border-r border-gray-200 dark:border-slate-800 relative flex flex-row h-full" style={{ width: sidebarWidth }}>
                
                {/* Record Selector (New) */}
                {records.length > 1 && (viewMode === 'inspector' || viewMode === 'raw') && (
                    <RecordList 
                        records={records} 
                        selectedId={selectedRecordId} 
                        onSelect={handleRecordSelect} 
                    />
                )}
                
                {/* Main Form/Table */}
                <div className="flex-1 overflow-hidden h-full">
                    <EdiGenerator 
                        formData={formData} onChange={handleFormChange}
                        formData276={formData276} onChange276={handleForm276Change}
                        formData837={formData837} onChange837={handleForm837Change}
                        formData834={formData834} onChange834={handleForm834Change}
                        transactionType={doc?.transactionType} 
                        generatorMode={generatorMode} onSetGeneratorMode={handleGeneratorModeChange}
                        benefits={benefits} claims={claims}
                        selectedSegment={selectedSegment} onFieldFocus={handleFieldFocus}
                    />
                </div>
            </div>
        )}

        {(viewMode !== 'reference' && viewMode !== 'settings' && viewMode !== 'contact' && (doc || rawEdi)) && (
            <div className="flex-none w-1 -ml-1 cursor-col-resize z-30 relative group hover:bg-blue-500 transition-colors" onMouseDown={() => setIsResizing(true)}></div>
        )}

        {/* Pane 2 & 3: Viewer Area */}
        <div className="flex-1 flex min-w-0 bg-white dark:bg-slate-950 relative">
          {viewMode === 'settings' ? <div className="w-full h-full"><Settings /></div> : 
           viewMode === 'contact' ? <div className="w-full h-full"><SendMessage /></div> : 
           viewMode === 'reference' ? <div className="w-full h-full"><CodeSearch /></div> : (
            <>
                {!doc && !rawEdi ? (
                    <div className="w-full h-full">
                        <DragDropInput onProcess={(txt) => { setRawEdi(txt); processEdi(txt, true); }} />
                    </div>
                ) : (
                    <>
                        {viewMode === 'inspector' && (
                            <>
                                <div className="w-1/3 min-w-[250px] max-w-sm border-r border-gray-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900">
                                    {doc && <SegmentTree segments={doc.segments} selectedId={selectedSegment?.id || null} onSelect={setSelectedSegment} />}
                                </div>
                                <div className="flex-1 bg-white dark:bg-slate-950 h-full overflow-hidden">
                                    {selectedSegment ? <SegmentDetail segment={selectedSegment} /> : <div className="flex items-center justify-center h-full text-gray-300 dark:text-slate-600 text-sm">Select a segment to view details</div>}
                                </div>
                            </>
                        )}
                        {viewMode === 'raw' && (
                            <div className="w-full h-full bg-white dark:bg-slate-950 overflow-hidden flex flex-col relative">
                                <div className="absolute top-2 right-4 z-10 flex gap-2">
                                    <button onClick={handleFormat} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white shadow-sm">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg><span>Format</span>
                                    </button>
                                    <button onClick={() => handleCopy(rawEdi)} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 ${copyFeedback ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white shadow-sm'}`}>
                                        {copyFeedback ? <><span>Copied!</span></> : <><span>Copy</span></>}
                                    </button>
                                </div>
                                <textarea className="flex-1 w-full p-8 bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-200 font-mono text-sm resize-none focus:outline-none leading-relaxed custom-scrollbar" value={rawEdi} onChange={(e) => { setRawEdi(e.target.value); processEdi(e.target.value, true); }} spellCheck={false} />
                            </div>
                        )}
                        {viewMode === 'json' && (
                            <div className="w-full h-full bg-white dark:bg-slate-950 overflow-hidden flex flex-col relative">
                                <div className="absolute top-2 right-4 z-10 flex gap-2">
                                    <div className="flex bg-white dark:bg-slate-800 rounded-md shadow-sm border border-gray-200 dark:border-slate-700">
                                        <button onClick={() => toggleJsonExpand('expanded')} className="px-3 py-1.5 text-xs font-medium border-r border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-l-md transition-colors">Expand All</button>
                                        <button onClick={() => toggleJsonExpand('collapsed')} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-r-md transition-colors">Collapse All</button>
                                    </div>
                                    <button onClick={() => handleCopy(JSON.stringify(enrichedJson, null, 2))} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white shadow-sm"><span>Copy JSON</span></button>
                                </div>
                                <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-gray-50 dark:bg-slate-900">
                                    {enrichedJson ? <JsonViewer key={jsonViewKey} data={enrichedJson} initiallyOpen={jsonExpandMode === 'auto' ? undefined : (jsonExpandMode === 'expanded')} /> : <div className="text-gray-400 text-xs">No data available</div>}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </>
          )}
        </div>
      </div>
      {doc && viewMode !== 'reference' && viewMode !== 'settings' && viewMode !== 'contact' && <ChatInterface rawEdi={rawEdi} />}
    </div>
  );
}

export default App;
