
export interface FormData270 {
  payerName: string;
  payerId: string;
  providerName: string;
  providerNpi: string;
  subscriberFirstName: string;
  subscriberLastName: string;
  subscriberId: string;
  subscriberDob: string; // YYYY-MM-DD
  serviceDate: string; // YYYY-MM-DD
  serviceTypeCodes: string[]; // Changed to array
  
  // Dependent Data
  hasDependent: boolean;
  dependentFirstName: string;
  dependentLastName: string;
  dependentDob: string; // YYYY-MM-DD
  dependentGender: string; // M, F, U
}

export interface FormData276 {
  payerName: string;
  payerId: string;
  providerName: string;
  providerNpi: string;
  subscriberFirstName: string;
  subscriberLastName: string;
  subscriberId: string;
  
  // Dependent Data
  hasDependent: boolean;
  dependentFirstName: string;
  dependentLastName: string;

  // Claim Details
  claimId: string; // Client Trace Number
  chargeAmount: string;
  serviceDate: string; // YYYY-MM-DD
}

export interface FormData278 {
    // Requester (Provider)
    requesterName: string;
    requesterNpi: string;
    
    // Utilization Management Org (Payer)
    umoName: string;
    umoId: string;
    
    // Subscriber
    subscriberFirstName: string;
    subscriberLastName: string;
    subscriberId: string;
    subscriberDob: string;
    
    // Event/Service
    serviceType: string; // e.g. "1" Medical Care
    procedureCode: string; // CPT
    diagnosisCode: string; // ICD-10
    serviceDate: string;
    quantity: string;
}

export interface ServiceLine837 {
    procedureCode: string;
    lineCharge: string;
    units: string;
    serviceDate: string;
}

export interface FormData837 {
  type: 'Professional' | 'Institutional' | 'Dental';
  // Billing Provider
  billingProviderName: string;
  billingProviderNpi: string;
  billingProviderAddress: string;
  billingProviderCity: string;
  billingProviderState: string;
  billingProviderZip: string;
  billingTaxId: string;

  // Subscriber
  subscriberFirstName: string;
  subscriberLastName: string;
  subscriberId: string;
  subscriberDob: string;
  subscriberGender: string;
  payerName: string;
  payerId: string;

  // Claim Info
  claimId: string;
  totalCharge: string;
  placeOfService: string; // For Prof (e.g., 11)
  typeOfBill: string; // For Inst (e.g., 111)
  diagnosisCode1: string; // ICD-10 no dots
  diagnosisCode2: string;
  
  // Service Lines
  serviceLines: ServiceLine837[];
}

export interface Member834 {
    id: string; // REF*0F
    firstName: string;
    lastName: string;
    ssn: string; // REF*SY
    dob: string;
    gender: string;
    relationship: string; // 18=Self, 01=Spouse, 19=Child
}

export interface FormData834 {
    sponsorName: string; // Plan Sponsor (Employer)
    sponsorTaxId: string; 
    payerName: string; // Insurer
    payerId: string;
    
    maintenanceType: string; // INS03 (021=Add, 024=Term, 001=Change)
    maintenanceReason: string; // INS04 (01=Divorce, 02=Birth, etc)
    benefitStatus: string; // HD01 (024=Active coverage)
    
    // Benefit Data
    policyNumber: string; // REF*1L
    coverageLevelCode: string; // HD05 (EMP, FAM, etc)
    
    planEffectiveDate: string; // DTP*348
    
    subscriber: Member834;
    dependents: Member834[];
}

export interface Remittance820 {
    refId: string; // REF*1L or REF*0F
    amount: string;
    name?: string; // Optional
}

export interface FormData820 {
    premiumReceiverName: string; // Payer
    premiumReceiverId: string;
    premiumPayerName: string; // Employer
    premiumPayerId: string; // Tax ID
    totalPayment: string;
    checkDate: string;
    checkNumber: string; // TRN02
    remittances: Remittance820[];
}

// --- Manufacturing / Supply Chain Forms ---

