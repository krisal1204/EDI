
import React, { useState, Fragment } from 'react';
import { ClaimStatusRow } from '../services/ediMapper';
import { STATUS_CODES } from '../services/offlineAnalyzer';

export const ClaimStatusTable = ({ claims }: { claims: ClaimStatusRow[] }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    const next = new Set(expandedRows);
    if (next.has(index)) {
        next.delete(index);
    } else {
        next.add(index);
    }
    setExpandedRows(next);
  };

  if (!claims || claims.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-slate-500 bg-white dark:bg-slate-900 m-4 border border-gray-100 dark:border-slate-800 rounded">
         <p className="text-sm">No claim status information found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative">
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 relative custom-scrollbar">
        <div className="absolute inset-0">
            <table className="min-w-full text-left text-xs divide-y divide-gray-100 dark:divide-slate-800">
                <thead className="bg-white dark:bg-slate-900 sticky top-0 z-10">
                <tr>
                    <th className="w-8 px-4 py-3 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800"></th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">Patient</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">Claim ID</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-right">Billed</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 text-right">Paid</th>
                    <th className="px-4 py-3 font-medium text-gray-900 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">Check Info</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {claims.map((c, i) => (
                    <Fragment key={i}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => toggleRow(i)}>
                            <td className="px-4 py-3 text-gray-400 dark:text-slate-500">
                                {c.serviceLines.length > 0 && (
                                    <span className={`transform inline-block transition-transform ${expandedRows.has(i) ? 'rotate-90' : ''}`}>›</span>
                                )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap align-top text-gray-600 dark:text-slate-300 font-medium">
                                <div className="font-bold text-gray-900 dark:text-white">{c.patientName || c.entity}</div>
                                {(c.patientName || c.patientId) && (
                                    <div className="text-[10px] text-gray-500 dark:text-slate-400">
                                        {c.entity} {c.patientId ? `• ${c.patientId}` : ''}
                                    </div>
                                )}
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-700 dark:text-slate-400 align-top">
                               {c.claimRef}
                               <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{c.statusDate}</div>
                            </td>
                            <td className="px-4 py-3 align-top max-w-xs">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border
                                    ${c.statusCategory === 'F1' || c.statusCategory === 'F0' 
                                        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50' 
                                        : c.statusCategory === 'F2' 
                                        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50'
                                        : 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50'
                                    }`}>
                                    {c.statusCategory}-{c.statusCode}
                                </span>
                                {STATUS_CODES[c.statusCode] && (
                                    <div className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 leading-tight">
                                        {STATUS_CODES[c.statusCode]}
                                    </div>
                                )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-gray-700 dark:text-slate-400 align-top">
                                ${c.billedAmount}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900 dark:text-slate-200 align-top">
                                ${c.paidAmount}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-[11px] align-top">
                                {c.checkNumber ? (
                                    <div>
                                        <span className="font-mono text-gray-700 dark:text-slate-300">#{c.checkNumber}</span>
                                        {c.checkDate && <span className="text-gray-400 dark:text-slate-500 ml-2">{c.checkDate}</span>}
                                    </div>
                                ) : '-'}
                            </td>
                        </tr>
                        {expandedRows.has(i) && c.serviceLines.length > 0 && (
                            <tr className="bg-gray-50/50 dark:bg-slate-800/20">
                                <td colSpan={7} className="px-4 py-2">
                                    <div className="ml-8 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
                                        <table className="min-w-full text-[11px]">
                                            <thead className="bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-300">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-medium">Line</th>
                                                    <th className="px-3 py-2 text-left font-medium">Service / Procedure</th>
                                                    <th className="px-3 py-2 text-left font-medium">Status</th>
                                                    <th className="px-3 py-2 text-right font-medium">Billed</th>
                                                    <th className="px-3 py-2 text-right font-medium">Paid</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                {c.serviceLines.map((line, idx) => (
                                                    <tr key={idx} className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors">
                                                        <td className="px-3 py-2 text-gray-400 dark:text-slate-500 font-mono">
                                                            {line.lineId || idx + 1}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-800 dark:text-slate-200">
                                                            <div className="font-mono font-medium">{line.procedureCode}</div>
                                                            <div className="text-gray-500 dark:text-slate-400 truncate max-w-xs">{line.procedureDesc}</div>
                                                        </td>
                                                        <td className="px-3 py-2 max-w-xs">
                                                            {line.statusCategory ? (
                                                                <>
                                                                    <span className="text-gray-600 dark:text-slate-300 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-600 inline-block mb-1">
                                                                        {line.statusCategory}-{line.statusCode}
                                                                    </span>
                                                                    {STATUS_CODES[line.statusCode] && (
                                                                        <div className="text-gray-500 dark:text-slate-400 leading-tight">
                                                                            {STATUS_CODES[line.statusCode]}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono text-gray-600 dark:text-slate-400">
                                                            ${line.chargeAmount}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono font-medium text-gray-900 dark:text-slate-200">
                                                            ${line.paymentAmount}
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
    </div>
  );
};
