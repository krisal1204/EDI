import React, { useState } from 'react';
import { EdiSegment } from '../types';

interface SegmentTreeProps {
  segments: EdiSegment[];
  selectedId: string | null;
  onSelect: (segment: EdiSegment) => void;
}

const SegmentNode: React.FC<{ 
  segment: EdiSegment; 
  selectedId: string | null; 
  onSelect: (s: EdiSegment) => void;
}> = ({ segment, selectedId, onSelect }) => {
  const [expanded, setExpanded] = useState(true);
  const isSelected = selectedId === segment.id;
  const hasChildren = segment.children && segment.children.length > 0;

  const getLabel = (seg: EdiSegment) => {
    if (seg.tag === 'NM1') return `${seg.tag} ${seg.elements[2]?.value || ''}`;
    if (seg.tag === 'HL') {
        const level = seg.levelCode === '20' ? 'Source' : 
                      seg.levelCode === '21' ? 'Receiver' :
                      seg.levelCode === '22' ? 'Subscriber' :
                      seg.levelCode === '23' ? 'Dependent' : 
                      seg.levelCode === '19' ? 'Provider' : 'Level';
        return `${seg.tag} ${level}`;
    }
    return seg.tag;
  };

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-1.5 px-3 cursor-pointer border-l-2 transition-colors duration-150 text-xs font-mono
          ${isSelected ? 'border-black bg-gray-50 text-black font-medium' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        style={{ paddingLeft: `${(segment.depth * 12) + 12}px` }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(segment);
        }}
      >
        {hasChildren ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }} 
            className="mr-1.5 focus:outline-none hover:text-black"
          >
            <span className={`inline-block transform transition-transform ${expanded ? 'rotate-90' : ''}`}>›</span>
          </button>
        ) : <span className="w-2.5 mr-1.5"></span>}
        
        <span>{getLabel(segment)}</span>
      </div>

      {hasChildren && expanded && (
        <div>
          {segment.children!.map(child => (
            <SegmentNode 
              key={child.id} 
              segment={child} 
              selectedId={selectedId} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SegmentTree: React.FC<SegmentTreeProps> = ({ segments, selectedId, onSelect }) => {
  return (
    <div className="h-full overflow-y-auto bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest sticky top-0 bg-white z-10">
        Structure
      </div>
      <div className="py-2 pb-20">
        {segments.map(seg => (
          <SegmentNode 
            key={seg.id} 
            segment={seg} 
            selectedId={selectedId} 
            onSelect={onSelect} 
          />
        ))}
      </div>
    </div>
  );
};