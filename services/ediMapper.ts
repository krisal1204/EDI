
import { EdiDocument, EdiSegment } from '../types';
import { FormData270, FormData276, FormData837, FormData834, ServiceLine837, Member834 } from './ediBuilder';
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
 * Find a segment backwards from a starting index
 */
const findBackwards = (segments: EdiSegment[], startIndex: number, predicate: (s: EdiSegment) => boolean): EdiSegment | undefined => {
    for (let i = startIndex; i >= 0; i--) {
        if (predicate(segments[i])) return segments[i];
    }
    return undefined;
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

/**
 * Handles mapping multiple repeated codes to a string list
 */
const getRepeatedDefinition = (tag: string, index: number, element?: { value: string, repeats?: string[] }): string => {
    if (!element) return '';
    
    if (element.repeats && element.repeats.length > 0) {
        return element.repeats.map(val => {
            const def = getElementDefinition(tag, index, val);
            return def !== val ? def : `${val}`;
        }).join(', ');
    }
    return getElementDefinition(tag, index, element.value);
};

export const mapEdiToForm = (doc: EdiDocument, targetId?: string): Partial<FormData270> => {
  const segments = flattenSegments(doc.segments);
  const data: Partial<FormData270> = {};

  // If targetId is provided (e.g. specific HL segment for sub/dep), use it as anchor
  let anchorIndex = segments.length - 1;
  if (targetId) {
      const idx = segments.findIndex(s => s.id === targetId);
      if (idx !== -1) anchorIndex = idx;
  }

  const payerSeg = findBackwards(segments, anchorIndex, s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
  if (payerSeg) {
    data.payerName = payerSeg.elements[2]?.value || '';
    data.payerId = payerSeg.elements[8]?.value || '';
  }

  const providerSeg = findBackwards(segments, anchorIndex, s => s.tag === 'NM1' && s.elements[0]?.value === '1P');
  if (providerSeg) {
    data.providerName = providerSeg.elements[2]?.value || '';
    data.providerNpi = providerSeg.elements[8]?.value || '';
  }

  // Find Subscriber
  // If the anchor is a Dependent HL, look back for Subscriber HL then NM1*IL inside it
  const subSeg = findBackwards(segments, anchorIndex, s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
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

  // Is anchor dependent?
  // Check if current anchor area has NM1*03
  // We search LOCAL to the anchor.
  // If the anchor is the Subscriber HL, we shouldn't find a dependent unless we look forward?
  // Actually, usually in the "Record Selector", if it's a dependent, targetId is the Dependent HL.
  
  const targetSeg = segments[anchorIndex];
  let depSeg: EdiSegment | undefined;
  
  if (targetSeg?.tag === 'HL' && targetSeg.elements[2]?.value === '23') {
       // Target is Dependent HL. Look for NM1*03 inside this HL block
       for(let i = anchorIndex; i < segments.length; i++) {
           if (i > anchorIndex && segments[i].tag === 'HL') break;
           if (segments[i].tag === 'NM1' && segments[i].elements[0]?.value === '03') {
               depSeg = segments[i];
               break;
           }
       }
  } else if (targetSeg?.tag === 'NM1' && targetSeg.elements[0]?.value === '03') {
      depSeg = targetSeg;
  }

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

  // Dates & EQ
  // Look forward from anchor until next HL
  const eqSegs: EdiSegment[] = [];
  for (let i = anchorIndex; i < segments.length; i++) {
      const s = segments[i];
      if (i > anchorIndex && s.tag === 'HL') break;
      
      if (s.tag === 'DTP' && s.elements[0]?.value === '291') {
          data.serviceDate = formatDate(s.elements[2]?.value);
      }
      if (s.tag === 'EQ') {
          eqSegs.push(s);
      }
  }
  
  if (eqSegs.length > 0) {
    data.serviceTypeCodes = eqSegs.map(s => s.elements[0]?.value || '30');
  }

  return data;
};

export const mapEdiToForm276 = (doc: EdiDocument, targetId?: string): Partial<FormData276> => {
  const segments = flattenSegments(doc.segments);
  const data: Partial<FormData276> = {};

  let anchorIndex = segments.length - 1;
  if (targetId) {
      const idx = segments.findIndex(s => s.id === targetId);
      if (idx !== -1) anchorIndex = idx;
  }

  const payerSeg = findBackwards(segments, anchorIndex, s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
  if (payerSeg) {
    data.payerName = payerSeg.elements[2]?.value || '';
    data.payerId = payerSeg.elements[8]?.value || '';
  }

  const providerSeg = findBackwards(segments, anchorIndex, s => s.tag === 'NM1' && (s.elements[0]?.value === '41' || s.elements[0]?.value === '1P'));
  if (providerSeg) {
    data.providerName = providerSeg.elements[2]?.value || '';
    data.providerNpi = providerSeg.elements[8]?.value || '';
  }

  const subSeg = findBackwards(segments, anchorIndex, s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
  if (subSeg) {
    data.subscriberLastName = subSeg.elements[2]?.value || '';
    data.subscriberFirstName = subSeg.elements[3]?.value || '';
    data.subscriberId = subSeg.elements[8]?.value || '';
  }

  // Look for dependent in the hierarchy up to anchor
  // If anchor is TRN inside a Dependent HL loop.
  const depSeg = findBackwards(segments, anchorIndex, s => s.tag === 'NM1' && s.elements[0]?.value === '03');
  // Check if depSeg is actually the parent of this anchor (not a previous sibling's dependent)
  // Simplification: In 276, hierarchy is linear usually. If we found a Dep before this TRN and after the Sub, it applies.
  if (depSeg && subSeg && segments.indexOf(depSeg) > segments.indexOf(subSeg)) {
      data.hasDependent = true;
      data.dependentLastName = depSeg.elements[2]?.value || '';
      data.dependentFirstName = depSeg.elements[3]?.value || '';
  } else {
    data.hasDependent = false;
  }

  // Current Anchor should be TRN or close to it
  let trnSeg = segments[anchorIndex];
  if (trnSeg.tag !== 'TRN') {
      // search forward slightly
      const nextTrn = segments.slice(anchorIndex, anchorIndex + 5).find(s => s.tag === 'TRN');
      if (nextTrn) trnSeg = nextTrn;
  }

  if (trnSeg && trnSeg.tag === 'TRN') {
      data.claimId = trnSeg.elements[1]?.value || '';
      const trnIndex = segments.indexOf(trnSeg);
      
      const amtSeg = segments.slice(trnIndex, trnIndex + 5).find(s => s.tag === 'AMT' && s.elements[0]?.value === 'T3');
      if (amtSeg) {
          data.chargeAmount = amtSeg.elements[1]?.value || '';
      }

      const dtpSeg = segments.slice(trnIndex, trnIndex + 5).find(s => s.tag === 'DTP' && s.elements[0]?.value === '472');
      if (dtpSeg) {
          data.serviceDate = formatDate(dtpSeg.elements[2]?.value);
      }
  }

  return data;
};

export const mapEdiToForm837 = (doc: EdiDocument, targetId?: string): Partial<FormData837> => {
    const segments = flattenSegments(doc.segments);
    const data: Partial<FormData837> = {};
    
    // Attempt to detect type
    const gs = segments.find(s => s.tag === 'GS');
    const version = gs?.elements[7]?.value;
    if (version?.includes('223')) data.type = 'Institutional';
    else data.type = 'Professional';

    // Locate Anchor (The specific CLM segment)
    let clmIndex = -1;
    if (targetId) {
        clmIndex = segments.findIndex(s => s.id === targetId);
    }
    // Default to first CLM if not found or not provided
    if (clmIndex === -1) {
        clmIndex = segments.findIndex(s => s.tag === 'CLM');
    }

    if (clmIndex === -1) return data; // No claim found

    // Look BACKWARDS for Header Info (Context)
    
    // Billing Provider (NM1*85) - nearest before CLM
    const billing = findBackwards(segments, clmIndex, s => s.tag === 'NM1' && s.elements[0]?.value === '85');
    if (billing) {
        data.billingProviderName = billing.elements[2]?.value || '';
        data.billingProviderNpi = billing.elements[8]?.value || '';
        
        const idx = segments.indexOf(billing);
        // Usually N3/N4 follow immediately
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

    // Subscriber (NM1*IL) - nearest before CLM
    const sub = findBackwards(segments, clmIndex, s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
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

    // Payer (NM1*PR) - nearest before CLM (but usually after Subscriber)
    const payer = findBackwards(segments, clmIndex, s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
    if (payer) {
        data.payerName = payer.elements[2]?.value || '';
        data.payerId = payer.elements[8]?.value || '';
    }

    // Claim (CLM) - Current Segment
    const clm = segments[clmIndex];
    if (clm && clm.tag === 'CLM') {
        data.claimId = clm.elements[0]?.value || '';
        data.totalCharge = clm.elements[1]?.value || '';
        
        const comp = clm.elements[4]?.value || '';
        const parts = comp.split(':');
        
        if (data.type === 'Professional') {
            data.placeOfService = parts[0] || '';
        } else {
            data.typeOfBill = parts[0] || '';
        }
    }

    // Look FORWARD from CLM for Details (Diagnosis, Service Lines)
    // Stop at next CLM or next Loop Header that breaks context (e.g. next HL)
    const claimSegments: EdiSegment[] = [];
    for (let i = clmIndex + 1; i < segments.length; i++) {
        const s = segments[i];
        if (s.tag === 'CLM' || s.tag === 'HL' || s.tag === 'SE') break;
        claimSegments.push(s);
    }

    // HI (Diagnosis)
    const hi = claimSegments.find(s => s.tag === 'HI');
    if (hi) {
        const diag1 = hi.elements[0]?.value || '';
        data.diagnosisCode1 = diag1.split(':')[1] || '';
        const diag2 = hi.elements[1]?.value;
        if (diag2) data.diagnosisCode2 = diag2.split(':')[1] || '';
    }

    // Service Lines
    data.serviceLines = [];
    for (let i = 0; i < claimSegments.length; i++) {
        const seg = claimSegments[i];
        if (seg.tag === 'LX') {
            const line: ServiceLine837 = {
                procedureCode: '',
                lineCharge: '',
                units: '',
                serviceDate: ''
            };
            
            // Scan sub-loop
            let j = i + 1;
            while(j < claimSegments.length) {
                const next = claimSegments[j];
                if (next.tag === 'LX') break;
                
                if (next.tag === 'SV1') {
                    const comp = next.elements[0]?.value || '';
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

export const mapEdiToForm834 = (doc: EdiDocument, targetId?: string): Partial<FormData834> => {
    const segments = flattenSegments(doc.segments);
    const data: Partial<FormData834> = {
        dependents: []
    };

    // Locate Anchor (INS segment)
    let insIndex = -1;
    if (targetId) {
        insIndex = segments.findIndex(s => s.id === targetId);
    }
    if (insIndex === -1) insIndex = segments.findIndex(s => s.tag === 'INS');
    
    if (insIndex === -1) return data;

    // Headers (Look Backwards)
    const sponsor = findBackwards(segments, insIndex, s => s.tag === 'N1' && s.elements[0]?.value === 'P5');
    if (sponsor) {
        data.sponsorName = sponsor.elements[1]?.value || '';
        data.sponsorTaxId = sponsor.elements[3]?.value || '';
    }

    const payer = findBackwards(segments, insIndex, s => s.tag === 'N1' && s.elements[0]?.value === 'IN');
    if (payer) {
        data.payerName = payer.elements[1]?.value || '';
        data.payerId = payer.elements[3]?.value || '';
    }

    // Process Member Loop (Forward from INS)
    const ins = segments[insIndex];
    const maintType = ins.elements[2]?.value;
    const maintReason = ins.elements[3]?.value;
    
    // Member details are in the loop starting at INS
    // Stop at next INS
    const loopSegs: EdiSegment[] = [ins];
    for (let i = insIndex + 1; i < segments.length; i++) {
        const s = segments[i];
        if (s.tag === 'INS' || s.tag === 'SE') break;
        loopSegs.push(s);
    }

    const member: Member834 = {
        id: '',
        firstName: '',
        lastName: '',
        ssn: '',
        dob: '',
        gender: '',
        relationship: ins.elements[1]?.value || '18'
    };

    const ref0F = loopSegs.find(s => s.tag === 'REF' && s.elements[0]?.value === '0F');
    if (ref0F) member.id = ref0F.elements[1]?.value || '';
    
    const refSY = loopSegs.find(s => s.tag === 'REF' && s.elements[0]?.value === 'SY');
    if (refSY) member.ssn = refSY.elements[1]?.value || '';

    const nm1 = loopSegs.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
    if (nm1) {
        member.lastName = nm1.elements[2]?.value || '';
        member.firstName = nm1.elements[3]?.value || '';
    }

    const dmg = loopSegs.find(s => s.tag === 'DMG');
    if (dmg) {
        member.dob = formatDate(dmg.elements[1]?.value);
        member.gender = dmg.elements[2]?.value || '';
    }

    // Since this is single record selection mode, we map this member as Subscriber for editing simplicity,
    // or as a Dependent if relationship indicates, but usually 834 editing focuses on one life.
    // However, to keep Form structure, we treat this record as the Primary.
    
    data.subscriber = member;
    data.maintenanceType = maintType;
    data.maintenanceReason = maintReason;
    
    const hd = loopSegs.find(s => s.tag === 'HD');
    if (hd) {
        data.benefitStatus = hd.elements[0]?.value || '';
        data.coverageLevelCode = hd.elements[4]?.value || '';
    }
    
    const ref1L = loopSegs.find(s => s.tag === 'REF' && s.elements[0]?.value === '1L');
    if (ref1L) {
        data.policyNumber = ref1L.elements[1]?.value || '';
    }
    
    const dtp = loopSegs.find(s => s.tag === 'DTP' && s.elements[0]?.value === '348');
    if (dtp) data.planEffectiveDate = formatDate(dtp.elements[2]?.value);

    // Dependencies in 834 are usually sequential INS loops. 
    // If we select a dependent, we just show that dependent.
    // If we select a subscriber, we theoretically should show their dependents, but 834 format is flat.
    // For simplicity in Record Selection mode, we treat each INS as an independent editable unit.
    data.dependents = []; 

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
                type: getRepeatedDefinition('EB', 1, seg.elements[0]), // Coverage Level/Type
                coverage: getRepeatedDefinition('EB', 2, seg.elements[1]), // Coverage Description
                service: getRepeatedDefinition('EB', 3, seg.elements[2]), // Service Type
                insuranceType: getRepeatedDefinition('EB', 4, seg.elements[3]),
                timePeriod: getRepeatedDefinition('EB', 6, seg.elements[5]),
                amount: seg.elements[6]?.value,
                percent: seg.elements[7]?.value,
                quantityQualifier: getRepeatedDefinition('EB', 9, seg.elements[8]),
                quantity: seg.elements[9]?.value,
                authRequired: getRepeatedDefinition('EB', 11, seg.elements[10]),
                network: getRepeatedDefinition('EB', 12, seg.elements[11]),
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
