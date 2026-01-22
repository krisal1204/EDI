
import React from 'react';
import { EdiDocument } from '../types';
import { 
    mapEdiToForm, mapEdiToForm834, mapEdiToForm837, mapEdiToForm276, mapEdiToForm278, mapEdiToForm820,
    FormData837, FormData834, FormData270, FormData276, FormData278, FormData820,
    mapEdiToBenefits, mapEdiToClaimStatus, mapEdiToRemittance, mapEdiToOrder
} from '../services/ediMapper';
import { BenefitTable } from './BenefitTable';
import { ClaimStatusTable } from './ClaimStatusTable';
import { PaymentTable } from './PaymentTable';
import { OrderTable } from './OrderTable';

interface Props {
  doc: EdiDocument;
  selectedRecordId: string | null;
  onFieldFocus: (field: string) => void;
}

const Card = ({ title, children, icon }: { title: string, children?: React.ReactNode, icon?: string }) => (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-50 dark:border-slate-800 pb-2">
            {icon && <span className="text-lg">{icon}</span>}
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h3>
        </div>
        {children}
    </div>
);

const DetailRow = ({ label, value, field, onFocus }: { label: string, value: any, field?: string, onFocus?: (f: string) => void }) => (
    <div 
        className={`flex justify-between py-2 text-sm border-b border-gray-50 dark:border-slate-800/50 last:border-0 ${field ? 'cursor-pointer hover:bg-brand-50/50 dark:hover:bg-brand-900/10 px-2 -mx-2 rounded transition-colors' : ''}`}
        onClick={() => field && onFocus && onFocus(field)}
    >
        <span className="text-gray-500 dark:text-slate-500">{label}</span>
        <span className="font-medium text-gray-900 dark:text-slate-200">{value || '—'}</span>
    </div>
);

