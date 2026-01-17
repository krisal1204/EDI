
import React from 'react';
import { OrderData } from '../services/ediMapper';

interface Props {
    order: OrderData;
}

const formatCurrency = (val: string) => {
    const num = parseFloat(val);
    return isNaN(num) ? val : `$${num.toFixed(2)}`;
};

export const OrderTable: React.FC<Props> = ({ order }) => {
    if (!order) return null;

    const isInvoice = order.type === 'Invoice';
    const isAsn = order.type === 'Ship Notice';

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 overflow-y-auto custom-scrollbar p-8">
            <div className="max-w-4xl mx-auto w-full bg-white dark:bg-slate-800 shadow-lg rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                
                {/* Header */}
                <div className="p-8 border-b border-gray-200 dark:border-slate-700 flex justify-between items-start bg-gray-50/50 dark:bg-slate-800">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{order.type}</h1>
                        <div className="text-sm text-gray-500 dark:text-slate-400 font-mono">#{order.id}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm uppercase tracking-wide text-gray-500 dark:text-slate-400 font-bold mb-1">Date</div>
                        <div className="text-lg font-medium text-gray-900 dark:text-white">{order.date}</div>
                    </div>
                </div>

                {/* Addresses */}
                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                    {order.buyer && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                                {isInvoice ? 'Bill To' : 'Buyer'}
                            </h3>
                            <div className="text-gray-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                                {order.buyer}
                            </div>
                        </div>
                    )}
                    {order.seller && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                                {isInvoice ? 'Vendor' : 'Seller'}
                            </h3>
                            <div className="text-gray-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                                {order.seller}
                            </div>
                        </div>
                    )}
                    {order.shipTo && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">
                                Ship To
                            </h3>
                            <div className="text-gray-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                                {order.shipTo}
                            </div>
                        </div>
                    )}
                </div>

                {/* Line Items */}
                <div className="border-t border-gray-200 dark:border-slate-700">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-900/50 text-gray-500 dark:text-slate-400 font-medium">
                            <tr>
                                <th className="px-8 py-3 w-16">#</th>
                                <th className="px-8 py-3">Item / Description</th>
                                <th className="px-8 py-3 text-right">Qty</th>
                                {!isAsn && <th className="px-8 py-3 text-right">Unit Price</th>}
                                {!isAsn && <th className="px-8 py-3 text-right">Total</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {order.lines.map((line, i) => {
                                const lineTotal = parseFloat(line.quantity) * parseFloat(line.unitPrice);
                                return (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-8 py-4 text-gray-400 dark:text-slate-500 font-mono text-xs">{line.lineNumber || i + 1}</td>
                                        <td className="px-8 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white mb-1">{line.partNumber || 'N/A'}</div>
                                            <div className="text-gray-500 dark:text-slate-400 text-xs">{line.description}</div>
                                        </td>
                                        <td className="px-8 py-4 text-right">
                                            <span className="font-mono font-medium text-gray-900 dark:text-slate-200">{line.quantity}</span>
                                            <span className="text-xs text-gray-400 ml-1">{line.uom}</span>
                                        </td>
                                        {!isAsn && (
                                            <td className="px-8 py-4 text-right font-mono text-gray-600 dark:text-slate-400">
                                                {formatCurrency(line.unitPrice)}
                                            </td>
                                        )}
                                        {!isAsn && (
                                            <td className="px-8 py-4 text-right font-mono font-bold text-gray-900 dark:text-white">
                                                {isNaN(lineTotal) ? '-' : formatCurrency(lineTotal.toString())}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Totals */}
                {!isAsn && (
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-8 border-t border-gray-200 dark:border-slate-700">
                        <div className="flex justify-end items-center gap-8">
                            <div className="text-gray-500 dark:text-slate-400 font-medium">Total Amount</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(order.totalAmount)}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
