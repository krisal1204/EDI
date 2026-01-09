import { EdiDocument, EdiSegment } from '../types';
import { FormData270, FormData276 } from './ediBuilder';
import { getElementDefinition } from './offlineAnalyzer';

/**
 * Data structure for the Benefits Table
 */
export interface BenefitRow {
  type: string;      // EB01
  coverage: string;  // EB02
  service: string;   // EB03
  insuranceType: string; // EB04
  timePeriod: string; // EB06
  amount: string;    // EB07
  percent: string;   // EB08
  quantityQualifier: string; // EB09
  quantity: string;  // EB10
  authRequired: string; // EB11
  network: string;   // EB12
  messages: string[]; // MSG segments
  dates: string[];   // DTP segments
  reference: string; // e.g., "Subscriber" or "Dependent"
}

export interface ClaimStatusRow {
  entity: string; // Subscriber or Dependent
  claimRef: string; // REF*1K or TRN
  statusCategory: string; // STC01-1
  statusCode: string; // STC01-2
  statusDate: string; // STC02
  billedAmount: string; // STC04
  paidAmount: string; // STC05
  checkNumber: string; // REF*CK
  checkDate: string; // DTP*576
  messages: string[]; // Free form text
}

/**
 * Helper to flatten tree for easier searching
 */
const flattenSegments = (segments: EdiSegment[]): EdiSegment[] => {
  let flat: EdiSegment[] = [];
  segments.forEach(s => {
    flat.push(s);
    if (s.children && s.children.length > 0) {
      flat = flat.concat(flattenSegments(s.children));
    }
  });
  return flat;
};

/**
 * Format YYYYMMDD to YYYY-MM-DD
 */
const formatDate = (dateStr?: string): string => {
  if (!dateStr || dateStr.length !== 8) return '';
  return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
};

/**
 * Format DTP date range or single date
 */
const formatDtpValue = (format: string, value: string): string => {
    if (!value) return '';
    if (format === 'D8') return formatDate(value);
    if (format === 'RD8' && value.length === 17) { // YYYYMMDD-YYYYMMDD
        const start = formatDate(value.substring(0, 8));
        const end = formatDate(value.substring(9, 17));
        return `${start} to ${end}`;
    }
    return value;
}

export const mapEdiToForm = (doc: EdiDocument): Partial<FormData270> => {
  const segments = flattenSegments(doc.segments);
  const data: Partial<FormData270> = {};

  // 1. Payer (Look for NM1*PR)
  // Or HL*20 -> NM1*PR (technically NM1 is usually child of HL)
  const payerSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
  if (payerSeg) {
    data.payerName = payerSeg.elements[2]?.value || '';
    data.payerId = payerSeg.elements[8]?.value || '';
  }

  // 2. Provider (Look for NM1*1P)
  const providerSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === '1P');
  if (providerSeg) {
    data.providerName = providerSeg.elements[2]?.value || '';
    data.providerNpi = providerSeg.elements[8]?.value || '';
  }

  // 3. Subscriber (Look for NM1*IL)
  const subSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
  if (subSeg) {
    data.subscriberLastName = subSeg.elements[2]?.value || '';
    data.subscriberFirstName = subSeg.elements[3]?.value || '';
    data.subscriberId = subSeg.elements[8]?.value || '';

    // Try to find DMG under Subscriber
    // In a flat list, DMG usually follows NM1 immediately or closely
    const subIndex = segments.indexOf(subSeg);
    // Look ahead next 5 segments
    const dmg = segments.slice(subIndex, subIndex + 5).find(s => s.tag === 'DMG');
    if (dmg) {
      data.subscriberDob = formatDate(dmg.elements[1]?.value);
    }
  }

  // 4. Dependent (Look for NM1*03)
  const depSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === '03');
  if (depSeg) {
    data.hasDependent = true;
    data.dependentLastName = depSeg.elements[2]?.value || '';
    data.dependentFirstName = depSeg.elements[3]?.value || '';

    const depIndex = segments.indexOf(depSeg);
    const dmg = segments.slice(depIndex, depIndex + 5).find(s => s.tag === 'DMG');
    if (dmg) {
      data.dependentDob = formatDate(dmg.elements[1]?.value);
      data.dependentGender = dmg.elements[2]?.value || 'U';
    }
  } else {
    data.hasDependent = false;
  }

  // 5. Service Date (DTP*291)
  const dtpSeg = segments.find(s => s.tag === 'DTP' && s.elements[0]?.value === '291');
  if (dtpSeg) {
    data.serviceDate = formatDate(dtpSeg.elements[2]?.value);
  }

  // 6. Service Type (EQ)
  const eqSeg = segments.find(s => s.tag === 'EQ');
  if (eqSeg) {
    data.serviceTypeCode = eqSeg.elements[0]?.value || '30';
  }

  return data;
};

