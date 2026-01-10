import { EdiDocument, EdiSegment } from '../types';
import { FormData270, FormData276, FormData837, ServiceLine837 } from './ediBuilder';
import { getElementDefinition, getProcedureDefinition } from './offlineAnalyzer';

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

export interface ServiceLine {
  lineId: string; // from REF*6R or derived
  procedureCode: string;
  procedureDesc: string;
  chargeAmount: string;
  paymentAmount: string;
  revenueCode: string;
  units: string;
  statusCategory: string; // STC01-1
  statusCode: string; // STC01-2
  statusDate: string;
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
  serviceLines: ServiceLine[];
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

  const payerSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
  if (payerSeg) {
    data.payerName = payerSeg.elements[2]?.value || '';
    data.payerId = payerSeg.elements[8]?.value || '';
  }

  const providerSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === '1P');
  if (providerSeg) {
    data.providerName = providerSeg.elements[2]?.value || '';
    data.providerNpi = providerSeg.elements[8]?.value || '';
  }

  const subSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
  if (subSeg) {
    data.subscriberLastName = subSeg.elements[2]?.value || '';
    data.subscriberFirstName = subSeg.elements[3]?.value || '';
    data.subscriberId = subSeg.elements[8]?.value || '';

    const subIndex = segments.indexOf(subSeg);
    const dmg = segments.slice(subIndex, subIndex + 5).find(s => s.tag === 'DMG');
    if (dmg) {
      data.subscriberDob = formatDate(dmg.elements[1]?.value);
    }
  }

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

  const dtpSeg = segments.find(s => s.tag === 'DTP' && s.elements[0]?.value === '291');
  if (dtpSeg) {
    data.serviceDate = formatDate(dtpSeg.elements[2]?.value);
  }

  const eqSegs = segments.filter(s => s.tag === 'EQ');
  if (eqSegs.length > 0) {
    data.serviceTypeCodes = eqSegs.map(s => s.elements[0]?.value || '30');
  }

  return data;
};

export const mapEdiToForm276 = (doc: EdiDocument): Partial<FormData276> => {
  const segments = flattenSegments(doc.segments);
  const data: Partial<FormData276> = {};

  const payerSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
  if (payerSeg) {
    data.payerName = payerSeg.elements[2]?.value || '';
    data.payerId = payerSeg.elements[8]?.value || '';
  }

  const providerSeg = segments.find(s => s.tag === 'NM1' && (s.elements[0]?.value === '41' || s.elements[0]?.value === '1P'));
  if (providerSeg) {
    data.providerName = providerSeg.elements[2]?.value || '';
    data.providerNpi = providerSeg.elements[8]?.value || '';
  }

  const subSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
  if (subSeg) {
    data.subscriberLastName = subSeg.elements[2]?.value || '';
    data.subscriberFirstName = subSeg.elements[3]?.value || '';
    data.subscriberId = subSeg.elements[8]?.value || '';
  }

  const depSeg = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === '03');
  if (depSeg) {
    data.hasDependent = true;
    data.dependentLastName = depSeg.elements[2]?.value || '';
    data.dependentFirstName = depSeg.elements[3]?.value || '';
  } else {
    data.hasDependent = false;
  }

  const trnSeg = segments.find(s => s.tag === 'TRN' && s.elements[0]?.value === '1');
  if (trnSeg) {
      data.claimId = trnSeg.elements[1]?.value || '';
  }

  const amtSeg = segments.find(s => s.tag === 'AMT' && s.elements[0]?.value === 'T3');
  if (amtSeg) {
      data.chargeAmount = amtSeg.elements[1]?.value || '';
  }

  const dtpSeg = segments.find(s => s.tag === 'DTP' && s.elements[0]?.value === '472');
  if (dtpSeg) {
      data.serviceDate = formatDate(dtpSeg.elements[2]?.value);
  }

  return data;
};

