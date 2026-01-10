export interface EdiElement {
  index: number;
  value: string;
  components?: string[];
}

export interface EdiSegment {
  id: string; // generated uuid
  tag: string; // e.g., "ISA", "NM1"
  raw: string;
  elements: EdiElement[];
  lineNumber: number;
  
  // Hierarchical Data
  hlId?: string; // If this is an HL segment, the ID
  parentId?: string; // If this is an HL segment, the parent ID
  levelCode?: string; // e.g., '20', '21'
  children?: EdiSegment[]; // For tree view
  depth: number;
}

export interface EdiDocument {
  segments: EdiSegment[];
  elementSeparator: string;
  segmentTerminator: string;
  componentSeparator: string;
  raw: string;
  transactionType: '270' | '271' | '276' | '277' | '837' | 'Unknown';
}

export interface SegmentAnalysis {
  summary: string;
  fields: {
    code: string;
    description: string;
    value: string;
    definition: string;
  }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}