export const mapEdiToForm276 = (doc: EdiDocument): Partial<FormData276> => {
  const segments = flattenSegments(doc.segments);
  const data: Partial<FormData276> = {};

  // 1. Payer (NM1*PR)
  const payerSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
  if (payerSeg) {
    data.payerName = payerSeg.elements[2]?.value || '';
    data.payerId = payerSeg.elements[8]?.value || '';
  }

  // 2. Provider (NM1*41 or NM1*1P)
  // 276 usually uses 41 for Information Receiver or 1P for Service Provider
  const providerSeg = segments.find(s => s.tag === 'NM1' && (s.elements[0]?.value === '41' || s.elements[0]?.value === '1P'));
  if (providerSeg) {
    data.providerName = providerSeg.elements[2]?.value || '';
    data.providerNpi = providerSeg.elements[8]?.value || '';
  }

  // 3. Subscriber (NM1*IL)
  const subSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
  if (subSeg) {
    data.subscriberLastName = subSeg.elements[2]?.value || '';
    data.subscriberFirstName = subSeg.elements[3]?.value || '';
    data.subscriberId = subSeg.elements[8]?.value || '';
  }

  // 4. Dependent (NM1*03)
  const depSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === '03');
  if (depSeg) {
    data.hasDependent = true;
    data.dependentLastName = depSeg.elements[2]?.value || '';
    data.dependentFirstName = depSeg.elements[3]?.value || '';
  } else {
    data.hasDependent = false;
  }

  // 5. Claim Info
  // TRN*1 is Claim Status Tracking Number
  const trnSeg = segments.find(s => s.tag === 'TRN' && s.elements[0]?.value === '1');
  if (trnSeg) {
      data.claimId = trnSeg.elements[1]?.value || '';
  }

  // AMT*T3
  const amtSeg = segments.find(s => s.tag === 'AMT' && s.elements[0]?.value === 'T3');
  if (amtSeg) {
      data.chargeAmount = amtSeg.elements[1]?.value || '';
  }

  // DTP*472 (Service Date)
  const dtpSeg = segments.find(s => s.tag === 'DTP' && s.elements[0]?.value === '472');
  if (dtpSeg) {
      data.serviceDate = formatDate(dtpSeg.elements[2]?.value);
  }

  return data;
};

