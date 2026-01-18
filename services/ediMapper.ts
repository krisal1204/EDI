
import { EdiDocument, EdiSegment } from '../types';
import { flattenTree } from './ediParser';
import { 
    FormData270, FormData276, FormData837, FormData834, 
    ServiceLine837, Member834, FormData850, FormData810, 
    OrderLineItem, FormData856, ShipNoticeLineItem, FormData278, FormData820, Remittance820
} from './ediBuilder';
import { STATUS_CATEGORIES, STATUS_CODES } from './offlineAnalyzer';

// Re-exporting form data types for components to use
export type { 
    FormData270, FormData276, FormData837, FormData834, 
    FormData850, FormData810, FormData856, FormData278, FormData820 
};

// Interface for Benefit rows used in Eligibility Response (271)
export interface BenefitRow {
    reference: string;
    type: string;
    service: string;
    coverage: string;
    amount?: string;
    percent?: string;
    quantity?: string;
    quantityQualifier?: string;
    dates: string[];
    messages: string[];
    network: 'Yes' | 'No' | 'Unknown';
}

// Interface for Claim Status rows used in Status Response (277)
export interface ClaimStatusRow {
    patientName?: string;
    patientId?: string;
    entity: string;
    claimRef: string;
    statusDate: string;
    statusCategory: string;
    statusCode: string;
    billedAmount: string;
    paidAmount: string;
    checkNumber?: string;
    checkDate?: string;
    serviceLines: {
      lineId?: string;
      procedureCode: string;
      procedureDesc: string;
      statusCategory?: string;
      statusCode?: string;
      chargeAmount: string;
      paymentAmount: string;
    }[];
}

// Interface for Payment Adjustments used in Remittance (835)
export interface Adjustment {
    groupCode: string;
    reasonCode: string;
    amount: string;
}

// Interface for Payment Header Info used in Remittance (835)
export interface PaymentInfo {
    checkNumber: string;
    checkAmount: string;
    payerName: string;
    checkDate: string;
}

// Interface for Remittance Claim details (835)
export interface RemittanceClaim {
    patientName: string;
    patientId: string;
    claimId: string;
    payerControlNumber?: string;
    chargeAmount: string;
    paidAmount: string;
    patientResp: string;
    status: string;
    adjustments: Adjustment[];
    serviceLines: {
      date: string;
      procedureCode: string;
      units?: string;
      chargeAmount: string;
      paidAmount: string;
      adjustments: Adjustment[];
    }[];
}

// Interface for Order/Invoice/ASN data (850, 810, 856)
export interface OrderData {
    type: 'Invoice' | 'Order' | 'Ship Notice';
    id: string;
    date: string;
    buyer?: string;
    seller?: string;
    shipTo?: string;
    totalAmount: string;
    lines: {
      lineNumber?: string;
      partNumber?: string;
      description?: string;
      quantity: string;
      uom: string;
      unitPrice: string;
    }[];
}