export interface OrderLineItem {
    lineNo: string;
    qty: string;
    uom: string;
    price: string;
    partNumber: string;
    description: string;
}

export interface FormData850 {
    poNumber: string;
    poDate: string;
    buyerName: string;
    buyerId: string;
    sellerName: string;
    sellerId: string;
    shipToName: string;
    shipToAddress: string;
    shipToCity: string;
    shipToState: string;
    shipToZip: string;
    lines: OrderLineItem[];
}

export interface FormData810 {
    invoiceNumber: string;
    invoiceDate: string;
    poNumber: string;
    buyerName: string; 
    buyerId: string;
    sellerName: string;
    sellerId: string;
    lines: OrderLineItem[];
}

export interface ShipNoticeLineItem {
    lineNo: string;
    poNumber: string;
    partNumber: string;
    qty: string;
    uom: string;
}

export interface FormData856 {
    shipmentId: string; // BSN02
    shipDate: string; // BSN03
    shipTime: string; // BSN04
    carrierCode: string; // TD5
    trackingNumber: string; // REF*CN or BM
    sellerName: string;
    sellerId: string;
    shipToName: string;
    shipToAddress: string;
    shipToCity: string;
    shipToState: string;
    shipToZip: string;
    lines: ShipNoticeLineItem[];
}

const getCurrentDate = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
const getCurrentTime = () => new Date().toTimeString().slice(0, 5).replace(/:/g, '');

const pad = (str: string, length: number) => (str + ' '.repeat(length)).slice(0, length);

export const build270 = (data: FormData270): string => {
  const date = getCurrentDate();
  const time = getCurrentTime();
  const isaControl = Math.floor(Math.random() * 900000000) + 100000000;
  const gsControl = Math.floor(Math.random() * 900000000) + 100000000;

  // Formatting dates from YYYY-MM-DD to YYYYMMDD
  const dobSub = data.subscriberDob.replace(/-/g, '');
  const svcDate = data.serviceDate.replace(/-/g, '');

  const segments = [
    // ISA: Interchange Control Header
    `ISA*00*          *00*          *ZZ*${pad('SENDER', 15)}*ZZ*${pad('RECEIVER', 15)}*${date.slice(2)}*${time}*^*00501*${isaControl}*0*T*:`,
    
    // GS: Functional Group Header
    `GS*HS*SENDER*RECEIVER*${date}*${time}*${gsControl}*X*005010X279A1`,
    
    // ST: Transaction Set Header
    `ST*270*0001*005010X279A1`,
    
    // BHT: Beginning of Hierarchical Transaction
    `BHT*0022*13*${isaControl}*${date}*${time}`,
    
    // HL Loop 1: Information Source (Payer)
    `HL*1**20*1`,
    `NM1*PR*2*${data.payerName}*****PI*${data.payerId}`,
    
    // HL Loop 2: Information Receiver (Provider)
    `HL*2*1*21*1`,
    `NM1*1P*2*${data.providerName}*****XX*${data.providerNpi}`,
    
    // HL Loop 3: Subscriber
    // If hasDependent is true, child code is 1 (has subordinate HL), else 0 (no subordinate)
    `HL*3*2*22*${data.hasDependent ? '1' : '0'}`,
    `TRN*1*${Math.floor(Math.random() * 10000000)}*9876543210`,
    `NM1*IL*1*${data.subscriberLastName}*${data.subscriberFirstName}****MI*${data.subscriberId}`,
  ];
  
  if (data.subscriberDob) {
    segments.push(`DMG*D8*${dobSub}`);
  }
  
  // Service Types logic
  const codes = data.serviceTypeCodes && data.serviceTypeCodes.length > 0 ? data.serviceTypeCodes : ['30'];

  if (!data.hasDependent) {
    // --- Subscriber is Patient ---
    segments.push(`DTP*291*D8*${svcDate}`);
    codes.forEach(code => {
        segments.push(`EQ*${code}`);
    });
  } else {
    // --- Dependent is Patient ---
    const dobDep = data.dependentDob.replace(/-/g, '');
    
    // HL Loop 4: Dependent (Child of Subscriber)
    // Parent ID is 3 (Subscriber HL ID)
    segments.push(`HL*4*3*23*0`);
    segments.push(`NM1*03*1*${data.dependentLastName}*${data.dependentFirstName}`);
    if (data.dependentDob) {
        segments.push(`DMG*D8*${dobDep}*${data.dependentGender}`);
    }
    
    segments.push(`DTP*291*D8*${svcDate}`);
    codes.forEach(code => {
        segments.push(`EQ*${code}`);
    });
  }

  // Trailers
  segments.push(`SE*${segments.length - 1}*0001`);
  segments.push(`GE*1*${gsControl}`);
  segments.push(`IEA*1*${isaControl}`);

  return segments.join('~') + '~';
};

