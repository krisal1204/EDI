
import { EdiDocument, EdiSegment } from '../types';

const uuid = () => Math.random().toString(36).substring(2, 11);

/**
 * Detects delimiters from the ISA segment (standard X12)
 * ISA is fixed length 106 characters.
 */
function detectDelimiters(raw: string) {
  if (!raw.startsWith('ISA')) {
    return {
      elementSeparator: '*',
      componentSeparator: ':',
      segmentTerminator: '~',
      repetitionSeparator: '^'
    };
  }

  // ISA is always 106 chars in valid X12
  const elementSeparator = raw.charAt(3);
  const componentSeparator = raw.charAt(104);
  const segmentTerminator = raw.charAt(105);
  
  // ISA11 is typically the repetition separator in 5010
  const parts = raw.split(elementSeparator);
  const repetitionSeparator = parts[11] && parts[11].length === 1 ? parts[11] : undefined;

  return {
    elementSeparator,
    componentSeparator,
    segmentTerminator,
    repetitionSeparator
  };
}

export const parseEdi = (rawEdi: string): EdiDocument => {
  const cleanEdi = rawEdi.trim();
  const delimiters = detectDelimiters(cleanEdi);
  
  // Robust split handling both with and without newlines
  const rawSegments = cleanEdi.split(delimiters.segmentTerminator)
    .map(s => s.replace(/[\n\r]/g, '').trim())
    .filter(s => s.length > 0);

  let transactionType: any = 'Unknown';

  const segments: EdiSegment[] = rawSegments.map((rawSeg, index) => {
    const elementsRaw = rawSeg.split(delimiters.elementSeparator);
    const tag = elementsRaw[0];
    
    if (tag === 'ST') {
        const typeCode = elementsRaw[1]?.trim();
        if (['270', '271', '276', '277', '278', '837', '834', '835', '820', '850', '810', '856'].includes(typeCode)) {
            transactionType = typeCode as any;
        }
    }

    const elements = elementsRaw.slice(1).map((val, i) => {
      const repeats = (delimiters.repetitionSeparator && val.includes(delimiters.repetitionSeparator))
        ? val.split(delimiters.repetitionSeparator)
        : undefined;

      const components = val.includes(delimiters.componentSeparator) 
        ? val.split(delimiters.componentSeparator) 
        : undefined;

      return { index: i + 1, value: val, components, repeats };
    });

    return {
      id: uuid(),
      tag,
      raw: rawSeg + delimiters.segmentTerminator + '\n', // Added newline for display formatting
      elements,
      lineNumber: index + 1,
      depth: 0,
      children: []
    };
  });

  // Organise into tree based on HL or generic nesting
  const hlMap = new Map<string, EdiSegment>();
  segments.forEach(seg => {
    if (seg.tag === 'HL') {
      const hlId = seg.elements[0]?.value;
      if (hlId) {
        seg.hlId = hlId;
        seg.parentId = seg.elements[1]?.value || undefined;
        seg.levelCode = seg.elements[2]?.value;
        hlMap.set(hlId, seg);
      }
    }
  });

  const tree: EdiSegment[] = [];
  let currentHl: EdiSegment | null = null;

  segments.forEach(seg => {
    if (seg.tag === 'HL') {
      seg.children = [];
      currentHl = seg;
      if (seg.parentId && hlMap.has(seg.parentId)) {
        const parent = hlMap.get(seg.parentId)!;
        parent.children!.push(seg);
        seg.depth = parent.depth + 1;
      } else {
        tree.push(seg);
      }
    } else {
      if (!currentHl) tree.push(seg);
      else {
        currentHl.children!.push(seg);
        seg.depth = currentHl.depth + 1;
      }
    }
  });

  return {
    segments: hlMap.size > 0 ? tree : segments,
    ...delimiters,
    raw: rawEdi,
    transactionType
  };
};

export const flattenTree = (segments: EdiSegment[]): EdiSegment[] => {
  let flat: EdiSegment[] = [];
  segments.forEach(seg => {
    flat.push(seg);
    if (seg.children && seg.children.length > 0) {
      flat = flat.concat(flattenTree(seg.children));
    }
  });
  return flat;
};

export const getRecordRaw = (doc: EdiDocument, recordId: string): string => {
    const flat = flattenTree(doc.segments);
    const anchorIdx = flat.findIndex(s => s.id === recordId);
    if (anchorIdx === -1) return "";
    const anchorSeg = flat[anchorIdx];
    let endIdx = anchorIdx + 1;
    
    const isStartOfNextRecord = (seg: EdiSegment) => {
        if (['SE', 'GE', 'IEA'].includes(seg.tag)) return true;
        if (anchorSeg.tag === 'INS') return seg.tag === 'INS';
        if (anchorSeg.tag === 'CLM') return seg.tag === 'CLM';
        if (anchorSeg.tag === 'CLP') return seg.tag === 'CLP';
        if (anchorSeg.tag === 'HL' && seg.tag === 'HL') return seg.depth <= anchorSeg.depth;
        return false;
    };

    while(endIdx < flat.length && !isStartOfNextRecord(flat[endIdx])) endIdx++;
    return flat.slice(anchorIdx, endIdx).map(s => s.raw).join('');
};