const formatDate = (dateStr: string | undefined): string => {
    if (!dateStr || dateStr.length < 8) return dateStr || '';
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
    const flat = flattenTree(doc.segments);
    const data: Partial<FormData270> = { serviceTypeCodes: [] };
    let anchorIdx = recordId ? flat.findIndex(s => s.id === recordId) : 0;
    if (anchorIdx === -1) anchorIdx = 0;

    const payerSeg = findBackwards(flat, anchorIdx, s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
    if (payerSeg) { data.payerName = payerSeg.elements[2]?.value; data.payerId = payerSeg.elements[8]?.value; }

    const provSeg = findBackwards(flat, anchorIdx, s => s.tag === 'NM1' && s.elements[0]?.value === '1P');
    if (provSeg) { data.providerName = provSeg.elements[2]?.value; data.providerNpi = provSeg.elements[8]?.value; }

    const anchorSeg = flat[anchorIdx];
    let subscriberSeg = anchorSeg;
    let dependentSeg = null;

    if (anchorSeg?.tag === 'HL') {
        const level = anchorSeg.elements[2]?.value;
        if (level === '23') {
            const pId = anchorSeg.elements[1]?.value;
            const parent = flat.find(s => s.tag === 'HL' && s.elements[0]?.value === pId);
            if (parent) subscriberSeg = flat.slice(flat.indexOf(parent)).find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL')!;
            dependentSeg = flat.slice(anchorIdx).find(s => s.tag === 'NM1' && s.elements[0]?.value === '03');
            data.hasDependent = true;
        } else {
            subscriberSeg = flat.slice(anchorIdx).find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL')!;
            data.hasDependent = false;
        }
    }

    if (subscriberSeg) {
        data.subscriberLastName = subscriberSeg.elements[2]?.value;
        data.subscriberFirstName = subscriberSeg.elements[3]?.value;
        data.subscriberId = subscriberSeg.elements[8]?.value;
        const dmg = flat.slice(flat.indexOf(subscriberSeg), flat.indexOf(subscriberSeg) + 5).find(s => s.tag === 'DMG');
        if (dmg) data.subscriberDob = formatDate(dmg.elements[1]?.value);
    }

    if (dependentSeg) {
        data.dependentLastName = dependentSeg.elements[2]?.value;
        data.dependentFirstName = dependentSeg.elements[3]?.value;
        const dmg = flat.slice(flat.indexOf(dependentSeg), flat.indexOf(dependentSeg) + 5).find(s => s.tag === 'DMG');
        if (dmg) { data.dependentDob = formatDate(dmg.elements[1]?.value); data.dependentGender = dmg.elements[2]?.value; }
    }

    const start = dependentSeg ? flat.indexOf(dependentSeg) : (subscriberSeg ? flat.indexOf(subscriberSeg) : 0);
    const dtp = flat.slice(start).find(s => s.tag === 'DTP' && (s.elements[0]?.value === '291' || s.elements[0]?.value === '472'));
    if (dtp) data.serviceDate = formatDate(dtp.elements[2]?.value);
    const eqs = flat.slice(start).filter(s => s.tag === 'EQ');
    if (eqs.length > 0) data.serviceTypeCodes = eqs.map(e => e.elements[0]?.value).filter(Boolean);

    return data;
};

export const mapEdiToForm276 = (doc: EdiDocument, recordId?: string): Partial<FormData276> => {
    const flat = flattenTree(doc.segments);
    const data: Partial<FormData276> = {};
    let anchorIdx = recordId ? flat.findIndex(s => s.id === recordId) : 0;
    if (anchorIdx === -1) anchorIdx = 0;

    const payer = findBackwards(flat, anchorIdx, s => s.tag === 'NM1' && s.elements[0]?.value === 'PR');
    if (payer) { data.payerName = payer.elements[2]?.value; data.payerId = payer.elements[8]?.value; }

    const provider = findBackwards(flat, anchorIdx, s => s.tag === 'NM1' && (s.elements[0]?.value === '1P' || s.elements[0]?.value === '41'));
    if (provider) { data.providerName = provider.elements[2]?.value; data.providerNpi = provider.elements[8]?.value; }

    let subSeg = findBackwards(flat, anchorIdx, s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
    if (subSeg) {
        data.subscriberLastName = subSeg.elements[2]?.value;
        data.subscriberFirstName = subSeg.elements[3]?.value;
        data.subscriberId = subSeg.elements[8]?.value;
    }

    const trn = flat.slice(anchorIdx).find(s => s.tag === 'TRN');
    if (trn) data.claimId = trn.elements[1]?.value;

    const amt = flat.slice(anchorIdx).find(s => s.tag === 'AMT');
    if (amt) data.chargeAmount = amt.elements[1]?.value;

    const dtp = flat.slice(anchorIdx).find(s => s.tag === 'DTP' && s.elements[0]?.value === '472');
    if (dtp) data.serviceDate = formatDate(dtp.elements[2]?.value);

    // Determine dependency based on HL
    const hl = findBackwards(flat, anchorIdx, s => s.tag === 'HL');
    if (hl && hl.elements[2]?.value === '23') {
        data.hasDependent = true;
        const depNm1 = flat.slice(flat.indexOf(hl)).find(s => s.tag === 'NM1' && s.elements[0]?.value === '03');
        if (depNm1) {
            data.dependentLastName = depNm1.elements[2]?.value;
            data.dependentFirstName = depNm1.elements[3]?.value;
        }
    }

    return data;
};

export const mapEdiToForm278 = (doc: EdiDocument): Partial<FormData278> => {
    const flat = flattenTree(doc.segments);
    const data: Partial<FormData278> = {};

    const umo = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'X3');
    if (umo) { data.umoName = umo.elements[2]?.value; data.umoId = umo.elements[8]?.value; }

    const req = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === '1P');
    if (req) { data.requesterName = req.elements[2]?.value; data.requesterNpi = req.elements[8]?.value; }

    const sub = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
    if (sub) {
        data.subscriberLastName = sub.elements[2]?.value;
        data.subscriberFirstName = sub.elements[3]?.value;
        data.subscriberId = sub.elements[8]?.value;
    }
    const dmg = flat.find(s => s.tag === 'DMG');
    if (dmg) data.subscriberDob = formatDate(dmg.elements[1]?.value);

    // Service
    const sv1 = flat.find(s => s.tag === 'SV1');
    if (sv1) {
        const comp = sv1.elements[0]?.value?.split(':') || [];
        data.procedureCode = comp[1] || comp[0];
        data.quantity = sv1.elements[2]?.value;
    }
    
    const hi = flat.find(s => s.tag === 'HI');
    if (hi) {
        const diag = hi.elements[0]?.value?.split(':') || [];
        data.diagnosisCode = diag[1] || diag[0];
    }

    const dtp = flat.find(s => s.tag === 'DTP' && s.elements[0]?.value === '472');
    if (dtp) data.serviceDate = formatDate(dtp.elements[2]?.value);

    return data;
};