export const build276 = (data: FormData276): string => {
  const date = getCurrentDate();
  const time = getCurrentTime();
  const isaControl = Math.floor(Math.random() * 900000000) + 100000000;
  const gsControl = Math.floor(Math.random() * 900000000) + 100000000;
  const svcDate = data.serviceDate.replace(/-/g, '');

  const segments = [
    // ISA
    `ISA*00*          *00*          *ZZ*${pad('SENDER', 15)}*ZZ*${pad('RECEIVER', 15)}*${date.slice(2)}*${time}*^*00501*${isaControl}*0*T*:`,
    // GS for Claim Status (HR)
    `GS*HR*SENDER*RECEIVER*${date}*${time}*${gsControl}*X*005010X212`,
    // ST
    `ST*276*0001*005010X212`,
    // BHT
    `BHT*0010*13*${isaControl}*${date}*${time}`,
    
    // Loop 2000A: Information Source (Payer)
    `HL*1**20*1`,
    `NM1*PR*2*${data.payerName}*****PI*${data.payerId}`,
    
    // Loop 2000B: Information Receiver (Provider/Submitter)
    `HL*2*1*21*1`,
    // Using 1P (Provider) or 41 (Submitter). 
    `NM1*41*2*${data.providerName}*****XX*${data.providerNpi}`,
    
    // Loop 2000C: Subscriber
    `HL*3*2*22*${data.hasDependent ? '1' : '0'}`,
    `NM1*IL*1*${data.subscriberLastName}*${data.subscriberFirstName}****MI*${data.subscriberId}`,
  ];

  if (!data.hasDependent) {
    // --- Subscriber is Patient ---
    // Loop 2200D: Claim Status Tracking Component
    segments.push(`TRN*1*${data.claimId}`);
    if (data.chargeAmount && data.chargeAmount !== '0') {
        segments.push(`AMT*T3*${data.chargeAmount}`);
    }
    if (svcDate) {
        segments.push(`DTP*472*D8*${svcDate}`);
    }
  } else {
    // --- Dependent is Patient ---
    // Loop 2000E: Dependent Level
    // Parent is 3 (Subscriber)
    segments.push(`HL*4*3*23*0`);
    segments.push(`NM1*03*1*${data.dependentLastName}*${data.dependentFirstName}`);
    
    // Loop 2200E: Claim Status Tracking Component (for Dependent)
    segments.push(`TRN*1*${data.claimId}`);
    if (data.chargeAmount && data.chargeAmount !== '0') {
        segments.push(`AMT*T3*${data.chargeAmount}`);
    }
    if (svcDate) {
        segments.push(`DTP*472*D8*${svcDate}`);
    }
  }

  segments.push(`SE*${segments.length - 1}*0001`);
  segments.push(`GE*1*${gsControl}`);
  segments.push(`IEA*1*${isaControl}`);

  return segments.join('~') + '~';
};