export const replaceRecordInEdi = (doc: EdiDocument, newEdi: string, recordId: string): string => {
    const originalFlat = flattenTree(doc.segments);
    const anchorIdx = originalFlat.findIndex(s => s.id === recordId);
    if (anchorIdx === -1) return doc.raw; 

    const anchorSeg = originalFlat[anchorIdx];
    let endIdx = anchorIdx + 1;
    const isNext = (seg: EdiSegment) => (['SE', 'GE', 'IEA'].includes(seg.tag)) || (anchorSeg.tag === 'INS' && seg.tag === 'INS') || (anchorSeg.tag === 'CLM' && seg.tag === 'CLM') || (anchorSeg.tag === 'HL' && seg.tag === 'HL' && seg.depth <= anchorSeg.depth);
    while(endIdx < originalFlat.length && !isNext(originalFlat[endIdx])) endIdx++;

    const prefix = originalFlat.slice(0, anchorIdx).map(s => s.raw).join('');
    const suffix = originalFlat.slice(endIdx).map(s => s.raw).join('');
    return prefix + newEdi + suffix;
};

export const reindexEdi = (doc: EdiDocument): string => {
    const flat = flattenTree(doc.segments);
    let hlCounter = 0;
    const hlMap = new Map<string, string>(); 
    const reindexed = flat.map(seg => {
        if (seg.tag === 'HL') {
            hlCounter++;
            const oldId = seg.elements[0]?.value;
            const newId = hlCounter.toString();
            if (oldId) hlMap.set(oldId, newId);
            const els = [...seg.elements];
            if (els[0]) els[0] = { ...els[0], value: newId };
            return { ...seg, elements: els };
        }
        return seg;
    }).map(seg => {
        if (seg.tag === 'HL') {
            const els = [...seg.elements];
            const pId = els[1]?.value;
            if (pId && hlMap.has(pId)) els[1] = { ...els[1], value: hlMap.get(pId)! };
            const content = els.map(e => e.value).join(doc.elementSeparator);
            // Reconstruct raw with formatting
            return { ...seg, elements: els, raw: `HL${doc.elementSeparator}${content}${doc.segmentTerminator}\n` };
        }
        return seg;
    });
    return reindexed.map(s => s.raw).join('');
};

export const duplicateRecordInEdi = (doc: EdiDocument, recordId: string): string => {
    const flat = flattenTree(doc.segments);
    const anchorIdx = flat.findIndex(s => s.id === recordId);
    if (anchorIdx === -1) return doc.raw;
    const raw = getRecordRaw(doc, recordId);
    // Count segments roughly by newlines if formatted, or delimiters
    // Just use raw directly since getRecordRaw uses flat segment raw map
    const endIdx = anchorIdx + (raw.split(doc.segmentTerminator).filter(Boolean).length); 
    // Correction: splitting by terminator gives empty string at end usually. 
    // Actually we can find endIdx logic from replaceRecordInEdi logic duplication if we want precision but reindexEdi handles parsing again.
    
    // Simpler: 
    const prefix = flat.slice(0, anchorIdx).map(s => s.raw).join('');
    // We insert BEFORE the next record? No, usually duplicate means append after.
    // Let's find end of current record first.
    let scanIdx = anchorIdx + 1;
    const anchorSeg = flat[anchorIdx];
    const isNext = (seg: EdiSegment) => (['SE', 'GE', 'IEA'].includes(seg.tag)) || (anchorSeg.tag === 'INS' && seg.tag === 'INS') || (anchorSeg.tag === 'CLM' && seg.tag === 'CLM') || (anchorSeg.tag === 'HL' && seg.tag === 'HL' && seg.depth <= anchorSeg.depth);
    while(scanIdx < flat.length && !isNext(flat[scanIdx])) scanIdx++;
    
    const recordRaw = flat.slice(anchorIdx, scanIdx).map(s => s.raw).join('');
    const pre = flat.slice(0, scanIdx).map(s => s.raw).join('');
    const post = flat.slice(scanIdx).map(s => s.raw).join('');
    
    return reindexEdi(parseEdi(pre + recordRaw + post));
};

export const removeRecordFromEdi = (doc: EdiDocument, recordId: string): string => {
    const flat = flattenTree(doc.segments);
    const anchorIdx = flat.findIndex(s => s.id === recordId);
    if (anchorIdx === -1) return doc.raw;
    
    const anchorSeg = flat[anchorIdx];
    let endIdx = anchorIdx + 1;
    const isNext = (seg: EdiSegment) => (['SE', 'GE', 'IEA'].includes(seg.tag)) || (anchorSeg.tag === 'INS' && seg.tag === 'INS') || (anchorSeg.tag === 'CLM' && seg.tag === 'CLM') || (anchorSeg.tag === 'HL' && seg.tag === 'HL' && seg.depth <= anchorSeg.depth);
    while(endIdx < flat.length && !isNext(flat[endIdx])) endIdx++;

    const prefix = flat.slice(0, anchorIdx).map(s => s.raw).join('');
    const suffix = flat.slice(endIdx).map(s => s.raw).join('');
    return reindexEdi(parseEdi(prefix + suffix));
};
