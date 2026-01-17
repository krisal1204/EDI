
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
import { OrderTable } from './components/OrderTable';
import { parseEdi, flattenTree, replaceRecordInEdi, getRecordRaw, duplicateRecordInEdi, removeRecordFromEdi } from './services/ediParser';
import { EdiDocument, EdiSegment } from './types';
import { 
    FormData270, FormData276, FormData837, FormData834, FormData850, FormData810, FormData856,
    build270, build276, build837, build834, build850, build810, build856
} from './services/ediBuilder';
import { 
    mapEdiToForm, mapEdiToForm276, mapEdiToForm837, mapEdiToForm834, mapEdiToForm850, mapEdiToForm810, mapEdiToForm856,
    mapEdiToBenefits, BenefitRow, mapEdiToClaimStatus, ClaimStatusRow, mapEdiToRemittance, PaymentInfo, RemittanceClaim, mapEdiToOrder, OrderData 
} from './services/ediMapper';
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

const INITIAL_FORM_DATA_850: FormData850 = {
    poNumber: 'PO-2024-001',
    poDate: new Date().toISOString().slice(0, 10),
    buyerName: 'AUTO MANUFACTURER LLC',
    buyerId: 'MFG001',
    sellerName: 'ACME SUPPLIES INC',
    sellerId: 'SUP001',
    shipToName: 'PLANT A',
    shipToAddress: '123 INDUSTRIAL BLVD',
    shipToCity: 'DETROIT',
    shipToState: 'MI',
    shipToZip: '48201',
    lines: [
        { lineNo: '1', qty: '100', uom: 'EA', price: '12.50', partNumber: 'P100-55', description: 'STEEL BOLTS 5MM' }
    ]
};

const INITIAL_FORM_DATA_810: FormData810 = {
    invoiceNumber: 'INV-998877',
    invoiceDate: new Date().toISOString().slice(0, 10),
    poNumber: 'PO-2024-001',
    buyerName: 'AUTO MANUFACTURER LLC',
    buyerId: 'MFG001',
    sellerName: 'ACME SUPPLIES INC',
    sellerId: 'SUP001',
    lines: [
        { lineNo: '1', qty: '100', uom: 'EA', price: '12.50', partNumber: 'P100-55', description: 'STEEL BOLTS 5MM' }
    ]
};