export const build278 = (data: FormData278): string => {
    const date = getCurrentDate();
    const time = getCurrentTime();
    const isaControl = Math.floor(Math.random() * 900000000) + 100000000;
    const gsControl = Math.floor(Math.random() * 900000000) + 100000000;
    const svcDate = data.serviceDate ? data.serviceDate.replace(/-/g, '') : date;

    const segments = [
        `ISA*00*          *00*          *ZZ*${pad('SENDER', 15)}*ZZ*${pad('RECEIVER', 15)}*${date.slice(2)}*${time}*^*00501*${isaControl}*0*T*:`,
        `GS*HI*SENDER*RECEIVER*${date}*${time}*${gsControl}*X*005010X217`,
        `ST*278*0001*005010X217`,
        `BHT*0007*13*${isaControl}*${date}*${time}*RT`,
        
        // Loop 2000A Utilization Management Organization (UMO) - Source
        `HL*1**20*1`,
        `NM1*X3*2*${data.umoName}*****PI*${data.umoId}`,
        
        // Loop 2000B Requester (Provider) - Receiver
        `HL*2*1*21*1`,
        `NM1*1P*2*${data.requesterName}*****XX*${data.requesterNpi}`,
        
        // Loop 2000C Subscriber
        `HL*3*2*22*1`,
        `NM1*IL*1*${data.subscriberLastName}*${data.subscriberFirstName}****MI*${data.subscriberId}`,
    ];
    
    if (data.subscriberDob) {
        segments.push(`DMG*D8*${data.subscriberDob.replace(/-/g, '')}`);
    }

    // Loop 2000D Dependent (Skipped for simplicity in this builder version)

    // Loop 2000E Service/Event
    segments.push(`HL*4*3*EV*0`);
    segments.push(`TRN*1*${uuid().slice(0,9)}`);
    // UM01: Health Care Service Review (SC=Screening, AR=Admission Review)
    // UM03: Service Type (1=Medical, 2=Surgical)
    segments.push(`UM*SC*I*${data.serviceType || '1'}*21:B`); 
    segments.push(`DTP*472*D8*${svcDate}`);
    
    // SV1 Professional Service
    if (data.procedureCode) {
        segments.push(`HI*BF:${data.diagnosisCode || 'R69'}`);
        segments.push(`SV1*HC:${data.procedureCode}*${data.quantity || 1}*UN*1`);
    }

    segments.push(`SE*${segments.length - 1}*0001`);
    segments.push(`GE*1*${gsControl}`);
    segments.push(`IEA*1*${isaControl}`);

    return segments.join('~') + '~';
};

const uuid = () => Math.random().toString(36).substring(2, 11);