export const mapEdiToForm834 = (doc: EdiDocument, recordId?: string): Partial<FormData834> => {
    const flat = flattenTree(doc.segments);
    const data: Partial<FormData834> = { 
        subscriber: { id: '', firstName: '', lastName: '', ssn: '', dob: '', gender: '', relationship: '18' },
        dependents: [] 
    };

    const sponsor = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'P5');
    if (sponsor) { data.sponsorName = sponsor.elements[1]?.value; data.sponsorTaxId = sponsor.elements[3]?.value; }
    const payer = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'IN');
    if (payer) { data.payerName = payer.elements[1]?.value; data.payerId = payer.elements[3]?.value; }

    let targetIdx = recordId ? flat.findIndex(s => s.id === recordId) : -1;
    if (targetIdx !== -1) {
        const ins = findBackwards(flat, targetIdx, s => s.tag === 'INS');
        if (ins) targetIdx = flat.indexOf(ins);
    } else {
        targetIdx = flat.findIndex(s => s.tag === 'INS');
    }

    if (targetIdx === -1) return data;
    
    // If selected is dependent, backtrack to subscriber
    if (flat[targetIdx].elements[0]?.value === 'N') {
        const sub = findBackwards(flat, targetIdx, s => s.tag === 'INS' && s.elements[0]?.value === 'Y');
        if (sub) targetIdx = flat.indexOf(sub);
    }

    const mapMember = (idx: number): Member834 => {
        const m: Member834 = { id: '', firstName: '', lastName: '', ssn: '', dob: '', gender: '', relationship: flat[idx].elements[1]?.value };
        for (let i = idx + 1; i < flat.length && flat[i].tag !== 'INS' && flat[i].tag !== 'SE'; i++) {
            const s = flat[i];
            if (s.tag === 'REF' && s.elements[0]?.value === '0F') m.id = s.elements[1]?.value;
            if (s.tag === 'REF' && s.elements[0]?.value === 'SY') m.ssn = s.elements[1]?.value;
            if (s.tag === 'NM1' && (s.elements[0]?.value === 'IL' || s.elements[0]?.value === '74')) { m.lastName = s.elements[2]?.value; m.firstName = s.elements[3]?.value; }
            if (s.tag === 'DMG') { m.dob = formatDate(s.elements[1]?.value); m.gender = s.elements[2]?.value; }
            if (idx === targetIdx) {
                if (s.tag === 'REF' && s.elements[0]?.value === '1L') data.policyNumber = s.elements[1]?.value;
                if (s.tag === 'HD') { data.benefitStatus = s.elements[0]?.value; data.coverageLevelCode = s.elements[4]?.value; }
                if (s.tag === 'DTP' && s.elements[0]?.value === '348') data.planEffectiveDate = formatDate(s.elements[2]?.value);
            }
        }
        return m;
    };

    data.subscriber = mapMember(targetIdx);
    data.maintenanceType = flat[targetIdx].elements[2]?.value;
    data.maintenanceReason = flat[targetIdx].elements[3]?.value;

    for (let i = targetIdx + 1; i < flat.length && flat[i].tag !== 'SE'; i++) {
        if (flat[i].tag === 'INS') {
            if (flat[i].elements[0]?.value === 'Y') break;
            data.dependents!.push(mapMember(i));
        }
    }
    return data;
};