export const VisualReport: React.FC<Props> = ({ doc, selectedRecordId, onFieldFocus }) => {
    const type = doc.transactionType;

    if (type === '837') {
        const data = mapEdiToForm837(doc, selectedRecordId || undefined) as FormData837;
        return (
            <div className="p-8 h-full overflow-y-auto custom-scrollbar space-y-6 animate-fade-in">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded uppercase tracking-widest mb-2 inline-block">
                            Medical Claim (837{data.type?.charAt(0)})
                        </span>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Claim Summary</h2>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white">${data.totalCharge}</div>
                        <div className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Total Billed Amount</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Patient & Subscriber" icon="👤">
                        <DetailRow label="Name" value={`${data.subscriberFirstName} ${data.subscriberLastName}`} field="subscriberFirstName" onFocus={onFieldFocus} />
                        <DetailRow label="Member ID" value={data.subscriberId} field="subscriberId" onFocus={onFieldFocus} />
                        <DetailRow label="DOB" value={data.subscriberDob} field="subscriberDob" onFocus={onFieldFocus} />
                        <DetailRow label="Gender" value={data.subscriberGender} field="subscriberGender" onFocus={onFieldFocus} />
                    </Card>
                    <Card title="Billing Provider" icon="🏥">
                        <DetailRow label="Organization" value={data.billingProviderName} field="billingProviderName" onFocus={onFieldFocus} />
                        <DetailRow label="NPI" value={data.billingProviderNpi} field="billingProviderNpi" onFocus={onFieldFocus} />
                        <DetailRow label="Tax ID" value={data.billingTaxId} field="billingTaxId" onFocus={onFieldFocus} />
                        <DetailRow label="Address" value={data.billingProviderCity ? `${data.billingProviderCity}, ${data.billingProviderState}` : ''} field="billingProviderCity" onFocus={onFieldFocus} />
                    </Card>
                </div>

                <Card title="Clinical Data" icon="🩺">
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <DetailRow label="Claim ID" value={data.claimId} field="claimId" onFocus={onFieldFocus} />
                            <DetailRow label="Primary Diagnosis" value={data.diagnosisCode1} field="diagnosisCode1" onFocus={onFieldFocus} />
                        </div>
                        <div>
                             <DetailRow label="POS / TOB" value={data.type === 'Institutional' ? data.typeOfBill : data.placeOfService} field="claimId" onFocus={onFieldFocus} />
                             <DetailRow label="Secondary Diagnosis" value={data.diagnosisCode2} field="diagnosisCode2" onFocus={onFieldFocus} />
                        </div>
                    </div>
                </Card>

                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Service Lines</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="text-gray-400 dark:text-slate-500 text-[10px] uppercase font-bold border-b border-gray-50 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Procedure</th>
                                <th className="px-6 py-3 text-right">Charge</th>
                                <th className="px-6 py-3 text-right">Units</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {data.serviceLines?.map((line, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => onFieldFocus(`line-${i}-procedureCode`)}>
                                    <td className="px-6 py-4 text-gray-600 dark:text-slate-400 font-mono">{line.serviceDate}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{line.procedureCode}</td>
                                    <td className="px-6 py-4 text-right font-mono">${line.lineCharge}</td>
                                    <td className="px-6 py-4 text-right text-gray-500">{line.units}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (type === '834') {
        const data = mapEdiToForm834(doc, selectedRecordId || undefined) as FormData834;
        return (
            <div className="p-8 h-full overflow-y-auto custom-scrollbar space-y-6 animate-fade-in">
                <div className="mb-8">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded uppercase tracking-widest mb-2 inline-block">
                        Benefit Enrollment (834)
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Enrollment Report</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-lg border border-gray-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Action</div>
                        <div className="text-lg font-bold text-brand-600">
                            {data.maintenanceType === '021' ? 'ADDITION' : data.maintenanceType === '024' ? 'TERMINATION' : 'CHANGE'}
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-lg border border-gray-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Effective Date</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{data.planEffectiveDate}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-800/40 p-4 rounded-lg border border-gray-100 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">Coverage</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{data.coverageLevelCode}</div>
                    </div>
                </div>

                <Card title="Primary Subscriber" icon="🥇">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                        <DetailRow label="Full Name" value={`${data.subscriber.firstName} ${data.subscriber.lastName}`} field="subFirstName" onFocus={onFieldFocus} />
                        <DetailRow label="Member ID" value={data.subscriber.id} field="subId" onFocus={onFieldFocus} />
                        <DetailRow label="SSN" value={data.subscriber.ssn} field="subSsn" onFocus={onFieldFocus} />
                        <DetailRow label="Policy #" value={data.policyNumber} field="policyNumber" onFocus={onFieldFocus} />
                    </div>
                </Card>

                {data.dependents && data.dependents.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest ml-1">Dependents ({data.dependents.length})</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.dependents.map((dep, i) => (
                                <div 
                                    key={i} 
                                    className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl p-5 hover:border-brand-400 transition-colors cursor-pointer"
                                    onClick={() => onFieldFocus(`dep-${i}-firstName`)}
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-sm">👤</div>
                                        <div>
                                            <div className="font-bold text-gray-900 dark:text-white">{dep.firstName} {dep.lastName}</div>
                                            <div className="text-[10px] text-gray-400 font-mono">REL: {dep.relationship}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 text-xs">
                                        <div className="text-gray-500 uppercase font-bold text-[9px]">DOB: <span className="text-gray-900 dark:text-slate-300 ml-1">{dep.dob}</span></div>
                                        <div className="text-gray-500 uppercase font-bold text-[9px] text-right">SEX: <span className="text-gray-900 dark:text-slate-300 ml-1">{dep.gender}</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (type === '270') {
        const data = mapEdiToForm(doc, selectedRecordId || undefined) as FormData270;
        return (
            <div className="p-8 h-full overflow-y-auto custom-scrollbar space-y-6 animate-fade-in">
                <div className="mb-8">
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-bold rounded uppercase tracking-widest mb-2 inline-block">
                        Eligibility Check (270)
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Coverage Inquiry</h2>
                </div>

                <div className="bg-brand-500 text-white rounded-2xl p-8 shadow-lg shadow-brand-500/20 flex items-center justify-between">
                    <div>
                        <div className="text-brand-100 text-[10px] font-bold uppercase tracking-widest mb-1">Inquiring For</div>
                        <div className="text-2xl font-bold">{data.hasDependent ? `${data.dependentFirstName} ${data.dependentLastName}` : `${data.subscriberFirstName} ${data.subscriberLastName}`}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-brand-100 text-[10px] font-bold uppercase tracking-widest mb-1">Service Type</div>
                        <div className="text-2xl font-mono font-bold">{data.serviceTypeCodes?.[0] || '30'}</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Payer Information" icon="🏢">
                        <DetailRow label="Name" value={data.payerName} field="payerName" onFocus={onFieldFocus} />
                        <DetailRow label="Payer ID" value={data.payerId} field="payerId" onFocus={onFieldFocus} />
                    </Card>
                    <Card title="Requesting Provider" icon="🩺">
                        <DetailRow label="Name" value={data.providerName} field="providerName" onFocus={onFieldFocus} />
                        <DetailRow label="NPI" value={data.providerNpi} field="providerNpi" onFocus={onFieldFocus} />
                    </Card>
                </div>
            </div>
        );
    }

    if (type === '271') {
        // Reuse mapEdiToForm to extract header info like Payer/Subscriber names as they share similar structure
        const header = mapEdiToForm(doc, selectedRecordId || undefined) as Partial<FormData270>;
        const benefits = mapEdiToBenefits(doc, selectedRecordId || undefined);
        
        return (
            <div className="p-8 h-full overflow-y-auto custom-scrollbar space-y-6 animate-fade-in">
                <div className="mb-8">
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded uppercase tracking-widest mb-2 inline-block">
                        Eligibility Response (271)
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Benefit Summary</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card title="Covered Member" icon="👤">
                        <DetailRow label="Name" value={header.hasDependent ? `${header.dependentFirstName} ${header.dependentLastName}` : `${header.subscriberFirstName} ${header.subscriberLastName}`} field="subscriberFirstName" onFocus={onFieldFocus} />
                        <DetailRow label="Member ID" value={header.subscriberId} field="subscriberId" onFocus={onFieldFocus} />
                        <DetailRow label="DOB" value={header.hasDependent ? header.dependentDob : header.subscriberDob} field="subscriberDob" onFocus={onFieldFocus} />
                    </Card>
                    <Card title="Payer" icon="🏢">
                        <DetailRow label="Organization" value={header.payerName} field="payerName" onFocus={onFieldFocus} />
                        <DetailRow label="Payer ID" value={header.payerId} field="payerId" onFocus={onFieldFocus} />
                    </Card>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm h-[500px]">
                    <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Benefit Details</h3>
                    </div>
                    <div className="h-full">
                        <BenefitTable benefits={benefits} />
                    </div>
                </div>
            </div>
        );
    }

    if (type === '276') {
        const data = mapEdiToForm276(doc, selectedRecordId || undefined) as FormData276;
        return (
            <div className="p-8 h-full overflow-y-auto custom-scrollbar space-y-6 animate-fade-in">
                <div className="mb-8">
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-[10px] font-bold rounded uppercase tracking-widest mb-2 inline-block">
                        Status Request (276)
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Claim Status Inquiry</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Claim Details" icon="📄">
                        <DetailRow label="Trace Number" value={data.claimId} field="claimId" onFocus={onFieldFocus} />
                        <DetailRow label="Charge Amount" value={data.chargeAmount} field="chargeAmount" onFocus={onFieldFocus} />
                        <DetailRow label="Service Date" value={data.serviceDate} field="serviceDate" onFocus={onFieldFocus} />
                    </Card>
                    <Card title="Patient" icon="👤">
                        <DetailRow label="Name" value={data.hasDependent ? `${data.dependentFirstName} ${data.dependentLastName}` : `${data.subscriberFirstName} ${data.subscriberLastName}`} field="subscriberFirstName" onFocus={onFieldFocus} />
                        <DetailRow label="Subscriber ID" value={data.subscriberId} field="subscriberId" onFocus={onFieldFocus} />
                    </Card>
                </div>
            </div>
        );
    }

    if (type === '277') {
        const claims = mapEdiToClaimStatus(doc);
        return <ClaimStatusTable claims={claims} />;
    }

    if (type === '278') {
        const data = mapEdiToForm278(doc) as FormData278;
        return (
            <div className="p-8 h-full overflow-y-auto custom-scrollbar space-y-6 animate-fade-in">
                <div className="mb-8">
                    <span className="px-2 py-1 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-[10px] font-bold rounded uppercase tracking-widest mb-2 inline-block">
                        Auth Request (278)
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Authorization</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="Request Details" icon="📋">
                        <DetailRow label="Diagnosis" value={data.diagnosisCode} field="diagnosisCode" onFocus={onFieldFocus} />
                        <DetailRow label="Procedure" value={data.procedureCode} field="procedureCode" onFocus={onFieldFocus} />
                        <DetailRow label="Quantity" value={data.quantity} field="quantity" onFocus={onFieldFocus} />
                        <DetailRow label="Date" value={data.serviceDate} field="serviceDate" onFocus={onFieldFocus} />
                    </Card>
                    <Card title="Parties" icon="🏥">
                        <DetailRow label="Requester" value={data.requesterName} field="requesterName" onFocus={onFieldFocus} />
                        <DetailRow label="UMO" value={data.umoName} field="umoName" onFocus={onFieldFocus} />
                        <DetailRow label="Subscriber" value={`${data.subscriberFirstName} ${data.subscriberLastName}`} field="subscriberFirstName" onFocus={onFieldFocus} />
                    </Card>
                </div>
            </div>
        );
    }

    if (type === '835') {
        const { info, claims } = mapEdiToRemittance(doc);
        return <PaymentTable info={info} claims={claims} />;
    }

    if (type === '820') {
        const data = mapEdiToForm820(doc) as FormData820;
        return (
            <div className="p-8 h-full overflow-y-auto custom-scrollbar space-y-6 animate-fade-in">
                <div className="mb-8">
                    <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded uppercase tracking-widest mb-2 inline-block">
                        Payment Order (820)
                    </span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Premium Payment</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card title="Payment" icon="💰">
                        <DetailRow label="Total Amount" value={data.totalPayment} field="totalPayment" onFocus={onFieldFocus} />
                        <DetailRow label="Trace Number" value={data.checkNumber} field="checkNumber" onFocus={onFieldFocus} />
                        <DetailRow label="Date" value={data.checkDate} field="checkDate" onFocus={onFieldFocus} />
                    </Card>
                    <Card title="Payer" icon="🏢">
                        <DetailRow label="Name" value={data.premiumPayerName} field="premiumPayerName" onFocus={onFieldFocus} />
                        <DetailRow label="ID" value={data.premiumPayerId} field="premiumPayerId" onFocus={onFieldFocus} />
                    </Card>
                    <Card title="Receiver" icon="🏦">
                        <DetailRow label="Name" value={data.premiumReceiverName} field="premiumReceiverName" onFocus={onFieldFocus} />
                        <DetailRow label="ID" value={data.premiumReceiverId} field="premiumReceiverId" onFocus={onFieldFocus} />
                    </Card>
                </div>
                <Card title="Remittance Details">
                    <table className="w-full text-left text-sm">
                        <thead className="text-gray-400 dark:text-slate-500 text-[10px] uppercase font-bold border-b border-gray-50 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-2">Reference ID</th>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                            {data.remittances.map((rem, i) => (
                                <tr key={i}>
                                    <td className="px-4 py-2 font-mono text-gray-600 dark:text-slate-400">{rem.refId}</td>
                                    <td className="px-4 py-2">{rem.name}</td>
                                    <td className="px-4 py-2 text-right font-mono">${rem.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        );
    }

    if (type === '850' || type === '810' || type === '856') {
        const order = mapEdiToOrder(doc);
        if (order) return <OrderTable order={order} />;
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Visual Report Ready</h3>
            <p className="max-w-md text-sm leading-relaxed">
                We've identified this as a <strong>{type}</strong> transaction. Use the Generator Form on the left to edit data, or use the Segment Tree to inspect raw X12 elements.
            </p>
        </div>
    );
};
