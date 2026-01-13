
import { EdiDocument, EdiSegment } from '../types';

/**
 * Generates a simple unique ID
 */
const uuid = () => Math.random().toString(36).substr(2, 9);

/**
 * Detects delimiters from the ISA segment (standard X12)
 * ISA is fixed length 106 characters.
 */
function detectDelimiters(raw: string) {
  if (!raw.startsWith('ISA')) {
    // Fallback defaults if ISA is missing or malformed (rare for valid EDI)
    return {
      elementSeparator: '*',
      componentSeparator: ':',
      segmentTerminator: '~',
      repetitionSeparator: '^'
    };
  }

  const elementSeparator = raw.charAt(3);
  
  // ISA11 (Repetition Separator) is usually at a specific offset, but splitting is safer given potential formatting issues
  // ISA segments have 16 elements. 
  // ISA*01*...
  // Split limit 17 to get up to ISA16
  const parts = raw.split(elementSeparator);
  const repetitionSeparator = parts[11] && parts[11].length === 1 ? parts[11] : undefined;

  return {
    elementSeparator,
    componentSeparator: raw.charAt(104),
    segmentTerminator: raw.charAt(105), // Sometimes 105, check visual inspection
    repetitionSeparator
  };
}

export const parseEdi = (rawEdi: string): EdiDocument => {
  const cleanEdi = rawEdi.trim();
  const delimiters = detectDelimiters(cleanEdi);
  
  // Split segments
  const rawSegments = cleanEdi.split(delimiters.segmentTerminator)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let transactionType: '270' | '271' | '276' | '277' | '837' | '834' | 'Unknown' = 'Unknown';

  const segments: EdiSegment[] = rawSegments.map((rawSeg, index) => {
    // Split elements
    const elementsRaw = rawSeg.split(delimiters.elementSeparator);
    const tag = elementsRaw[0];
    
    // Check for ST segment to determine type
    if (tag === 'ST') {
        const typeCode = elementsRaw[1];
        if (typeCode === '270') transactionType = '270';
        else if (typeCode === '271') transactionType = '271';
        else if (typeCode === '276') transactionType = '276';
        else if (typeCode === '277') transactionType = '277';
        else if (typeCode === '837') transactionType = '837';
        else if (typeCode === '834') transactionType = '834';
    }

    const elements = elementsRaw.slice(1).map((val, i) => {
      // Handle Repeats (e.g. EB03 "1>33>35")
      const repeats = (delimiters.repetitionSeparator && val.includes(delimiters.repetitionSeparator))
        ? val.split(delimiters.repetitionSeparator)
        : undefined;

      // Handle Components (e.g. SVC01 "HC:99213")
      // Note: If repeats exist, components might exist inside repeats, but simple parser usually treats them hierarchically or just splits strings.
      // For this inspector, we'll check components on the main val or just leave as is if repeated.
      const components = val.includes(delimiters.componentSeparator) 
        ? val.split(delimiters.componentSeparator) 
        : undefined;

      return {
        index: i + 1,
        value: val,
        components,
        repeats
      };
    });

    return {
      id: uuid(),
      tag,
      raw: rawSeg + delimiters.segmentTerminator,
      elements,
      lineNumber: index + 1,
      depth: 0,
      children: []
    };
  });

  // Post-processing for Hierarchy (HL segments)
  const segmentMap = new Map<string, EdiSegment>();
  const hlMap = new Map<string, EdiSegment>(); // Map HL ID to Segment

  // First pass: Identify HL segments and build map
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

  // Second pass: Organize into tree
  const tree: EdiSegment[] = [];
  let currentHl: EdiSegment | null = null;

  segments.forEach(seg => {
    if (seg.tag === 'HL') {
      seg.children = []; // Initialize
      currentHl = seg;
      
      if (seg.parentId && hlMap.has(seg.parentId)) {
        const parent = hlMap.get(seg.parentId)!;
        parent.children = parent.children || [];
        parent.children.push(seg);
        seg.depth = parent.depth + 1;
      } else {
        tree.push(seg); // Root HL
        seg.depth = 0;
      }
    } else {
      // Logic for segments before any HL (like ISA, GS)
      if (!currentHl) {
        tree.push(seg);
      } else {
        // It belongs to the current HL
        currentHl.children?.push(seg);
        seg.depth = currentHl.depth + 1;
      }
    }
  });

  const result: EdiDocument = {
    segments: hlMap.size > 0 ? tree : segments,
    ...delimiters,
    raw: rawEdi,
    transactionType
  };

  return result;
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

/**
 * Extracts the raw text string for a specific record loop.
 */
export const getRecordRaw = (doc: EdiDocument, recordId: string): string => {
    const flat = flattenTree(doc.segments);
    const anchorIdx = flat.findIndex(s => s.id === recordId);
    if (anchorIdx === -1) return "";

    const anchorSeg = flat[anchorIdx];
    let endIdx = anchorIdx + 1;
    
    // Scan forward until we hit a segment that starts a "sibling" or "parent" record, or SE.
    const isStartOfNextRecord = (seg: EdiSegment) => {
        if (seg.tag === 'SE') return true; 
        if (seg.tag === 'GE') return true;
        if (seg.tag === 'IEA') return true;

        if (anchorSeg.tag === 'INS') return seg.tag === 'INS';
        if (anchorSeg.tag === 'CLM') return seg.tag === 'CLM';
        if (anchorSeg.tag === 'HL') {
            // For HL, we stop if we hit a sibling or parent HL (depth <= current)
            if (seg.tag === 'HL') {
                return seg.depth <= anchorSeg.depth;
            }
            return false;
        }
        if (anchorSeg.tag === 'TRN') return seg.tag === 'TRN';
        
        return false;
    };

    while(endIdx < flat.length) {
        if (isStartOfNextRecord(flat[endIdx])) break;
        endIdx++;
    }

    return flat.slice(anchorIdx, endIdx).map(s => s.raw).join('');
};

/**
 * Replaces a specific record loop (identified by recordId) in the original document
 * with a new segment loop generated from the form.
 */
export const replaceRecordInEdi = (doc: EdiDocument, newEdi: string, recordId: string): string => {
    // 1. Flatten Original to linear list for splicing
    const originalFlat = flattenTree(doc.segments);
    const anchorIdx = originalFlat.findIndex(s => s.id === recordId);
    
    // If we can't find the record, return original (safety)
    if (anchorIdx === -1) return doc.raw; 

    const anchorSeg = originalFlat[anchorIdx];
    
    // 2. Determine Original Range End
    // Scan forward until we hit a segment that starts a "sibling" or "parent" record, or SE.
    let endIdx = anchorIdx + 1;
    
    const isStartOfNextRecord = (seg: EdiSegment) => {
        if (seg.tag === 'SE') return true; // End of transaction
        if (seg.tag === 'GE') return true;
        if (seg.tag === 'IEA') return true;

        if (anchorSeg.tag === 'INS') return seg.tag === 'INS';
        if (anchorSeg.tag === 'CLM') return seg.tag === 'CLM';
        if (anchorSeg.tag === 'HL') {
            // For HL, we stop if we hit a sibling or parent HL (depth <= current)
            // If next HL is a child (depth > current), it's part of this record.
            if (seg.tag === 'HL') {
                return seg.depth <= anchorSeg.depth;
            }
            return false;
        }
        if (anchorSeg.tag === 'TRN') return seg.tag === 'TRN';
        
        return false;
    };

    while(endIdx < originalFlat.length) {
        if (isStartOfNextRecord(originalFlat[endIdx])) break;
        endIdx++;
    }

    // 3. Parse New EDI to find Replacement Block
    const newDoc = parseEdi(newEdi);
    const newFlat = flattenTree(newDoc.segments);
    
    // Find matching start segment in new EDI
    let newStartIdx = -1;
    
    if (anchorSeg.tag === 'HL') {
         // Match by Level Code (HL03) - e.g. "22" for Subscriber
         const levelCode = anchorSeg.elements[2]?.value;
         newStartIdx = newFlat.findIndex(s => s.tag === 'HL' && s.elements[2]?.value === levelCode);
    } else {
         // Match by Tag - e.g. "INS", "CLM"
         newStartIdx = newFlat.findIndex(s => s.tag === anchorSeg.tag);
    }
    
    if (newStartIdx === -1) return doc.raw; // Could not find matching record in generated output

    // Determine New Range End
    const newAnchorSeg = newFlat[newStartIdx];
    let newEndIdx = newStartIdx + 1;
    
    const isNewEnd = (seg: EdiSegment) => {
        if (seg.tag === 'SE') return true;
        if (anchorSeg.tag === 'INS') return seg.tag === 'INS';
        if (anchorSeg.tag === 'CLM') return seg.tag === 'CLM';
        if (anchorSeg.tag === 'TRN') return seg.tag === 'TRN';
        if (anchorSeg.tag === 'HL') {
             if (seg.tag === 'HL') return seg.depth <= newAnchorSeg.depth;
             return false;
        }
        return false;
    };

    while(newEndIdx < newFlat.length) {
        if (isNewEnd(newFlat[newEndIdx])) break;
        newEndIdx++;
    }

    // 4. Construct Result
    // Original Prefix + New Block + Original Suffix
    const prefix = originalFlat.slice(0, anchorIdx).map(s => s.raw).join('');
    const replacement = newFlat.slice(newStartIdx, newEndIdx).map(s => s.raw).join('');
    const suffix = originalFlat.slice(endIdx).map(s => s.raw).join('');

    return prefix + replacement + suffix;
};
