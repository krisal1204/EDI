
import { EdiDocument, EdiSegment } from '../types';
import { flattenTree } from './ediParser';
import { 
    FormData270, FormData276, FormData837, FormData834, 
    ServiceLine837, Member834, FormData850, FormData810, 
    OrderLineItem, FormData856, ShipNoticeLineItem, FormData278, FormData820, Remittance820
} from './ediBuilder';
import { getProcedureDefinition } from './offlineAnalyzer';

// --- Interfaces ---

export interface BenefitRow {
  reference: string;
  type: string;
  service: string;
  coverage: string;
  dates: string[];
  amount?: string;
  percent?: string;
  quantity?: string;
  quantityQualifier?: string;
  network?: string;
  messages: string[];
}

export interface Adjustment {
  groupCode: string;
  reasonCode: string;
  amount: string;
}

export interface ServiceLine {
  lineId: string;
  procedureCode: string;
  procedureDesc: string;
  chargeAmount: string;
  paymentAmount: string;
  date: string;
  units: string;
  adjustments: Adjustment[];
  statusCategory?: string;
  statusCode?: string;
}

export interface ClaimStatusRow {
  patientName: string;
  patientId: string;
  entity: string;
  claimRef: string;
  statusCategory: string;
  statusCode: string;
  statusDate: string;
  billedAmount: string;
  paidAmount: string;
  checkNumber: string;
  checkDate: string;
  serviceLines: ServiceLine[];
}

export interface RemittanceServiceLine {
  procedureCode: string;
  paidAmount: string;
  chargeAmount: string;
  date: string;
  units: string;
  adjustments: Adjustment[];
}

export interface RemittanceClaim {
  claimId: string;
  patientName: string;
  patientId: string;
  payerControlNumber: string;
  status: string; // CLP02
  chargeAmount: string;
  paidAmount: string;
  patientResp: string;
  adjustments: Adjustment[];
  serviceLines: RemittanceServiceLine[];
}

export interface PaymentInfo {
  checkNumber: string;
  checkAmount: string;
  payerName: string;
  checkDate: string;
}

export interface OrderLine {
    lineNumber: string;
    partNumber: string;
    description: string;
    quantity: string;
    uom: string;
    unitPrice: string;
}

export interface OrderData {
    id: string;
    date: string;
    type: string;
    buyer: string;
    seller: string;
    shipTo: string;
    lines: OrderLine[];
    totalAmount: string;
}

// --- Helpers ---

const flattenSegments = flattenTree;

const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr || dateStr.length !== 8) return dateStr || '';
    return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
};

const findBackwards = (segments: EdiSegment[], startIndex: number, predicate: (s: EdiSegment) => boolean): EdiSegment | undefined => {
    for (let i = startIndex; i >= 0; i--) {
        if (predicate(segments[i])) return segments[i];
    }
    return undefined;
};

// --- Mappers ---