export const mapEdiToForm837 = (doc: EdiDocument, recordId?: string): Partial<FormData837> => {
    const flat = flattenTree(doc.segments);
    const data: Partial<FormData837> = { serviceLines: [] };
    let anchorIdx = recordId ? flat.findIndex(s => s.id === recordId) : 0;
    if (anchorIdx === -1) anchorIdx = 0;

    const receiver = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === '40');
    if (receiver) { data.payerName = receiver.elements[2]?.value; data.payerId = receiver.elements[8]?.value; }

    const billProv = flat.find(s => s.tag === 'NM1' && s.elements[0]?.value === '85');
    if (billProv) {
        data.billingProviderName = billProv.elements[2]?.value;
        data.billingProviderNpi = billProv.elements[8]?.value;
        const bpIdx = flat.indexOf(billProv);
        const n3 = flat[bpIdx + 1]?.tag === 'N3' ? flat[bpIdx + 1] : null;
        const n4 = flat[bpIdx + 2]?.tag === 'N4' ? flat[bpIdx + 2] : null;
        if (n3) data.billingProviderAddress = n3.elements[0]?.value;
        if (n4) { data.billingProviderCity = n4.elements[0]?.value; data.billingProviderState = n4.elements[1]?.value; data.billingProviderZip = n4.elements[2]?.value; }
        const refEi = flat.slice(bpIdx, bpIdx + 5).find(s => s.tag === 'REF' && s.elements[0]?.value === 'EI');
        if (refEi) data.billingTaxId = refEi.elements[1]?.value;
    }

    const subSeg = findBackwards(flat, anchorIdx, s => s.tag === 'NM1' && s.elements[0]?.value === 'IL');
    if (subSeg) {
        data.subscriberLastName = subSeg.elements[2]?.value;
        data.subscriberFirstName = subSeg.elements[3]?.value;
        data.subscriberId = subSeg.elements[8]?.value;
        const dmg = flat.slice(flat.indexOf(subSeg), flat.indexOf(subSeg) + 5).find(s => s.tag === 'DMG');
        if (dmg) { data.subscriberDob = formatDate(dmg.elements[1]?.value); data.subscriberGender = dmg.elements[2]?.value; }
    }

    let clmSeg = flat[anchorIdx]?.tag === 'CLM' ? flat[anchorIdx] : findBackwards(flat, anchorIdx, s => s.tag === 'CLM');
    if (clmSeg) {
        data.claimId = clmSeg.elements[0]?.value;
        data.totalCharge = clmSeg.elements[1]?.value;
        const clm05 = clmSeg.elements[4]?.value || '';
        if (clm05.split(':')[0]?.length === 3) { data.type = 'Institutional'; data.typeOfBill = clm05.split(':')[0]; }
        else { data.type = 'Professional'; data.placeOfService = clm05.split(':')[0]; }

        const idx = flat.indexOf(clmSeg);
        const hi = flat.slice(idx, idx + 10).find(s => s.tag === 'HI');
        if (hi) {
            data.diagnosisCode1 = hi.elements[0]?.value?.split(':')[1] || hi.elements[0]?.value;
            data.diagnosisCode2 = hi.elements[1]?.value?.split(':')[1] || hi.elements[1]?.value;
        }

        for (let i = idx + 1; i < flat.length && flat[i].tag !== 'CLM' && flat[i].tag !== 'SE'; i++) {
            const s = flat[i];
            if (['SV1', 'SV2', 'SV3'].includes(s.tag)) {
                const line: ServiceLine837 = { procedureCode: '', lineCharge: '', units: '', serviceDate: '' };
                if (s.tag === 'SV1') { line.procedureCode = s.elements[0]?.value?.split(':')[1] || s.elements[0]?.value; line.lineCharge = s.elements[1]?.value; line.units = s.elements[3]?.value; }
                else if (s.tag === 'SV2') { line.procedureCode = s.elements[1]?.value?.split(':')[1] || s.elements[1]?.value; line.lineCharge = s.elements[2]?.value; line.units = s.elements[4]?.value; }
                else { line.procedureCode = s.elements[0]?.value?.split(':')[1] || s.elements[0]?.value; line.lineCharge = s.elements[1]?.value; line.units = s.elements[5]?.value; data.type = 'Dental'; }
                const dtp = flat[i+1]?.tag === 'DTP' ? flat[i+1] : null;
                if (dtp && dtp.elements[0]?.value === '472') line.serviceDate = formatDate(dtp.elements[2]?.value);
                data.serviceLines!.push(line);
            }
        }
    }
    return data;
};

