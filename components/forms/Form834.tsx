
import React from 'react';
import { FormData834, Member834 } from '../../services/ediBuilder';
import { InputField, SelectField, SectionHeader, GENDER_OPTIONS } from '../ui/FormElements';
import { DatePicker } from '../DatePicker';

interface Props {
    formData: FormData834;
    onChange: (data: FormData834) => void;
    onFieldFocus: (field: string) => void;
}

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

export const Form834: React.FC<Props> = ({ formData, onChange, onFieldFocus }) => {
    const handleAddDependent = () => {
        const newDep: Member834 = { id: '', firstName: '', lastName: '', ssn: '', dob: '', gender: '', relationship: '19' };
        onChange({ ...formData, dependents: [...formData.dependents, newDep] });
    };

    const handleRemoveDependent = (idx: number) => {
        const newDeps = [...formData.dependents];
        newDeps.splice(idx, 1);
        onChange({ ...formData, dependents: newDeps });
    };

    const updateDependent = (idx: number, field: keyof Member834, value: string) => {
        const newDeps = [...formData.dependents];
        newDeps[idx] = { ...newDeps[idx], [field]: value };
        onChange({ ...formData, dependents: newDeps });
    };

    return (
      <>
        <SectionHeader title="Sponsor & Payer" />
        <div className="grid grid-cols-2 gap-4">
            <InputField id="sponsorName" label="Sponsor Name" value={formData.sponsorName} onChange={v => onChange({...formData, sponsorName: v})} onFocus={() => onFieldFocus('sponsorName')} />
            <InputField id="sponsorTaxId" label="Sponsor Tax ID" value={formData.sponsorTaxId} onChange={v => onChange({...formData, sponsorTaxId: v})} onFocus={() => onFieldFocus('sponsorTaxId')} />
            <InputField id="payerName" label="Payer Name" value={formData.payerName} onChange={v => onChange({...formData, payerName: v})} onFocus={() => onFieldFocus('payerName')} />
            <InputField id="payerId" label="Payer ID" value={formData.payerId} onChange={v => onChange({...formData, payerId: v})} onFocus={() => onFieldFocus('payerId')} />
        </div>

        <SectionHeader title="Enrollment Action" />
        <div className="grid grid-cols-2 gap-4">
            <SelectField id="maintenanceType" label="Type" value={formData.maintenanceType} onChange={v => onChange({...formData, maintenanceType: v})} onFocus={() => onFieldFocus('maintenanceType')} options={MAINT_TYPES} />
            <SelectField id="maintenanceReason" label="Reason" value={formData.maintenanceReason} onChange={v => onChange({...formData, maintenanceReason: v})} onFocus={() => onFieldFocus('maintenanceReason')} options={MAINT_REASONS} />
            <div id="planEffectiveDate" className="col-span-2">
                <DatePicker label="Effective Date" value={formData.planEffectiveDate} onChange={v => onChange({...formData, planEffectiveDate: v})} onFocus={() => onFieldFocus('planEffectiveDate')} />
            </div>
        </div>

        <SectionHeader title="Subscriber" />
        <div className="grid grid-cols-2 gap-4">
            <InputField id="subFirstName" label="First Name" value={formData.subscriber.firstName} onChange={v => onChange({...formData, subscriber: {...formData.subscriber, firstName: v}})} onFocus={() => onFieldFocus('subFirstName')} />
            <InputField id="subLastName" label="Last Name" value={formData.subscriber.lastName} onChange={v => onChange({...formData, subscriber: {...formData.subscriber, lastName: v}})} onFocus={() => onFieldFocus('subLastName')} />
            <InputField id="subId" label="Member ID" value={formData.subscriber.id} onChange={v => onChange({...formData, subscriber: {...formData.subscriber, id: v}})} onFocus={() => onFieldFocus('subId')} />
            <InputField id="subSsn" label="SSN" value={formData.subscriber.ssn} onChange={v => onChange({...formData, subscriber: {...formData.subscriber, ssn: v}})} onFocus={() => onFieldFocus('subSsn')} />
            <div id="subDob">
                <DatePicker label="DOB" value={formData.subscriber.dob} onChange={v => onChange({...formData, subscriber: {...formData.subscriber, dob: v}})} onFocus={() => onFieldFocus('subDob')} />
            </div>
            <SelectField id="subGender" label="Gender" value={formData.subscriber.gender} onChange={v => onChange({...formData, subscriber: {...formData.subscriber, gender: v}})} onFocus={() => onFieldFocus('subGender')} options={GENDER_OPTIONS} />
        </div>

        <SectionHeader title="Coverage" />
        <div className="grid grid-cols-2 gap-4">
            <InputField id="policyNumber" label="Policy Number" value={formData.policyNumber} onChange={v => onChange({...formData, policyNumber: v})} onFocus={() => onFieldFocus('policyNumber')} />
            <SelectField id="coverageLevelCode" label="Level" value={formData.coverageLevelCode} onChange={v => onChange({...formData, coverageLevelCode: v})} onFocus={() => onFieldFocus('coverageLevelCode')} options={COVERAGE_LEVELS} />
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
            {formData.dependents.map((dep, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-slate-800/50 rounded p-4 border border-gray-100 dark:border-slate-800 relative group">
                    <button 
                        onClick={() => handleRemoveDependent(idx)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                        title="Remove Dependent"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <InputField id={`dep-${idx}-firstName`} label="First Name" value={dep.firstName} onChange={v => updateDependent(idx, 'firstName', v)} onFocus={() => onFieldFocus(`dep-${idx}-firstName`)} />
                        <InputField id={`dep-${idx}-lastName`} label="Last Name" value={dep.lastName} onChange={v => updateDependent(idx, 'lastName', v)} onFocus={() => onFieldFocus(`dep-${idx}-lastName`)} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div id={`dep-${idx}-dob`}>
                            <DatePicker label="DOB" value={dep.dob} onChange={v => updateDependent(idx, 'dob', v)} onFocus={() => onFieldFocus(`dep-${idx}-dob`)} />
                        </div>
                        <SelectField id={`dep-${idx}-gender`} label="Gender" value={dep.gender} onChange={v => updateDependent(idx, 'gender', v)} onFocus={() => onFieldFocus(`dep-${idx}-gender`)} options={GENDER_OPTIONS} />
                        <InputField id={`dep-${idx}-rel`} label="Rel Code" value={dep.relationship} onChange={v => updateDependent(idx, 'relationship', v)} onFocus={() => onFieldFocus(`dep-${idx}-rel`)} placeholder="19=Child" />
                    </div>
                </div>
            ))}
        </div>
      </>
    );
};