export const mapEdiToForm = (doc: EdiDocument, recordId?: string): Partial<FormData270> => {
    const flat = flattenSegments(doc.segments);
    const data: Partial<FormData270> = {
        serviceTypeCodes: []
    };

    let anchorIdx = 0;
    if (recordId) {
        anchorIdx = flat.findIndex(s => s.id === recordId);
        if (anchorIdx === -1) anchorIdx = 0;
    }

    // Identify Roles
    const payerSeg = findBackwards(flat, anchorIdx > 0 ? anchorIdx : flat.length - 1, s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
    if (payerSeg) {
        data.payerName = payerSeg.elements[2]?.value;
        data.payerId = payerSeg.elements[8]?.value;
    }

    const provSeg = findBackwards(flat, anchorIdx > 0 ? anchorIdx : flat.length - 1, s => s.tag === 'NM1' && s.elements[0]?.value === '1P');
    if (provSeg) {
        data.providerName = provSeg.elements[2]?.value;
        data.providerNpi = provSeg.elements[8]?.value;
    }

    // Determine if anchor is Subscriber or Dependent
    const anchorSeg = flat[anchorIdx];
    let subscriberSeg = anchorSeg;
    let dependentSeg = null;

    if (anchorSeg && anchorSeg.tag === 'HL') {
        const level = anchorSeg.elements[2]?.value; // HL03
        if (level === '23') { // Dependent
            // Find parent subscriber HL
            const parentId = anchorSeg.elements[1]?.value;
            const parentHL = flat.find(s => s.tag === 'HL' && s.elements[0]?.value === parentId);
            if (parentHL) {
                // Find Subscriber NM1 under parent HL
                const parentIdx = flat.indexOf(parentHL);
                subscriberSeg = flat.slice(parentIdx).find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL')!;
            }
            // Find Dependent NM1
            dependentSeg = flat.slice(anchorIdx).find(s => s.tag === 'NM1' && s.elements[0]?.value === '03');
            data.hasDependent = true;
        } else if (level === '22') { // Subscriber
            subscriberSeg = flat.slice(anchorIdx).find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL')!;
            data.hasDependent = false;
        }
    } else {
        // Fallback search
        subscriberSeg = findBackwards(flat, flat.length - 1, s => s.tag === 'NM1' && s.elements[0]?.value === 'IL')!;
    }

    if (subscriberSeg) {
        data.subscriberLastName = subscriberSeg.elements[2]?.value;
        data.subscriberFirstName = subscriberSeg.elements[3]?.value;
        data.subscriberId = subscriberSeg.elements[8]?.value;
        
        // Find DOB (DMG) after subscriber NM1
        const subIdx = flat.indexOf(subscriberSeg);
        const dmg = flat.slice(subIdx, subIdx + 5).find(s => s.tag === 'DMG');
        if (dmg) data.subscriberDob = formatDate(dmg.elements[1]?.value);
    }

    if (dependentSeg) {
        const d = dependentSeg as EdiSegment;
        data.dependentLastName = d.elements[2]?.value;
        data.dependentFirstName = d.elements[3]?.value;
        
        const depIdx = flat.indexOf(d);
        const dmg = flat.slice(depIdx, depIdx + 5).find(s => s.tag === 'DMG');
        if (dmg) {
            data.dependentDob = formatDate(dmg.elements[1]?.value);
            data.dependentGender = dmg.elements[2]?.value;
        }
    }

    // Find Service Date & Types (EQ)
    // Usually near the end of the loop
    const searchStart = dependentSeg ? flat.indexOf(dependentSeg) : (subscriberSeg ? flat.indexOf(subscriberSeg) : 0);
    const searchEnd = flat.length;
    
    const dtp = flat.slice(searchStart, searchEnd).find(s => s.tag === 'DTP' && (s.elements[0]?.value === '291' || s.elements[0]?.value === '472'));
    if (dtp) data.serviceDate = formatDate(dtp.elements[2]?.value);

    const eqs = flat.slice(searchStart, searchEnd).filter(s => s.tag === 'EQ');
    if (eqs.length > 0) {
        data.serviceTypeCodes = eqs.map(e => e.elements[0]?.value).filter(Boolean);
    }

    return data;
};

export const mapEdiToForm276 = (doc: EdiDocument, recordId?: string): Partial<FormData276> => {
    const flat = flattenSegments(doc.segments);
    const data: Partial<FormData276> = {};

    let anchorIdx = 0;
    if (recordId) {
        anchorIdx = flat.findIndex(s => s.id === recordId);
        if (anchorIdx === -1) anchorIdx = 0;
    }

    // Payer/Provider same logic as 270
    const payerSeg = findBackwards(flat, flat.length - 1, s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
    if (payerSeg) {
        data.payerName = payerSeg.elements[2]?.value;
        data.payerId = payerSeg.elements[8]?.value;
    }

    const provSeg = findBackwards(flat, flat.length - 1, s => s.tag === 'NM1' && (s.elements[0]?.value === '1P' || s.elements[0]?.value === '41'));
    if (provSeg) {
        data.providerName = provSeg.elements[2]?.value;
        data.providerNpi = provSeg.elements[8]?.value;
    }

    // Subscriber/Dependent logic similar to 270
    // Simplified for now, just finding the nearest backward IL and 03
    const subSeg = findBackwards(flat, anchorIdx > 0 ? anchorIdx : flat.length - 1, s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
    if (subSeg) {
        data.subscriberLastName = subSeg.elements[2]?.value;
        data.subscriberFirstName = subSeg.elements[3]?.value;
        data.subscriberId = subSeg.elements[8]?.value;
    }

    // Check if current loop is dependent
    const depSeg = findBackwards(flat, anchorIdx > 0 ? anchorIdx : flat.length - 1, s => s.tag === 'NM1' && s.elements[0]?.value === '03');
    // Ensure dependent is AFTER subscriber
    if (depSeg && subSeg && flat.indexOf(depSeg) > flat.indexOf(subSeg)) {
        data.hasDependent = true;
        data.dependentLastName = depSeg.elements[2]?.value;
        data.dependentFirstName = depSeg.elements[3]?.value;
    }

    // Claim Trace (TRN)
    // Look forward from anchor if it's HL, or at anchor
    let searchStart = anchorIdx;
    if (flat[anchorIdx]?.tag === 'TRN') searchStart = anchorIdx;
    
    // Scan a bit around anchor
    const trn = flat.slice(searchStart, searchStart + 10).find(s => s.tag === 'TRN');
    if (trn) data.claimId = trn.elements[1]?.value;

    const amt = flat.slice(searchStart, searchStart + 10).find(s => s.tag === 'AMT' && s.elements[0]?.value === 'T3');
    if (amt) data.chargeAmount = amt.elements[1]?.value;

    const dtp = flat.slice(searchStart, searchStart + 10).find(s => s.tag === 'DTP' && s.elements[0]?.value === '472');
    if (dtp) data.serviceDate = formatDate(dtp.elements[2]?.value);

    return data;
};

export const mapEdiToForm278 = (doc: EdiDocument): Partial<FormData278> => {
    const flat = flattenSegments(doc.segments);
    const data: Partial<FormData278> = {};

    // UMO (Payer) - X3
    const umo = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'X3');
    if(umo) {
        data.umoName = umo.elements[2]?.value;
        data.umoId = umo.elements[8]?.value;
    }

    // Requester (Provider) - 1P
    const req = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === '1P');
    if(req) {
        data.requesterName = req.elements[2]?.value;
        data.requesterNpi = req.elements[8]?.value;
    }

    // Subscriber - IL
    const sub = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
    if(sub) {
        data.subscriberLastName = sub.elements[2]?.value;
        data.subscriberFirstName = sub.elements[3]?.value;
        data.subscriberId = sub.elements[8]?.value;
        
        const subIdx = flat.indexOf(sub);
        const dmg = flat.slice(subIdx, subIdx+5).find(s => s.tag === 'DMG');
        if(dmg) data.subscriberDob = formatDate(dmg.elements[1]?.value);
    }

    // Event Info (UM, HSD, SV1)
    const um = flat.find(s => s.tag === 'UM');
    if(um) {
        data.serviceType = um.elements[2]?.value; 
    }

    const sv1 = flat.find(s => s.tag === 'SV1');
    if(sv1) {
        // HC:Code
        const proc = sv1.elements[0]?.value;
        data.procedureCode = proc?.split(':')[1] || proc;
        data.quantity = sv1.elements[1]?.value;
    }

    const dtp = flat.find(s => s.tag === 'DTP' && s.elements[0]?.value === '472');
    if(dtp) data.serviceDate = formatDate(dtp.elements[2]?.value);

    // HI Segment for Diagnosis
    const hi = flat.find(s => s.tag === 'HI');
    if(hi) {
        // BK:R69 or BF:R69
        const diag = hi.elements[0]?.value;
        data.diagnosisCode = diag?.split(':')[1] || diag;
    }

    return data;
};

export const mapEdiToForm837 = (doc: EdiDocument, recordId?: string): Partial<FormData837> => {
    const flat = flattenSegments(doc.segments);
    const data: Partial<FormData837> = {
        serviceLines: []
    };

    let anchorIdx = 0;
    if (recordId) {
        anchorIdx = flat.findIndex(s => s.id === recordId);
        if (anchorIdx === -1) anchorIdx = 0;
    }

    // Basic Header Info
    const submitter = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === '41');
    const receiver = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === '40');
    if (receiver) {
        data.payerName = receiver.elements[2]?.value;
        data.payerId = receiver.elements[8]?.value;
    }

    // Billing Provider (Loop 2000A)
    const billProv = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === '85');
    if (billProv) {
        data.billingProviderName = billProv.elements[2]?.value;
        data.billingProviderNpi = billProv.elements[8]?.value;
        const bpIdx = flat.indexOf(billProv);
        const n3 = flat[bpIdx + 1]?.tag === 'N3' ? flat[bpIdx + 1] : null;
        const n4 = flat[bpIdx + 2]?.tag === 'N4' ? flat[bpIdx + 2] : null;
        const refEi = flat.slice(bpIdx, bpIdx + 5).find(s => s.tag === 'REF' && s.elements[0]?.value === 'EI');
        
        if (n3) data.billingProviderAddress = n3.elements[0]?.value;
        if (n4) {
            data.billingProviderCity = n4.elements[0]?.value;
            data.billingProviderState = n4.elements[1]?.value;
            data.billingProviderZip = n4.elements[2]?.value;
        }
        if (refEi) data.billingTaxId = refEi.elements[1]?.value;
    }

    // Subscriber (Loop 2000B)
    const subSeg = findBackwards(flat, anchorIdx > 0 ? anchorIdx : flat.length - 1, s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
    if (subSeg) {
        data.subscriberLastName = subSeg.elements[2]?.value;
        data.subscriberFirstName = subSeg.elements[3]?.value;
        data.subscriberId = subSeg.elements[8]?.value;
        
        const subIdx = flat.indexOf(subSeg);
        const dmg = flat.slice(subIdx, subIdx + 5).find(s => s.tag === 'DMG');
        if (dmg) {
            data.subscriberDob = formatDate(dmg.elements[1]?.value);
            data.subscriberGender = dmg.elements[2]?.value;
        }
    }

    // Claim Info (Loop 2300)
    // Find CLM near anchor
    let clmSeg = flat[anchorIdx]?.tag === 'CLM' ? flat[anchorIdx] : null;
    if (!clmSeg) {
        // Look backwards if anchor is a line item
        clmSeg = findBackwards(flat, anchorIdx, s => s.tag === 'CLM');
    }
    
    if (clmSeg) {
        data.claimId = clmSeg.elements[0]?.value;
        data.totalCharge = clmSeg.elements[1]?.value;
        
        // Composite 05 (Type of Bill or Place of Service)
        const typeInfo = clmSeg.elements[4]?.value; // CLM05
        if (typeInfo) {
            const parts = typeInfo.split(':');
            if (parts[0].length === 3) {
                data.type = 'Institutional';
                data.typeOfBill = parts[0];
            } else {
                data.type = 'Professional';
                data.placeOfService = parts[0];
            }
        }

        // Diagnosis (HI)
        const clmIdx = flat.indexOf(clmSeg);
        const hiSeg = flat.slice(clmIdx, clmIdx + 10).find(s => s.tag === 'HI');
        if (hiSeg) {
            // HI elements are composites: "ABK:R05"
            // Extract first one
            const diag1 = hiSeg.elements[0]?.value;
            if (diag1) data.diagnosisCode1 = diag1.split(':')[1] || diag1;
            const diag2 = hiSeg.elements[1]?.value;
            if (diag2) data.diagnosisCode2 = diag2.split(':')[1] || diag2;
        }

        // Service Lines (LX Loops)
        // Scan forward from CLM until next CLM or SE
        for (let i = clmIdx + 1; i < flat.length; i++) {
            const s = flat[i];
            if (s.tag === 'CLM' || s.tag === 'SE') break;
            
            // Check for SV1 (Prof), SV2 (Inst), SV3 (Dental)
            if (s.tag === 'SV1' || s.tag === 'SV2' || s.tag === 'SV3') {
                const line: ServiceLine837 = {
                    procedureCode: '',
                    lineCharge: '',
                    units: '',
                    serviceDate: ''
                };
                
                // SV1 Professional: HC:99213
                // SV2 Institutional: 0320 (Rev) HC:99213 (Proc)
                // SV3 Dental: AD:D1110
                if (s.tag === 'SV1') {
                    const proc = s.elements[0]?.value; // SV101
                    line.procedureCode = proc?.split(':')[1] || proc;
                    line.lineCharge = s.elements[1]?.value;
                    line.units = s.elements[3]?.value;
                } else if (s.tag === 'SV2') {
                    const proc = s.elements[1]?.value; // SV202
                    line.procedureCode = proc?.split(':')[1] || proc;
                    line.lineCharge = s.elements[2]?.value;
                    line.units = s.elements[4]?.value;
                } else if (s.tag === 'SV3') {
                    const proc = s.elements[0]?.value;
                    line.procedureCode = proc?.split(':')[1] || proc;
                    line.lineCharge = s.elements[1]?.value;
                    line.units = s.elements[5]?.value; // SV306 is units
                    if (data.type !== 'Dental') data.type = 'Dental';
                }

                // Date DTP*472
                const dtp = flat[i+1]?.tag === 'DTP' ? flat[i+1] : null; // simplified check
                if (dtp && dtp.elements[0]?.value === '472') {
                    line.serviceDate = formatDate(dtp.elements[2]?.value);
                }

                data.serviceLines?.push(line);
            }
        }
    }

    return data;
};