export const build837 = (data: FormData837): string => {
    const date = getCurrentDate();
    const time = getCurrentTime();
    const isaControl = Math.floor(Math.random() * 900000000) + 100000000;
    const gsControl = Math.floor(Math.random() * 900000000) + 100000000;
    
    const isProf = data.type === 'Professional';
    const isInst = data.type === 'Institutional';
    const isDent = data.type === 'Dental';
    
    let version = '005010X222A1'; // Prof
    if (isInst) version = '005010X223A2';
    if (isDent) version = '005010X224A2';

    const subDob = data.subscriberDob.replace(/-/g, '');
    
    const segments = [
        `ISA*00*          *00*          *ZZ*${pad('SENDER', 15)}*ZZ*${pad('RECEIVER', 15)}*${date.slice(2)}*${time}*^*00501*${isaControl}*0*P*:`,
        `GS*HC*SENDER*RECEIVER*${date}*${time}*${gsControl}*X*${version}`,
        `ST*837*0001*${version}`,
        `BHT*0019*00*${isaControl}*${date}*${time}*CH`,
        
        // Loop 1000A Submitter
        `NM1*41*2*SUBMITTER NAME*****46*SUBMITTERID`,
        `PER*IC*CONTACT NAME*TE*8005551234`,
        
        // Loop 1000B Receiver
        `NM1*40*2*${data.payerName}*****46*${data.payerId}`,
        
        // Loop 2000A Billing Provider
        `HL*1**20*1`,
        `NM1*85*2*${data.billingProviderName}*****XX*${data.billingProviderNpi}`,
        `N3*${data.billingProviderAddress}`,
        `N4*${data.billingProviderCity}*${data.billingProviderState}*${data.billingProviderZip}`,
        `REF*EI*${data.billingTaxId}`,
        
        // Loop 2000B Subscriber
        `HL*2*1*22*0`, // Assuming Subscriber is Patient for simple form
        `SBR*P*18*******CI`,
        `NM1*IL*1*${data.subscriberLastName}*${data.subscriberFirstName}****MI*${data.subscriberId}`,
        `DMG*D8*${subDob}*${data.subscriberGender}`,
        `NM1*PR*2*${data.payerName}*****PI*${data.payerId}`,
        
        // Loop 2300 Claim Information
        // CLM*ClaimID*TotalCharge***Type:Freq:YN*Y*A*Y*Y
        isProf || isDent
            ? `CLM*${data.claimId}*${data.totalCharge}***${data.placeOfService}:B:1*Y*A*Y*Y`
            : `CLM*${data.claimId}*${data.totalCharge}***${data.typeOfBill || '111'}*Y*A*Y*Y`,
        
        // HI Segment (Diagnoses)
        // ABK = ICD-10 Principal
        `HI*ABK:${data.diagnosisCode1}${data.diagnosisCode2 ? '*ABF:' + data.diagnosisCode2 : ''}`
    ];

    // Loop 2400 Service Lines
    data.serviceLines.forEach((line, index) => {
        const lineDate = line.serviceDate ? line.serviceDate.replace(/-/g, '') : date;
        
        segments.push(`LX*${index + 1}`);
        
        if (isProf) {
            segments.push(`SV1*HC:${line.procedureCode}*${line.lineCharge}*UN*${line.units || 1}***1`);
        } else if (isDent) {
            segments.push(`SV3*AD:${line.procedureCode}*${line.lineCharge}**UN*${line.units || 1}`);
        } else {
            segments.push(`SV2*${line.procedureCode}*HC*${line.lineCharge}*UN*${line.units || 1}`);
        }
        
        segments.push(`DTP*472*D8*${lineDate}`);
    });
    
    // Footer
    segments.push(`SE*${segments.length - 1}*0001`);
    segments.push(`GE*1*${gsControl}`);
    segments.push(`IEA*1*${isaControl}`);

    return segments.join('~') + '~';
};

