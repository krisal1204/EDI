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
      segmentTerminator: '~'
    };
  }

  return {
    elementSeparator: raw.charAt(3),
    componentSeparator: raw.charAt(104),
    segmentTerminator: raw.charAt(105) // Sometimes 105, check visual inspection
  };
}

export const parseEdi = (rawEdi: string): EdiDocument => {
  const cleanEdi = rawEdi.trim();
  const delimiters = detectDelimiters(cleanEdi);
  
  // Split segments
  const rawSegments = cleanEdi.split(delimiters.segmentTerminator)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let transactionType: '270' | '271' | '276' | '277' | '837' | 'Unknown' = 'Unknown';

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
    }

    const elements = elementsRaw.slice(1).map((val, i) => ({
      index: i + 1,
      value: val,
      components: val.includes(delimiters.componentSeparator) 
        ? val.split(delimiters.componentSeparator) 
        : undefined
    }));

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