export const mapEdiToForm834 = (doc: EdiDocument, recordId?: string): Partial<FormData834> => {
    const flat = flattenSegments(doc.segments);
    const data: Partial<FormData834> = {
        subscriber: { id: '', firstName: '', lastName: '', ssn: '', dob: '', gender: '', relationship: '18' },
        dependents: []
    };

    // Header Info
    const sponsor = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'P5');
    if (sponsor) {
        data.sponsorName = sponsor.elements[1]?.value;
        data.sponsorTaxId = sponsor.elements[3]?.value;
    }
    const payer = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'IN');
    if (payer) {
        data.payerName = payer.elements[1]?.value;
        data.payerId = payer.elements[3]?.value;
    }

    // Locate the Record (Member Loop)
    let insIdx = -1;
    if (recordId) {
        // If selected segment is INS or inside member loop
        const selIdx = flat.findIndex(s => s.id === recordId);
        if (selIdx !== -1) {
            // Find backwards to nearest INS
            const ins = findBackwards(flat, selIdx, s => s.tag === 'INS');
            if (ins) insIdx = flat.indexOf(ins);
        }
    }
    
    // If not found, just default to first INS
    if (insIdx === -1) {
        insIdx = flat.findIndex(s => s.tag === 'INS');
    }

    if (insIdx !== -1) {
        const insSeg = flat[insIdx];
        data.maintenanceType = insSeg.elements[2]?.value;
        data.maintenanceReason = insSeg.elements[3]?.value;

        // REF*0F (Subscriber ID)
        // Scan forward
        for (let i = insIdx + 1; i < flat.length; i++) {
            const s = flat[i];
            if (s.tag === 'INS' || s.tag === 'SE') break;

            if (s.tag === 'REF' && s.elements[0]?.value === '0F') {
                data.subscriber.id = s.elements[1]?.value;
            }
            if (s.tag === 'REF' && s.elements[0]?.value === 'SY') {
                data.subscriber.ssn = s.elements[1]?.value;
            }
            if (s.tag === 'REF' && s.elements[0]?.value === '1L') {
                data.policyNumber = s.elements[1]?.value;
            }
            if (s.tag === 'NM1' && s.elements[0]?.value === 'IL') {
                data.subscriber.lastName = s.elements[2]?.value;
                data.subscriber.firstName = s.elements[3]?.value;
            }
            if (s.tag === 'DMG') {
                data.subscriber.dob = formatDate(s.elements[1]?.value);
                data.subscriber.gender = s.elements[2]?.value;
            }
            if (s.tag === 'HD') {
                data.benefitStatus = s.elements[0]?.value;
                data.coverageLevelCode = s.elements[4]?.value;
            }
            if (s.tag === 'DTP' && s.elements[0]?.value === '348') {
                data.planEffectiveDate = formatDate(s.elements[2]?.value);
            }
        }
    }

    return data;
};