export const build834 = (data: FormData834): string => {
    const date = getCurrentDate();
    const time = getCurrentTime();
    const isaControl = Math.floor(Math.random() * 900000000) + 100000000;
    const gsControl = Math.floor(Math.random() * 900000000) + 100000000;
    
    const segments = [
        `ISA*00*          *00*          *ZZ*${pad('SENDER', 15)}*ZZ*${pad('RECEIVER', 15)}*${date.slice(2)}*${time}*^*00501*${isaControl}*0*P*:`,
        `GS*BE*SENDER*RECEIVER*${date}*${time}*${gsControl}*X*005010X220A1`,
        `ST*834*0001*005010X220A1`,
        `BGN*00*${isaControl}*${date}*${time}***2`, // 00=Original, 2=Change (often used)
        
        // Loop 1000A Sponsor
        `N1*P5*${data.sponsorName}*FI*${data.sponsorTaxId}`,
        
        // Loop 1000B Payer
        `N1*IN*${data.payerName}*XV*${data.payerId}`,
    ];

    // Helper to add Member Loop (Subscriber or Dependent)
    const addMemberLoop = (member: Member834, isSubscriber: boolean) => {
        // INS*Y/N*18/19*MaintenanceType*ReasonCode
        // Y=Subscriber, N=Dependent
        // 18=Self, 19=Child, 01=Spouse
        const yn = isSubscriber ? 'Y' : 'N';
        const rel = isSubscriber ? '18' : member.relationship || '19';
        
        segments.push(`INS*${yn}*${rel}*${data.maintenanceType}*${data.maintenanceReason}*A***FT`); // FT=FullTime
        segments.push(`REF*0F*${member.id}`); // Subscriber/Member Policy ID
        if (member.ssn) segments.push(`REF*SY*${member.ssn}`);
        
        // DTP*356*D8*Date (Eligibility Begin) - mapping from Effective Date
        if (data.planEffectiveDate) {
            segments.push(`DTP*356*D8*${data.planEffectiveDate.replace(/-/g, '')}`);
        }

        // Loop 2100A Member Name
        // NM1*IL or 74 (Corrected Insured) usually IL is used for Subscriber in 2000 loop context
        // 834 Spec: 2100A NM101 is IL (Insured/Subscriber) or 74.
        segments.push(`NM1*IL*1*${member.lastName}*${member.firstName}`);
        // PER segment could go here
        // N3 Address
        if (isSubscriber) { // Simplified: only subscriber has address in this generator
             segments.push(`N3*123 MAIN ST`);
             segments.push(`N4*CITY*ST*12345`);
        }
        
        // DMG
        if (member.dob || member.gender) {
            segments.push(`DMG*D8*${(member.dob || date).replace(/-/g, '')}*${member.gender || 'U'}`);
        }
        
        // Loop 2300 Health Coverage
        // HD*024 (Insurance Line Code) ** HLT (Health) ** Coverage Level
        const covLevel = data.coverageLevelCode || 'IND';
        segments.push(`HD*${data.benefitStatus}**HLT**${covLevel}`); 
        
        if (data.planEffectiveDate) {
             segments.push(`DTP*348*D8*${data.planEffectiveDate.replace(/-/g, '')}`);
        }
        
        // REF*1L Policy Number
        if (data.policyNumber) {
            segments.push(`REF*1L*${data.policyNumber}`);
        }
    };

    // Add Subscriber
    addMemberLoop(data.subscriber, true);

    // Add Dependents
    data.dependents.forEach(dep => {
        addMemberLoop(dep, false);
    });

    segments.push(`SE*${segments.length - 1}*0001`);
    segments.push(`GE*1*${gsControl}`);
    segments.push(`IEA*1*${isaControl}`);

    return segments.join('~') + '~';
};

export const build820 = (data: FormData820): string => {
    const date = getCurrentDate();
    const time = getCurrentTime();
    const isaControl = Math.floor(Math.random() * 900000000) + 100000000;
    const gsControl = Math.floor(Math.random() * 900000000) + 100000000;
    
    const checkDt = data.checkDate ? data.checkDate.replace(/-/g, '') : date;

    const segments = [
        `ISA*00*          *00*          *ZZ*${pad('SENDER', 15)}*ZZ*${pad('RECEIVER', 15)}*${date.slice(2)}*${time}*^*00501*${isaControl}*0*P*:`,
        `GS*RA*SENDER*RECEIVER*${date}*${time}*${gsControl}*X*005010X218`,
        `ST*820*0001*005010X218`,
        `BPR*I*${data.totalPayment}*C*ACH*CCP*01*043000261*DA*123456789*1234567890**01*999999999*DA*987654321*${checkDt}`,
        `TRN*1*${data.checkNumber}*1999999999`,
        
        // Loop 1000A Premium Receiver
        `N1*PE*${data.premiumReceiverName}*FI*${data.premiumReceiverId}`,
        
        // Loop 1000B Premium Payer
        `N1*PR*${data.premiumPayerName}*FI*${data.premiumPayerId}`,
    ];

    // Loop 2000B - Individual Remittance (Standard RMR)
    // For simplicity, grouping all remittances under one parent org loop if needed, but 820 is flexible.
    // We will use Organization Summary Loop 2000A (ENT) + 2300A (RMR) if it were summary, 
    // but Individual is Loop 2000B (ENT*IND)
    
    data.remittances.forEach((remit, idx) => {
        segments.push(`ENT*${idx + 1}*2J*TE*1`); // 2J=Individual
        if (remit.name) {
            segments.push(`NM1*IL*1*${remit.name.split(' ')[1] || ''}*${remit.name.split(' ')[0] || ''}`);
        }
        // RMR*ReferenceIDQual*RefID*PaymentAction*Amount
        // IV = Seller's Invoice Number, AZ = Health Ins Policy
        segments.push(`RMR*AZ*${remit.refId}*PI*${remit.amount}`); 
        segments.push(`DTM*009*${checkDt}`); // Process Date
    });

    segments.push(`SE*${segments.length - 1}*0001`);
    segments.push(`GE*1*${gsControl}`);
    segments.push(`IEA*1*${isaControl}`);

    return segments.join('~') + '~';
};

