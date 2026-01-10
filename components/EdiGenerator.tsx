import React, { useState } from 'react';
import { FormData270, FormData276, FormData837, FormData834, Member834, ServiceLine837 } from '../services/ediBuilder';
import { EdiSegment } from '../types';
import { BenefitRow, ClaimStatusRow } from '../services/ediMapper';
import { BenefitTable } from './BenefitTable';
import { ClaimStatusTable } from './ClaimStatusTable';
import { PROCEDURE_CODES, ICD10_CODES, SERVICE_TYPE_CODES } from '../services/referenceData';
import { DatePicker } from './DatePicker';

interface Props {
  formData: FormData270;
  onChange: (data: FormData270) => void;
  formData276: FormData276;
  onChange276: (data: FormData276) => void;
  formData837: FormData837;
  onChange837: (data: FormData837) => void;
  formData834: FormData834;
  onChange834: (data: FormData834) => void;
  transactionType?: string;
  generatorMode: '270' | '276' | '837' | '834';
  onSetGeneratorMode: (mode: '270' | '276' | '837' | '834') => void;
  benefits: BenefitRow[];
  claims: ClaimStatusRow[];
  selectedSegment: EdiSegment | null;
  onFieldFocus: (field: string) => void;
}

const InputField = ({ label, value, onChange, onFocus, type = 'text', className = '', placeholder }: { label: string, value: string, onChange: (val: string) => void, onFocus?: () => void, type?: string, className?: string, placeholder?: string }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-500 focus:ring-1 focus:ring-black dark:focus:ring-brand-500 transition-colors"
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={onFocus}
      placeholder={placeholder}
    />
  </div>
);