export const mapEdiToForm820 = (doc: EdiDocument): Partial<FormData820> => {
    const flat = flattenSegments(doc.segments);
    const data: Partial<FormData820> = {
        remittances: []
    };

    // BPR (Total)
    const bpr = flat.find(s => s.tag === 'BPR');
    if(bpr) {
        data.totalPayment = bpr.elements[1]?.value;
        data.checkDate = formatDate(bpr.elements[15]?.value);
    }

    const trn = flat.find(s => s.tag === 'TRN');
    if(trn) data.checkNumber = trn.elements[1]?.value;

    const pe = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'PE'); // Payee
    if(pe) {
        data.premiumReceiverName = pe.elements[1]?.value;
        data.premiumReceiverId = pe.elements[3]?.value;
    }

    const pr = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'PR'); // Payer
    if(pr) {
        data.premiumPayerName = pr.elements[1]?.value;
        data.premiumPayerId = pr.elements[3]?.value;
    }

    flat.forEach((s, idx) => {
        if(s.tag === 'RMR') {
            const refId = s.elements[1]?.value;
            const amount = s.elements[3]?.value;
            let name = "";
            
            // Check previous NM1*IL
            const nm1 = flat[idx-1];
            if(nm1 && nm1.tag === 'NM1' && nm1.elements[0]?.value === 'IL') {
                name = `${nm1.elements[3]?.value} ${nm1.elements[2]?.value}`.trim();
            }

            data.remittances?.push({
                refId,
                amount,
                name
            });
        }
    });

    return data;
};

