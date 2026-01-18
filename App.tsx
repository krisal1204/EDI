
import React, { useState, useEffect, useMemo } from 'react';
import { DragDropInput } from './components/DragDropInput';
import { SegmentTree } from './components/SegmentTree';
import { SegmentDetail } from './components/SegmentDetail';
import { EdiGenerator } from './components/EdiGenerator';
import { ChatInterface } from './components/ChatInterface';
import { CodeSearch } from './components/CodeSearch';
import { Settings } from './components/Settings';
import { Landing } from './components/Landing';
import { Guide } from './components/Guide';
import { JsonViewer } from './components/JsonViewer';
import { SendMessage } from './components/SendMessage';
import { RecordList } from './components/RecordList';
import { VisualReport } from './components/VisualReport';
import { parseEdi, flattenTree, replaceRecordInEdi, getRecordRaw, duplicateRecordInEdi, removeRecordFromEdi } from './services/ediParser';
import { EdiDocument, EdiSegment } from './types';
import { 
    FormData270, FormData276, FormData837, FormData834, FormData850, FormData810, FormData856, FormData278, FormData820,
    build270, build276, build837, build834, build850, build810, build856, build278, build820
} from './services/ediBuilder';
import { 
    mapEdiToForm, mapEdiToForm276, mapEdiToForm837, mapEdiToForm834, mapEdiToForm850, mapEdiToForm810, mapEdiToForm856, mapEdiToForm278, mapEdiToForm820,
    mapEdiToBenefits, BenefitRow, mapEdiToClaimStatus, ClaimStatusRow, mapEdiToRemittance, PaymentInfo, RemittanceClaim, mapEdiToOrder, OrderData 
} from './services/ediMapper';
import { analyzeSegmentOffline } from './services/offlineAnalyzer';
import { extractRecords, EdiRecord } from './services/recordService';
import { useAppStore } from './store/useAppStore';

const INITIAL_FORM_DATA: FormData270 = {
    payerName: 'CMS MEDICARE', payerId: 'CMS001', providerName: 'GENERAL HOSPITAL', providerNpi: '1234567890',
    subscriberFirstName: 'JOHN', subscriberLastName: 'DOE', subscriberId: 'MBI123456789', subscriberDob: '1955-05-12',
    serviceDate: new Date().toISOString().slice(0, 10), serviceTypeCodes: ['30'], hasDependent: false,
    dependentFirstName: 'JANE', dependentLastName: 'DOE', dependentDob: '2015-08-20', dependentGender: 'F'
};

