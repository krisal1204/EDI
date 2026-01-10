import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FormData270, FormData276, FormData837, FormData834, ServiceLine837, Member834 } from '../services/ediBuilder';
import { BenefitRow, ClaimStatusRow } from '../services/ediMapper';
import { EdiSegment } from '../types';
import { BenefitTable } from './BenefitTable';
import { ClaimStatusTable } from './ClaimStatusTable';
import { generateFormData, getModelName } from '../services/geminiService';
import { PROCEDURE_CODES, ICD10_CODES } from '../services/referenceData';

interface Props {
  formData: FormData270;
  onChange: (data: FormData270) => void;
  
  formData276: FormData276;
  onChange276: (data: FormData276) => void;

  formData837: FormData837;
  onChange837: (data: FormData837) => void;

  formData834: FormData834;
  onChange834: (data: FormData834) => void;

  transactionType?: string; // from parser (270, 271, 276, 277, 837)
  
  // For forcing generator mode when manual
  generatorMode: '270' | '276' | '837' | '834';
  onSetGeneratorMode: (mode: '270' | '276' | '837' | '834') => void;

  benefits?: BenefitRow[];
  claims?: ClaimStatusRow[];
  
  selectedSegment?: EdiSegment | null;
  onFieldFocus?: (fieldName: string) => void;
}