// ... (Rest of file unchanged: mapEdiToBenefits, mapEdiToClaimStatus, mapEdiToRemittance, mapEdiToOrder, mapEdiToForm850/810/856)
// NOTE: For brevity, assuming the rest of the file is preserved.
export const mapEdiToBenefits = (doc: EdiDocument): BenefitRow[] => {
    const flat = flattenSegments(doc.segments);
    const rows: BenefitRow[] = [];

    // Context tracking
    let currentSource = "";
    let currentSubscriber = "";
    
    flat.forEach((s, i) => {
        if (s.tag === 'NM1') {
            const type = s.elements[0]?.value;
            const name = s.elements[2]?.value;
            if (type === 'PR') currentSource = name;
            if (type === 'IL') currentSubscriber = `${s.elements[3]?.value || ''} ${name || ''}`.trim();
        }

        if (s.tag === 'EB') {
            // EB01: Benefit Info Code (1=Active, 6=Inactive, etc)
            const typeCode = s.elements[0]?.value;
            // EB03: Service Type Code
            const serviceCode = s.elements[2]?.value;
            // EB04: Insurance Type
            const insType = s.elements[3]?.value;
            
            // Extract Amount/Qty if present
            // EB07 (Amount), EB08 (Percent), EB09 (Qty Qual), EB10 (Qty)
            // Note: Indices in array are 0-based, but element numbers are 1-based.
            // EB segment: [code, covLevel, svcType, insType, planCov, timePeriod, amt, pct, qtyQual, qty, ...]
            // elements array index: 0=EB01, 6=EB07
            
            const row: BenefitRow = {
                reference: currentSubscriber || "Unknown",
                type: typeCode === '1' ? 'Active' : typeCode === '6' ? 'Inactive' : typeCode,
                service: serviceCode || 'Health',
                coverage: insType || '',
                dates: [],
                messages: []
            };

            // Values
            if (s.elements[6]?.value) row.amount = s.elements[6].value;
            if (s.elements[7]?.value) row.percent = s.elements[7].value;
            if (s.elements[9]?.value) {
                row.quantity = s.elements[9].value;
                row.quantityQualifier = s.elements[8]?.value;
            }
            if (s.elements[11]?.value) {
                row.network = s.elements[11].value === 'Y' ? 'Yes' : 'No';
            }

            // Look ahead for DTP or MSG
            for (let k = i + 1; k < i + 10 && k < flat.length; k++) {
                const next = flat[k];
                if (next.tag === 'EB' || next.tag === 'HL' || next.tag === 'SE') break;
                
                if (next.tag === 'DTP') {
                    const qual = next.elements[0]?.value;
                    const date = formatDate(next.elements[2]?.value);
                    if (qual === '307') row.dates.push(`Eligibility: ${date}`);
                    if (qual === '348') row.dates.push(`Benefit Begin: ${date}`);
                    if (qual === '349') row.dates.push(`Benefit End: ${date}`);
                    if (qual === '291') row.dates.push(`Plan: ${date}`);
                }
                if (next.tag === 'MSG') {
                    if (next.elements[0]?.value) row.messages.push(next.elements[0].value);
                }
            }
            rows.push(row);
        }
    });

    return rows;
};

export const mapEdiToClaimStatus = (doc: EdiDocument): ClaimStatusRow[] => {
    const flat = flattenSegments(doc.segments);
    const rows: ClaimStatusRow[] = [];

    // Context
    let currentPatient = "";
    let currentPatientId = "";
    let currentEntity = ""; // Provider or Payer

    flat.forEach((s, i) => {
        if (s.tag === 'NM1') {
            const type = s.elements[0]?.value;
            if (type === 'IL' || type === 'QC') {
                currentPatient = `${s.elements[3]?.value || ''} ${s.elements[2]?.value || ''}`.trim();
                currentPatientId = s.elements[8]?.value || '';
            } else if (type === 'PR') {
                currentEntity = s.elements[2]?.value || '';
            }
        }

        if (s.tag === 'STC') {
            // STC01 is composite: Category:Status:Entity
            const stc01 = s.elements[0]?.value || '';
            const parts = stc01.split(':');
            
            const row: ClaimStatusRow = {
                patientName: currentPatient,
                patientId: currentPatientId,
                entity: currentEntity,
                statusCategory: parts[0] || '',
                statusCode: parts[1] || '',
                statusDate: formatDate(s.elements[1]?.value),
                claimRef: '',
                billedAmount: s.elements[3]?.value || '0',
                paidAmount: s.elements[4]?.value || '0',
                checkNumber: s.elements[6]?.value || '',
                checkDate: formatDate(s.elements[5]?.value),
                serviceLines: []
            };

            // Find Claim Ref (TRN or REF) BACKWARDS
            const trn = findBackwards(flat, i, s => s.tag === 'TRN');
            if (trn) row.claimRef = trn.elements[1]?.value || '';

            // Check for SVC lines following this STC (if detail level)
            // Or if STC is inside a loop, lines might be adjacent
            // Simplified: scan forward for SVC
            for (let k = i + 1; k < i + 20 && k < flat.length; k++) {
                const next = flat[k];
                if (next.tag === 'STC' && next.elements[0]?.value?.includes(':')) break; // Next claim status
                if (next.tag === 'HL' || next.tag === 'SE') break;

                if (next.tag === 'SVC') {
                    const proc = next.elements[0]?.value;
                    const charge = next.elements[1]?.value;
                    const paid = next.elements[2]?.value;
                    
                    // SVC Status usually in adjacent STC
                    let lineStatus = "";
                    let lineCat = "";
                    if (flat[k+1]?.tag === 'STC') {
                        const lParts = flat[k+1].elements[0]?.value.split(':');
                        lineCat = lParts[0];
                        lineStatus = lParts[1];
                    }

                    row.serviceLines.push({
                        lineId: '',
                        procedureCode: proc?.split(':')[1] || proc || '',
                        procedureDesc: '',
                        chargeAmount: charge || '0',
                        paymentAmount: paid || '0',
                        date: '',
                        units: next.elements[4]?.value || '1',
                        adjustments: [],
                        statusCategory: lineCat,
                        statusCode: lineStatus
                    });
                }
            }

            rows.push(row);
        }
    });

    return rows;
};