export const mapEdiToForm837 = (doc: EdiDocument): Partial<FormData837> => {
    const segments = flattenSegments(doc.segments);
    const data: Partial<FormData837> = {};
    
    // Attempt to detect type
    const gs = segments.find(s => s.tag === 'GS');
    const version = gs?.elements[7]?.value;
    if (version?.includes('223')) data.type = 'Institutional';
    else data.type = 'Professional';

    // Billing Provider (NM1*85)
    const billing = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === '85');
    if (billing) {
        data.billingProviderName = billing.elements[2]?.value || '';
        data.billingProviderNpi = billing.elements[8]?.value || '';
        
        const idx = segments.indexOf(billing);
        const n3 = segments[idx + 1];
        if (n3 && n3.tag === 'N3') data.billingProviderAddress = n3.elements[0]?.value || '';
        const n4 = segments[idx + 2];
        if (n4 && n4.tag === 'N4') {
            data.billingProviderCity = n4.elements[0]?.value || '';
            data.billingProviderState = n4.elements[1]?.value || '';
            data.billingProviderZip = n4.elements[2]?.value || '';
        }
        const ref = segments.slice(idx, idx+5).find(s => s.tag === 'REF' && s.elements[0]?.value === 'EI');
        if (ref) data.billingTaxId = ref.elements[1]?.value || '';
    }

    // Subscriber (NM1*IL)
    const sub = segments.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
    if (sub) {
        data.subscriberLastName = sub.elements[2]?.value || '';
        data.subscriberFirstName = sub.elements[3]?.value || '';
        data.subscriberId = sub.elements[8]?.value || '';
        
        const idx = segments.indexOf(sub);
        const dmg = segments.slice(idx, idx+5).find(s => s.tag === 'DMG');
        if (dmg) {
            data.subscriberDob = formatDate(dmg.elements[1]?.value);
            data.subscriberGender = dmg.elements[2]?.value || '';
        }
    }

    // Payer (NM1*PR) - usually inside Loop 2010BB (after Subscriber)
    // Finding second PR NM1 or one after subscriber
    const subIndex = sub ? segments.indexOf(sub) : 0;
    const payer = segments.slice(subIndex).find(s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
    if (payer) {
        data.payerName = payer.elements[2]?.value || '';
        data.payerId = payer.elements[8]?.value || '';
    }

    // Claim (CLM)
    const clm = segments.find(s => s.tag === 'CLM');
    if (clm) {
        data.claimId = clm.elements[0]?.value || '';
        data.totalCharge = clm.elements[1]?.value || '';
        
        // CLM05 is composite
        const comp = clm.elements[4]?.value || '';
        const parts = comp.split(':');
        
        if (data.type === 'Professional') {
            data.placeOfService = parts[0] || '';
        } else {
            data.typeOfBill = parts[0] || '';
        }
    }

    // HI (Diagnosis)
    const hi = segments.find(s => s.tag === 'HI');
    if (hi) {
        const diag1 = hi.elements[0]?.value || ''; // e.g., ABK:I10
        data.diagnosisCode1 = diag1.split(':')[1] || '';
        const diag2 = hi.elements[1]?.value;
        if (diag2) data.diagnosisCode2 = diag2.split(':')[1] || '';
    }

    // Service Lines (Loop 2400)
    data.serviceLines = [];
    
    // Simple Loop finding: iterate all segments, if LX found, read next SV1/SV2/DTP
    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        if (seg.tag === 'LX') {
            const line: ServiceLine837 = {
                procedureCode: '',
                lineCharge: '',
                units: '',
                serviceDate: ''
            };
            
            // Scan forward until next LX or SE
            let j = i + 1;
            while(j < segments.length) {
                const next = segments[j];
                if (next.tag === 'LX' || next.tag === 'SE') break;
                
                if (next.tag === 'SV1') {
                    const comp = next.elements[0]?.value || ''; // HC:99213
                    line.procedureCode = comp.split(':')[1] || comp;
                    line.lineCharge = next.elements[1]?.value || '';
                    line.units = next.elements[3]?.value || '';
                } else if (next.tag === 'SV2') {
                    line.procedureCode = next.elements[0]?.value || '';
                    line.lineCharge = next.elements[2]?.value || '';
                    line.units = next.elements[4]?.value || '';
                } else if (next.tag === 'DTP' && next.elements[0]?.value === '472') {
                    line.serviceDate = formatDate(next.elements[2]?.value);
                }
                
                j++;
            }
            data.serviceLines.push(line);
        }
    }

    return data;
};

