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

export interface ServiceLine837 {
    procedureCode: string;
    lineCharge: string;
    units: string;
    serviceDate: string;
}

export interface FormData837 {
  type: 'Professional' | 'Institutional';
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
    
    planEffectiveDate: string; // DTP*348
    
    subscriber: Member834;
    dependents: Member834[];
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

export const build837 = (data: FormData837): string => {
    const date = getCurrentDate();
    const time = getCurrentTime();
    const isaControl = Math.floor(Math.random() * 900000000) + 100000000;
    const gsControl = Math.floor(Math.random() * 900000000) + 100000000;
    
    const isProf = data.type === 'Professional';
    const version = isProf ? '005010X222A1' : '005010X223A2';
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
        isProf 
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
        } else {
            segments.push(`SV2*${line.procedureCode}*HC*${line.lineCharge}*UN*${line.units || 1}`);
        }
        
        segments.push(`DTP*472*D8*${lineDate}`);
    });
    
    // Footer
    // SE count includes ST through SE.
    // ISA (0), GS (1). Count = Total - 2 (for ISA/GS) + 1 (for SE itself) = Total - 1.
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
        // HD*024 (Insurance Line Code)
        segments.push(`HD*${data.benefitStatus}**HLT`); // HLT=Health
        if (data.planEffectiveDate) {
             segments.push(`DTP*348*D8*${data.planEffectiveDate.replace(/-/g, '')}`);
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