const INITIAL_FORM_DATA_834: FormData834 = {
    sponsorName: 'ACME CORP', sponsorTaxId: '998877665', payerName: 'AETNA', payerId: '60054',
    maintenanceType: '021', maintenanceReason: '01', benefitStatus: '024', policyNumber: 'GROUP554433',
    coverageLevelCode: 'FAM', planEffectiveDate: new Date().toISOString().slice(0, 10),
    subscriber: { id: 'SUB123456', firstName: 'JOHN', lastName: 'DOE', ssn: '123456789', dob: '1980-01-01', gender: 'M', relationship: '18' },
    dependents: []
};

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

  const [currentPage, setCurrentPage] = useState<'landing' | 'workspace' | 'guide'>('landing');
  const [industry, setIndustry] = useState<'healthcare' | 'manufacturing'>('healthcare');

  // --- Form Data State ---
  const [formData, setFormData] = useState<FormData270>(INITIAL_FORM_DATA);
  const [formData276, setFormData276] = useState<FormData276>({} as any);
  const [formData837, setFormData837] = useState<FormData837>({} as any);
  const [formData834, setFormData834] = useState<FormData834>(INITIAL_FORM_DATA_834);
  const [formData278, setFormData278] = useState<FormData278>({} as any);
  const [formData820, setFormData820] = useState<FormData820>({} as any);
  const [formData850, setFormData850] = useState<FormData850>({} as any);
  const [formData810, setFormData810] = useState<FormData810>({} as any);
  const [formData856, setFormData856] = useState<FormData856>({} as any);
  
  const [rawEdi, setRawEdi] = useState<string>('');
  const [originalEdi, setOriginalEdi] = useState<string>(''); 
  const [doc, setDoc] = useState<EdiDocument | null>(null);
  
  const [records, setRecords] = useState<EdiRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<EdiSegment | null>(null);

  const [viewMode, setViewMode] = useState<'inspector' | 'visual' | 'raw' | 'json' | 'reference' | 'settings' | 'contact'>('inspector');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [jsonExpandMode, setJsonExpandMode] = useState<'auto' | 'expanded' | 'collapsed'>('auto');
  const [jsonViewKey, setJsonViewKey] = useState(0);
  const [jsonDisplayType, setJsonDisplayType] = useState<'structure' | 'simplified'>('structure');

  const [generatorMode, setGeneratorMode] = useState<'270' | '276' | '837' | '834' | '278' | '820' | '850' | '810' | '856'>('270');

  const [sidebarWidth, setSidebarWidth] = useState(700);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const handleLoadNewEdi = (edi: string) => {
      setRawEdi(edi);
      setOriginalEdi(edi);
      processEdi(edi, true);
  };

  const handleClearFile = () => {
      setDoc(null);
      setRawEdi('');
      setOriginalEdi('');
      setRecords([]);
      setSelectedRecordId(null);
      setSelectedSegment(null);
      
      // Reset all form states to ensure no cross-contamination
      setFormData(INITIAL_FORM_DATA);
      setFormData276({} as any);
      setFormData837({} as any);
      setFormData834(INITIAL_FORM_DATA_834);
      setFormData278({} as any);
      setFormData820({} as any);
      setFormData850({} as any);
      setFormData810({} as any);
      setFormData856({} as any);
      
      setViewMode('inspector');
  };

  const processEdi = (edi: string, shouldMapToForm: boolean, maintainSelectionIndex?: number) => {
    try {
      const parsed = parseEdi(edi);
      setDoc(parsed);
      const extracted = extractRecords(parsed);
      setRecords(extracted);
      
      let targetId = selectedRecordId;
      if (maintainSelectionIndex !== undefined) targetId = extracted[maintainSelectionIndex]?.id;
      else if (!targetId) targetId = extracted[0]?.id;
      setSelectedRecordId(targetId || null);

      if (shouldMapToForm) mapToForm(parsed, targetId);
    } catch (e) { console.error(e); }
  };

  const mapToForm = (parsed: EdiDocument, recordId?: string) => {
      const type = parsed.transactionType;
      
      // Clear current mode to avoid flickering wrong form
      // setGeneratorMode(type as any); 

      if (type === '270') {
          setFormData({ ...INITIAL_FORM_DATA, ...mapEdiToForm(parsed, recordId) });
          setGeneratorMode('270');
      } 
      else if (type === '276') {
          setFormData276({ ...mapEdiToForm276(parsed, recordId) } as any);
          setGeneratorMode('276');
      }
      else if (type === '837') {
          setFormData837({ ...mapEdiToForm837(parsed, recordId) } as any);
          setGeneratorMode('837');
      }
      else if (type === '834') {
          setFormData834({ ...INITIAL_FORM_DATA_834, ...mapEdiToForm834(parsed, recordId) });
          setGeneratorMode('834');
      }
      else if (type === '278') {
          setFormData278({ ...mapEdiToForm278(parsed) } as any);
          setGeneratorMode('278');
      }
      else if (type === '820') {
          setFormData820({ ...mapEdiToForm820(parsed) } as any);
          setGeneratorMode('820');
      }
      else if (type === '850') {
          setFormData850({ ...mapEdiToForm850(parsed) } as any);
          setGeneratorMode('850');
      }
      else if (type === '810') {
          setFormData810({ ...mapEdiToForm810(parsed) } as any);
          setGeneratorMode('810');
      }
      else if (type === '856') {
          setFormData856({ ...mapEdiToForm856(parsed) } as any);
          setGeneratorMode('856');
      }
  };

  const handleRecordSelect = (record: EdiRecord) => {
      const index = records.findIndex(r => r.id === record.id);
      processEdi(rawEdi || originalEdi, true, index);
  };

  // --- Form Change Handlers ---

  const handleFormChange = (newData: FormData270) => {
    setFormData(newData);
    const newEdi = build270(newData);
    const updated = replaceRecordInEdi(doc!, newEdi, selectedRecordId!);
    setRawEdi(updated);
    processEdi(updated, false);
  };

  const handleForm276Change = (newData: FormData276) => {
    setFormData276(newData);
    const newEdi = build276(newData);
    const updated = replaceRecordInEdi(doc!, newEdi, selectedRecordId!);
    setRawEdi(updated);
    processEdi(updated, false);
  };

  const handleForm837Change = (newData: FormData837) => {
    setFormData837(newData);
    const newEdi = build837(newData);
    const updated = replaceRecordInEdi(doc!, newEdi, selectedRecordId!);
    setRawEdi(updated);
    processEdi(updated, false);
  }

  const handleForm834Change = (newData: FormData834) => {
    setFormData834(newData);
    const newEdi = build834(newData);
    const updated = replaceRecordInEdi(doc!, newEdi, selectedRecordId!);
    setRawEdi(updated);
    processEdi(updated, false);
  }

  const handleForm278Change = (newData: FormData278) => {
    setFormData278(newData);
    const newEdi = build278(newData);
    const updated = replaceRecordInEdi(doc!, newEdi, selectedRecordId!);
    setRawEdi(updated);
    processEdi(updated, false);
  };

  const handleForm820Change = (newData: FormData820) => {
    setFormData820(newData);
    const newEdi = build820(newData);
    const updated = replaceRecordInEdi(doc!, newEdi, selectedRecordId!);
    setRawEdi(updated);
    processEdi(updated, false);
  };

  const handleForm850Change = (newData: FormData850) => {
    setFormData850(newData);
    const newEdi = build850(newData);
    const updated = replaceRecordInEdi(doc!, newEdi, selectedRecordId!);
    setRawEdi(updated);
    processEdi(updated, false);
  };

  const handleForm810Change = (newData: FormData810) => {
    setFormData810(newData);
    const newEdi = build810(newData);
    const updated = replaceRecordInEdi(doc!, newEdi, selectedRecordId!);
    setRawEdi(updated);
    processEdi(updated, false);
  };

  const handleForm856Change = (newData: FormData856) => {
    setFormData856(newData);
    const newEdi = build856(newData);
    const updated = replaceRecordInEdi(doc!, newEdi, selectedRecordId!);
    setRawEdi(updated);
    processEdi(updated, false);
  };

  const handleFieldFocus = (field: string) => {
      const el = document.getElementById(field);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
      }
  };

  if (currentPage === 'landing') {
      return (
        <Landing 
            onEnter={(ind) => { setCurrentPage('workspace'); setIndustry(ind); setViewMode('inspector'); }} 
            onContact={() => { setCurrentPage('workspace'); setViewMode('contact'); }} 
            onLearn={() => setCurrentPage('guide')} 
            onCodes={() => { setCurrentPage('workspace'); setViewMode('reference'); }}
        />
      );
  }

  if (currentPage === 'guide') return <Guide onBack={() => setCurrentPage('landing')} />;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-200 font-sans overflow-hidden transition-colors">
      <header className="flex-none h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 z-30">
        <div className="flex items-center space-x-4">
            <button onClick={() => setCurrentPage('landing')} className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-black dark:bg-brand-500 rounded-sm flex items-center justify-center">
                    <span className="text-white font-mono font-bold text-xs">X12</span>
                </div>
                <span className="font-medium text-sm tracking-tight text-gray-900 dark:text-white uppercase">EDI Insight</span>
            </button>
            {doc?.transactionType && (
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-mono">
                    {doc.transactionType}
                </span>
            )}
        </div>
        
        <nav className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-slate-800/80 rounded-lg">
             <NavTab active={viewMode === 'inspector'} onClick={() => setViewMode('inspector')} label="Inspector" icon="🔍" />
             <NavTab active={viewMode === 'visual'} onClick={() => setViewMode('visual')} label="Visual Report" disabled={!doc} icon="📄" />
             <NavTab active={viewMode === 'json'} onClick={() => setViewMode('json')} label="JSON" disabled={!doc} icon="{} " />
             <NavTab active={viewMode === 'raw'} onClick={() => setViewMode('raw')} label="Editor" icon="✏️" />
        </nav>

        <div className="flex items-center gap-3">
             {doc && (
                 <button 
                    onClick={handleClearFile}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1.5 rounded transition-colors"
                 >
                    New File
                 </button>
             )}
             <button onClick={() => setViewMode('settings')} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">⚙️</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {doc && ['inspector', 'visual', 'raw', 'json'].includes(viewMode) && (
            <div className="flex-none bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex" style={{ width: sidebarWidth }}>
                <RecordList records={records} selectedId={selectedRecordId} onSelect={handleRecordSelect} onResetAll={() => {}} onResetRecord={() => {}} isModified={false} />
                <div className="flex-1 overflow-hidden">
                    <EdiGenerator 
                        formData={formData} onChange={handleFormChange}
                        formData276={formData276} onChange276={handleForm276Change}
                        formData837={formData837} onChange837={handleForm837Change}
                        formData834={formData834} onChange834={handleForm834Change}
                        formData278={formData278} onChange278={handleForm278Change}
                        formData820={formData820} onChange820={handleForm820Change}
                        formData850={formData850} onChange850={handleForm850Change}
                        formData810={formData810} onChange810={handleForm810Change}
                        formData856={formData856} onChange856={handleForm856Change}
                        generatorMode={generatorMode} onSetGeneratorMode={m => setGeneratorMode(m)}
                        transactionType={doc.transactionType}
                        benefits={[]} claims={[]} selectedSegment={null} onFieldFocus={() => {}} 
                    />
                </div>
            </div>
        )}

        <div className="flex-1 flex min-w-0 bg-white dark:bg-slate-950 relative">
          
          {viewMode === 'settings' && <Settings />}
          {viewMode === 'reference' && <CodeSearch />}
          {viewMode === 'contact' && <SendMessage />}

          {['inspector', 'visual', 'raw', 'json'].includes(viewMode) && (
              !doc ? (
                <div className="w-full h-full">
                    <DragDropInput onProcess={handleLoadNewEdi} industry={industry} />
                </div>
              ) : (
                <>
                    {viewMode === 'inspector' && (
                        <div className="flex w-full h-full">
                            <div className="w-1/3 min-w-[250px] border-r border-gray-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900">
                                <SegmentTree 
                                    segments={doc.segments} 
                                    selectedId={selectedSegment?.id || null} 
                                    onSelect={setSelectedSegment} 
                                />
                            </div>
                            <div className="flex-1 bg-white dark:bg-slate-950 h-full overflow-hidden">
                                {selectedSegment ? (
                                    <SegmentDetail segment={selectedSegment} />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-300 dark:text-slate-600 text-sm">Select a segment to view details</div>
                                )}
                            </div>
                        </div>
                    )}
                    {viewMode === 'visual' && <VisualReport doc={doc} selectedRecordId={selectedRecordId} onFieldFocus={handleFieldFocus} />}
                    {viewMode === 'json' && (
                        <div className="p-8 h-full overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950">
                            <JsonViewer data={doc} initiallyOpen={true} />
                        </div>
                    )}
                    {viewMode === 'raw' && (
                        <textarea 
                            className="flex-1 w-full p-8 bg-white dark:bg-slate-950 text-gray-800 dark:text-slate-200 font-mono text-sm resize-none outline-none leading-relaxed h-full" 
                            value={rawEdi} 
                            onChange={(e) => { setRawEdi(e.target.value); processEdi(e.target.value, true); }} 
                            spellCheck={false} 
                        />
                    )}
                </>
              )
          )}
        </div>
      </div>
      {doc && <ChatInterface rawEdi={rawEdi} />}
    </div>
  );
}

export default App;
