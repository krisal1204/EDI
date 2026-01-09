import React, { useState, Fragment } from 'react';
import { ClaimStatusRow } from '../services/ediMapper';

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
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white m-4 border border-gray-100 rounded">
         <p className="text-sm">No claim status information found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 overflow-auto bg-white relative">
        <div className="absolute inset-0">
            <table className="min-w-full text-left text-xs divide-y divide-gray-100">
                <thead className="bg-white sticky top-0 z-10">
                <tr>
                    <th className="w-8 px-4 py-3 bg-white border-b border-gray-200"></th>
                    <th className="px-4 py-3 font-medium text-gray-900 uppercase tracking-wider bg-white border-b border-gray-200">Patient</th>
                    <th className="px-4 py-3 font-medium text-gray-900 uppercase tracking-wider bg-white border-b border-gray-200">Claim ID</th>
                    <th className="px-4 py-3 font-medium text-gray-900 uppercase tracking-wider bg-white border-b border-gray-200">Status</th>
                    <th className="px-4 py-3 font-medium text-gray-900 uppercase tracking-wider bg-white border-b border-gray-200 text-right">Billed</th>
                    <th className="px-4 py-3 font-medium text-gray-900 uppercase tracking-wider bg-white border-b border-gray-200 text-right">Paid</th>
                    <th className="px-4 py-3 font-medium text-gray-900 uppercase tracking-wider bg-white border-b border-gray-200">Check Info</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                {claims.map((c, i) => (
                    <Fragment key={i}>
                        <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleRow(i)}>
                            <td className="px-4 py-3 text-gray-400">
                                {c.serviceLines.length > 0 && (
                                    <span className={`transform inline-block transition-transform ${expandedRows.has(i) ? 'rotate-90' : ''}`}>›</span>
                                )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap align-top text-gray-600 font-medium">
                               {c.entity}
                            </td>
                            <td className="px-4 py-3 font-mono text-gray-700 align-top">
                               {c.claimRef}
                               <div className="text-[10px] text-gray-400 mt-0.5">{c.statusDate}</div>
                            </td>
                            <td className="px-4 py-3 align-top">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border
                                    ${c.statusCategory === 'F1' || c.statusCategory === 'F0' 
                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                        : c.statusCategory === 'F2' 
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : 'bg-yellow-50 text-yellow-800 border-yellow-200'
                                    }`}>
                                    {c.statusCategory}-{c.statusCode}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-gray-700 align-top">
                                ${c.billedAmount}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900 align-top">
                                ${c.paidAmount}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-[11px] align-top">
                                {c.checkNumber ? (
                                    <div>
                                        <span className="font-mono text-gray-700">#{c.checkNumber}</span>
                                        {c.checkDate && <span className="text-gray-400 ml-2">{c.checkDate}</span>}
                                    </div>
                                ) : '-'}
                            </td>
                        </tr>
                        {expandedRows.has(i) && c.serviceLines.length > 0 && (
                            <tr className="bg-gray-50/50">
                                <td colSpan={7} className="px-4 py-2">
                                    <div className="ml-8 border border-gray-200 rounded bg-white overflow-hidden shadow-sm">
                                        <table className="min-w-full text-[11px]">
                                            <thead className="bg-gray-50 text-gray-500">
                                                <tr>
                                                    <th className="px-3 py-2 text-left font-medium">Line</th>
                                                    <th className="px-3 py-2 text-left font-medium">Service / Procedure</th>
                                                    <th className="px-3 py-2 text-left font-medium">Status</th>
                                                    <th className="px-3 py-2 text-right font-medium">Billed</th>
                                                    <th className="px-3 py-2 text-right font-medium">Paid</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {c.serviceLines.map((line, idx) => (
                                                    <tr key={idx} className="hover:bg-blue-50/20">
                                                        <td className="px-3 py-2 text-gray-400 font-mono">
                                                            {line.lineId || idx + 1}
                                                        </td>
                                                        <td className="px-3 py-2 text-gray-800">
                                                            <div className="font-mono font-medium">{line.procedureCode}</div>
                                                            <div className="text-gray-500 truncate max-w-xs">{line.procedureDesc}</div>
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            {line.statusCategory ? (
                                                                <span className="text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                                                                    {line.statusCategory}-{line.statusCode}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono text-gray-600">
                                                            ${line.chargeAmount}
                                                        </td>
                                                        <td className="px-3 py-2 text-right font-mono font-medium text-gray-900">
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