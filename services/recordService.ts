
import { EdiDocument, EdiSegment } from '../types';
import { flattenTree } from './ediParser';

export interface EdiRecord {
    id: string;         // The unique ID of the triggering segment (e.g., CLM segment ID)
    label: string;      // Human readable label (e.g., "Claim #12345")
    value: string;      // Secondary info (e.g., "$150.00")
    type: 'Claim' | 'Subscriber' | 'Member' | 'Transaction' | 'Payment' | 'Unknown';
    startIndex: number; // Index in the flattened segment list
}

export const extractRecords = (doc: EdiDocument): EdiRecord[] => {
    if (!doc) return [];
    
    const flat = flattenTree(doc.segments);
    const records: EdiRecord[] = [];
    const type = doc.transactionType;

    // --- 837 Claims ---
    if (type === '837') {
        flat.forEach((seg, index) => {
            if (seg.tag === 'CLM') {
                const claimId = seg.elements[0]?.value || 'Unknown';
                const amount = seg.elements[1]?.value || '0';
                records.push({
                    id: seg.id,
                    label: `Claim ${claimId}`,
                    value: `$${amount}`,
                    type: 'Claim',
                    startIndex: index
                });
            }
        });
    }
    // --- 834 Members ---
    else if (type === '834') {
        let currentSubscriberName = "";
        flat.forEach((seg, index) => {
            if (seg.tag === 'INS') {
                const isSub = seg.elements[0]?.value === 'Y';
                let name = "";
                
                // Scan forward for name
                for (let i = index + 1; i < flat.length; i++) {
                    const next = flat[i];
                    if (next.tag === 'INS' || next.tag === 'SE') break;
                    if (next.tag === 'NM1' && next.elements[0]?.value === 'IL') {
                        const first = next.elements[3]?.value || '';
                        const last = next.elements[2]?.value || '';
                        name = `${first} ${last}`.trim();
                        break;
                    }
                }

                if (isSub) {
                    currentSubscriberName = name;
                }

                records.push({
                    id: seg.id,
                    label: name || (isSub ? 'Subscriber' : 'Dependent'),
                    value: isSub ? 'Primary Subscriber' : `Dependent of ${currentSubscriberName || 'Subscriber'}`,
                    type: isSub ? 'Subscriber' : 'Member',
                    startIndex: index
                });
            }
        });
    }
    // --- 270/271 Eligibility ---
    else if (type === '270' || type === '271') {
        flat.forEach((seg, index) => {
            if (seg.tag === 'HL') {
                const level = seg.elements[2]?.value; 
                if (level === '22' || level === '23') {
                    const isDep = level === '23';
                    let name = isDep ? "Dependent" : "Subscriber";
                    let idInfo = "";

                    for (let i = index + 1; i < flat.length; i++) {
                        const next = flat[i];
                        if (next.tag === 'HL' || next.tag === 'SE') break;
                        
                        if (next.tag === 'NM1' && (next.elements[0]?.value === 'IL' || next.elements[0]?.value === '03')) {
                             const first = next.elements[3]?.value || '';
                             const last = next.elements[2]?.value || '';
                             const id = next.elements[8]?.value;
                             name = `${first} ${last}`.trim();
                             if (id) idInfo = id;
                             break;
                        }
                    }

                    records.push({
                        id: seg.id,
                        label: name || (isDep ? "Dependent" : "Subscriber"),
                        value: idInfo,
                        type: isDep ? 'Member' : 'Subscriber',
                        startIndex: index
                    });
                }
            }
        });
    }
    // --- 276/277 Status ---
    else if (type === '276' || type === '277') {
        flat.forEach((seg, index) => {
            if (seg.tag === 'TRN' && (seg.elements[0]?.value === '1' || seg.elements[0]?.value === '2')) {
                const trace = seg.elements[1]?.value || 'Unknown';
                let amount = "";
                for (let i = index + 1; i < index + 5 && i < flat.length; i++) {
                     if (flat[i].tag === 'AMT') {
                         amount = `$${flat[i].elements[1]?.value}`;
                     }
                }
                records.push({
                    id: seg.id,
                    label: `Trace ${trace}`,
                    value: amount,
                    type: 'Claim',
                    startIndex: index
                });
            }
        });
    }
    // --- 835 Remittance ---
    else if (type === '835') {
        flat.forEach((seg, index) => {
            if (seg.tag === 'CLP') {
                const claimId = seg.elements[0]?.value || 'Unknown';
                const status = seg.elements[1]?.value;
                const paidAmt = seg.elements[2]?.value || '0';
                
                let statusLabel = 'Processed';
                if (status === '3' || status === '4') statusLabel = 'Denied';
                else if (status === '22') statusLabel = 'Reversal';

                records.push({
                    id: seg.id,
                    label: `Claim ${claimId}`,
                    value: `Paid $${paidAmt} (${statusLabel})`,
                    type: 'Payment',
                    startIndex: index
                });
            }
        });
    }

    if (records.length === 0 && flat.length > 2) {
        records.push({
            id: flat[0].id,
            label: 'Single Transaction',
            value: type,
            type: 'Transaction',
            startIndex: 0
        });
    }

    return records;
};