const InputGroup: React.FC<{ label: string; children: React.ReactNode; error?: string }> = ({ label, children, error }) => (
  <div className="mb-4">
    <div className="flex justify-between items-baseline mb-1.5">
        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
        {error && <span className="text-[10px] text-red-500 font-medium">{error}</span>}
    </div>
    {children}
  </div>
);

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    isActive?: boolean;
    hasError?: boolean;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(({ isActive, hasError, className, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={`w-full px-3 py-2 rounded-sm text-sm focus:outline-none transition-all duration-300 disabled:bg-gray-50 disabled:text-gray-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600
        ${hasError ? 'border-red-400 focus:border-red-500 bg-red-50/50 dark:bg-red-900/10' : 
            isActive 
            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-500' 
            : 'bg-white border-gray-200 focus:border-black dark:bg-slate-900 dark:border-slate-700 dark:focus:border-slate-500 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600'
        }
        border ${className || ''}
    `}
  />
));

interface AutocompleteProps extends TextInputProps {
    options: Record<string, string>;
    onSelect: (value: string) => void;
}

const AutocompleteInput = React.forwardRef<HTMLInputElement, AutocompleteProps>(({ options, onSelect, isActive, hasError, className, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const suggestions = useMemo(() => {
        const val = String(props.value || '');
        if (val.length < 1) return [];
        const lower = val.toLowerCase();
        // Limit to 50 to avoid rendering lag
        return Object.entries(options)
            .filter(([code, desc]) => 
                code.toLowerCase().includes(lower) || 
                String(desc).toLowerCase().includes(lower)
            )
            .slice(0, 50); 
    }, [props.value, options]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShow(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (code: string) => {
        onSelect(code);
        setShow(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <TextInput
                ref={ref}
                {...props}
                isActive={isActive}
                hasError={hasError}
                onFocus={(e) => {
                    props.onFocus?.(e);
                    setShow(true);
                }}
                onChange={(e) => {
                    props.onChange?.(e);
                    setShow(true);
                }}
                autoComplete="off"
            />
            {show && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                    {suggestions.map(([code, desc]) => (
                        <div 
                            key={code}
                            className="px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 border-b border-gray-50 dark:border-slate-800/50 last:border-0 transition-colors"
                            onClick={() => handleSelect(code)}
                        >
                            <div className="flex justify-between items-baseline">
                                <span className="font-bold text-xs text-gray-900 dark:text-white mr-2">{code}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate" title={desc}>{desc}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

const SERVICE_TYPE_CODES = {
    '30': 'Health Benefit Plan Coverage',
    '1': 'Medical Care',
    '33': 'Chiropractic',
    '35': 'Dental Care',
    '47': 'Hospital',
    '48': 'Hospital - Inpatient',
    '50': 'Hospital - Outpatient',
    '86': 'Emergency Services',
    '88': 'Pharmacy',
    '98': 'Professional Visit - Office',
    'AL': 'Vision (Optometry)',
    'MH': 'Mental Health',
    'UC': 'Urgent Care',
    'PT': 'Physical Therapy'
};

export const EdiGenerator: React.FC<Props> = ({ 
    formData, 
    onChange, 
    formData276, 
    onChange276,
    formData837,
    onChange837,
    formData834,
    onChange834,
    transactionType, 
    generatorMode,
    onSetGeneratorMode,
    benefits = [], 
    claims = [],
    selectedSegment,
    onFieldFocus
}) => {
  
  // Determine if we are viewing a parsed response
  const is271 = transactionType === '271';
  const is277 = transactionType === '277';
  const isResponse = is271 || is277;

  // If parsed type exists and matches a generator, use it, otherwise use manual mode
  const activeMode = (['270', '276', '837', '834'].includes(transactionType || '')) ? transactionType as '270' | '276' | '837' | '834' : generatorMode;

  const [view, setView] = useState<'form' | 'table'>('table');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  // 837 Validation State
  const [errors837, setErrors837] = useState<Record<string, string>>({});

  const setRef = (name: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
      fieldRefs.current[name] = el;
  };

  const validate837 = (data: FormData837) => {
      const errs: Record<string, string> = {};
      
      if (!data.billingProviderNpi || data.billingProviderNpi.length !== 10) errs.billingProviderNpi = "Must be 10 digits";
      if (!data.billingProviderName) errs.billingProviderName = "Required";
      if (!data.billingTaxId) errs.billingTaxId = "Required";
      
      if (!data.subscriberFirstName) errs.subscriberFirstName = "Required";
      if (!data.subscriberLastName) errs.subscriberLastName = "Required";
      if (!data.subscriberId) errs.subscriberId = "Required";
      
      if (!data.claimId) errs.claimId = "Required";
      if (!data.totalCharge) errs.totalCharge = "Required";
      
      if (data.serviceLines.length === 0) errs.general = "At least one service line required";

      setErrors837(errs);
      return Object.keys(errs).length === 0;
  };

  // Run validation on change for 837 to provide real-time feedback
  const handleChange837 = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData837, [name]: value };
    onChange837(newData);
    
    // Simple debounce or immediate check
    if (activeMode === '837') {
        const errs = { ...errors837 };
        if (value) delete errs[name];
        // Specific checks
        if (name.includes('Npi') && value.length !== 10) errs[name] = "Must be 10 digits";
        setErrors837(errs);
    }
  };

  const handleLineChange837 = (index: number, field: keyof ServiceLine837, value: string) => {
      const newLines = [...formData837.serviceLines];
      newLines[index] = { ...newLines[index], [field]: value };
      onChange837({ ...formData837, serviceLines: newLines });
  };

  const addLine837 = () => {
      const newLine: ServiceLine837 = {
          procedureCode: '',
          lineCharge: '0.00',
          units: '1',
          serviceDate: formData837.serviceLines[0]?.serviceDate || new Date().toISOString().slice(0, 10)
      };
      onChange837({ ...formData837, serviceLines: [...formData837.serviceLines, newLine] });
  };

  const removeLine837 = (index: number) => {
      const newLines = formData837.serviceLines.filter((_, i) => i !== index);
      onChange837({ ...formData837, serviceLines: newLines });
  };

  const handleChange270 = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
        onChange({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
        onChange({ ...formData, [name]: value });
    }
  };

  const addServiceType270 = (code: string) => {
      if (formData.serviceTypeCodes.includes(code)) return;
      onChange({ ...formData, serviceTypeCodes: [...formData.serviceTypeCodes, code] });
  };

  const removeServiceType270 = (code: string) => {
      onChange({ ...formData, serviceTypeCodes: formData.serviceTypeCodes.filter(c => c !== code) });
  };

  const handleChange276 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        onChange276({ ...formData276, [name]: (e.target as HTMLInputElement).checked });
    } else {
        onChange276({ ...formData276, [name]: value });
    }
  };

  // 834 Handlers
  const handleChange834 = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      onChange834({ ...formData834, [name]: value });
  };

  const handleChangeSubscriber834 = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      onChange834({ ...formData834, subscriber: { ...formData834.subscriber, [name]: value } });
  };

  const handleAddDependent834 = () => {
      const newDep: Member834 = {
          id: '',
          firstName: '',
          lastName: formData834.subscriber.lastName,
          ssn: '',
          dob: '',
          gender: '',
          relationship: '19' // Child
      };
      onChange834({ ...formData834, dependents: [...formData834.dependents, newDep] });
  };

  const handleRemoveDependent834 = (index: number) => {
      const newDeps = formData834.dependents.filter((_, i) => i !== index);
      onChange834({ ...formData834, dependents: newDeps });
  };

  const handleChangeDependent834 = (index: number, field: keyof Member834, value: string) => {
      const newDeps = [...formData834.dependents];
      newDeps[index] = { ...newDeps[index], [field]: value };
      onChange834({ ...formData834, dependents: newDeps });
  };

  const handleAiAutofill = async () => {
    if (activeMode === '837' || activeMode === '834') {
        alert(`AI Generation for ${activeMode} is coming soon.`);
        return;
    }

    const mode = activeMode as '270' | '276';
    const modelName = getModelName();
    const description = window.prompt(
        "Describe the scenario to generate (e.g. 'Child with broken arm, dependent on mother')", 
        "Realistic random scenario"
    );
    
    if (!description) return; 

    setIsAiLoading(true);
    try {
        const generatedData = await generateFormData(mode, description);
        
        if (mode === '270') {
            onChange({ 
                ...formData, 
                ...generatedData,
                dependentFirstName: generatedData.hasDependent ? generatedData.dependentFirstName : '',
                dependentLastName: generatedData.hasDependent ? generatedData.dependentLastName : ''
            });
        } else {
             onChange276({
                 ...formData276,
                 ...generatedData
             });
        }
    } catch (e) {
        alert(`Failed to generate data. Please ensure Ollama is configured correctly in Settings.`);
        console.error(e);
    } finally {
        setIsAiLoading(false);
    }
  };

  const activeFields = useMemo(() => {
    if (!selectedSegment) return [];
    const tag = selectedSegment.tag;
    const el1 = selectedSegment.elements[0]?.value;

    if (tag === 'NM1') {
        if (el1 === 'PR') return ['payerName', 'payerId'];
        if (el1 === 'IL') return ['subscriberFirstName', 'subscriberLastName', 'subscriberId'];
        if (el1 === '03') return ['dependentFirstName', 'dependentLastName'];
        if (['1P', '85', '41'].includes(el1)) return ['providerName', 'providerNpi', 'billingProviderName', 'billingProviderNpi'];
    }
    if (tag === 'DMG') {
        // Need to guess if it's subscriber or dependent.
        // In this simple UI, we highlight subscriberDob as primary.
        return ['subscriberDob', 'dependentDob']; 
    }
    if (tag === 'DTP') {
        if (el1 === '291' || el1 === '472') return ['serviceDate'];
    }
    if (tag === 'EQ') return ['serviceTypeCodes'];
    if (tag === 'TRN' && el1 === '1') return ['claimId'];
    if (tag === 'CLM') return ['claimId', 'totalCharge', 'placeOfService', 'typeOfBill'];
    if (tag === 'AMT' && el1 === 'T3') return ['chargeAmount'];
    if (tag === 'HI') return ['diagnosisCode1'];
    if (tag === 'REF' && el1 === 'EI') return ['billingTaxId'];
    if (tag === 'N3') return ['billingProviderAddress'];
    if (tag === 'N4') return ['billingProviderCity', 'billingProviderState'];
    if (tag === 'SV1' || tag === 'SV2' || tag === 'LX') return ['procedureCode', 'lineCharge', 'units'];
    
    // 834 Specific Mappings
    if (tag === 'INS') return ['maintenanceType', 'maintenanceReason'];
    if (tag === 'HD') return ['benefitStatus'];
    if (tag === 'N1') {
        if (el1 === 'P5') return ['sponsorName', 'sponsorTaxId'];
        if (el1 === 'IN') return ['payerName', 'payerId'];
    }

    return [];
  }, [selectedSegment]);

  useEffect(() => {
      if (activeFields.length > 0) {
          const firstField = activeFields[0];
          const el = fieldRefs.current[firstField];
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [activeFields]);

  const handleFocus = (name: string) => {
      if (onFieldFocus) onFieldFocus(name);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transition-colors">
      <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
                {isResponse ? (
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                         {transactionType} Response
                    </h2>
                ) : (
                    <>
                        <select 
                            value={activeMode}
                            onChange={(e) => onSetGeneratorMode(e.target.value as '270' | '276' | '837' | '834')}
                            className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 rounded px-1 -ml-1 py-1"
                        >
                            <option value="270" className="text-black dark:text-white dark:bg-slate-900">Eligibility (270)</option>
                            <option value="837" className="text-black dark:text-white dark:bg-slate-900">File Claim (837)</option>
                            <option value="276" className="text-black dark:text-white dark:bg-slate-900">Claim Status (276)</option>
                            <option value="834" className="text-black dark:text-white dark:bg-slate-900">Enrollment (834)</option>
                        </select>
                        
                        {(activeMode !== '837' && activeMode !== '834') && (
                            <button 
                                onClick={handleAiAutofill}
                                disabled={isAiLoading}
                                className="ml-2 flex items-center space-x-1 px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50 dark:border-brand-800/50 rounded text-[10px] font-medium transition-colors disabled:opacity-50 border border-brand-100 dark:border-brand-900"
                            >
                                {isAiLoading ? <span>Generating...</span> : <span>AI Autofill</span>}
                            </button>
                        )}
                    </>
                )}
            </div>
            
            {isResponse && (
             <div className="flex bg-gray-100 dark:bg-slate-800 p-0.5 rounded-sm">
                <button 
                  onClick={() => setView('table')}
                  className={`py-1 px-3 text-[10px] font-medium transition-all rounded-sm ${view === 'table' ? 'bg-white dark:bg-slate-600 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                >
                  Table
                </button>
                <button 
                  onClick={() => setView('form')}
                  className={`py-1 px-3 text-[10px] font-medium transition-all rounded-sm ${view === 'form' ? 'bg-white dark:bg-slate-600 text-black dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200'}`}
                >
                  Details
                </button>
             </div>
            )}
      </div>

      {is271 && view === 'table' ? (
          <BenefitTable benefits={benefits} />
      ) : is277 && view === 'table' ? (
          <ClaimStatusTable claims={claims} />
      ) : (
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {isResponse && (
                <div className="mb-6 p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 text-gray-500 dark:text-slate-400 text-xs rounded-sm">
                    Form editing is disabled for response transactions.
                </div>
            )}

            <div className={`space-y-8 ${isResponse ? 'opacity-60 pointer-events-none' : ''}`}>
            
            {/* 834 Generator Form */}
            {activeMode === '834' && (
                <>
                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Sponsor & Payer</h3>
                    <InputGroup label="Plan Sponsor (Employer)">
                        <TextInput name="sponsorName" ref={setRef('sponsorName')} onFocus={() => handleFocus('sponsorName')} value={formData834.sponsorName} onChange={handleChange834} isActive={activeFields.includes('sponsorName')} />
                    </InputGroup>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Sponsor Tax ID">
                            <TextInput name="sponsorTaxId" ref={setRef('sponsorTaxId')} onFocus={() => handleFocus('sponsorTaxId')} value={formData834.sponsorTaxId} onChange={handleChange834} isActive={activeFields.includes('sponsorTaxId')} />
                        </InputGroup>
                        <InputGroup label="Payer Name">
                            <TextInput name="payerName" ref={setRef('payerName')} onFocus={() => handleFocus('payerName')} value={formData834.payerName} onChange={handleChange834} isActive={activeFields.includes('payerName')} />
                        </InputGroup>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Enrollment Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Maintenance Type">
                            <select 
                                name="maintenanceType" 
                                value={formData834.maintenanceType} 
                                onChange={handleChange834}
                                className={`w-full px-3 py-2 border rounded-sm text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700
                                    ${activeFields.includes('maintenanceType') ? 'ring-1 ring-blue-500 border-blue-500' : 'border-gray-200'}
                                `}
                                ref={setRef('maintenanceType')}
                                onFocus={() => handleFocus('maintenanceType')}
                            >
                                <option value="021">021 - Add</option>
                                <option value="001">001 - Change</option>
                                <option value="024">024 - Terminate</option>
                                <option value="030">030 - Audit</option>
                            </select>
                        </InputGroup>
                        <InputGroup label="Reason">
                            <select 
                                name="maintenanceReason" 
                                value={formData834.maintenanceReason} 
                                onChange={handleChange834}
                                className={`w-full px-3 py-2 border rounded-sm text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700
                                    ${activeFields.includes('maintenanceReason') ? 'ring-1 ring-blue-500 border-blue-500' : 'border-gray-200'}
                                `}
                                ref={setRef('maintenanceReason')}
                                onFocus={() => handleFocus('maintenanceReason')}
                            >
                                <option value="01">01 - Divorce</option>
                                <option value="02">02 - Birth</option>
                                <option value="03">03 - Death</option>
                                <option value="07">07 - Termination of Employment</option>
                                <option value="28">28 - Initial Enrollment</option>
                            </select>
                        </InputGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Benefit Status">
                             <select 
                                name="benefitStatus" 
                                value={formData834.benefitStatus} 
                                onChange={handleChange834}
                                className={`w-full px-3 py-2 border rounded-sm text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700
                                    ${activeFields.includes('benefitStatus') ? 'ring-1 ring-blue-500 border-blue-500' : 'border-gray-200'}
                                `}
                                ref={setRef('benefitStatus')}
                                onFocus={() => handleFocus('benefitStatus')}
                            >
                                <option value="024">024 - Active</option>
                                <option value="001">001 - Cancelled</option>
                            </select>
                        </InputGroup>
                        <InputGroup label="Effective Date">
                            <TextInput type="date" name="planEffectiveDate" value={formData834.planEffectiveDate} onChange={handleChange834} ref={setRef('planEffectiveDate')} onFocus={() => handleFocus('planEffectiveDate')} isActive={activeFields.includes('planEffectiveDate')} />
                        </InputGroup>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Subscriber</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="First Name">
                            <TextInput name="firstName" value={formData834.subscriber.firstName} onChange={handleChangeSubscriber834} />
                        </InputGroup>
                        <InputGroup label="Last Name">
                            <TextInput name="lastName" value={formData834.subscriber.lastName} onChange={handleChangeSubscriber834} />
                        </InputGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Member ID (Ref)">
                            <TextInput name="id" value={formData834.subscriber.id} onChange={handleChangeSubscriber834} />
                        </InputGroup>
                        <InputGroup label="SSN">
                            <TextInput name="ssn" value={formData834.subscriber.ssn} onChange={handleChangeSubscriber834} />
                        </InputGroup>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="DOB">
                            <TextInput type="date" name="dob" value={formData834.subscriber.dob} onChange={handleChangeSubscriber834} />
                        </InputGroup>
                        <InputGroup label="Gender">
                            <select 
                                name="gender" 
                                value={formData834.subscriber.gender} 
                                onChange={handleChangeSubscriber834}
                                className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700"
                            >
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="U">Unknown</option>
                            </select>
                        </InputGroup>
                    </div>
                </div>

                <div>
                     <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">
                        <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200">Dependents</h3>
                        <button onClick={handleAddDependent834} className="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white px-2 py-1 rounded transition-colors">+ Add Dependent</button>
                     </div>
                     
                     <div className="space-y-4">
                        {formData834.dependents.map((dep, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-100 dark:border-slate-800 relative group">
                                <button 
                                    onClick={() => handleRemoveDependent834(idx)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Dependent {idx + 1}</div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <TextInput placeholder="First Name" value={dep.firstName} onChange={(e) => handleChangeDependent834(idx, 'firstName', e.target.value)} />
                                    <TextInput placeholder="Last Name" value={dep.lastName} onChange={(e) => handleChangeDependent834(idx, 'lastName', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <TextInput type="date" value={dep.dob} onChange={(e) => handleChangeDependent834(idx, 'dob', e.target.value)} />
                                    <select 
                                        value={dep.relationship} 
                                        onChange={(e) => handleChangeDependent834(idx, 'relationship', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-sm text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700"
                                    >
                                        <option value="01">Spouse</option>
                                        <option value="19">Child</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
                </>
            )}

            {/* 837 Generator Form */}
            {activeMode === '837' && (
                <>
                {/* 837 Header / Provider Info */}
                <div>
                     <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">
                        <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200">Billing Provider</h3>
                        <div className="flex space-x-2 bg-gray-100 dark:bg-slate-800 p-0.5 rounded">
                            <button 
                                onClick={() => onChange837({...formData837, type: 'Professional'})}
                                className={`text-[10px] px-2 py-0.5 rounded ${formData837.type === 'Professional' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                Professional
                            </button>
                            <button 
                                onClick={() => onChange837({...formData837, type: 'Institutional'})}
                                className={`text-[10px] px-2 py-0.5 rounded ${formData837.type === 'Institutional' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-gray-500'}`}
                            >
                                Institutional
                            </button>
                        </div>
                     </div>
                     <InputGroup label="Organization Name" error={errors837.billingProviderName}>
                        <TextInput 
                            isActive={activeFields.includes('billingProviderName')}
                            hasError={!!errors837.billingProviderName} 
                            name="billingProviderName" 
                            ref={setRef('billingProviderName')} 
                            onFocus={() => handleFocus('billingProviderName')}
                            value={formData837.billingProviderName} 
                            onChange={handleChange837} 
                        />
                     </InputGroup>
                     <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="NPI (10 digits)" error={errors837.billingProviderNpi}>
                            <TextInput 
                                isActive={activeFields.includes('billingProviderNpi')}
                                hasError={!!errors837.billingProviderNpi} 
                                name="billingProviderNpi" 
                                ref={setRef('billingProviderNpi')} 
                                onFocus={() => handleFocus('billingProviderNpi')}
                                maxLength={10} 
                                value={formData837.billingProviderNpi} 
                                onChange={handleChange837} 
                            />
                        </InputGroup>
                        <InputGroup label="Tax ID (EIN)" error={errors837.billingTaxId}>
                            <TextInput 
                                isActive={activeFields.includes('billingTaxId')}
                                hasError={!!errors837.billingTaxId} 
                                name="billingTaxId" 
                                ref={setRef('billingTaxId')} 
                                onFocus={() => handleFocus('billingTaxId')}
                                value={formData837.billingTaxId} 
                                onChange={handleChange837} 
                            />
                        </InputGroup>
                     </div>
                     <InputGroup label="Address">
                        <TextInput 
                            isActive={activeFields.includes('billingProviderAddress')}
                            name="billingProviderAddress" 
                            ref={setRef('billingProviderAddress')} 
                            onFocus={() => handleFocus('billingProviderAddress')}
                            value={formData837.billingProviderAddress} 
                            onChange={handleChange837} 
                            placeholder="123 Medical Way" 
                        />
                     </InputGroup>
                     <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                            <TextInput 
                                isActive={activeFields.includes('billingProviderCity')}
                                name="billingProviderCity" 
                                ref={setRef('billingProviderCity')} 
                                onFocus={() => handleFocus('billingProviderCity')}
                                value={formData837.billingProviderCity} 
                                onChange={handleChange837} 
                                placeholder="City" 
                            />
                        </div>
                        <TextInput 
                            isActive={activeFields.includes('billingProviderState')}
                            name="billingProviderState" 
                            ref={setRef('billingProviderState')} 
                            onFocus={() => handleFocus('billingProviderState')}
                            value={formData837.billingProviderState} 
                            onChange={handleChange837} 
                            placeholder="ST" 
                            maxLength={2} 
                        />
                     </div>
                </div>

                {/* 837 Patient Info */}
                <div>
                     <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Patient / Subscriber</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="First Name" error={errors837.subscriberFirstName}>
                            <TextInput 
                                isActive={activeFields.includes('subscriberFirstName')}
                                hasError={!!errors837.subscriberFirstName} 
                                name="subscriberFirstName" 
                                ref={setRef('subscriberFirstName')} 
                                onFocus={() => handleFocus('subscriberFirstName')}
                                value={formData837.subscriberFirstName} 
                                onChange={handleChange837} 
                            />
                        </InputGroup>
                        <InputGroup label="Last Name" error={errors837.subscriberLastName}>
                            <TextInput 
                                isActive={activeFields.includes('subscriberLastName')}
                                hasError={!!errors837.subscriberLastName} 
                                name="subscriberLastName" 
                                ref={setRef('subscriberLastName')} 
                                onFocus={() => handleFocus('subscriberLastName')}
                                value={formData837.subscriberLastName} 
                                onChange={handleChange837} 
                            />
                        </InputGroup>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Member ID" error={errors837.subscriberId}>
                            <TextInput 
                                isActive={activeFields.includes('subscriberId')}
                                hasError={!!errors837.subscriberId} 
                                name="subscriberId" 
                                ref={setRef('subscriberId')} 
                                onFocus={() => handleFocus('subscriberId')}
                                value={formData837.subscriberId} 
                                onChange={handleChange837} 
                            />
                        </InputGroup>
                        <InputGroup label="DOB">
                            <TextInput 
                                isActive={activeFields.includes('subscriberDob')}
                                type="date" 
                                name="subscriberDob" 
                                ref={setRef('subscriberDob')} 
                                onFocus={() => handleFocus('subscriberDob')}
                                value={formData837.subscriberDob} 
                                onChange={handleChange837} 
                            />
                        </InputGroup>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                         <InputGroup label="Payer Name">
                             <TextInput 
                                isActive={activeFields.includes('payerName')}
                                name="payerName" 
                                ref={setRef('payerName')} 
                                onFocus={() => handleFocus('payerName')}
                                value={formData837.payerName} 
                                onChange={handleChange837} 
                             />
                         </InputGroup>
                         <InputGroup label="Payer ID">
                             <TextInput 
                                isActive={activeFields.includes('payerId')}
                                name="payerId" 
                                ref={setRef('payerId')} 
                                onFocus={() => handleFocus('payerId')}
                                value={formData837.payerId} 
                                onChange={handleChange837} 
                             />
                         </InputGroup>
                     </div>
                </div>

                {/* 837 Claim Header */}
                <div>
                     <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Claim Header</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Claim ID (Ref)" error={errors837.claimId}>
                             <TextInput 
                                isActive={activeFields.includes('claimId')}
                                hasError={!!errors837.claimId} 
                                name="claimId" 
                                ref={setRef('claimId')} 
                                onFocus={() => handleFocus('claimId')}
                                value={formData837.claimId} 
                                onChange={handleChange837} 
                             />
                        </InputGroup>
                        <InputGroup label="Total Charge" error={errors837.totalCharge}>
                             <TextInput 
                                isActive={activeFields.includes('totalCharge')}
                                hasError={!!errors837.totalCharge} 
                                type="number" 
                                name="totalCharge" 
                                ref={setRef('totalCharge')} 
                                onFocus={() => handleFocus('totalCharge')}
                                value={formData837.totalCharge} 
                                onChange={handleChange837} 
                             />
                        </InputGroup>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        {formData837.type === 'Professional' ? (
                            <InputGroup label="Place of Service">
                                <select 
                                    name="placeOfService" 
                                    ref={setRef('placeOfService')} 
                                    onFocus={() => handleFocus('placeOfService')}
                                    value={formData837.placeOfService} 
                                    onChange={handleChange837}
                                    className={`w-full px-3 py-2 border rounded-sm text-sm dark:bg-slate-900 dark:text-white dark:border-slate-700
                                      ${activeFields.includes('placeOfService') 
                                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm dark:bg-blue-900/30 dark:border-blue-500' 
                                        : 'bg-white border-gray-200 focus:border-black dark:border-slate-700 dark:focus:border-slate-500'}
                                    `}
                                >
                                    <option value="11">11 - Office</option>
                                    <option value="21">21 - Inpatient Hospital</option>
                                    <option value="22">22 - Outpatient Hospital</option>
                                    <option value="23">23 - ER - Hospital</option>
                                </select>
                            </InputGroup>
                        ) : (
                            <InputGroup label="Type of Bill">
                                <TextInput 
                                    isActive={activeFields.includes('typeOfBill')}
                                    name="typeOfBill" 
                                    ref={setRef('typeOfBill')} 
                                    onFocus={() => handleFocus('typeOfBill')}
                                    value={formData837.typeOfBill} 
                                    onChange={handleChange837} 
                                    placeholder="e.g. 111" 
                                />
                            </InputGroup>
                        )}
                        <InputGroup label="Diagnosis (ICD-10)">
                            <AutocompleteInput 
                                isActive={activeFields.includes('diagnosisCode1')}
                                name="diagnosisCode1" 
                                ref={setRef('diagnosisCode1')} 
                                onFocus={() => handleFocus('diagnosisCode1')}
                                value={formData837.diagnosisCode1} 
                                onChange={handleChange837} 
                                onSelect={(val) => {
                                    // Mock event for handler
                                    const e = { target: { name: 'diagnosisCode1', value: val } } as any;
                                    handleChange837(e);
                                }}
                                options={ICD10_CODES}
                                placeholder="e.g. R05"
                            />
                        </InputGroup>
                     </div>
                </div>

                {/* 837 Service Lines */}
                <div>
                     <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">
                        <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200">Service Lines</h3>
                        <button onClick={addLine837} className="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white px-2 py-1 rounded transition-colors">+ Add Line</button>
                     </div>
                     
                     <div className="space-y-4">
                        {formData837.serviceLines.map((line, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-3 border border-gray-100 dark:border-slate-800 relative group">
                                <button 
                                    onClick={() => removeLine837(idx)}
                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                                <div className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2">Line {idx + 1}</div>
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-1">Service Date</label>
                                        <TextInput 
                                            isActive={activeFields.includes('serviceDate')}
                                            type="date" 
                                            value={line.serviceDate} 
                                            onFocus={() => handleFocus('serviceDate')}
                                            onChange={(e) => handleLineChange837(idx, 'serviceDate', e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-1">Procedure</label>
                                        <AutocompleteInput 
                                            isActive={activeFields.includes('procedureCode')}
                                            value={line.procedureCode} 
                                            onChange={(e) => handleLineChange837(idx, 'procedureCode', e.target.value)}
                                            onFocus={() => handleFocus('procedureCode')}
                                            onSelect={(val) => handleLineChange837(idx, 'procedureCode', val)}
                                            options={PROCEDURE_CODES}
                                            placeholder="CPT/HCPCS"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-1">Charge</label>
                                        <TextInput 
                                            isActive={activeFields.includes('lineCharge')}
                                            type="number" 
                                            value={line.lineCharge} 
                                            onFocus={() => handleFocus('lineCharge')}
                                            onChange={(e) => handleLineChange837(idx, 'lineCharge', e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 dark:text-slate-400 mb-1">Units</label>
                                        <TextInput 
                                            isActive={activeFields.includes('units')}
                                            type="number" 
                                            value={line.units} 
                                            onFocus={() => handleFocus('units')}
                                            onChange={(e) => handleLineChange837(idx, 'units', e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
                </>
            )}

            {/* 270 Generator Form */}
            {activeMode === '270' && (
                <>
                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Information Source</h3>
                    <InputGroup label="Payer Name">
                        <TextInput name="payerName" ref={setRef('payerName')} onFocus={() => handleFocus('payerName')} value={formData.payerName} onChange={handleChange270} isActive={activeFields.includes('payerName')} />
                    </InputGroup>
                    <InputGroup label="Payer ID">
                        <TextInput name="payerId" ref={setRef('payerId')} onFocus={() => handleFocus('payerId')} value={formData.payerId} onChange={handleChange270} isActive={activeFields.includes('payerId')} />
                    </InputGroup>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Information Receiver</h3>
                    <InputGroup label="Provider Name">
                        <TextInput name="providerName" ref={setRef('providerName')} onFocus={() => handleFocus('providerName')} value={formData.providerName} onChange={handleChange270} isActive={activeFields.includes('providerName')} />
                    </InputGroup>
                    <InputGroup label="NPI">
                        <TextInput name="providerNpi" ref={setRef('providerNpi')} onFocus={() => handleFocus('providerNpi')} value={formData.providerNpi} onChange={handleChange270} isActive={activeFields.includes('providerNpi')} />
                    </InputGroup>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Subscriber</h3>
                    <div className="grid grid-cols-2 gap-4">
                    <InputGroup label="First Name">
                        <TextInput name="subscriberFirstName" ref={setRef('subscriberFirstName')} onFocus={() => handleFocus('subscriberFirstName')} value={formData.subscriberFirstName} onChange={handleChange270} isActive={activeFields.includes('subscriberFirstName')} />
                    </InputGroup>
                    <InputGroup label="Last Name">
                        <TextInput name="subscriberLastName" ref={setRef('subscriberLastName')} onFocus={() => handleFocus('subscriberLastName')} value={formData.subscriberLastName} onChange={handleChange270} isActive={activeFields.includes('subscriberLastName')} />
                    </InputGroup>
                    </div>
                    <InputGroup label="Member ID">
                        <TextInput name="subscriberId" ref={setRef('subscriberId')} onFocus={() => handleFocus('subscriberId')} value={formData.subscriberId} onChange={handleChange270} isActive={activeFields.includes('subscriberId')} />
                    </InputGroup>
                    <InputGroup label="Date of Birth">
                        <TextInput type="date" name="subscriberDob" ref={setRef('subscriberDob')} onFocus={() => handleFocus('subscriberDob')} value={formData.subscriberDob} onChange={handleChange270} isActive={activeFields.includes('subscriberDob')} />
                    </InputGroup>
                </div>

                <div className={`transition-all ${formData.hasDependent ? '' : ''}`}>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200">Dependent</h3>
                    <label className="flex items-center cursor-pointer">
                        <span className="mr-2 text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Is Patient?</span>
                        <div className="relative">
                            <input type="checkbox" name="hasDependent" checked={formData.hasDependent} onChange={handleChange270} className="sr-only" />
                            <div className={`block w-8 h-4 rounded-full transition-colors ${formData.hasDependent ? 'bg-black dark:bg-brand-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                            <div className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${formData.hasDependent ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                    </div>

                    {formData.hasDependent && (
                    <div className="animate-fade-in-down">
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="First Name">
                                <TextInput name="dependentFirstName" ref={setRef('dependentFirstName')} onFocus={() => handleFocus('dependentFirstName')} value={formData.dependentFirstName} onChange={handleChange270} isActive={activeFields.includes('dependentFirstName')} />
                            </InputGroup>
                            <InputGroup label="Last Name">
                                <TextInput name="dependentLastName" ref={setRef('dependentLastName')} onFocus={() => handleFocus('dependentLastName')} value={formData.dependentLastName} onChange={handleChange270} isActive={activeFields.includes('dependentLastName')} />
                            </InputGroup>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Date of Birth">
                            <TextInput type="date" name="dependentDob" ref={setRef('dependentDob')} onFocus={() => handleFocus('dependentDob')} value={formData.dependentDob} onChange={handleChange270} isActive={activeFields.includes('dependentDob')} />
                        </InputGroup>
                        <InputGroup label="Gender">
                            <select 
                                name="dependentGender" 
                                value={formData.dependentGender} 
                                onChange={handleChange270}
                                ref={setRef('dependentGender')}
                                onFocus={() => handleFocus('dependentGender')}
                                className={`w-full px-3 py-2 border rounded-sm text-sm focus:outline-none transition-colors dark:bg-slate-900 dark:text-white
                                  ${activeFields.includes('dependentGender') 
                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm dark:bg-blue-900/30 dark:border-blue-500' 
                                    : 'bg-white border-gray-200 focus:border-black dark:border-slate-700 dark:focus:border-slate-500'}
                                `}
                            >
                                <option value="F">Female</option>
                                <option value="M">Male</option>
                                <option value="U">Unknown</option>
                            </select>
                        </InputGroup>
                        </div>
                    </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Inquiry Details</h3>
                    <div className="mb-4">
                        <InputGroup label="Service Date">
                            <TextInput type="date" name="serviceDate" ref={setRef('serviceDate')} onFocus={() => handleFocus('serviceDate')} value={formData.serviceDate} onChange={handleChange270} isActive={activeFields.includes('serviceDate')} />
                        </InputGroup>
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Service Types</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.serviceTypeCodes.map(code => (
                                <span key={code} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs border border-blue-100 dark:border-blue-800">
                                    {code} - {SERVICE_TYPE_CODES[code as keyof typeof SERVICE_TYPE_CODES] || code}
                                    <button onClick={() => removeServiceType270(code)} className="ml-1.5 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200">×</button>
                                </span>
                            ))}
                        </div>
                        <select 
                            onChange={(e) => {
                                if(e.target.value) {
                                    addServiceType270(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            className={`w-full px-3 py-2 border rounded-sm text-sm focus:outline-none transition-colors dark:bg-slate-900 dark:text-white
                                  ${activeFields.includes('serviceTypeCodes') 
                                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm dark:bg-blue-900/30 dark:border-blue-500' 
                                    : 'bg-white border-gray-200 focus:border-black dark:border-slate-700 dark:focus:border-slate-500'}
                            `}
                            onFocus={() => handleFocus('serviceTypeCodes')}
                        >
                            <option value="">+ Add Service Type</option>
                            {Object.entries(SERVICE_TYPE_CODES).map(([code, label]) => (
                                <option key={code} value={code} disabled={formData.serviceTypeCodes.includes(code)}>
                                    {code} - {label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                </>
            )}

            {/* 276 Generator Form */}
            {activeMode === '276' && (
                <>
                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Information Source</h3>
                    <InputGroup label="Payer Name">
                        <TextInput name="payerName" ref={setRef('payerName')} onFocus={() => handleFocus('payerName')} value={formData276.payerName} onChange={handleChange276} isActive={activeFields.includes('payerName')} />
                    </InputGroup>
                    <InputGroup label="Payer ID">
                        <TextInput name="payerId" ref={setRef('payerId')} onFocus={() => handleFocus('payerId')} value={formData276.payerId} onChange={handleChange276} isActive={activeFields.includes('payerId')} />
                    </InputGroup>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Information Receiver</h3>
                    <InputGroup label="Provider Name">
                        <TextInput name="providerName" ref={setRef('providerName')} onFocus={() => handleFocus('providerName')} value={formData276.providerName} onChange={handleChange276} isActive={activeFields.includes('providerName')} />
                    </InputGroup>
                    <InputGroup label="NPI">
                        <TextInput name="providerNpi" ref={setRef('providerNpi')} onFocus={() => handleFocus('providerNpi')} value={formData276.providerNpi} onChange={handleChange276} isActive={activeFields.includes('providerNpi')} />
                    </InputGroup>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Subscriber</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="First Name">
                            <TextInput name="subscriberFirstName" ref={setRef('subscriberFirstName')} onFocus={() => handleFocus('subscriberFirstName')} value={formData276.subscriberFirstName} onChange={handleChange276} isActive={activeFields.includes('subscriberFirstName')} />
                        </InputGroup>
                        <InputGroup label="Last Name">
                            <TextInput name="subscriberLastName" ref={setRef('subscriberLastName')} onFocus={() => handleFocus('subscriberLastName')} value={formData276.subscriberLastName} onChange={handleChange276} isActive={activeFields.includes('subscriberLastName')} />
                        </InputGroup>
                    </div>
                    <InputGroup label="Member ID">
                        <TextInput name="subscriberId" ref={setRef('subscriberId')} onFocus={() => handleFocus('subscriberId')} value={formData276.subscriberId} onChange={handleChange276} isActive={activeFields.includes('subscriberId')} />
                    </InputGroup>
                </div>

                <div className={`transition-all ${formData276.hasDependent ? '' : ''}`}>
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200">Dependent</h3>
                    <label className="flex items-center cursor-pointer">
                        <span className="mr-2 text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Is Patient?</span>
                        <div className="relative">
                            <input type="checkbox" name="hasDependent" checked={formData276.hasDependent} onChange={handleChange276} className="sr-only" />
                            <div className={`block w-8 h-4 rounded-full transition-colors ${formData276.hasDependent ? 'bg-black dark:bg-brand-500' : 'bg-gray-200 dark:bg-slate-700'}`}></div>
                            <div className={`absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform ${formData276.hasDependent ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                    </div>

                    {formData276.hasDependent && (
                    <div className="animate-fade-in-down">
                        <div className="grid grid-cols-2 gap-4">
                            <InputGroup label="First Name">
                                <TextInput name="dependentFirstName" ref={setRef('dependentFirstName')} onFocus={() => handleFocus('dependentFirstName')} value={formData276.dependentFirstName} onChange={handleChange276} isActive={activeFields.includes('dependentFirstName')} />
                            </InputGroup>
                            <InputGroup label="Last Name">
                                <TextInput name="dependentLastName" ref={setRef('dependentLastName')} onFocus={() => handleFocus('dependentLastName')} value={formData276.dependentLastName} onChange={handleChange276} isActive={activeFields.includes('dependentLastName')} />
                            </InputGroup>
                        </div>
                    </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-slate-200 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">Claim Details</h3>
                    <InputGroup label="Claim Trace Number (ID)">
                        <TextInput name="claimId" ref={setRef('claimId')} onFocus={() => handleFocus('claimId')} value={formData276.claimId} onChange={handleChange276} isActive={activeFields.includes('claimId')} />
                    </InputGroup>
                    <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Total Charge">
                            <TextInput type="number" name="chargeAmount" ref={setRef('chargeAmount')} onFocus={() => handleFocus('chargeAmount')} value={formData276.chargeAmount} onChange={handleChange276} isActive={activeFields.includes('chargeAmount')} />
                        </InputGroup>
                        <InputGroup label="Service Date">
                            <TextInput type="date" name="serviceDate" ref={setRef('serviceDate')} onFocus={() => handleFocus('serviceDate')} value={formData276.serviceDate} onChange={handleChange276} isActive={activeFields.includes('serviceDate')} />
                        </InputGroup>
                    </div>
                </div>
                </>
            )}

            </div>
        </div>
      )}
    </div>
  );
};