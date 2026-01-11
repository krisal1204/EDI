
import React, { useEffect, useState } from 'react';
import { EdiSegment, SegmentAnalysis } from '../types';
import { analyzeSegmentOffline } from '../services/offlineAnalyzer';

interface SegmentDetailProps {
  segment: EdiSegment;
}

export const SegmentDetail: React.FC<SegmentDetailProps> = ({ segment }) => {
  const [analysis, setAnalysis] = useState<SegmentAnalysis | null>(null);

  useEffect(() => {
    const result = analyzeSegmentOffline(segment);
    setAnalysis(result);
  }, [segment]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 overflow-hidden transition-colors">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">{segment.tag}</h2>
          <span className="text-xs font-mono text-gray-400 dark:text-slate-500">Line {segment.lineNumber}</span>
        </div>

        {/* Raw Segment View */}
        <div className="bg-gray-50 dark:bg-slate-900 rounded p-4 border border-gray-100 dark:border-slate-800 overflow-x-auto shadow-sm dark:shadow-none">
          <code className="text-xs font-mono text-gray-800 dark:text-brand-300 whitespace-nowrap">
            {segment.raw}
          </code>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        
        {/* Interpretation Section */}
        <div className="mb-10">
          <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">
            Analysis
          </h3>
          
          <div className="p-0">
            {analysis ? (
              <div>
                <p className="text-gray-900 dark:text-slate-200 text-lg mb-4 font-light leading-relaxed">
                  {analysis.summary}
                </p>
                <div className="flex flex-wrap gap-2">
                   {analysis.fields.filter(f => f.definition && f.definition !== '-' && f.definition !== 'Code not in dictionary' && !f.definition.includes('\n')).map((field, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-1 rounded-sm text-[10px] uppercase font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-transparent dark:border-slate-700">
                        {field.code} • {field.definition}
                      </span>
                   ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Select a segment.</p>
            )}
          </div>
        </div>

        {/* Detailed Fields Table */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Elements</h3>
          <div className="border-t border-gray-100 dark:border-slate-800">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-800">
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {segment.elements.map((el, idx) => {
                  const analyzedField = analysis?.fields.find(f => f.code.endsWith(el.index.toString().padStart(2, '0')));
                  const refId = `${segment.tag}${el.index.toString().padStart(2, '0')}`;
                  
                  return (
                    <tr key={idx} className="group hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 pr-4 whitespace-nowrap text-xs font-mono text-gray-400 dark:text-slate-600 align-top w-20 pt-4">
                        {refId}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-slate-300 align-top pt-3.5">
                        <div className="font-medium mb-0.5 text-gray-900 dark:text-slate-200">{analyzedField?.description || 'Element'}</div>
                        {analyzedField?.definition !== '-' && (
                            <div className="text-gray-500 dark:text-slate-500 font-light text-xs whitespace-pre-wrap">
                                {analyzedField?.definition}
                            </div>
                        )}
                      </td>
                      <td className="py-3 pl-4 whitespace-nowrap text-sm font-mono text-black dark:text-slate-200 align-top text-right pt-4 bg-gray-50/50 dark:bg-slate-900/30">
                        {el.value}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