export const mapEdiToForm820 = (doc: EdiDocument): Partial<FormData820> => {
    const flat = flattenTree(doc.segments);
    const data: Partial<FormData820> = { remittances: [] };

    const bpr = flat.find(s => s.tag === 'BPR');
    if (bpr) {
        data.totalPayment = bpr.elements[1]?.value;
        data.checkDate = formatDate(bpr.elements[15]?.value);
    }
    const trn = flat.find(s => s.tag === 'TRN');
    if (trn) data.checkNumber = trn.elements[1]?.value;

    const pr = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'PR');
    if (pr) { data.premiumPayerName = pr.elements[1]?.value; data.premiumPayerId = pr.elements[3]?.value; }

    const pe = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'PE');
    if (pe) { data.premiumReceiverName = pe.elements[1]?.value; data.premiumReceiverId = pe.elements[3]?.value; }

    flat.forEach((seg, i) => {
        if (seg.tag === 'RMR') {
            const refId = seg.elements[1]?.value;
            const amount = seg.elements[3]?.value;
            let name = "";
            const prev = flat[i-1];
            if (prev && prev.tag === 'NM1' && prev.elements[0]?.value === 'IL') {
                name = `${prev.elements[3]?.value || ''} ${prev.elements[2]?.value || ''}`;
            }
            data.remittances!.push({ refId, amount, name: name.trim() });
        }
    });

    return data;
};

export const mapEdiToForm850 = (doc: EdiDocument): Partial<FormData850> => {
    const flat = flattenTree(doc.segments);
    const data: Partial<FormData850> = { lines: [] };

    const beg = flat.find(s => s.tag === 'BEG');
    if (beg) { data.poNumber = beg.elements[2]?.value; data.poDate = formatDate(beg.elements[4]?.value); }

    const buyer = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'BY');
    if (buyer) { data.buyerName = buyer.elements[1]?.value; data.buyerId = buyer.elements[3]?.value; }

    const seller = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'SE');
    if (seller) { data.sellerName = seller.elements[1]?.value; data.sellerId = seller.elements[3]?.value; }

    const st = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'ST');
    if (st) {
        data.shipToName = st.elements[1]?.value;
        const stIdx = flat.indexOf(st);
        if (flat[stIdx+1]?.tag === 'N3') data.shipToAddress = flat[stIdx+1].elements[0]?.value;
        if (flat[stIdx+2]?.tag === 'N4') {
            data.shipToCity = flat[stIdx+2].elements[0]?.value;
            data.shipToState = flat[stIdx+2].elements[1]?.value;
            data.shipToZip = flat[stIdx+2].elements[2]?.value;
        }
    }

    flat.forEach((seg, i) => {
        if (seg.tag === 'PO1') {
            const line: OrderLineItem = {
                lineNo: seg.elements[0]?.value,
                qty: seg.elements[1]?.value,
                uom: seg.elements[2]?.value,
                price: seg.elements[3]?.value,
                partNumber: seg.elements[6]?.value, // VP
                description: ''
            };
            if (flat[i+1]?.tag === 'PID') line.description = flat[i+1].elements[4]?.value;
            data.lines!.push(line);
        }
    });

    return data;
};

export const mapEdiToForm810 = (doc: EdiDocument): Partial<FormData810> => {
    const flat = flattenTree(doc.segments);
    const data: Partial<FormData810> = { lines: [] };

    const big = flat.find(s => s.tag === 'BIG');
    if (big) { 
        data.invoiceDate = formatDate(big.elements[0]?.value);
        data.invoiceNumber = big.elements[1]?.value;
        data.poNumber = big.elements[3]?.value;
    }

    const billTo = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'BY');
    if (billTo) { data.buyerName = billTo.elements[1]?.value; data.buyerId = billTo.elements[3]?.value; }

    const remitTo = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'SE');
    if (remitTo) { data.sellerName = remitTo.elements[1]?.value; data.sellerId = remitTo.elements[3]?.value; }

    flat.forEach((seg, i) => {
        if (seg.tag === 'IT1') {
            const line: OrderLineItem = {
                lineNo: seg.elements[0]?.value,
                qty: seg.elements[1]?.value,
                uom: seg.elements[2]?.value,
                price: seg.elements[3]?.value,
                partNumber: seg.elements[6]?.value,
                description: ''
            };
            if (flat[i+1]?.tag === 'PID') line.description = flat[i+1].elements[4]?.value;
            data.lines!.push(line);
        }
    });

    return data;
};