const SelectField = ({ label, value, onChange, onFocus, options, className = '' }: { label: string, value: string, onChange: (val: string) => void, onFocus?: () => void, options: {value: string, label: string}[], className?: string }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
    <div className="relative">
      <select
        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-500 focus:ring-1 focus:ring-black dark:focus:ring-brand-500 transition-colors appearance-none cursor-pointer"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
      >
          {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-slate-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

const AutocompleteField = ({ label, value, onChange, onFocus, options, placeholder }: { label: string, value: string, onChange: (val: string) => void, onFocus?: () => void, options: Record<string, string>, placeholder?: string }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    // Filter options based on input
    const filtered = Object.entries(options)
        .filter(([code, desc]) => 
            code.toLowerCase().includes(value.toLowerCase()) || 
            desc.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 8); // Limit to 8 results

    return (
        <div className="mb-4 relative">
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">{label}</label>
            <input
                type="text"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-500 focus:ring-1 focus:ring-black dark:focus:ring-brand-500 transition-colors"
                value={value}
                placeholder={placeholder}
                onChange={e => {
                    onChange(e.target.value);
                    setShowSuggestions(true);
                }}
                onFocus={() => {
                    if (onFocus) onFocus();
                    setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                autoComplete="off"
            />
            {showSuggestions && value && filtered.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl rounded-md max-h-48 overflow-y-auto">
                    {filtered.map(([code, desc]) => (
                        <div 
                            key={code} 
                            className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-50 dark:border-slate-700/50 last:border-0"
                            onClick={() => {
                                onChange(code);
                                setShowSuggestions(false);
                            }}
                        >
                            <div className="flex items-baseline justify-between">
                                <span className="text-xs font-bold text-gray-900 dark:text-white mr-2">{code}</span>
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-slate-400 truncate">{desc}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const SectionHeader = ({ title, action }: { title: string, action?: React.ReactNode }) => (
  <div className="flex items-center justify-between mt-6 mb-4 pb-2 border-b border-gray-100 dark:border-slate-800">
      <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
        {title}
      </h3>
      {action}
  </div>
);

// --- 834 Options ---
const MAINT_TYPES = [
    { value: '021', label: '021 - Addition' },
    { value: '001', label: '001 - Change' },
    { value: '024', label: '024 - Cancellation/Termination' },
    { value: '030', label: '030 - Audit' },
    { value: '025', label: '025 - Reinstatement' }
];

const MAINT_REASONS = [
    { value: '01', label: '01 - Divorce' },
    { value: '02', label: '02 - Birth' },
    { value: '03', label: '03 - Death' },
    { value: '05', label: '05 - Marriage' },
    { value: '07', label: '07 - Termination of Employment' },
    { value: '28', label: '28 - Initial Enrollment' },
    { value: '41', label: '41 - Re-enrollment' },
    { value: '43', label: '43 - Change of Location' }
];

const COVERAGE_LEVELS = [
    { value: 'EMP', label: 'EMP - Employee Only' },
    { value: 'FAM', label: 'FAM - Family' },
    { value: 'ESP', label: 'ESP - Employee + Spouse' },
    { value: 'ECH', label: 'ECH - Employee + Children' },
    { value: 'IND', label: 'IND - Individual' },
    { value: 'SPC', label: 'SPC - Spouse + Children' }
];

const GENDER_OPTIONS = [
    { value: 'M', label: 'Male' },
    { value: 'F', label: 'Female' },
    { value: 'U', label: 'Unknown' }
];

export const EdiGenerator: React.FC<Props> = ({
  formData, onChange,
  formData276, onChange276,
  formData837, onChange837,
  formData834, onChange834,
  transactionType,
  generatorMode, onSetGeneratorMode,
  benefits, claims,
  onFieldFocus
}) => {
  const activeMode = generatorMode;

  if (transactionType === '271') {
    return <BenefitTable benefits={benefits} />;
  }
  if (transactionType === '277') {
    return <ClaimStatusTable claims={claims} />;
  }

  // --- 270 Eligibility Form ---
  const renderForm270 = () => (
    <>
      <SectionHeader title="Payer & Provider" />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Payer Name" value={formData.payerName} onChange={v => onChange({...formData, payerName: v})} onFocus={() => onFieldFocus('payerName')} />
        <InputField label="Payer ID" value={formData.payerId} onChange={v => onChange({...formData, payerId: v})} onFocus={() => onFieldFocus('payerId')} />
        <InputField label="Provider Name" value={formData.providerName} onChange={v => onChange({...formData, providerName: v})} onFocus={() => onFieldFocus('providerName')} />
        <InputField label="Provider NPI" value={formData.providerNpi} onChange={v => onChange({...formData, providerNpi: v})} onFocus={() => onFieldFocus('providerNpi')} />
      </div>

      <SectionHeader title="Subscriber" />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="First Name" value={formData.subscriberFirstName} onChange={v => onChange({...formData, subscriberFirstName: v})} onFocus={() => onFieldFocus('subscriberFirstName')} />
        <InputField label="Last Name" value={formData.subscriberLastName} onChange={v => onChange({...formData, subscriberLastName: v})} onFocus={() => onFieldFocus('subscriberLastName')} />
        <InputField label="Member ID" value={formData.subscriberId} onChange={v => onChange({...formData, subscriberId: v})} onFocus={() => onFieldFocus('subscriberId')} />
        <DatePicker label="DOB" value={formData.subscriberDob} onChange={v => onChange({...formData, subscriberDob: v})} onFocus={() => onFieldFocus('subscriberDob')} />
      </div>

      <div className="mt-4 mb-4 flex items-center">
        <input 
            type="checkbox" 
            id="hasDependent" 
            checked={formData.hasDependent} 
            onChange={e => onChange({...formData, hasDependent: e.target.checked})}
            className="rounded border-gray-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="hasDependent" className="ml-2 text-sm text-gray-700 dark:text-slate-300 font-medium">Dependent is Patient</label>
      </div>

      {formData.hasDependent && (
        <>
            <SectionHeader title="Dependent" />
            <div className="grid grid-cols-2 gap-4">
                <InputField label="First Name" value={formData.dependentFirstName} onChange={v => onChange({...formData, dependentFirstName: v})} onFocus={() => onFieldFocus('dependentFirstName')} />
                <InputField label="Last Name" value={formData.dependentLastName} onChange={v => onChange({...formData, dependentLastName: v})} onFocus={() => onFieldFocus('dependentLastName')} />
                <DatePicker label="DOB" value={formData.dependentDob} onChange={v => onChange({...formData, dependentDob: v})} onFocus={() => onFieldFocus('dependentDob')} />
                <SelectField label="Gender" value={formData.dependentGender} onChange={v => onChange({...formData, dependentGender: v})} onFocus={() => onFieldFocus('dependentGender')} options={GENDER_OPTIONS} />
            </div>
        </>
      )}

      <SectionHeader title="Request Details" />
      <div className="space-y-4">
        <DatePicker label="Service Date" value={formData.serviceDate} onChange={v => onChange({...formData, serviceDate: v})} onFocus={() => onFieldFocus('serviceDate')} />
        
        <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Service Types</label>
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded p-3">
                <div className="flex flex-wrap gap-2 mb-3">
                    {formData.serviceTypeCodes.map(code => (
                        <span key={code} className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs border border-blue-100 dark:border-blue-800">
                            <span className="font-mono font-bold mr-1.5">{code}</span>
                            <span className="mr-1.5 truncate max-w-[200px] hidden sm:inline">{SERVICE_TYPE_CODES[code] || 'Unknown'}</span>
                            <button 
                                onClick={() => {
                                    const newCodes = formData.serviceTypeCodes.filter(c => c !== code);
                                    onChange({...formData, serviceTypeCodes: newCodes});
                                }}
                                className="ml-0.5 text-blue-400 hover:text-red-500 dark:text-blue-400 dark:hover:text-red-400 font-bold"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    {formData.serviceTypeCodes.length === 0 && (
                        <span className="text-gray-400 text-xs italic">No service types selected (Defaults to 30)</span>
                    )}
                </div>
                
                <select
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-500 transition-colors"
                    onChange={(e) => {
                        if (e.target.value && !formData.serviceTypeCodes.includes(e.target.value)) {
                            onChange({...formData, serviceTypeCodes: [...formData.serviceTypeCodes, e.target.value]});
                            e.target.value = ""; // Reset select
                        }
                    }}
                    onFocus={() => onFieldFocus('serviceTypeCodes')}
                    value=""
                >
                    <option value="" disabled>+ Add Service Type...</option>
                    {Object.entries(SERVICE_TYPE_CODES).map(([code, desc]) => (
                        <option key={code} value={code} disabled={formData.serviceTypeCodes.includes(code)}>
                            {code} - {desc}
                        </option>
                    ))}
                </select>
            </div>
        </div>
      </div>
    </>
  );

  // --- 276 Claim Status Form ---
  const renderForm276 = () => (
    <>
      <SectionHeader title="Payer & Provider" />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Payer Name" value={formData276.payerName} onChange={v => onChange276({...formData276, payerName: v})} onFocus={() => onFieldFocus('payerName')} />
        <InputField label="Payer ID" value={formData276.payerId} onChange={v => onChange276({...formData276, payerId: v})} onFocus={() => onFieldFocus('payerId')} />
        <InputField label="Provider Name" value={formData276.providerName} onChange={v => onChange276({...formData276, providerName: v})} onFocus={() => onFieldFocus('providerName')} />
        <InputField label="Provider NPI" value={formData276.providerNpi} onChange={v => onChange276({...formData276, providerNpi: v})} onFocus={() => onFieldFocus('providerNpi')} />
      </div>

      <SectionHeader title="Subscriber" />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="First Name" value={formData276.subscriberFirstName} onChange={v => onChange276({...formData276, subscriberFirstName: v})} onFocus={() => onFieldFocus('subscriberFirstName')} />
        <InputField label="Last Name" value={formData276.subscriberLastName} onChange={v => onChange276({...formData276, subscriberLastName: v})} onFocus={() => onFieldFocus('subscriberLastName')} />
        <InputField label="Member ID" value={formData276.subscriberId} onChange={v => onChange276({...formData276, subscriberId: v})} onFocus={() => onFieldFocus('subscriberId')} />
      </div>

      <div className="mt-4 mb-4 flex items-center">
        <input 
            type="checkbox" 
            id="hasDependent276" 
            checked={formData276.hasDependent} 
            onChange={e => onChange276({...formData276, hasDependent: e.target.checked})}
            className="rounded border-gray-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
        />
        <label htmlFor="hasDependent276" className="ml-2 text-sm text-gray-700 dark:text-slate-300 font-medium">Dependent is Patient</label>
      </div>

      {formData276.hasDependent && (
        <>
            <SectionHeader title="Dependent" />
            <div className="grid grid-cols-2 gap-4">
                <InputField label="First Name" value={formData276.dependentFirstName} onChange={v => onChange276({...formData276, dependentFirstName: v})} onFocus={() => onFieldFocus('dependentFirstName')} />
                <InputField label="Last Name" value={formData276.dependentLastName} onChange={v => onChange276({...formData276, dependentLastName: v})} onFocus={() => onFieldFocus('dependentLastName')} />
            </div>
        </>
      )}

      <SectionHeader title="Claim Details" />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Claim ID (Trace)" value={formData276.claimId} onChange={v => onChange276({...formData276, claimId: v})} onFocus={() => onFieldFocus('claimId')} />
        <InputField label="Charge Amount" value={formData276.chargeAmount} onChange={v => onChange276({...formData276, chargeAmount: v})} onFocus={() => onFieldFocus('chargeAmount')} />
        <DatePicker label="Service Date" value={formData276.serviceDate} onChange={v => onChange276({...formData276, serviceDate: v})} onFocus={() => onFieldFocus('serviceDate')} />
      </div>
    </>
  );

  // --- 837 Claim Form ---
  const handleAddServiceLine = () => {
    const newLine: ServiceLine837 = {
        procedureCode: '',
        lineCharge: '',
        units: '1',
        serviceDate: ''
    };
    onChange837({ ...formData837, serviceLines: [...formData837.serviceLines, newLine] });
  };

  const handleRemoveServiceLine = (idx: number) => {
    const newLines = [...formData837.serviceLines];
    newLines.splice(idx, 1);
    onChange837({ ...formData837, serviceLines: newLines });
  };

  const updateServiceLine = (idx: number, field: keyof ServiceLine837, value: string) => {
    const newLines = [...formData837.serviceLines];
    newLines[idx] = { ...newLines[idx], [field]: value };
    onChange837({ ...formData837, serviceLines: newLines });
  };

  const renderForm837 = () => (
      <>
        <SectionHeader title="Claim Type" />
        <div className="flex gap-4 mb-4">
             <button 
                onClick={() => onChange837({...formData837, type: 'Professional'})}
                className={`flex-1 py-2 text-sm font-medium rounded border ${formData837.type === 'Professional' ? 'bg-black dark:bg-brand-600 text-white border-transparent' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700'}`}
             >
                 Professional (CMS-1500)
             </button>
             <button 
                onClick={() => onChange837({...formData837, type: 'Institutional'})}
                className={`flex-1 py-2 text-sm font-medium rounded border ${formData837.type === 'Institutional' ? 'bg-black dark:bg-brand-600 text-white border-transparent' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700'}`}
             >
                 Institutional (UB-04)
             </button>
        </div>

        <SectionHeader title="Billing Provider" />
        <div className="grid grid-cols-2 gap-4">
            <InputField label="Name" value={formData837.billingProviderName} onChange={v => onChange837({...formData837, billingProviderName: v})} onFocus={() => onFieldFocus('billingProviderName')} />
            <InputField label="NPI" value={formData837.billingProviderNpi} onChange={v => onChange837({...formData837, billingProviderNpi: v})} onFocus={() => onFieldFocus('billingProviderNpi')} />
            <InputField label="Tax ID" value={formData837.billingTaxId} onChange={v => onChange837({...formData837, billingTaxId: v})} onFocus={() => onFieldFocus('billingTaxId')} />
            <InputField label="Address" value={formData837.billingProviderAddress} onChange={v => onChange837({...formData837, billingProviderAddress: v})} onFocus={() => onFieldFocus('billingProviderAddress')} />
            <InputField label="City" value={formData837.billingProviderCity} onChange={v => onChange837({...formData837, billingProviderCity: v})} onFocus={() => onFieldFocus('billingProviderCity')} />
            <div className="grid grid-cols-2 gap-4">
                <InputField label="State" value={formData837.billingProviderState} onChange={v => onChange837({...formData837, billingProviderState: v})} onFocus={() => onFieldFocus('billingProviderState')} />
                <InputField label="Zip" value={formData837.billingProviderZip} onChange={v => onChange837({...formData837, billingProviderZip: v})} onFocus={() => onFieldFocus('billingProviderZip')} />
            </div>
        </div>

        <SectionHeader title="Subscriber" />
        <div className="grid grid-cols-2 gap-4">
            <InputField label="First Name" value={formData837.subscriberFirstName} onChange={v => onChange837({...formData837, subscriberFirstName: v})} onFocus={() => onFieldFocus('subscriberFirstName')} />
            <InputField label="Last Name" value={formData837.subscriberLastName} onChange={v => onChange837({...formData837, subscriberLastName: v})} onFocus={() => onFieldFocus('subscriberLastName')} />
            <InputField label="Member ID" value={formData837.subscriberId} onChange={v => onChange837({...formData837, subscriberId: v})} onFocus={() => onFieldFocus('subscriberId')} />
            <DatePicker label="DOB" value={formData837.subscriberDob} onChange={v => onChange837({...formData837, subscriberDob: v})} onFocus={() => onFieldFocus('subscriberDob')} />
            <InputField label="Gender" value={formData837.subscriberGender} onChange={v => onChange837({...formData837, subscriberGender: v})} onFocus={() => onFieldFocus('subscriberGender')} />
        </div>

        <SectionHeader title="Claim Info" />
        <div className="grid grid-cols-2 gap-4">
            <InputField label="Claim ID" value={formData837.claimId} onChange={v => onChange837({...formData837, claimId: v})} onFocus={() => onFieldFocus('claimId')} />
            <InputField label="Total Charge" value={formData837.totalCharge} onChange={v => onChange837({...formData837, totalCharge: v})} onFocus={() => onFieldFocus('totalCharge')} />
            {formData837.type === 'Professional' ? (
                <InputField label="Place of Service" value={formData837.placeOfService} onChange={v => onChange837({...formData837, placeOfService: v})} onFocus={() => onFieldFocus('placeOfService')} />
            ) : (
                <InputField label="Type of Bill" value={formData837.typeOfBill} onChange={v => onChange837({...formData837, typeOfBill: v})} onFocus={() => onFieldFocus('typeOfBill')} />
            )}
            <AutocompleteField 
                label="Diagnosis 1" 
                value={formData837.diagnosisCode1} 
                onChange={v => onChange837({...formData837, diagnosisCode1: v})} 
                onFocus={() => onFieldFocus('diagnosisCode1')}
                options={ICD10_CODES}
                placeholder="e.g. R05"
            />
        </div>

        <SectionHeader 
            title="Service Lines" 
            action={
                <button 
                    onClick={handleAddServiceLine}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white px-3 py-1.5 rounded transition-colors font-medium border border-gray-200 dark:border-slate-700"
                >
                    + Add Line
                </button>
            }
        />
        <div className="space-y-4">
            {formData837.serviceLines.length === 0 && (
                <div className="text-xs text-gray-400 dark:text-slate-500 italic p-2 border border-dashed border-gray-200 dark:border-slate-800 rounded text-center">
                    No service lines added.
                </div>
            )}
            {formData837.serviceLines.map((line, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-slate-800/50 rounded p-4 border border-gray-100 dark:border-slate-800 relative group">
                    <button 
                        onClick={() => handleRemoveServiceLine(idx)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Remove Line"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <AutocompleteField 
                            label={`Procedure ${idx + 1}`} 
                            value={line.procedureCode} 
                            onChange={v => updateServiceLine(idx, 'procedureCode', v)} 
                            onFocus={() => onFieldFocus('procedureCode')}
                            options={PROCEDURE_CODES}
                            placeholder="CPT/HCPCS"
                        />
                        <InputField label="Charge" value={line.lineCharge} onChange={v => updateServiceLine(idx, 'lineCharge', v)} onFocus={() => onFieldFocus('lineCharge')} />
                        <InputField label="Units" value={line.units} onChange={v => updateServiceLine(idx, 'units', v)} onFocus={() => onFieldFocus('units')} />
                        <DatePicker label="Date" value={line.serviceDate} onChange={v => updateServiceLine(idx, 'serviceDate', v)} onFocus={() => onFieldFocus('serviceDate')} placeholder="YYYY-MM-DD" />
                    </div>
                </div>
            ))}
        </div>
      </>
  );

  // --- 834 Enrollment Form ---
  const handleAddDependent = () => {
      const newDep: Member834 = {
          id: '', firstName: '', lastName: '', ssn: '', dob: '', gender: 'U', relationship: '19'
      };
      onChange834({ ...formData834, dependents: [...formData834.dependents, newDep] });
  };

  const handleRemoveDependent = (idx: number) => {
      const newDeps = [...formData834.dependents];
      newDeps.splice(idx, 1);
      onChange834({ ...formData834, dependents: newDeps });
  };

  const updateDependent = (idx: number, field: keyof Member834, value: string) => {
      const newDeps = [...formData834.dependents];
      newDeps[idx] = { ...newDeps[idx], [field]: value };
      onChange834({ ...formData834, dependents: newDeps });
  };

  const renderForm834 = () => (
      <>
        <SectionHeader title="Sponsor & Payer" />
        <div className="grid grid-cols-2 gap-4">
             <InputField label="Sponsor Name" value={formData834.sponsorName} onChange={v => onChange834({...formData834, sponsorName: v})} onFocus={() => onFieldFocus('sponsorName')} />
             <InputField label="Sponsor Tax ID" value={formData834.sponsorTaxId} onChange={v => onChange834({...formData834, sponsorTaxId: v})} onFocus={() => onFieldFocus('sponsorTaxId')} />
             <InputField label="Payer Name" value={formData834.payerName} onChange={v => onChange834({...formData834, payerName: v})} onFocus={() => onFieldFocus('payerName')} />
             <InputField label="Payer ID" value={formData834.payerId} onChange={v => onChange834({...formData834, payerId: v})} onFocus={() => onFieldFocus('payerId')} />
        </div>

        <SectionHeader title="Enrollment Details" />
        <div className="grid grid-cols-2 gap-4">
             <SelectField label="Maint Type" value={formData834.maintenanceType} onChange={v => onChange834({...formData834, maintenanceType: v})} onFocus={() => onFieldFocus('maintenanceType')} options={MAINT_TYPES} />
             <SelectField label="Reason" value={formData834.maintenanceReason} onChange={v => onChange834({...formData834, maintenanceReason: v})} onFocus={() => onFieldFocus('maintenanceReason')} options={MAINT_REASONS} />
             <SelectField label="Benefit Status" value={formData834.benefitStatus} onChange={v => onChange834({...formData834, benefitStatus: v})} onFocus={() => onFieldFocus('benefitStatus')} options={MAINT_TYPES} />
             <SelectField label="Coverage Level" value={formData834.coverageLevelCode} onChange={v => onChange834({...formData834, coverageLevelCode: v})} onFocus={() => onFieldFocus('coverageLevelCode')} options={COVERAGE_LEVELS} />
             <DatePicker label="Effective Date" value={formData834.planEffectiveDate} onChange={v => onChange834({...formData834, planEffectiveDate: v})} onFocus={() => onFieldFocus('planEffectiveDate')} />
             <InputField label="Policy Number" value={formData834.policyNumber} onChange={v => onChange834({...formData834, policyNumber: v})} onFocus={() => onFieldFocus('policyNumber')} />
        </div>

        <SectionHeader title="Subscriber" />
        <div className="grid grid-cols-2 gap-4">
            <InputField label="First Name" value={formData834.subscriber.firstName} onChange={v => onChange834({...formData834, subscriber: {...formData834.subscriber, firstName: v}})} onFocus={() => onFieldFocus('subscriberFirstName')} />
            <InputField label="Last Name" value={formData834.subscriber.lastName} onChange={v => onChange834({...formData834, subscriber: {...formData834.subscriber, lastName: v}})} onFocus={() => onFieldFocus('subscriberLastName')} />
            <InputField label="Member ID" value={formData834.subscriber.id} onChange={v => onChange834({...formData834, subscriber: {...formData834.subscriber, id: v}})} onFocus={() => onFieldFocus('subscriberId')} />
            <InputField label="SSN" value={formData834.subscriber.ssn} onChange={v => onChange834({...formData834, subscriber: {...formData834.subscriber, ssn: v}})} onFocus={() => onFieldFocus('subscriberSSN')} />
            <DatePicker label="DOB" value={formData834.subscriber.dob} onChange={v => onChange834({...formData834, subscriber: {...formData834.subscriber, dob: v}})} onFocus={() => onFieldFocus('subscriberDob')} />
            <SelectField label="Gender" value={formData834.subscriber.gender} onChange={v => onChange834({...formData834, subscriber: {...formData834.subscriber, gender: v}})} onFocus={() => onFieldFocus('subscriberGender')} options={GENDER_OPTIONS} />
        </div>

        <SectionHeader 
            title="Dependents" 
            action={
                <button 
                    onClick={handleAddDependent}
                    className="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-900 dark:text-white px-3 py-1.5 rounded transition-colors font-medium border border-gray-200 dark:border-slate-700"
                >
                    + Add Dependent
                </button>
            } 
        />
        
        <div className="space-y-4">
            {formData834.dependents.length === 0 && (
                <div className="text-xs text-gray-400 dark:text-slate-500 italic p-2 border border-dashed border-gray-200 dark:border-slate-800 rounded text-center">
                    No dependents added.
                </div>
            )}
            {formData834.dependents.map((dep, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-slate-800/50 rounded p-4 border border-gray-100 dark:border-slate-800 relative group">
                    <button 
                        onClick={() => handleRemoveDependent(idx)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Remove Dependent"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <InputField label="First Name" value={dep.firstName} onChange={v => updateDependent(idx, 'firstName', v)} />
                        <InputField label="Last Name" value={dep.lastName} onChange={v => updateDependent(idx, 'lastName', v)} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                            <DatePicker label="DOB" value={dep.dob} onChange={v => updateDependent(idx, 'dob', v)} />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Relationship</label>
                            <select 
                                value={dep.relationship}
                                onChange={e => updateDependent(idx, 'relationship', e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-sm text-gray-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-brand-500 focus:ring-1 focus:ring-black dark:focus:ring-brand-500 transition-colors"
                            >
                                <option value="01">Spouse (01)</option>
                                <option value="19">Child (19)</option>
                                <option value="21">Unknown (21)</option>
                            </select>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Mode Switcher Tabs (Only if not in Result Mode) */}
      {(activeMode === '270' || activeMode === '276' || activeMode === '837' || activeMode === '834') && (
        <div className="flex border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {['834', '270', '837', '276'].map((mode) => (
                <button
                    key={mode}
                    onClick={() => onSetGeneratorMode(mode as any)}
                    className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition-colors ${
                        activeMode === mode 
                        ? 'border-black dark:border-brand-500 text-black dark:text-white bg-gray-50 dark:bg-slate-800/50' 
                        : 'border-transparent text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
                    }`}
                >
                    {mode === '834' && 'Enrollment'}
                    {mode === '270' && 'Eligibility'}
                    {mode === '837' && 'Claim'}
                    {mode === '276' && 'Status'}
                </button>
            ))}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeMode === '270' && renderForm270()}
          {activeMode === '276' && renderForm276()}
          {activeMode === '837' && renderForm837()}
          {activeMode === '834' && renderForm834()}
      </div>
    </div>
  );
};