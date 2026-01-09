import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FormData270, FormData276 } from '../services/ediBuilder';
import { BenefitRow, ClaimStatusRow } from '../services/ediMapper';
import { EdiSegment } from '../types';
import { BenefitTable } from './BenefitTable';
import { ClaimStatusTable } from './ClaimStatusTable';
import { generateFormData, getModelName } from '../services/geminiService';

interface Props {
  formData: FormData270;
  onChange: (data: FormData270) => void;
  
  formData276: FormData276;
  onChange276: (data: FormData276) => void;

  transactionType?: string; // from parser (270, 271, 276, 277)
  
  // For forcing generator mode when manual
  generatorMode: '270' | '276';
  onSetGeneratorMode: (mode: '270' | '276') => void;

  benefits?: BenefitRow[];
  claims?: ClaimStatusRow[];
  
  selectedSegment?: EdiSegment | null;
  onFieldFocus?: (fieldName: string) => void;
}

const InputGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-4">
    <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
    {children}
  </div>
);

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    isActive?: boolean;
}

const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(({ isActive, className, ...props }, ref) => (
  <input
    ref={ref}
    {...props}
    className={`w-full px-3 py-2 rounded-sm text-sm focus:outline-none transition-all duration-300 disabled:bg-gray-50 disabled:text-gray-400 dark:disabled:bg-slate-800 dark:disabled:text-slate-600
        ${isActive 
            ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm text-blue-900 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-500' 
            : 'bg-white border-gray-200 focus:border-black dark:bg-slate-900 dark:border-slate-700 dark:focus:border-slate-500 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600'
        }
        border
    `}
  />
));

export const EdiGenerator: React.FC<Props> = ({ 
    formData, 
    onChange, 
    formData276, 
    onChange276,
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
  const activeMode = (transactionType === '270' || transactionType === '276') ? transactionType : generatorMode;

  const [view, setView] = useState<'form' | 'table'>('table');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  const setRef = (name: string) => (el: HTMLInputElement | HTMLSelectElement | null) => {
      fieldRefs.current[name] = el;
  };

  const handleChange270 = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
        onChange({ ...formData, [name]: (e.target as HTMLInputElement).checked });
    } else {
        onChange({ ...formData, [name]: value });
    }
  };

  const handleChange276 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        onChange276({ ...formData276, [name]: (e.target as HTMLInputElement).checked });
    } else {
        onChange276({ ...formData276, [name]: value });
    }
  };

  const handleAiAutofill = async () => {
    // Determine the current mode to know which generation to request
    const mode = activeMode as '270' | '276';
    const modelName = getModelName();
    
    // Prompt user for scenario (optional)
    const description = window.prompt(
        "Describe the scenario to generate (e.g. 'Child with broken arm, dependent on mother')", 
        "Realistic random scenario"
    );
    
    if (!description) return; // User cancelled

    setIsAiLoading(true);
    try {
        const generatedData = await generateFormData(mode, description);
        
        if (mode === '270') {
            // Merge with defaults to ensure safety, then overwrite with generated
            // Be careful with boolean mapping if LLM sends strings, though prompt requests boolean.
            onChange({ 
                ...formData, 
                ...generatedData,
                // Ensure dependent fields are cleared if hasDependent is false, to be safe
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
    const val01 = selectedSegment.elements[0]?.value;

    if (selectedSegment.tag === 'NM1') {
        if (val01 === 'PR') return ['payerName', 'payerId'];
        if (val01 === '1P' || val01 === '41') return ['providerName', 'providerNpi'];
        if (val01 === 'IL') return ['subscriberFirstName', 'subscriberLastName', 'subscriberId'];
        if (val01 === '03') return ['dependentFirstName', 'dependentLastName'];
    }
    if (selectedSegment.tag === 'DMG') {
        return ['subscriberDob', 'dependentDob', 'dependentGender'];
    }
    if (selectedSegment.tag === 'DTP') {
        if (val01 === '291' || val01 === '472') return ['serviceDate'];
    }
    if (selectedSegment.tag === 'TRN' && val01 === '1') return ['claimId'];
    if (selectedSegment.tag === 'AMT' && val01 === 'T3') return ['chargeAmount'];
    if (selectedSegment.tag === 'EQ') return ['serviceTypeCode'];

    return [];
  }, [selectedSegment]);

  // Scroll active field into view
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
                            onChange={(e) => onSetGeneratorMode(e.target.value as '270' | '276')}
                            className="text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 rounded px-1 -ml-1 py-1"
                        >
                            <option value="270" className="text-black dark:text-white dark:bg-slate-900">Eligibility (270)</option>
                            <option value="276" className="text-black dark:text-white dark:bg-slate-900">Claim Status (276)</option>
                        </select>
                        
                        <button 
                            onClick={handleAiAutofill}
                            disabled={isAiLoading}
                            className="ml-2 flex items-center space-x-1 px-2 py-1 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300 dark:hover:bg-brand-900/50 dark:border-brand-800/50 rounded text-[10px] font-medium transition-colors disabled:opacity-50 border border-brand-100 dark:border-brand-900"
                            title={`Generate data with Local AI`}
                        >
                            {isAiLoading ? (
                                <>
                                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span>AI Autofill</span>
                                </>
                            )}
                        </button>
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