export const mapEdiToForm856 = (doc: EdiDocument): Partial<FormData856> => {
    const flat = flattenTree(doc.segments);
    const data: Partial<FormData856> = { lines: [] };

    const bsn = flat.find(s => s.tag === 'BSN');
    if (bsn) {
        data.shipmentId = bsn.elements[1]?.value;
        data.shipDate = formatDate(bsn.elements[2]?.value);
        data.shipTime = bsn.elements[3]?.value;
    }

    const carrier = flat.find(s => s.tag === 'TD5');
    if (carrier) data.carrierCode = carrier.elements[2]?.value;

    const ref = flat.find(s => s.tag === 'REF' && (s.elements[0]?.value === 'CN' || s.elements[0]?.value === 'BM'));
    if (ref) data.trackingNumber = ref.elements[1]?.value;

    const shipTo = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'ST');
    if (shipTo) {
        data.shipToName = shipTo.elements[1]?.value;
        const idx = flat.indexOf(shipTo);
        if (flat[idx+1]?.tag === 'N3') data.shipToAddress = flat[idx+1].elements[0]?.value;
        if (flat[idx+2]?.tag === 'N4') {
            data.shipToCity = flat[idx+2].elements[0]?.value;
            data.shipToState = flat[idx+2].elements[1]?.value;
            data.shipToZip = flat[idx+2].elements[2]?.value;
        }
    }

    // Complicated hierarchy - simplify by finding SN1
    let currentPO = "";
    flat.forEach((seg, i) => {
        if (seg.tag === 'PRF') currentPO = seg.elements[0]?.value;
        if (seg.tag === 'LIN') {
            const line: ShipNoticeLineItem = {
                lineNo: seg.elements[0]?.value,
                partNumber: seg.elements[2]?.value, // VP
                poNumber: currentPO,
                qty: '0',
                uom: ''
            };
            if (flat[i+1]?.tag === 'SN1') {
                line.qty = flat[i+1].elements[1]?.value;
                line.uom = flat[i+1].elements[2]?.value;
            }
            data.lines!.push(line);
        }
    });

    return data;
};

// --- Visual Report Mappers ---

export const mapEdiToBenefits = (doc: EdiDocument): BenefitRow[] => {
    const rows: BenefitRow[] = [];
    const flat = flattenTree(doc.segments);
    
    let currentRef = "Unknown";

    flat.forEach((seg, i) => {
        if (seg.tag === 'NM1' && (seg.elements[0]?.value === 'IL' || seg.elements[0]?.value === '03')) {
            const first = seg.elements[3]?.value || '';
            const last = seg.elements[2]?.value || '';
            currentRef = `${first} ${last}`.trim() || "Subscriber";
        }

        if (seg.tag === 'EB') {
            const typeCode = seg.elements[0]?.value;
            const insuranceType = seg.elements[3]?.value;
            const coverageLevel = seg.elements[1]?.value; // CHD, FAM, etc.
            
            // Extract messages
            const messages: string[] = [];
            let j = i + 1;
            while(j < flat.length && (flat[j].tag === 'MSG' || flat[j].tag === 'DTP' || flat[j].tag === 'III' || flat[j].tag === 'LS')) {
                if (flat[j].tag === 'MSG') messages.push(flat[j].elements[0]?.value);
                j++;
            }

            // Extract dates
            const dates: string[] = [];
            j = i + 1;
            while(j < flat.length && flat[j].tag !== 'EB' && flat[j].tag !== 'SE' && flat[j].tag !== 'HL' && flat[j].tag !== 'NM1') {
                if (flat[j].tag === 'DTP') {
                    const qual = flat[j].elements[0]?.value;
                    const dateVal = formatDate(flat[j].elements[2]?.value);
                    if (qual === '346') dates.push(`Plan Begin: ${dateVal}`);
                    if (qual === '348') dates.push(`Benefit Begin: ${dateVal}`);
                    if (qual === '349') dates.push(`Benefit End: ${dateVal}`);
                    if (qual === '291') dates.push(`Plan: ${dateVal}`);
                }
                j++;
            }

            const serviceTypeCodes = seg.elements[2]?.value?.split(doc.componentSeparator || '>') || [];
            // Map codes to text
            const serviceTexts = serviceTypeCodes.map((c: string) => {
                // Check local dict
                const dict: any = { "1": "Medical", "30": "Health Plan", "33": "Chiropractic", "35": "Dental", "88": "Pharmacy", "98": "Visit" };
                return dict[c] || c;
            }).join(', ');

            rows.push({
                reference: currentRef,
                type: typeCode === '1' ? 'Active' : typeCode === '6' ? 'Inactive' : typeCode,
                service: serviceTexts,
                coverage: insuranceType || 'Medical',
                amount: seg.elements[6]?.value,
                percent: seg.elements[7]?.value,
                quantity: seg.elements[9]?.value,
                quantityQualifier: seg.elements[8]?.value,
                network: seg.elements[11]?.value === 'Y' ? 'Yes' : seg.elements[11]?.value === 'N' ? 'No' : 'Unknown',
                dates,
                messages
            });
        }
    });

    return rows;
};