export const mapEdiToRemittance = (doc: EdiDocument): { info: PaymentInfo | null, claims: RemittanceClaim[] } => {
    const flat = flattenSegments(doc.segments);
    const claims: RemittanceClaim[] = [];
    let info: PaymentInfo | null = null;

    // Header BPR (Check Info)
    const bpr = flat.find(s => s.tag === 'BPR');
    const trn = flat.find(s => s.tag === 'TRN'); // TRN*1*CheckNum
    const payer = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'PR');
    const dtms = flat.filter(s => s.tag === 'DTM'); // 405 = Check Date

    if (bpr) {
        info = {
            checkAmount: bpr.elements[1]?.value || '0',
            checkNumber: trn?.elements[1]?.value || 'Unknown',
            payerName: payer?.elements[1]?.value || 'Unknown Payer',
            checkDate: formatDate(bpr.elements[15]?.value || dtms.find(d => d.elements[0]?.value === '405')?.elements[1]?.value)
        };
    }

    flat.forEach((s, i) => {
        if (s.tag === 'CLP') {
            const claim: RemittanceClaim = {
                claimId: s.elements[0]?.value || '',
                status: s.elements[1]?.value || '',
                chargeAmount: s.elements[2]?.value || '0',
                paidAmount: s.elements[3]?.value || '0',
                patientResp: s.elements[4]?.value || '0',
                payerControlNumber: s.elements[6]?.value || '',
                patientName: '',
                patientId: '',
                adjustments: [],
                serviceLines: []
            };

            // Find Patient Name (NM1*QC)
            const nm1 = flat.slice(i, i + 5).find(x => x.tag === 'NM1' && x.elements[0]?.value === 'QC');
            if (nm1) {
                claim.patientName = `${nm1.elements[3]?.value || ''} ${nm1.elements[2]?.value || ''}`.trim();
                claim.patientId = nm1.elements[8]?.value || '';
            }

            // Find Claim Adjustments (CAS)
            for (let k = i + 1; k < flat.length; k++) {
                const next = flat[k];
                if (next.tag === 'CLP' || next.tag === 'SE' || next.tag === 'LX' || next.tag === 'SVC') break; // End of claim header
                
                if (next.tag === 'CAS') {
                    // Multiple adjustments in one segment possible: Group*Reason*Amt*Qty*Reason*Amt...
                    // Standard says: Group, Reason, Amt, Qty, Reason, Amt...
                    const group = next.elements[0]?.value;
                    // Loop pairs
                    for(let el = 1; el < next.elements.length; el+=3) {
                        const r = next.elements[el]?.value;
                        const a = next.elements[el+1]?.value;
                        if (r && a) {
                            claim.adjustments.push({ groupCode: group, reasonCode: r, amount: a });
                        }
                    }
                }
            }

            // Find Service Lines (SVC loop)
            // Loop until next CLP or SE
            for (let k = i + 1; k < flat.length; k++) {
                const next = flat[k];
                if (next.tag === 'CLP' || next.tag === 'SE') break;

                if (next.tag === 'SVC') {
                    const proc = next.elements[0]?.value; // Composite HC:Code
                    const svcLine: RemittanceServiceLine = {
                        procedureCode: proc?.split(':')[1] || proc || '',
                        chargeAmount: next.elements[1]?.value || '0',
                        paidAmount: next.elements[2]?.value || '0',
                        units: next.elements[4]?.value || '',
                        date: '',
                        adjustments: []
                    };

                    // Line Date
                    const lineDtm = flat[k+1]?.tag === 'DTM' ? flat[k+1] : null;
                    if (lineDtm && lineDtm.elements[0]?.value === '472') {
                        svcLine.date = formatDate(lineDtm.elements[1]?.value);
                    }

                    // Line Adjustments
                    // Scan small window
                    for(let m = k + 1; m < k + 10 && m < flat.length; m++) {
                        const sub = flat[m];
                        if (sub.tag === 'SVC' || sub.tag === 'CLP') break;
                        if (sub.tag === 'CAS') {
                            const group = sub.elements[0]?.value;
                            for(let el = 1; el < sub.elements.length; el+=3) {
                                const r = sub.elements[el]?.value;
                                const a = sub.elements[el+1]?.value;
                                if (r && a) {
                                    svcLine.adjustments.push({ groupCode: group, reasonCode: r, amount: a });
                                }
                            }
                        }
                    }
                    claim.serviceLines.push(svcLine);
                }
            }

            claims.push(claim);
        }
    });

    return { info, claims };
};