const INITIAL_FORM_DATA_856: FormData856 = {
    shipmentId: 'SHIP-5544',
    shipDate: new Date().toISOString().slice(0, 10),
    shipTime: '0900',
    carrierCode: 'UPS',
    trackingNumber: '1Z9999999999',
    sellerName: 'ACME SUPPLIES INC',
    sellerId: 'SUP001',
    shipToName: 'PLANT A',
    shipToAddress: '123 INDUSTRIAL BLVD',
    shipToCity: 'DETROIT',
    shipToState: 'MI',
    shipToZip: '48201',
    lines: [
        { lineNo: '1', poNumber: 'PO-2023-001', partNumber: 'P100-55', qty: '100', uom: 'EA' }
    ]
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
  const [currentPage, setCurrentPage] = useState<'landing' | 'workspace' | 'guide'>('landing');
  const [industry, setIndustry] = useState<'healthcare' | 'manufacturing'>('healthcare');

  const [formData, setFormData] = useState<FormData270>(INITIAL_FORM_DATA);
  const [formData276, setFormData276] = useState<FormData276>(INITIAL_FORM_DATA_276);
  const [formData837, setFormData837] = useState<FormData837>(INITIAL_FORM_DATA_837);
  const [formData834, setFormData834] = useState<FormData834>(INITIAL_FORM_DATA_834);
  const [formData850, setFormData850] = useState<FormData850>(INITIAL_FORM_DATA_850);
  const [formData810, setFormData810] = useState<FormData810>(INITIAL_FORM_DATA_810);
  const [formData856, setFormData856] = useState<FormData856>(INITIAL_FORM_DATA_856);
  
  const [rawEdi, setRawEdi] = useState<string>('');
  const [originalEdi, setOriginalEdi] = useState<string>(''); // Persist original loaded file for restoration
  const [doc, setDoc] = useState<EdiDocument | null>(null);
  
  // Record Handling
  const [records, setRecords] = useState<EdiRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  const [benefits, setBenefits] = useState<BenefitRow[]>([]);
  const [claims, setClaims] = useState<ClaimStatusRow[]>([]);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  
  // 835 Data
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [remittanceClaims, setRemittanceClaims] = useState<RemittanceClaim[]>([]);

  const [selectedSegment, setSelectedSegment] = useState<EdiSegment | null>(null);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<'inspector' | 'raw' | 'json' | 'reference' | 'settings' | 'contact'>('inspector');
  const [copyFeedback, setCopyFeedback] = useState(false);
  
  // JSON Viewer State
  const [jsonExpandMode, setJsonExpandMode] = useState<'auto' | 'expanded' | 'collapsed'>('auto');
  const [jsonViewKey, setJsonViewKey] = useState(0);
  const [jsonDisplayType, setJsonDisplayType] = useState<'structure' | 'simplified'>('structure');

  // Track which generator is currently active
  const [generatorMode, setGeneratorMode] = useState<'270' | '276' | '837' | '834' | '850' | '810' | '856'>('270');

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(700);
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

  const handleLoadNewEdi = (edi: string) => {
      setRawEdi(edi);
      setOriginalEdi(edi);
      processEdi(edi, true);
  };

  const processEdi = (edi: string, shouldMapToForm: boolean, specificRecordId?: string, maintainSelectionIndex?: number) => {
    try {
      const parsed = parseEdi(edi);
      setDoc(parsed);
      
      // Always extract records to reflect any changes in the EDI file (labels, etc)
      const extractedRecords = extractRecords(parsed);
      setRecords(extractedRecords);
      
      let targetId = specificRecordId;

      // Handle selection persistence logic
      if (maintainSelectionIndex !== undefined && maintainSelectionIndex >= 0 && maintainSelectionIndex < extractedRecords.length) {
          // If we edited a record, IDs change, so we try to select by index to keep user context
          targetId = extractedRecords[maintainSelectionIndex].id;
      } else if (!targetId && extractedRecords.length > 0) {
          // Default to first
          targetId = extractedRecords[0].id;
      }

      // Update Selection
      setSelectedRecordId(targetId || null);

      // Only Map to Form if requested (e.g. on new load or explicit record switch)
      if (shouldMapToForm) {
          mapToForm(parsed, targetId);
          
          if (targetId) {
              const flat = flattenTree(parsed.segments);
              const seg = flat.find(s => s.id === targetId);
              if (seg) setSelectedSegment(seg);
          }
      }

      // UI sizing logic
      if (parsed.transactionType !== lastTransactionType) {
          const windowWidth = window.innerWidth;
          const maxWidth = windowWidth * 0.8;
          if (['271', '277', '835', '850', '810', '856'].includes(parsed.transactionType)) {
              setSidebarWidth(Math.min(750, maxWidth)); 
          } else {
              setSidebarWidth(Math.min(700, maxWidth)); 
          }
          setLastTransactionType(parsed.transactionType);
      }

      if (!selectedSegment && parsed.segments.length > 0) {
        setSelectedSegment(parsed.segments[0]);
      }

      // Reset all view states
      setBenefits([]);
      setClaims([]);
      setRemittanceClaims([]);
      setOrderData(null);

      // Handle List Views
      if (parsed.transactionType === '271') {
          setBenefits(mapEdiToBenefits(parsed));
      } else if (parsed.transactionType === '277') {
          setClaims(mapEdiToClaimStatus(parsed));
      } else if (parsed.transactionType === '835') {
          const { info, claims } = mapEdiToRemittance(parsed);
          setPaymentInfo(info);
          setRemittanceClaims(claims);
      } else if (['850', '810', '856'].includes(parsed.transactionType)) {
          setOrderData(mapEdiToOrder(parsed));
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
      } else if (parsed.transactionType === '850') {
            const mappedData = mapEdiToForm850(parsed);
            setFormData850({ ...INITIAL_FORM_DATA_850, ...mappedData });
            setGeneratorMode('850');
      } else if (parsed.transactionType === '810') {
            const mappedData = mapEdiToForm810(parsed);
            setFormData810({ ...INITIAL_FORM_DATA_810, ...mappedData });
            setGeneratorMode('810');
      } else if (parsed.transactionType === '856') {
            const mappedData = mapEdiToForm856(parsed);
            setFormData856({ ...INITIAL_FORM_DATA_856, ...mappedData });
            setGeneratorMode('856');
      }
  };

  const handleRecordSelect = (record: EdiRecord) => {
      const index = records.findIndex(r => r.id === record.id);
      const ediToUse = rawEdi || originalEdi;
      processEdi(ediToUse, true, undefined, index !== -1 ? index : undefined);
  };

  const resetState = () => {
    setFormData(INITIAL_FORM_DATA);
    setFormData276(INITIAL_FORM_DATA_276);
    setFormData837(INITIAL_FORM_DATA_837);
    setFormData834(INITIAL_FORM_DATA_834);
    setFormData850(INITIAL_FORM_DATA_850);
    setFormData810(INITIAL_FORM_DATA_810);
    setFormData856(INITIAL_FORM_DATA_856);
    setRawEdi('');
    setOriginalEdi('');
    setDoc(null);
    setBenefits([]);
    setClaims([]);
    setRecords([]);
    setPaymentInfo(null);
    setRemittanceClaims([]);
    setOrderData(null);
    setSelectedRecordId(null);
    setHighlightedField(null);
    setJsonExpandMode('auto');
    setJsonViewKey(0);
    setJsonDisplayType('structure');
  };

  const handleResetAll = () => {
     if (originalEdi) {
         setRawEdi(originalEdi);
         processEdi(originalEdi, true);
     }
  };

  const handleResetRecord = (index: number) => {
      if (!originalEdi || !doc || index < 0) return;
      const origDoc = parseEdi(originalEdi);
      const origRecords = extractRecords(origDoc);
      if (index >= origRecords.length) return; 
      
      const origRecordId = origRecords[index].id;
      const origRaw = getRecordRaw(origDoc, origRecordId);

      if (index >= records.length) return;
      const currentRecordId = records[index].id;

      const updatedEdi = replaceRecordInEdi(doc, origRaw, currentRecordId);
      
      setRawEdi(updatedEdi);
      processEdi(updatedEdi, true, undefined, index);
  };

  const handleAddRecord = () => {
      if (!doc || records.length === 0) return;
      const idToDuplicate = selectedRecordId || records[records.length - 1].id;
      const newEdi = duplicateRecordInEdi(doc, idToDuplicate);
      setRawEdi(newEdi);
      const currentIdx = records.findIndex(r => r.id === idToDuplicate);
      const newIdx = currentIdx !== -1 ? currentIdx + 1 : records.length;
      processEdi(newEdi, true, undefined, newIdx);
  };

  const handleDeleteRecord = (index: number) => {
      if (!doc || index < 0 || index >= records.length) return;
      const idToDelete = records[index].id;
      const newEdi = removeRecordFromEdi(doc, idToDelete);
      setRawEdi(newEdi);
      let newSelectionIndex = index;
      if (newSelectionIndex >= records.length - 1) newSelectionIndex = records.length - 2;
      if (newSelectionIndex < 0) newSelectionIndex = 0;
      processEdi(newEdi, true, undefined, newSelectionIndex);
  };

  const updateEdiWithFormChange = (newSingleRecordEdi: string) => {
      if (!doc || !selectedRecordId) {
          setRawEdi(newSingleRecordEdi);
          processEdi(newSingleRecordEdi, false);
          return;
      }
      const currentIndex = records.findIndex(r => r.id === selectedRecordId);
      const updatedEdi = replaceRecordInEdi(doc, newSingleRecordEdi, selectedRecordId);
      setRawEdi(updatedEdi);
      processEdi(updatedEdi, false, undefined, currentIndex);
  };

  const handleFormChange = (newData: FormData270) => {
    setFormData(newData);
    const newEdi = build270(newData);
    updateEdiWithFormChange(newEdi);
  };

  const handleForm276Change = (newData: FormData276) => {
    setFormData276(newData);
    const newEdi = build276(newData);
    updateEdiWithFormChange(newEdi);
  }

  const handleForm837Change = (newData: FormData837) => {
    setFormData837(newData);
    const newEdi = build837(newData);
    updateEdiWithFormChange(newEdi);
  }

  const handleForm834Change = (newData: FormData834) => {
    setFormData834(newData);
    const newEdi = build834(newData);
    updateEdiWithFormChange(newEdi);
  }

  const handleForm850Change = (newData: FormData850) => {
    setFormData850(newData);
    const newEdi = build850(newData);
    setRawEdi(newEdi);
    processEdi(newEdi, false); 
  };

  const handleForm810Change = (newData: FormData810) => {
    setFormData810(newData);
    const newEdi = build810(newData);
    setRawEdi(newEdi);
    processEdi(newEdi, false);
  };

  const handleForm856Change = (newData: FormData856) => {
    setFormData856(newData);
    const newEdi = build856(newData);
    setRawEdi(newEdi);
    processEdi(newEdi, false);
  };

  const handleGeneratorModeChange = (mode: '270' | '276' | '837' | '834' | '850' | '810' | '856') => {
      setGeneratorMode(mode);
      let newEdi = '';
      if (mode === '270') newEdi = build270(formData);
      else if (mode === '276') newEdi = build276(formData276);
      else if (mode === '837') newEdi = build837(formData837);
      else if (mode === '834') newEdi = build834(formData834);
      else if (mode === '850') newEdi = build850(formData850);
      else if (mode === '810') newEdi = build810(formData810);
      else if (mode === '856') newEdi = build856(formData856);
      
      setRawEdi(newEdi);
      processEdi(newEdi, false);
  };

  const handleClear = () => {
    resetState();
    setGeneratorMode(industry === 'manufacturing' ? '850' : '270');
    setViewMode('inspector');
    setSidebarWidth(700); 
    setLastTransactionType('Unknown');
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

  // --- Bi-directional Sync Logic ---

  // 1. Structure -> Form
  useEffect(() => {
      if (!selectedSegment || !doc) return;
      
      const flat = flattenTree(doc.segments);
      const segmentIdx = flat.findIndex(s => s.id === selectedSegment.id);
      if (segmentIdx === -1) return;

      // Find which record this segment belongs to
      let foundRecord: EdiRecord | undefined;
      for (const rec of records) {
          if (segmentIdx >= rec.startIndex) {
              foundRecord = rec;
          } else {
              break;
          }
      }

      if (foundRecord && foundRecord.id !== selectedRecordId) {
          // Switch record context
          handleRecordSelect(foundRecord);
          // Wait for render cycle potentially? The logic below might need the new form state.
          // However, mapping happens synchronously in processEdi/handleRecordSelect.
      }

      // Calculate relative index within the record
      const anchorIdx = foundRecord ? foundRecord.startIndex : 0;
      const relativeSegments = flat.slice(anchorIdx);
      
      let fieldId: string | null = null;
      const s = selectedSegment;
      
      // Determine field based on tag and count
      if (s.tag === 'NM1') {
          const type = s.elements.find(e => e.index === 1)?.value;
          if (type === 'IL') fieldId = 'subscriberFirstName';
          else if (type === 'PR' || (type === 'IN' && generatorMode === '834')) fieldId = 'payerName';
          else if (type === '1P') fieldId = 'providerName';
          else if (type === '85') fieldId = 'billingProviderName';
          else if (type === '03') fieldId = 'dependentFirstName'; // Simplified for 270/276 single dep
          else if (type === 'P5') fieldId = 'sponsorName';
          else if ((type === 'BY' || type === 'SF') && (generatorMode === '850' || generatorMode === '810' || generatorMode === '856')) fieldId = 'buyerName'; // 856 uses SF for Seller sometimes? No, N1*SF is Ship From
          else if ((type === 'SE' || type === 'ST') && (generatorMode === '850' || generatorMode === '810' || generatorMode === '856')) fieldId = 'sellerName';
      }
      else if (s.tag === 'CLM') fieldId = 'claimId';
      else if (s.tag === 'TRN') fieldId = 'claimId'; 
      else if (s.tag === 'DMG') fieldId = 'subscriberDob'; 
      else if (s.tag === 'DTP') {
          const qual = s.elements.find(e => e.index === 1)?.value;
          if (qual === '472' || qual === '291') fieldId = 'serviceDate';
          if (qual === '348') fieldId = 'planEffectiveDate';
          if (qual === '011') fieldId = 'shipDate';
      }
      else if (s.tag === 'EQ') fieldId = 'serviceTypeCodes';
      else if (s.tag === 'BEG') fieldId = 'poNumber';
      else if (s.tag === 'BIG') fieldId = 'invoiceNumber';
      else if (s.tag === 'BSN') fieldId = 'shipmentId';
      
      // Handle Lists (Service Lines, PO Lines, Dependents)
      else if ((generatorMode === '850' && s.tag === 'PO1') || (generatorMode === '810' && s.tag === 'IT1')) {
          // Find which index this PO1/IT1 is relative to the anchor
          const lineSegments = relativeSegments.filter(seg => seg.tag === s.tag);
          const lineIdx = lineSegments.findIndex(seg => seg.id === s.id);
          if (lineIdx !== -1) fieldId = `line-${lineIdx}-partNumber`;
      }
      else if (generatorMode === '856' && s.tag === 'LIN') {
          const lineSegments = relativeSegments.filter(seg => seg.tag === 'LIN');
          const lineIdx = lineSegments.findIndex(seg => seg.id === s.id);
          if (lineIdx !== -1) fieldId = `line-${lineIdx}-partNumber`;
      }
      else if (generatorMode === '837' && (s.tag === 'SV1' || s.tag === 'SV2')) {
          // In 837, SV1/SV2 are inside LX loops.
          // Find all SV segments relative to anchor CLM
          // First find CLM
          const clmIdx = relativeSegments.findIndex(seg => seg.tag === 'CLM');
          if (clmIdx !== -1) {
              const claimSegments = relativeSegments.slice(clmIdx);
              const svSegments = claimSegments.filter(seg => seg.tag === 'SV1' || seg.tag === 'SV2');
              const lineIdx = svSegments.findIndex(seg => seg.id === s.id);
              if (lineIdx !== -1) fieldId = `line-${lineIdx}-procedureCode`;
          }
      }
      // Dependent list for 834? (Simplified: finding NM1*03 in list)
      
      setHighlightedField(fieldId);

  }, [selectedSegment, doc, records, selectedRecordId, generatorMode]);

  // 2. Form -> Structure
  const handleFieldFocus = (fieldName: string) => {
    if (!doc) return;
    const flat = flattenTree(doc.segments);
    
    // Find anchor for current record
    let anchorIdx = 0;
    if (selectedRecordId) {
        const idx = flat.findIndex(s => s.id === selectedRecordId);
        if (idx !== -1) anchorIdx = idx;
    }

    // Is it a dynamic list field?
    const listMatch = fieldName.match(/^line-(\d+)-(.+)$/) || fieldName.match(/^dependent-(\d+)-(.+)$/);
    
    if (listMatch) {
        const index = parseInt(listMatch[1]);
        // const field = listMatch[2]; // not really needed for segment targeting, just index and mode
        
        let targetTag: string | string[] = '';
        if (generatorMode === '850') targetTag = 'PO1';
        else if (generatorMode === '810') targetTag = 'IT1';
        else if (generatorMode === '856') targetTag = 'LIN';
        else if (generatorMode === '837') targetTag = ['SV1', 'SV2']; // could be either
        
        // Find Nth occurrence after anchor
        const relativeSegments = flat.slice(anchorIdx);
        let count = -1;
        const target = relativeSegments.find(s => {
            if (Array.isArray(targetTag) ? targetTag.includes(s.tag) : s.tag === targetTag) {
                count++;
                return count === index;
            }
            // Stop if we hit next record boundary? For 850/810 typically 1 record per file in simple mode.
            return false;
        });
        
        if (target) setSelectedSegment(target);
        return;
    }

    // Standard Fields - Find closest relevant segment
    // Helper to find backward from anchor or forward if necessary
    const findBackwards = (start: number, predicate: (s: EdiSegment) => boolean) => {
        for (let i = start; i >= 0; i--) {
            if (predicate(flat[i])) return flat[i];
        }
        return undefined;
    };
    
    const findForwards = (start: number, predicate: (s: EdiSegment) => boolean) => {
        // Limit search to reasonable record size (e.g. 50 segments)
        for (let i = start; i < Math.min(flat.length, start + 50); i++) {
            if (predicate(flat[i])) return flat[i];
        }
        return undefined;
    }

    let target: EdiSegment | undefined;

    if (fieldName.includes('payer')) {
         target = findBackwards(anchorIdx, s => (s.tag === 'NM1' && s.elements[0]?.value === 'PR') || (s.tag === 'N1' && s.elements[0]?.value === 'IN'));
    } 
    else if (fieldName.includes('provider') && !fieldName.includes('billing')) {
         target = findBackwards(anchorIdx, s => s.tag === 'NM1' && (['1P', '41'].includes(s.elements[0]?.value)));
    }
    else if (fieldName.includes('billingProvider')) {
         target = findBackwards(anchorIdx, s => s.tag === 'NM1' && s.elements[0]?.value === '85');
    }
    else if (fieldName.includes('subscriber')) {
         target = findBackwards(anchorIdx, s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
         if (fieldName.includes('Dob') && target) {
             const subIdx = flat.indexOf(target);
             target = flat.slice(subIdx, subIdx + 10).find(s => s.tag === 'DMG');
         }
    }
    else if (fieldName.includes('dependent')) {
         // Dependents often appear AFTER the anchor (if anchor is Subscriber HL)
         target = findForwards(anchorIdx, s => s.tag === 'NM1' && s.elements[0]?.value === '03');
         if (fieldName.includes('Dob') && target) {
             const depIdx = flat.indexOf(target);
             target = flat.slice(depIdx, depIdx + 10).find(s => s.tag === 'DMG');
         }
    }
    else if (fieldName === 'claimId' || fieldName === 'totalCharge') {
         if (generatorMode === '837') {
             // 837 CLM segment usually anchor or just after
             target = findForwards(anchorIdx, s => s.tag === 'CLM') || findBackwards(anchorIdx, s => s.tag === 'CLM');
         } else {
             // 276 TRN segment
             target = findForwards(anchorIdx, s => s.tag === 'TRN') || findBackwards(anchorIdx, s => s.tag === 'TRN');
         }
    }
    else if (fieldName === 'serviceDate') {
         target = findForwards(anchorIdx, s => s.tag === 'DTP' && (s.elements[0]?.value === '472' || s.elements[0]?.value === '291'));
    }
    else if (fieldName === 'serviceTypeCodes') {
         target = findForwards(anchorIdx, s => s.tag === 'EQ');
    }
    else if (fieldName.includes('sponsor')) {
         target = findBackwards(anchorIdx, s => s.tag === 'N1' && s.elements[0]?.value === 'P5');
    }
    else if (fieldName.includes('maintenance')) {
         target = findBackwards(anchorIdx, s => s.tag === 'INS');
    }
    else if (fieldName.includes('buyer')) {
         target = findBackwards(anchorIdx, s => s.tag === 'N1' && (s.elements[0]?.value === 'BY' || s.elements[0]?.value === 'BT'));
    }
    else if (fieldName.includes('seller')) {
         target = findBackwards(anchorIdx, s => s.tag === 'N1' && (s.elements[0]?.value === 'SE' || s.elements[0]?.value === 'SF' || s.elements[0]?.value === 'VN'));
    }
    else if (fieldName.includes('shipTo')) {
         target = findBackwards(anchorIdx, s => s.tag === 'N1' && s.elements[0]?.value === 'ST');
    }
    else if (fieldName === 'poNumber') {
         target = findBackwards(anchorIdx, s => s.tag === 'BEG');
    }
    else if (fieldName === 'invoiceNumber') {
         target = findBackwards(anchorIdx, s => s.tag === 'BIG');
    }
    else if (fieldName === 'shipmentId') {
         target = findBackwards(anchorIdx, s => s.tag === 'BSN');
    }
    else if (fieldName === 'shipDate') {
         target = findBackwards(anchorIdx, s => s.tag === 'DTM' && s.elements[0]?.value === '011');
    }
    
    if (target) {
        setSelectedSegment(target);
    }
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

  const simpleJson = useMemo(() => {
    if (!doc) return null;
    // Map based on transaction type to business object
    if (doc.transactionType === '270') return mapEdiToForm(doc, selectedRecordId || undefined);
    if (doc.transactionType === '276') return mapEdiToForm276(doc, selectedRecordId || undefined);
    if (doc.transactionType === '837') return mapEdiToForm837(doc, selectedRecordId || undefined);
    if (doc.transactionType === '834') return mapEdiToForm834(doc, selectedRecordId || undefined);
    if (doc.transactionType === '850') return mapEdiToForm850(doc);
    if (doc.transactionType === '810') return mapEdiToForm810(doc);
    if (doc.transactionType === '856') return mapEdiToForm856(doc);
    if (doc.transactionType === '271') return mapEdiToBenefits(doc);
    if (doc.transactionType === '277') return mapEdiToClaimStatus(doc);
    if (doc.transactionType === '835') return mapEdiToRemittance(doc);
    return { info: "Simplified view not available for this transaction type" };
  }, [doc, selectedRecordId]);

  if (currentPage === 'landing') {
      return (
        <Landing 
            onEnter={(ind) => { 
                resetState();
                setCurrentPage('workspace'); 
                setIndustry(ind);
                setGeneratorMode(ind === 'manufacturing' ? '850' : '270');
                setViewMode('inspector'); 
            }} 
            onContact={() => { setCurrentPage('workspace'); setViewMode('contact'); }}
            onLearn={() => setCurrentPage('guide')}
        />
      );
  }

  if (currentPage === 'guide') {
      return <Guide onBack={() => setCurrentPage('landing')} />;
  }

  // NOTE: showOrderTable logic removed to always show EdiGenerator for editing 856 as well
  const showOrderTable = false; 

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
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                {industry}
            </span>
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
        
        {/* Pane 1: Generator/Benefits/Claims/Orders */}
        {(viewMode !== 'reference' && viewMode !== 'settings' && viewMode !== 'contact' && (doc || rawEdi)) && (
            <div className="flex-none bg-white dark:bg-slate-900 z-20 border-r border-gray-200 dark:border-slate-800 relative flex flex-row h-full" style={{ width: sidebarWidth }}>
                
                {/* Record Selector (Only for Healthcare types for now) */}
                {industry === 'healthcare' && !showOrderTable && records.length > 0 && (viewMode === 'inspector' || viewMode === 'raw') && (
                    <RecordList 
                        records={records} 
                        selectedId={selectedRecordId} 
                        onSelect={handleRecordSelect} 
                        onResetAll={handleResetAll}
                        onResetRecord={handleResetRecord}
                        onAddRecord={doc?.transactionType !== '835' ? handleAddRecord : undefined}
                        onDeleteRecord={doc?.transactionType !== '835' ? handleDeleteRecord : undefined}
                        isModified={rawEdi !== originalEdi}
                    />
                )}
                
                {/* Main Form/Table */}
                <div className="flex-1 overflow-hidden h-full">
                    {showOrderTable ? (
                        <OrderTable order={orderData!} />
                    ) : (
                        <EdiGenerator 
                            formData={formData} onChange={handleFormChange}
                            formData276={formData276} onChange276={handleForm276Change}
                            formData837={formData837} onChange837={handleForm837Change}
                            formData834={formData834} onChange834={handleForm834Change}
                            formData850={formData850} onChange850={handleForm850Change}
                            formData810={formData810} onChange810={handleForm810Change}
                            formData856={formData856} onChange856={handleForm856Change}
                            transactionType={doc?.transactionType} 
                            generatorMode={generatorMode} onSetGeneratorMode={handleGeneratorModeChange}
                            benefits={benefits} 
                            claims={claims}
                            remittanceInfo={paymentInfo}
                            remittanceClaims={remittanceClaims}
                            selectedSegment={selectedSegment} 
                            onFieldFocus={handleFieldFocus}
                            highlightedField={highlightedField}
                        />
                    )}
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
                        <DragDropInput onProcess={handleLoadNewEdi} industry={industry} />
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
                                    <div className="flex bg-white dark:bg-slate-800 rounded-md shadow-sm border border-gray-200 dark:border-slate-700 mr-2">
                                        <button 
                                            onClick={() => { setJsonDisplayType('structure'); setJsonViewKey(k => k+1); }} 
                                            className={`px-3 py-1.5 text-xs font-medium rounded-l-md transition-colors ${jsonDisplayType === 'structure' ? 'bg-gray-100 dark:bg-slate-700 text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                                        >
                                            Segment Structure
                                        </button>
                                        <button 
                                            onClick={() => { setJsonDisplayType('simplified'); setJsonViewKey(k => k+1); }} 
                                            className={`px-3 py-1.5 text-xs font-medium rounded-r-md border-l border-gray-200 dark:border-slate-700 transition-colors ${jsonDisplayType === 'simplified' ? 'bg-gray-100 dark:bg-slate-700 text-black dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}
                                        >
                                            Simplified Data
                                        </button>
                                    </div>
                                    <div className="flex bg-white dark:bg-slate-800 rounded-md shadow-sm border border-gray-200 dark:border-slate-700">
                                        <button onClick={() => toggleJsonExpand('expanded')} className="px-3 py-1.5 text-xs font-medium border-r border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-l-md transition-colors">Expand All</button>
                                        <button onClick={() => toggleJsonExpand('collapsed')} className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-r-md transition-colors">Collapse All</button>
                                    </div>
                                    <button onClick={() => handleCopy(JSON.stringify(jsonDisplayType === 'structure' ? enrichedJson : simpleJson, null, 2))} className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-200 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white shadow-sm"><span>Copy JSON</span></button>
                                </div>
                                <div className="flex-1 overflow-auto p-8 custom-scrollbar bg-gray-50 dark:bg-slate-900">
                                    {(jsonDisplayType === 'structure' ? enrichedJson : simpleJson) ? (
                                        <JsonViewer 
                                            key={jsonViewKey} 
                                            data={jsonDisplayType === 'structure' ? enrichedJson : simpleJson} 
                                            initiallyOpen={jsonExpandMode === 'auto' ? undefined : (jsonExpandMode === 'expanded')} 
                                        />
                                    ) : <div className="text-gray-400 text-xs">No data available</div>}
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
