
import React, { useState, Fragment } from 'react';
import { PaymentInfo, RemittanceClaim, Adjustment } from '../services/ediMapper';

interface Props {
    info: PaymentInfo;
    claims: RemittanceClaim[];
}

const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    return isNaN(num) ? val : `$${num.toFixed(2)}`;
};

export const PaymentTable: React.FC<Props> = ({ info, claims }) => {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleRow = (index: number) => {
        const next = new Set(expandedRows);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        setExpandedRows(next);
    };

    if (!claims || claims.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-slate-500 bg-white dark:bg-slate-900 m-4 border border-gray-100 dark:border-slate-800 rounded">
                <p className="text-sm">No payment information found in this 835 file.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
            {/* Payment Header */}
            <div className="p-4 bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wide">Check Number</div>
                    <div className="font-mono font-bold text-gray-900 dark:text-white">{info.checkNumber || 'N/A'}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wide">Amount</div>
                    <div className="font-mono font-bold text-green-600 dark:text-green-400">{formatCurrency(info.checkAmount)}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wide">Payer</div>
                    <div className="font-medium text-gray-900 dark:text-white truncate" title={info.payerName}>{info.payerName || 'Unknown'}</div>
                </div>
                <div>
                    <div className="text-xs text-gray-500 dark:text-slate-500 uppercase tracking-wide">Date</div>
                    <div className="font-medium text-gray-900 dark:text-white">{info.checkDate}</div>
                </div>
            </div>

            {/* Claims Table */}
            <div className="flex-1 overflow-auto relative custom-scrollbar">
                <table className="min-w-full text-left text-xs divide-y divide-gray-100 dark:divide-slate-800">
                    <thead className="bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="w-8 px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800"></th>
                            <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">Patient / ID</th>
                            <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">Claim ID</th>
                            <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-right">Billed</th>
                            <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-right">Paid</th>
                            <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-right">Resp</th>
                            <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        {claims.map((claim, i) => (
                            <Fragment key={i}>
                                <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group" onClick={() => toggleRow(i)}>
                                    <td className="px-4 py-3 text-gray-400 dark:text-slate-500 text-center">
                                        <span className={`transform inline-block transition-transform duration-200 ${expandedRows.has(i) ? 'rotate-90' : ''}`}>›</span>
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="font-bold text-gray-900 dark:text-white">{claim.patientName}</div>
                                        <div className="text-[10px] text-gray-500 dark:text-slate-400 font-mono">{claim.patientId}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-slate-300 align-top">
                                        {claim.claimId}
                                        {claim.payerControlNumber && <div className="text-[10px] text-gray-400 dark:text-slate-500 truncate max-w-[120px]" title={claim.payerControlNumber}>ICN: {claim.payerControlNumber}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-slate-400 align-top">
                                        {formatCurrency(claim.chargeAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-900 dark:text-white align-top">
                                        {formatCurrency(claim.paidAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-slate-400 align-top">
                                        {formatCurrency(claim.patientResp)}
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase
                                            ${claim.status === '1' || claim.status === '2' || claim.status === '19'
                                                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' 
                                                : claim.status === '4' || claim.status === '22'
                                                ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
                                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-700'
                                            }`}>
                                            {claim.status === '1' ? 'Processed' : 
                                             claim.status === '2' ? 'Secondary' : 
                                             claim.status === '3' ? 'Denied' :
                                             claim.status === '4' ? 'Denied' : 
                                             claim.status === '22' ? 'Reversal' : 
                                             `Status ${claim.status}`}
                                        </span>
                                    </td>
                                </tr>
                                
                                {expandedRows.has(i) && (
                                    <tr className="bg-gray-50/50 dark:bg-slate-800/20">
                                        <td colSpan={7} className="px-4 py-2">
                                            <div className="ml-8 mb-2 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
                                                
                                                {/* Claim Level Adjustments */}
                                                {claim.adjustments.length > 0 && (
                                                    <div className="p-2 border-b border-gray-100 dark:border-slate-700 bg-yellow-50/50 dark:bg-yellow-900/10">
                                                        <div className="text-[10px] font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1">Claim Adjustments</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {claim.adjustments.map((adj, idx) => (
                                                                <span key={idx} className="text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-yellow-200 dark:border-yellow-800/50 rounded text-gray-700 dark:text-slate-300">
                                                                    <span className="font-bold">{adj.groupCode}-{adj.reasonCode}</span>: {formatCurrency(adj.amount)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <table className="min-w-full text-[11px]">
                                                    <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-300">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-medium">Date</th>
                                                            <th className="px-3 py-2 text-left font-medium">Procedure</th>
                                                            <th className="px-3 py-2 text-right font-medium">Billed</th>
                                                            <th className="px-3 py-2 text-right font-medium">Paid</th>
                                                            <th className="px-3 py-2 text-left font-medium pl-6">Adjustments</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                        {claim.serviceLines.map((line, idx) => (
                                                            <tr key={idx} className="hover:bg-blue-50/10 dark:hover:bg-blue-900/10 transition-colors">
                                                                <td className="px-3 py-2 text-gray-500 dark:text-slate-400 whitespace-nowrap">{line.date}</td>
                                                                <td className="px-3 py-2">
                                                                    <div className="font-mono text-gray-800 dark:text-slate-200">{line.procedureCode}</div>
                                                                    {line.units && <div className="text-[10px] text-gray-400 dark:text-slate-500">{line.units} units</div>}
                                                                </td>
                                                                <td className="px-3 py-2 text-right text-gray-600 dark:text-slate-400 font-mono">{formatCurrency(line.chargeAmount)}</td>
                                                                <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white font-mono">{formatCurrency(line.paidAmount)}</td>
                                                                <td className="px-3 py-2 pl-6">
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {line.adjustments.map((adj, aIdx) => (
                                                                            <span key={aIdx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800/50">
                                                                                <span className="font-bold mr-1">{adj.groupCode}-{adj.reasonCode}</span>
                                                                                {formatCurrency(adj.amount)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