export const build850 = (data: FormData850): string => {
    const date = getCurrentDate();
    const time = getCurrentTime();
    const isaControl = Math.floor(Math.random() * 900000000) + 100000000;
    const gsControl = Math.floor(Math.random() * 900000000) + 100000000;
    
    // Parse PO Date
    const poDt = data.poDate ? data.poDate.replace(/-/g, '') : date;

    const segments = [
        `ISA*00*          *00*          *ZZ*${pad('BUYER', 15)}*ZZ*${pad('SELLER', 15)}*${date.slice(2)}*${time}*U*00401*${isaControl}*0*P*>`,
        `GS*PO*BUYER*SELLER*${date}*${time}*${gsControl}*X*004010`,
        `ST*850*0001`,
        // BEG*00(Orig)*SA(StandAlone)*PoNum**Date
        `BEG*00*SA*${data.poNumber}**${poDt}`,
        // REF*DP*Department
        `REF*DP*055`,
        
        // Loop N1 Buyer
        `N1*BY*${data.buyerName}*92*${data.buyerId}`,
        
        // Loop N1 Seller
        `N1*SE*${data.sellerName}*92*${data.sellerId}`,
        
        // Loop N1 Ship To
        `N1*ST*${data.shipToName}`,
        `N3*${data.shipToAddress}`,
        `N4*${data.shipToCity}*${data.shipToState}*${data.shipToZip}`
    ];

    // PO1 Loop
    data.lines.forEach((line) => {
        // PO1*LineNo*Qty*UOM*Price**VP*PartNum...
        segments.push(`PO1*${line.lineNo}*${line.qty}*${line.uom}*${line.price}**VP*${line.partNumber}*PO*${data.poNumber}`);
        if (line.description) {
            segments.push(`PID*F****${line.description}`);
        }
    });

    // CTT*LineCount
    segments.push(`CTT*${data.lines.length}`);
    
    segments.push(`SE*${segments.length - 1}*0001`);
    segments.push(`GE*1*${gsControl}`);
    segments.push(`IEA*1*${isaControl}`);

    return segments.join('~') + '~';
};

export const build810 = (data: FormData810): string => {
    const date = getCurrentDate();
    const time = getCurrentTime();
    const isaControl = Math.floor(Math.random() * 900000000) + 100000000;
    const gsControl = Math.floor(Math.random() * 900000000) + 100000000;
    
    const invDt = data.invoiceDate ? data.invoiceDate.replace(/-/g, '') : date;
    
    // Calculate total amount from lines (qty * price) for TDS
    const totalAmount = data.lines.reduce((acc, line) => {
        return acc + (parseFloat(line.qty) * parseFloat(line.price));
    }, 0);
    // TDS expects amount * 100 usually, but simplified here we pass raw if no decimal logic enforced, 
    // standard X12 often implies 2 decimals. Let's multiply by 100 for N2 format.
    const tdsAmount = Math.round(totalAmount * 100).toString();

    const segments = [
        `ISA*00*          *00*          *ZZ*${pad('SELLER', 15)}*ZZ*${pad('BUYER', 15)}*${date.slice(2)}*${time}*U*00401*${isaControl}*0*P*>`,
        `GS*IN*SELLER*BUYER*${date}*${time}*${gsControl}*X*004010`,
        `ST*810*0001`,
        // BIG*Date*InvNum*PODate*PONum
        `BIG*${invDt}*${data.invoiceNumber}*${invDt}*${data.poNumber}`,
        
        // Loop N1 Remit To (Seller)
        `N1*SE*${data.sellerName}*92*${data.sellerId}`,
        
        // Loop N1 Bill To (Buyer)
        `N1*BY*${data.buyerName}*92*${data.buyerId}`,
    ];

    // IT1 Loop
    data.lines.forEach((line) => {
        // IT1*LineNo*Qty*UOM*Price**VP*PartNum
        segments.push(`IT1*${line.lineNo}*${line.qty}*${line.uom}*${line.price}**VP*${line.partNumber}`);
        if (line.description) {
            segments.push(`PID*F****${line.description}`);
        }
    });

    // TDS*Amount
    segments.push(`TDS*${tdsAmount}`);
    
    // CTT*LineCount
    segments.push(`CTT*${data.lines.length}`);
    
    segments.push(`SE*${segments.length - 1}*0001`);
    segments.push(`GE*1*${gsControl}`);
    segments.push(`IEA*1*${isaControl}`);

    return segments.join('~') + '~';
};