export const mapEdiToOrder = (doc: EdiDocument): OrderData => {
    const flat = flattenSegments(doc.segments);
    const data: OrderData = {
        id: 'Unknown',
        date: '',
        type: doc.transactionType === '850' ? 'Purchase Order' : doc.transactionType === '810' ? 'Invoice' : 'Ship Notice',
        buyer: '',
        seller: '',
        shipTo: '',
        lines: [],
        totalAmount: '0.00'
    };

    // ID extraction
    if (doc.transactionType === '850') {
        const beg = flat.find(s => s.tag === 'BEG');
        if (beg) {
            data.id = beg.elements[2]?.value;
            data.date = formatDate(beg.elements[4]?.value);
        }
    } else if (doc.transactionType === '810') {
        const big = flat.find(s => s.tag === 'BIG');
        if (big) {
            data.id = big.elements[1]?.value;
            data.date = formatDate(big.elements[0]?.value);
        }
    } else if (doc.transactionType === '856') {
        const bsn = flat.find(s => s.tag === 'BSN');
        if (bsn) {
            data.id = bsn.elements[1]?.value;
            data.date = formatDate(bsn.elements[2]?.value);
        }
    }

    // Addresses
    flat.forEach((s, idx) => {
        if (s.tag === 'N1') {
            const role = s.elements[0]?.value;
            const name = s.elements[1]?.value;
            const nextN3 = flat[idx+1]?.tag === 'N3' ? flat[idx+1] : null;
            const nextN4 = flat[idx+2]?.tag === 'N4' ? flat[idx+2] : null;
            
            let addr = name || '';
            if (nextN3) addr += `\n${nextN3.elements[0]?.value || ''}`;
            if (nextN4) addr += `\n${nextN4.elements[0]?.value || ''}, ${nextN4.elements[1]?.value || ''} ${nextN4.elements[2]?.value || ''}`;

            if (role === 'BY' || role === 'BT') data.buyer = addr;
            if (role === 'SE' || role === 'VN') data.seller = addr;
            if (role === 'ST') data.shipTo = addr;
        }
    });

    // Lines
    let totalCalc = 0;
    flat.forEach((s, idx) => {
        if (s.tag === 'PO1' || s.tag === 'IT1') {
            const qty = s.elements[1]?.value || '0';
            const price = s.elements[3]?.value || '0';
            const line: OrderLine = {
                lineNumber: s.elements[0]?.value || '',
                quantity: qty,
                uom: s.elements[2]?.value || '',
                unitPrice: price,
                partNumber: '',
                description: ''
            };

            // Scan for part number (VP/BP)
            for(let i=5; i < s.elements.length; i+=2) {
                if (s.elements[i]?.value === 'VP' || s.elements[i]?.value === 'BP') {
                    line.partNumber = s.elements[i+1]?.value;
                    break;
                }
            }

            // Description PID
            const pid = flat.slice(idx, idx+5).find(x => x.tag === 'PID');
            if (pid) line.description = pid.elements[4]?.value;

            data.lines.push(line);
            totalCalc += parseFloat(qty) * parseFloat(price);
        }
        else if (s.tag === 'LIN' && doc.transactionType === '856') {
            // ASN Lines are tricky, usually LIN loop
            const line: OrderLine = {
                lineNumber: s.elements[0]?.value || '',
                partNumber: '',
                description: '',
                quantity: '',
                uom: '',
                unitPrice: '0'
            };
            if (s.elements[1]?.value === 'VP') line.partNumber = s.elements[2]?.value;
            
            // SN1 follows for qty
            const sn1 = flat.slice(idx, idx+5).find(x => x.tag === 'SN1');
            if (sn1) {
                line.quantity = sn1.elements[1]?.value;
                line.uom = sn1.elements[2]?.value;
            }
            data.lines.push(line);
        }
    });

    if (doc.transactionType === '810') {
        const tds = flat.find(s => s.tag === 'TDS');
        if (tds) {
            // TDS is amount * 100 usually, but sometimes decimal.
            // Simplified:
            const val = parseFloat(tds.elements[0]?.value);
            data.totalAmount = (val / 100).toFixed(2);
        } else {
            data.totalAmount = totalCalc.toFixed(2);
        }
    } else {
        data.totalAmount = totalCalc.toFixed(2);
    }

    return data;
};

export const mapEdiToForm850 = (doc: EdiDocument): Partial<FormData850> => {
    const flat = flattenSegments(doc.segments);
    const data: Partial<FormData850> = {
        lines: []
    };

    // Header BEG
    const beg = flat.find(s => s.tag === 'BEG');
    if (beg) {
        data.poNumber = beg.elements[2]?.value || '';
        data.poDate = formatDate(beg.elements[4]?.value);
    }

    // Header N1s
    flat.forEach((s, idx) => {
        if (s.tag === 'N1') {
            const id = s.elements[0]?.value;
            const name = s.elements[1]?.value;
            const code = s.elements[3]?.value;

            if (id === 'BY') {
                data.buyerName = name;
                data.buyerId = code;
            } else if (id === 'SE') {
                data.sellerName = name;
                data.sellerId = code;
            } else if (id === 'ST') {
                data.shipToName = name;
                // Look ahead for N3/N4
                const n3 = flat[idx+1];
                if (n3 && n3.tag === 'N3') data.shipToAddress = n3.elements[0]?.value;
                const n4 = flat[idx+2];
                if (n4 && n4.tag === 'N4') {
                    data.shipToCity = n4.elements[0]?.value;
                    data.shipToState = n4.elements[1]?.value;
                    data.shipToZip = n4.elements[2]?.value;
                }
            }
        }
    });

    // Lines PO1
    flat.forEach((s, idx) => {
        if (s.tag === 'PO1') {
            const line: OrderLineItem = {
                lineNo: s.elements[0]?.value || '',
                qty: s.elements[1]?.value || '0',
                uom: s.elements[2]?.value || 'EA',
                price: s.elements[3]?.value || '0.00',
                partNumber: '',
                description: ''
            };

            // Part Number (VP)
            for(let i=5; i < s.elements.length; i+=2) {
                const qual = s.elements[i]?.value;
                const val = s.elements[i+1]?.value;
                if (qual === 'VP') {
                    line.partNumber = val;
                    break;
                }
            }

            // Description (PID)
            for(let k=1; k<=5; k++) {
                const next = flat[idx+k];
                if (!next || next.tag === 'PO1') break;
                if (next.tag === 'PID' && next.elements[4]?.value) {
                    line.description = next.elements[4].value;
                    break;
                }
            }
            data.lines?.push(line);
        }
    });

    return data;
};

