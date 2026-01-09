import React from 'react';
import { ClaimStatusRow } from '../services/ediMapper';

export const ClaimStatusTable = ({ claims }: { claims: ClaimStatusRow[] }) => {
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
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap align-top text-gray-600">
                           {c.entity}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-700 align-top">
                           {c.claimRef}
                           <div className="text-[10px] text-gray-400 mt-0.5">{c.statusDate}</div>
                        </td>
                        <td className="px-4 py-3 align-top">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800 border border-gray-200">
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
                ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};