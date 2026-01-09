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
  serviceTypeCode: string;
  
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
  
  // Logic: If dependent is present, the inquiry (EQ) is usually for the dependent.
  // If no dependent, inquiry is for subscriber.
  
  if (!data.hasDependent) {
    // --- Subscriber is Patient ---
    segments.push(`DTP*291*D8*${svcDate}`);
    segments.push(`EQ*${data.serviceTypeCode}`);
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
    segments.push(`EQ*${data.serviceTypeCode}`);
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
    // If hasDependent, Subscriber HL has children (1). If not, it is leaf (0) because Claim Loop is nested inside it in 2000C? 
    // Wait, in 276, Claim Status Tracking Component (Loop 2200D) is child of 2000C Subscriber.
    // If Dependent exists (Loop 2000E), it is child of 2000C Subscriber.
    // So if dependent, HL*3 has children (1). If no dependent, HL*3 has children (0) or (1) depending on how you view the nested segments. 
    // Actually, TRN/AMT/DTP are NOT HL segments, they are just segments in the loop.
    // The Hierarchy is HL(Source) -> HL(Receiver) -> HL(Subscriber) -> [Optional HL(Dependent)].
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