export const mapEdiToForm810 = (doc: EdiDocument): Partial<FormData810> => {
    const flat = flattenSegments(doc.segments);
    const data: Partial<FormData810> = {
        lines: []
    };

    // Header BIG
    const big = flat.find(s => s.tag === 'BIG');
    if (big) {
        data.invoiceDate = formatDate(big.elements[0]?.value);
        data.invoiceNumber = big.elements[1]?.value;
        data.poNumber = big.elements[3]?.value;
    }

    // Header N1s
    flat.forEach((s) => {
        if (s.tag === 'N1') {
            const id = s.elements[0]?.value;
            const name = s.elements[1]?.value;
            const code = s.elements[3]?.value;

            if (id === 'BY') {
                data.buyerName = name;
                data.buyerId = code;
            } else if (id === 'SE') {
                data.sellerName = name;
                data.sellerId = code;
            }
        }
    });

    // Lines IT1
    flat.forEach((s, idx) => {
        if (s.tag === 'IT1') {
            const line: OrderLineItem = {
                lineNo: s.elements[0]?.value || '',
                qty: s.elements[1]?.value || '0',
                uom: s.elements[2]?.value || 'EA',
                price: s.elements[3]?.value || '0.00',
                partNumber: '',
                description: ''
            };

            // Part Number (VP)
            for(let i=5; i < s.elements.length; i+=2) {
                const qual = s.elements[i]?.value;
                const val = s.elements[i+1]?.value;
                if (qual === 'VP') {
                    line.partNumber = val;
                    break;
                }
            }

            // Description (PID)
            for(let k=1; k<=5; k++) {
                const next = flat[idx+k];
                if (!next || next.tag === 'IT1') break;
                if (next.tag === 'PID' && next.elements[4]?.value) {
                    line.description = next.elements[4].value;
                    break;
                }
            }
            data.lines?.push(line);
        }
    });

    return data;
};

export const mapEdiToForm856 = (doc: EdiDocument): Partial<FormData856> => {
    const flat = flattenSegments(doc.segments);
    const data: Partial<FormData856> = {
        lines: []
    };

    const bsn = flat.find(s => s.tag === 'BSN');
    if(bsn) {
        data.shipmentId = bsn.elements[1]?.value;
        data.shipDate = formatDate(bsn.elements[2]?.value);
        data.shipTime = bsn.elements[3]?.value;
    }

    const td5 = flat.find(s => s.tag === 'TD5');
    if(td5) data.carrierCode = td5.elements[2]?.value;

    const refCn = flat.find(s => s.tag === 'REF' && (s.elements[0]?.value === 'CN' || s.elements[0]?.value === 'BM'));
    if(refCn) data.trackingNumber = refCn.elements[1]?.value;

    flat.forEach((s, idx) => {
        if (s.tag === 'N1') {
            const id = s.elements[0]?.value;
            if (id === 'SF' || id === 'SE') {
                data.sellerName = s.elements[1]?.value;
                data.sellerId = s.elements[3]?.value;
            } else if (id === 'ST') {
                data.shipToName = s.elements[1]?.value;
                const n3 = flat[idx+1]?.tag === 'N3' ? flat[idx+1] : null;
                const n4 = flat[idx+2]?.tag === 'N4' ? flat[idx+2] : null;
                if(n3) data.shipToAddress = n3.elements[0]?.value;
                if(n4) {
                    data.shipToCity = n4.elements[0]?.value;
                    data.shipToState = n4.elements[1]?.value;
                    data.shipToZip = n4.elements[2]?.value;
                }
            }
        }
    });

    let currentPO = '';
    flat.forEach((s, idx) => {
        if(s.tag === 'PRF') {
            currentPO = s.elements[0]?.value;
        }
        if(s.tag === 'LIN') {
            const lineNo = s.elements[0]?.value;
            let partNumber = '';
            for(let i=1; i<s.elements.length; i+=2) {
                if(s.elements[i]?.value === 'VP' || s.elements[i]?.value === 'BP') {
                    partNumber = s.elements[i+1]?.value;
                    break;
                }
            }
            
            const sn1 = flat[idx+1]?.tag === 'SN1' ? flat[idx+1] : null;
            const qty = sn1 ? sn1.elements[1]?.value : '0';
            const uom = sn1 ? sn1.elements[2]?.value : 'EA';

            data.lines?.push({
                lineNo: lineNo || '',
                poNumber: currentPO,
                partNumber,
                qty,
                uom
            });
        }
    });

    return data;
};