export const mapEdiToBenefits = (doc: EdiDocument): BenefitRow[] => {
    const rows: BenefitRow[] = [];
    const flat = flattenSegments(doc.segments);
    
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

            let j = i + 1;
            while(j < flat.length) {
                const nextTag = flat[j].tag;
                if (nextTag === 'EB' || nextTag === 'HL' || nextTag === 'EQ' || nextTag === 'SE') break;

                if (nextTag === 'MSG') {
                    const msg = flat[j].elements[0]?.value;
                    if (msg) row.messages.push(msg);
                }
                else if (nextTag === 'DTP') {
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
    let currentClaim: ClaimStatusRow | null = null;
    let currentLine: ServiceLine | null = null;

    const pushClaim = () => {
        if (currentClaim) {
            if (currentLine) {
                currentClaim.serviceLines.push(currentLine);
                currentLine = null;
            }
            rows.push(currentClaim);
            currentClaim = null;
        }
    };

    const pushLine = () => {
        if (currentClaim && currentLine) {
            currentClaim.serviceLines.push(currentLine);
            currentLine = null;
        }
    };

    for (let i = 0; i < flat.length; i++) {
        const seg = flat[i];

        // Track Hierarchy Entity (Subscriber vs Dependent)
        if (seg.tag === 'HL') {
            const level = seg.elements[2]?.value; 
            if (level === '22' || level === '23') {
                pushClaim(); // Close previous claim context if switching entity
                currentEntity = level === '22' ? "Subscriber" : "Dependent";
            }
        }

        // New Claim Trigger: TRN in Loop 2000D/2200D
        if (seg.tag === 'TRN' && seg.elements[0]?.value === '2') {
             pushClaim(); // Close previous claim
             
             currentClaim = {
                 entity: currentEntity,
                 claimRef: seg.elements[1]?.value || "Unknown",
                 statusCategory: "-",
                 statusCode: "-",
                 statusDate: "",
                 billedAmount: "0",
                 paidAmount: "0",
                 checkNumber: "",
                 checkDate: "",
                 messages: [],
                 serviceLines: []
             };
        }

        // Claim or Line Status (STC)
        if (seg.tag === 'STC') {
            const stc01 = seg.elements[0]?.value || "";
            const [cat, stat] = stc01.split(':');
            const date = formatDate(seg.elements[1]?.value);
            const amount = seg.elements[3]?.value || "0";
            const payment = seg.elements[4]?.value || "0";

            if (currentLine) {
                // Line Status
                currentLine.statusCategory = cat;
                currentLine.statusCode = stat;
                currentLine.statusDate = date;
                // Prefer payment amount from STC if SVC didn't have it (rare in 277)
            } else if (currentClaim) {
                // Claim Status
                currentClaim.statusCategory = cat;
                currentClaim.statusCode = stat;
                currentClaim.statusDate = date;
                currentClaim.billedAmount = amount;
                currentClaim.paidAmount = payment;
            }
        }

        // Service Line Trigger (SVC)
        if (seg.tag === 'SVC') {
            pushLine(); // Push previous line if any
            
            // SVC01 is composite: HC:99213 or NU:RevenueCode
            const composite = seg.elements[0]?.value || "";
            const parts = composite.split(':');
            // part 0 is qualifier (HC, NU), part 1 is code
            const code = parts.length > 1 ? parts[1] : parts[0]; 

            currentLine = {
                lineId: "",
                procedureCode: code,
                procedureDesc: getProcedureDefinition(code),
                chargeAmount: seg.elements[1]?.value || "0",
                paymentAmount: seg.elements[2]?.value || "0",
                revenueCode: "", // SVC04
                units: seg.elements[6]?.value || "",
                statusCategory: "",
                statusCode: "",
                statusDate: ""
            };
        }

        // Reference Numbers (Check, Line ID, Payer Claim ID)
        if (seg.tag === 'REF') {
             const qual = seg.elements[0]?.value;
             const val = seg.elements[1]?.value;

             if (currentLine) {
                 if (qual === '6R') currentLine.lineId = val;
             } else if (currentClaim) {
                 if (qual === '1K' && currentClaim.claimRef === 'Unknown') currentClaim.claimRef = val;
                 if (qual === 'CK') currentClaim.checkNumber = val;
             }
        }

        // Dates (Check Date)
        if (seg.tag === 'DTP') {
             // DTP*576 Check Date
             const qual = seg.elements[0]?.value;
             const date = formatDate(seg.elements[2]?.value);
             if (currentClaim && !currentLine && qual === '576') {
                 currentClaim.checkDate = date;
             }
        }
    }
    
    pushClaim(); // Close last claim
    return rows;
}