export const build856 = (data: FormData856): string => {
    const date = getCurrentDate();
    const time = getCurrentTime();
    const isaControl = Math.floor(Math.random() * 900000000) + 100000000;
    const gsControl = Math.floor(Math.random() * 900000000) + 100000000;
    const shipDt = data.shipDate ? data.shipDate.replace(/-/g, '') : date;
    const shipTm = data.shipTime ? data.shipTime.replace(/:/g, '') : time;

    let hlCount = 0;
    const nextHl = () => { hlCount++; return hlCount; };

    const segments = [
        `ISA*00*          *00*          *ZZ*${pad('SELLER', 15)}*ZZ*${pad('BUYER', 15)}*${date.slice(2)}*${time}*U*00401*${isaControl}*0*P*>`,
        `GS*SH*SELLER*BUYER*${date}*${time}*${gsControl}*X*004010`,
        `ST*856*0001`,
        `BSN*00*${data.shipmentId}*${shipDt}*${shipTm}*0001`,
    ];

    // HL 1: Shipment
    const hlShip = nextHl();
    segments.push(`HL*${hlShip}**S`);
    if(data.carrierCode) segments.push(`TD5*B*2*${data.carrierCode}*M`);
    if(data.trackingNumber) segments.push(`REF*CN*${data.trackingNumber}`);
    
    segments.push(`DTM*011*${shipDt}`); // Shipped Date
    
    segments.push(`N1*SF*${data.sellerName}*92*${data.sellerId}`);
    segments.push(`N1*ST*${data.shipToName}`);
    if(data.shipToAddress) segments.push(`N3*${data.shipToAddress}`);
    if(data.shipToCity) segments.push(`N4*${data.shipToCity}*${data.shipToState}*${data.shipToZip}`);

    // Group items by PO Number to create Order hierarchy
    const groupedItems: Record<string, ShipNoticeLineItem[]> = {};
    data.lines.forEach(line => {
        const po = line.poNumber || 'NO_PO';
        if(!groupedItems[po]) groupedItems[po] = [];
        groupedItems[po].push(line);
    });

    Object.entries(groupedItems).forEach(([po, lines]) => {
        // HL 2: Order
        const hlOrder = nextHl();
        segments.push(`HL*${hlOrder}*${hlShip}*O`);
        segments.push(`PRF*${po}`);

        lines.forEach(line => {
            // HL 3: Item
            const hlItem = nextHl();
            segments.push(`HL*${hlItem}*${hlOrder}*I`);
            segments.push(`LIN*${line.lineNo}*VP*${line.partNumber}`);
            segments.push(`SN1*${line.lineNo}*${line.qty}*${line.uom}`);
        });
    });

    segments.push(`CTT*${hlCount}`);
    segments.push(`SE*${segments.length - 1}*0001`);
    segments.push(`GE*1*${gsControl}`);
    segments.push(`IEA*1*${isaControl}`);

    return segments.join('~') + '~';
};