export const mapEdiToClaimStatus = (doc: EdiDocument): ClaimStatusRow[] => {
    const rows: ClaimStatusRow[] = [];
    const flat = flattenTree(doc.segments);
    
    let currentPatient = "";
    let currentPatientId = "";
    
    // Find all 2200D/E TRN loops or similar structure
    // STC segments are usually children of a Claim loop
    
    flat.forEach((seg, i) => {
        // Track patient context
        if (seg.tag === 'NM1' && (seg.elements[0]?.value === 'IL' || seg.elements[0]?.value === 'QC')) {
            currentPatient = `${seg.elements[3]?.value || ''} ${seg.elements[2]?.value || ''}`.trim();
            currentPatientId = seg.elements[8]?.value || '';
        }

        if (seg.tag === 'STC') {
            const comp = seg.elements[0]?.value?.split(':') || [];
            const category = comp[0];
            const status = comp[1];
            const entity = comp[2]; // Entity who updated status
            
            const date = formatDate(seg.elements[1]?.value);
            const amount = seg.elements[3]?.value || '0.00';
            const paid = seg.elements[4]?.value || '0.00';
            const checkDate = formatDate(seg.elements[7]?.value); // STC08 in 5010
            const checkNum = seg.elements[8]?.value; // STC09 in 5010

            // Find TRN backwards for Claim ID
            const trn = findBackwards(flat, i, s => s.tag === 'TRN');
            const claimRef = trn ? trn.elements[1]?.value : 'Unknown';

            // Check for service lines (SVC loops often follow if it's split)
            // Simplified: Assuming segment order STC represents the claim-level status
            rows.push({
                patientName: currentPatient,
                patientId: currentPatientId,
                entity,
                claimRef,
                statusDate: date,
                statusCategory: category,
                statusCode: status,
                billedAmount: amount,
                paidAmount: paid,
                checkNumber: checkNum,
                checkDate: checkDate,
                serviceLines: [] // Populate if SVC segments exist in future
            });
        }
    });

    return rows;
};

export const mapEdiToRemittance = (doc: EdiDocument): { info: PaymentInfo, claims: RemittanceClaim[] } => {
    const flat = flattenTree(doc.segments);
    const info: PaymentInfo = { checkNumber: '', checkAmount: '', payerName: '', checkDate: '' };
    const claims: RemittanceClaim[] = [];

    const bpr = flat.find(s => s.tag === 'BPR');
    if (bpr) {
        info.checkAmount = bpr.elements[1]?.value;
        info.checkDate = formatDate(bpr.elements[15]?.value);
    }
    const trn = flat.find(s => s.tag === 'TRN' && s.elements[0]?.value === '1');
    if (trn) info.checkNumber = trn.elements[1]?.value;
    const pr = flat.find(s => s.tag === 'N1' && s.elements[0]?.value === 'PR');
    if (pr) info.payerName = pr.elements[1]?.value;

    let currentClaim: RemittanceClaim | null = null;
    let currentPatientName = "";
    let currentPatientId = "";

    flat.forEach((seg, i) => {
        if (seg.tag === 'NM1' && seg.elements[0]?.value === 'QC') {
            currentPatientName = `${seg.elements[3]?.value || ''} ${seg.elements[2]?.value || ''}`.trim();
            currentPatientId = seg.elements[8]?.value || '';
        }

        if (seg.tag === 'CLP') {
            currentClaim = {
                patientName: currentPatientName,
                patientId: currentPatientId,
                claimId: seg.elements[0]?.value,
                status: seg.elements[1]?.value,
                chargeAmount: seg.elements[2]?.value,
                paidAmount: seg.elements[3]?.value,
                patientResp: seg.elements[4]?.value,
                payerControlNumber: seg.elements[6]?.value,
                adjustments: [],
                serviceLines: []
            };
            claims.push(currentClaim);
        }

        if (seg.tag === 'CAS' && currentClaim) {
            // Check if this CAS is part of SVC or Claim
            // If preceding segment is SVC or CAS following SVC, it's line level.
            // If preceding is CLP or CAS following CLP, it's claim level.
            // We use simple heuristic: if we haven't seen SVC yet since CLP, it's claim level.
            // Actually, safer to check backwards from current
            let isLine = false;
            for(let j=i-1; j>=0; j--){
                if (flat[j].tag === 'CLP') { isLine = false; break; }
                if (flat[j].tag === 'SVC') { isLine = true; break; }
            }

            const adj: Adjustment = {
                groupCode: seg.elements[0]?.value,
                reasonCode: seg.elements[1]?.value,
                amount: seg.elements[2]?.value
            };

            if (isLine && currentClaim.serviceLines.length > 0) {
                currentClaim.serviceLines[currentClaim.serviceLines.length - 1].adjustments.push(adj);
                // Handle repeats in CAS (indexes 5, 8, 11 etc)
                if (seg.elements[4]?.value) currentClaim.serviceLines[currentClaim.serviceLines.length - 1].adjustments.push({ groupCode: seg.elements[0]?.value, reasonCode: seg.elements[4]?.value, amount: seg.elements[5]?.value });
            } else {
                currentClaim.adjustments.push(adj);
                if (seg.elements[4]?.value) currentClaim.adjustments.push({ groupCode: seg.elements[0]?.value, reasonCode: seg.elements[4]?.value, amount: seg.elements[5]?.value });
            }
        }

        if (seg.tag === 'SVC' && currentClaim) {
            const comp = seg.elements[0]?.value?.split(':') || [];
            const proc = comp[1] || comp[0];
            const charge = seg.elements[1]?.value;
            const paid = seg.elements[2]?.value;
            const units = seg.elements[4]?.value;
            
            // Find date in DTM 472 following SVC
            let date = "";
            if (flat[i+1]?.tag === 'DTM' && flat[i+1].elements[0]?.value === '472') date = formatDate(flat[i+1].elements[1]?.value);

            currentClaim.serviceLines.push({
                procedureCode: proc,
                chargeAmount: charge,
                paidAmount: paid,
                units,
                date,
                adjustments: []
            });
        }
    });

    return { info, claims };
};