export const mapEdiToBenefits = (doc: EdiDocument): BenefitRow[] => {
    const rows: BenefitRow[] = [];
    const flat = flattenSegments(doc.segments);
    
    // We need to track context (who does this benefit belong to?)
    // In a flat list, we keep track of the last seen HL level
    
    let currentEntity = "Unknown";
    
    for (let i = 0; i < flat.length; i++) {
        const seg = flat[i];
        
        if (seg.tag === 'HL') {
            const level = seg.elements[2]?.value; // HL03
            if (level === '22') currentEntity = "Subscriber";
            else if (level === '23') currentEntity = "Dependent";
        }
        
        if (seg.tag === 'EB') {
            const row: BenefitRow = {
                type: getElementDefinition('EB', 1, seg.elements[0]?.value),
                coverage: getElementDefinition('EB', 2, seg.elements[1]?.value),
                service: getElementDefinition('EB', 3, seg.elements[2]?.value),
                insuranceType: getElementDefinition('EB', 4, seg.elements[3]?.value),
                timePeriod: getElementDefinition('EB', 6, seg.elements[5]?.value),
                amount: seg.elements[6]?.value,
                percent: seg.elements[7]?.value,
                quantityQualifier: getElementDefinition('EB', 9, seg.elements[8]?.value),
                quantity: seg.elements[9]?.value,
                authRequired: getElementDefinition('EB', 11, seg.elements[10]?.value),
                network: getElementDefinition('EB', 12, seg.elements[11]?.value),
                messages: [],
                dates: [],
                reference: currentEntity
            };

            // Look ahead for MSG, III, DTP, LS that might clarify this benefit
            // We scan forward until we hit another EB, EQ, or HL
            let j = i + 1;
            while(j < flat.length) {
                const nextTag = flat[j].tag;
                if (nextTag === 'EB' || nextTag === 'HL' || nextTag === 'EQ' || nextTag === 'SE') break;

                if (nextTag === 'MSG') {
                    // MSG01 is the text
                    const msg = flat[j].elements[0]?.value;
                    if (msg) row.messages.push(msg);
                }
                else if (nextTag === 'DTP') {
                    // DTP01: Qualifier, DTP02: Format, DTP03: Date
                    const qualifier = getElementDefinition('DTP', 1, flat[j].elements[0]?.value);
                    const format = flat[j].elements[1]?.value;
                    const dateVal = flat[j].elements[2]?.value;
                    
                    if (qualifier && dateVal) {
                        row.dates.push(`${qualifier}: ${formatDtpValue(format, dateVal)}`);
                    }
                }

                j++;
            }
            
            rows.push(row);
        }
    }
    
    return rows;
};

export const mapEdiToClaimStatus = (doc: EdiDocument): ClaimStatusRow[] => {
    const rows: ClaimStatusRow[] = [];
    const flat = flattenSegments(doc.segments);
    let currentEntity = "Unknown";
    let currentClaimRef = "-";

    for (let i = 0; i < flat.length; i++) {
        const seg = flat[i];
        
        // Track Hierarchy
        if (seg.tag === 'HL') {
            const level = seg.elements[2]?.value; 
            if (level === '22') currentEntity = "Subscriber";
            else if (level === '23') currentEntity = "Dependent";
        }

        // Track Claim Trace/Ref if available before STC
        if (seg.tag === 'TRN' && seg.elements[0]?.value === '2') {
            currentClaimRef = seg.elements[1]?.value || currentClaimRef;
        }

        if (seg.tag === 'STC') {
            // STC01 is Composite (Category:Status:Entity)
            const stc01 = seg.elements[0]?.value || "";
            const [cat, stat] = stc01.split(':');

            const row: ClaimStatusRow = {
                entity: currentEntity,
                claimRef: currentClaimRef,
                statusCategory: cat || "-",
                statusCode: stat || "-",
                statusDate: formatDate(seg.elements[1]?.value), // STC02
                billedAmount: seg.elements[3]?.value || "0", // STC04
                paidAmount: seg.elements[4]?.value || "0", // STC05
                checkNumber: "",
                checkDate: "",
                messages: []
            };

            // Look ahead for REF (Check info) or DTP
            let j = i + 1;
            while(j < flat.length) {
                const nextTag = flat[j].tag;
                if (nextTag === 'STC' || nextTag === 'HL' || nextTag === 'SE') break;

                if (nextTag === 'REF') {
                    // Check for Check Number (CK)
                    if (flat[j].elements[0]?.value === 'CK') {
                        row.checkNumber = flat[j].elements[1]?.value || "";
                    }
                     // Check for Payer Claim Control Number (1K)
                    if (flat[j].elements[0]?.value === '1K') {
                         if(row.claimRef === '-') row.claimRef = flat[j].elements[1]?.value;
                    }
                }
                if (nextTag === 'DTP' && flat[j].elements[0]?.value === '576') {
                    // Check Issue Date
                     row.checkDate = formatDate(flat[j].elements[2]?.value);
                }

                j++;
            }
            rows.push(row);
        }
    }
    return rows;
}