export const mapEdiToOrder = (doc: EdiDocument): OrderData | null => {
    const flat = flattenTree(doc.segments);
    const type = doc.transactionType;
    if (!['850', '810', '856'].includes(type)) return null;

    const data: OrderData = {
        type: type === '850' ? 'Order' : type === '810' ? 'Invoice' : 'Ship Notice',
        id: '', date: '', totalAmount: '0.00', lines: []
    };

    if (type === '850') {
        const beg = flat.find(s => s.tag === 'BEG');
        if (beg) { data.id = beg.elements[2]?.value; data.date = formatDate(beg.elements[4]?.value); }
    } else if (type === '810') {
        const big = flat.find(s => s.tag === 'BIG');
        if (big) { data.id = big.elements[1]?.value; data.date = formatDate(big.elements[0]?.value); }
        const tds = flat.find(s => s.tag === 'TDS');
        if (tds) data.totalAmount = (parseFloat(tds.elements[0]?.value) / 100).toFixed(2); // TDS usually cents
    } else if (type === '856') {
        const bsn = flat.find(s => s.tag === 'BSN');
        if (bsn) { data.id = bsn.elements[1]?.value; data.date = formatDate(bsn.elements[2]?.value); }
    }

    const buyer = flat.find(s => s.tag === 'N1' && (s.elements[0]?.value === 'BY' || s.elements[0]?.value === 'ST'));
    if (buyer) data.buyer = buyer.elements[1]?.value;

    const seller = flat.find(s => s.tag === 'N1' && (s.elements[0]?.value === 'SE' || s.elements[0]?.value === 'SF'));
    if (seller) data.seller = seller.elements[1]?.value;

    flat.forEach((seg, i) => {
        if (seg.tag === 'PO1' || seg.tag === 'IT1') {
            const qty = seg.elements[1]?.value;
            const uom = seg.elements[2]?.value;
            const price = seg.elements[3]?.value;
            const part = seg.elements[6]?.value; // VP
            let desc = "";
            if (flat[i+1]?.tag === 'PID') desc = flat[i+1].elements[4]?.value;
            data.lines.push({ quantity: qty, uom, unitPrice: price, partNumber: part, description: desc });
        }
        // 856 uses LIN and SN1
        if (seg.tag === 'LIN') {
            const part = seg.elements[2]?.value;
            let qty = "0";
            let uom = "";
            if (flat[i+1]?.tag === 'SN1') {
                qty = flat[i+1].elements[1]?.value;
                uom = flat[i+1].elements[2]?.value;
            }
            data.lines.push({ quantity: qty, uom, unitPrice: "0", partNumber: part, description: "" });
        }
    });

    if (data.totalAmount === '0.00' && data.lines.length > 0 && type !== '856') {
        data.totalAmount = data.lines.reduce((acc, l) => acc + (parseFloat(l.quantity) * parseFloat(l.unitPrice)), 0).toFixed(2);
    }

    return data;
};
