import { EdiSegment, SegmentAnalysis } from "../types";
import { PROCEDURE_CODES, ICD10_CODES } from "./referenceData";

// --- X12 DICTIONARY DATA ---

const SEGMENT_DESCRIPTIONS: Record<string, string> = {
  ISA: "Interchange Control Header",
  GS: "Functional Group Header",
  ST: "Transaction Set Header",
  BHT: "Beginning of Hierarchical Transaction",
  HL: "Hierarchical Level",
  NM1: "Individual or Organizational Name",
  N3: "Address Information",
  N4: "Geographic Location",
  PER: "Administrative Communications Contact",
  DMG: "Demographic Information",
  DTP: "Date or Time or Period",
  EB: "Eligibility or Benefit Information",
  EQ: "Eligibility or Benefit Inquiry",
  SE: "Transaction Set Trailer",
  GE: "Functional Group Trailer",
  IEA: "Interchange Control Trailer",
  TRN: "Trace",
  REF: "Reference Information",
  AMT: "Monetary Amount",
  INS: "Member Level Detail",
  III: "Information",
  MSG: "Message Text",
  PRV: "Provider Information",
  AAA: "Request Validation",
  HSD: "Health Care Services Delivery",
  STC: "Claim Status Information",
  SVC: "Service Information",
  HI: "Health Care Information Codes (Diagnosis)",
  LS: "Loop Header",
  LE: "Loop Trailer"
};

const YES_NO = { "Y": "Yes", "N": "No", "U": "Unknown" };

// STC01-1 Claim Status Categories
const STATUS_CATEGORIES: Record<string, string> = {
    "A0": "Acknowledgment of Receipt - Forwarded",
    "A1": "Acknowledgment of Receipt",
    "A2": "Acknowledgment of Acceptance",
    "A3": "Acknowledgment of Return",
    "A4": "Case Closed",
    "A5": "Notice of Appeal",
    "A6": "Notice of Complaint",
    "A7": "Acknowledgment of Receipt - Detail Pending",
    "A8": "Acknowledgment of Receipt - Validation Error",
    "F0": "Finalized",
    "F1": "Finalized/Payment",
    "F2": "Finalized/Denial",
    "F3": "Finalized/Revised",
    "F4": "Finalized/Adjudication Complete",
    "P0": "Pending - Adjudication/System",
    "P1": "Pending - Medical Review",
    "P2": "Pending - Information Requested",
    "P3": "Pending - Provider Info Requested",
    "P4": "Pending - Patient Info Requested",
    "P5": "Pending - Payer Info Requested",
    "R0": "Request for Information",
    "R1": "Request for Provider Info",
    "R3": "Request for Patient Info",
    "R4": "Request for Payer Info"
};

// STC01-2 Claim Status Codes (Subset of common codes)
const STATUS_CODES: Record<string, string> = {
    "1": "For more detailed information, see the remittance advice.",
    "2": "More detailed information is available in the letter or email.",
    "15": "Authorization number is missing, invalid, or does not apply.",
    "16": "Claim/Encounter has been forwarded to entity.",
    "19": "Entity acknowledges receipt of claim/encounter.",
    "20": "Accepted for processing.",
    "21": "Missing or invalid information.",
    "23": "Prior to this payment, a total deduction of payment was made...",
    "27": "Expenses incurred prior to coverage.",
    "29": "Time limit for filing has expired.",
    "35": "Claim/Encounter not found.",
    "45": "Charge exceeds fee schedule/maximum allowable or contracted/legislated fee arrangement.",
    "97": "Payment is included in the allowance for another service/procedure.",
    "187": "Date(s) of service.",
    "197": "Precertification/authorization/notification/pre-treatment absent.",
    "243": "Services not authorized by network/primary care providers.",
    "479": "Missing or invalid Explanation of Benefits (EOB).",
    "568": "Review in progress.",
    "663": "Entity acknowledges receipt of claim/encounter; claim/encounter is being adjudicated.",
    "720": "Alert: This claim/encounter is part of a cyclic filing..."
};

// Maps Segment Tag -> Element Index (1-based) -> Definition
const ELEMENT_DEFINITIONS: Record<string, Record<number, { name: string, codes?: Record<string, string> }>> = {
  ISA: {
    1: { name: "Authorization Information Qualifier" },
    6: { name: "Interchange Sender ID" },
    8: { name: "Interchange Receiver ID" },
    13: { name: "Interchange Control Number" },
  },
  GS: {
    1: { 
        name: "Functional Identifier Code", 
        codes: { 
            "HS": "Eligibility Inquiry (270)", 
            "HB": "Eligibility Response (271)",
            "HR": "Claim Status Request (276)",
            "HN": "Claim Status Response (277)"
        } 
    },
    8: { name: "Version Code", codes: { "005010X279A1": "HIPAA 5010 270/271", "005010X212": "HIPAA 5010 276/277" } }
  },
  BHT: {
    1: { name: "Hierarchical Structure Code", codes: { "0022": "Info Source -> Info Receiver -> Subscriber -> Dependent", "0010": "Information Source, Receiver, Provider, Subscriber, Dependent" } },
    2: { name: "Purpose Code", codes: { "13": "Request", "11": "Response", "01": "Cancellation", "00": "Original", "08": "Status" } },
    6: { name: "Transaction Type Code", codes: { "RT": "Real Time", "RP": "Reporting" } }
  },
  HL: {
    3: { 
      name: "Hierarchical Level Code", 
      codes: { 
        "20": "Information Source (Payer)", 
        "21": "Information Receiver (Provider)", 
        "22": "Subscriber", 
        "23": "Dependent",
        "19": "Provider of Service" 
      } 
    },
    4: { name: "Hierarchical Child Code", codes: { "0": "No Children (Leaf)", "1": "Has Children" } }
  },
  NM1: {
    1: { 
      name: "Entity Identifier Code", 
      codes: { 
        "IL": "Insured/Subscriber", 
        "PR": "Payer", 
        "1P": "Provider", 
        "03": "Dependent",
        "P5": "Plan Sponsor",
        "FA": "Facility",
        "QC": "Patient",
        "HK": "Subscriber (Trace)",
        "Y2": "Managed Care Organization",
        "41": "Submitter"
      } 
    },
    2: { name: "Entity Type", codes: { "1": "Person", "2": "Non-Person Entity" } },
    8: { 
      name: "ID Code Qualifier", 
      codes: { 
        "XX": "NPI", 
        "MI": "Member ID", 
        "PI": "Payer ID", 
        "FI": "Tax ID", 
        "XV": "CMS Plan ID",
        "24": "Employer ID",
        "34": "SSN",
        "46": "ETIN"
      } 
    }
  },
  TRN: {
    1: { name: "Trace Type Code", codes: { "1": "Current Transaction Trace Numbers", "2": "Referenced Transaction Trace Numbers" } },
  },
  REF: {
    1: { name: "Reference ID Qualifier", codes: { 
        "SY": "SSN", 
        "EI": "Employer ID", 
        "18": "Plan Number", 
        "49": "Family Unit Number", 
        "6P": "Group Number",
        "HPI": "NPI",
        "IG": "Insurance Policy Number",
        "Q4": "Prior Authorization Number",
        "9F": "Referral Number",
        "G1": "Prior Authorization Number",
        "0K": "Policy Form Identifying Number",
        "1K": "Payer Claim Number",
        "D9": "Claim Number",
        "BLT": "Billing Type",
        "CK": "Check Number",
        "EO": "Submitter Identification Number",
        "F8": "Original Reference Number",
        "EA": "Medical Record Identification Number"
    } }
  },
  DMG: {
    1: { name: "Date Format", codes: { "D8": "Date (CCYYMMDD)" } },
    3: { name: "Gender", codes: { "M": "Male", "F": "Female", "U": "Unknown" } }
  },
  DTP: {
    1: { 
      name: "Date/Time Qualifier", 
      codes: { 
        "291": "Plan", 
        "307": "Eligibility", 
        "435": "Admission", 
        "348": "Benefit Begin",
        "349": "Benefit End",
        "356": "Service",
        "357": "Eligibility Begin",
        "382": "Enrollment",
        "102": "Issue",
        "290": "Coordination of Benefits",
        "472": "Service Date",
        "050": "Received Date",
        "576": "Check Date"
      } 
    },
    2: { name: "Format", codes: { "D8": "Date", "RD8": "Date Range (start-end)" } }
  },
  EB: {
    1: {
        name: "Benefit Info Code",
        codes: { 
          "1": "Active Coverage", 
          "2": "Active - Full Risk Capitation", 
          "3": "Active - Services Capitated", 
          "4": "Active - Services Capitated to Primary Care Physician", 
          "5": "Active - Services Capitated to Primary Care Physician",
          "6": "Inactive", 
          "7": "Inactive - Pending Eligibility Update",
          "8": "Inactive - Pending Query",
          "A": "Co-Insurance",
          "B": "Co-Payment",
          "C": "Deductible",
          "D": "Benefit Description",
          "E": "Exclusions",
          "F": "Limitations",
          "G": "Out of Pocket (Stop Loss)",
          "H": "Unlimited",
          "I": "Non-Covered",
          "J": "Cost Containment",
          "K": "Reserve",
          "L": "Primary Care Provider",
          "M": "Pre-existing Condition",
          "N": "Services Restricted to Health Plan Network",
          "O": "Not Deemed a Medical Necessity",
          "P": "Benefit Disclaimer",
          "Q": "Second Surgical Opinion Required",
          "R": "Other or Additional Payor",
          "S": "Prior Year(s) History",
          "T": "Card(s) Reported Lost or Stolen",
          "U": "Contact Payer",
          "V": "Cannot Process",
          "W": "Comprehensive",
          "X": "Other",
          "Y": "Spend Down"
        }
    },
    2: {
        name: "Coverage Level",
        codes: { "CHD": "Children Only", "DEP": "Dependents Only", "FAM": "Family", "IND": "Individual", "SPC": "Spouse and Children", "SPO": "Spouse Only" }
    },
    3: {
        name: "Service Type",
        codes: { 
          "1": "Medical Care", 
          "30": "Health Benefit Plan Coverage", 
          "33": "Chiropractic", 
          "35": "Dental Care", 
          "47": "Hospital", 
          "48": "Hospital - Inpatient", 
          "50": "Hospital - Outpatient", 
          "86": "Emergency Services", 
          "88": "Pharmacy", 
          "98": "Professional Visit - Office",
          "AL": "Vision (Optometry)",
          "MH": "Mental Health",
          "UC": "Urgent Care",
          "PT": "Physical Therapy",
          "AE": "Physical Medicine",
          "AK": "Psychotherapy",
          "BY": "Physician Care - 24hr",
          "DM": "DME",
          "A0": "Specialty"
        }
    },
    4: { name: "Insurance Type", codes: { "MA": "Medicare A", "MB": "Medicare B", "MC": "Medicaid", "CI": "Commercial", "HM": "HMO", "PO": "PPO" } },
    6: { name: "Time Period", codes: { "26": "Total", "29": "Remaining", "6": "Hour", "7": "Day", "21": "Years", "22": "Service Year", "23": "Calendar Year", "24": "Year to Date", "25": "Contract", "32": "Lifetime" } },
    9: { name: "Quantity Qualifier", codes: { "99": "Quantity Used", "CA": "Covered - Actual", "CE": "Covered - Estimated" } },
    11: { name: "Auth/Cert Required", codes: YES_NO },
    12: { name: "In Plan Network", codes: YES_NO }
  },
  EQ: {
     1: {
         name: "Service Type",
         codes: { 
          "30": "Health Benefit Plan Coverage", 
          "1": "Medical Care",
          "33": "Chiropractic", 
          "35": "Dental Care", 
          "47": "Hospital", 
          "88": "Pharmacy", 
          "98": "Professional Visit - Office"
         }
     }
  },
  STC: {
      1: { name: "Claim Status Category/Code", codes: {} }, // Complex composite handled dynamically
      2: { name: "Effective Date" },
      3: { name: "Action Code" },
      4: { name: "Total Charge Amount" },
      5: { name: "Total Payment Amount" },
      12: { name: "Free Form Message" }
  },
  AAA: {
      1: { name: "Valid Request Code", codes: { "Y": "Yes", "N": "No" } },
      3: { name: "Reject Reason Code", codes: { 
          "04": "Authorized Rep",
          "15": "Required application data missing",
          "33": "Input Errors",
          "41": "Authorization/Access Restrictions",
          "42": "Unable to Respond at Current Time",
          "43": "Invalid/Missing Provider ID",
          "62": "Patient Not Found",
          "75": "Subscriber/Insured Not Found"
      }}
  },
  MSG: {
      1: { name: "Free Form Message Text" }
  },
  III: {
      1: { name: "Code List Qualifier", codes: { "ZZ": "Mutually Defined" } },
      2: { name: "Industry Code" }
  },
  HI: {
      // HI segment has 12 composite elements, all generic diagnosis
      1: { name: "Health Care Code Information" },
      2: { name: "Health Care Code Information" },
      3: { name: "Health Care Code Information" },
      4: { name: "Health Care Code Information" },
      5: { name: "Health Care Code Information" },
      6: { name: "Health Care Code Information" },
      7: { name: "Health Care Code Information" },
      8: { name: "Health Care Code Information" },
      9: { name: "Health Care Code Information" },
      10: { name: "Health Care Code Information" },
      11: { name: "Health Care Code Information" },
      12: { name: "Health Care Code Information" }
  }
};

// --- LOGIC ---

/**
 * Helper to retrieve a human readable definition for a code.
 */
export const getElementDefinition = (tag: string, index: number, value: string): string => {
    const def = ELEMENT_DEFINITIONS[tag]?.[index];
    if (def && def.codes && def.codes[value]) {
        return def.codes[value];
    }
    return value; // Fallback to raw value if no code match
};

export const getProcedureDefinition = (code: string): string => {
    return PROCEDURE_CODES[code] || "Procedure " + code;
};

export const getDiagnosisDefinition = (code: string): string => {
    // Check for direct match or variations (simple logic)
    if (ICD10_CODES[code]) return ICD10_CODES[code];
    
    // Sometimes codes come with dots, sometimes without in EDI (usually without, but good to be safe)
    // EDI usually sends "I10", "A01" without dots.
    // If the map uses dots (standard ICD-10), we might need to normalize. 
    // For this implementation, the map has dots where standard.
    
    return ICD10_CODES[code] || "Diagnosis " + code;
};

export const analyzeSegmentOffline = (segment: EdiSegment): SegmentAnalysis => {
  const segDef = SEGMENT_DESCRIPTIONS[segment.tag] || "Unknown Segment";
  const elemDefs = ELEMENT_DEFINITIONS[segment.tag] || {};

  const fields = segment.elements.map(el => {
    const def = elemDefs[el.index];
    let definition = "-";
    
    // Check if there is a predefined code value
    if (def && def.codes) {
        if (def.codes[el.value]) {
            definition = def.codes[el.value];
        } else {
             definition = "Code not in dictionary";
        }
    }

    // Heuristics
    if (definition === "-") {
      // Dates (D8 format usually)
      if (el.value.length === 8 && !isNaN(Number(el.value)) && 
         ((el.index === 3 || el.index === 2) && (segment.tag === 'DTP' || segment.tag === 'DMG' || segment.tag === 'STC'))) {
        definition = `${el.value.substring(4,6)}/${el.value.substring(6,8)}/${el.value.substring(0,4)}`;
      } 
      // Amounts
      else if (def && (def.name.includes("Amount") || def.name.includes("Quantity"))) {
        definition = el.value; 
      }
      
      // SVC Procedure Code lookup
      else if (segment.tag === 'SVC' && el.index === 1) {
          const parts = el.value.split(':');
          if (parts.length > 1) {
              definition = getProcedureDefinition(parts[1]);
          }
      }

      // HI Diagnosis Code Lookup (Composite Element)
      else if (segment.tag === 'HI') {
          // Format is usually Qual:Code e.g. BK:I10 or ABK:I10
          const parts = el.value.split(':');
          if (parts.length >= 2) {
              const qual = parts[0];
              const code = parts[1];
              const diagDesc = getDiagnosisDefinition(code);
              
              let qualDesc = qual;
              if (qual === 'BK' || qual === 'ABK') qualDesc = 'Principal Diag';
              else if (qual === 'BF' || qual === 'ABF') qualDesc = 'Diagnosis';
              else if (qual === 'BJ') qualDesc = 'Admitting Diag';
              
              definition = `${qualDesc}: ${diagDesc}`;
          }
      }
    }

    // Special handling for STC composite (Category Code:Status Code:Entity)
    if (segment.tag === 'STC' && el.index === 1) {
        const parts = el.value.split(':');
        // Category
        const catDesc = STATUS_CATEGORIES[parts[0]] || parts[0];
        // Status
        const statDesc = STATUS_CODES[parts[1]] || parts[1];
        
        if (parts.length >= 2) {
            definition = `[${parts[0]}] ${catDesc}\n[${parts[1]}] ${statDesc}`;
        }
    }

    return {
      code: `${segment.tag}${el.index.toString().padStart(2, '0')}`,
      description: def ? def.name : "Data Element",
      value: el.value,
      definition: definition
    };
  });

  // Dynamic Summary Generation
  let summary = segDef;
  
  if (segment.tag === 'NM1') {
     const entityType = fields.find(f => f.code === 'NM101')?.definition || "Entity";
     const lastName = fields.find(f => f.code === 'NM103')?.value || "";
     const firstName = fields.find(f => f.code === 'NM104')?.value || "";
     summary = `${entityType}: ${firstName} ${lastName}`.trim();
  } 
  else if (segment.tag === 'EB') {
     const coverage = fields.find(f => f.code === 'EB01')?.definition;
     const service = fields.find(f => f.code === 'EB03')?.definition;
     if (coverage) {
        summary = `Benefit: ${coverage}`;
        if (service) summary += ` for ${service}`;
     }
  }
  else if (segment.tag === 'STC') {
      const amt = fields.find(f => f.code === 'STC04')?.value;
      const date = fields.find(f => f.code === 'STC02')?.definition;
      const f1 = fields.find(f => f.code === 'STC01');
      // Clean up summary
      summary = `Claim Status: ${date || ''} ${amt ? `($${amt})` : ''}`;
  }
  else if (segment.tag === 'EQ') {
    const service = fields.find(f => f.code === 'EQ01')?.definition;
    if (service) summary = `Inquiry for: ${service}`;
  }
  else if (segment.tag === 'HL') {
    const level = fields.find(f => f.code === 'HL03')?.definition;
    const id = fields.find(f => f.code === 'HL01')?.value;
    if (level) summary = `Level ${id}: ${level}`;
  }
  else if (segment.tag === 'DTP') {
    const type = fields.find(f => f.code === 'DTP01')?.definition;
    const date = fields.find(f => f.code === 'DTP03')?.value;
    if (type && date) summary = `${type}: ${date}`;
  }
  else if (segment.tag === 'AAA') {
      const reason = fields.find(f => f.code === 'AAA03')?.definition;
      if (reason) summary = `Rejection: ${reason}`;
  }
  else if (segment.tag === 'MSG') {
      const text = fields.find(f => f.code === 'MSG01')?.value;
      if (text) summary = `Message: ${text}`;
  }
  else if (segment.tag === 'SVC') {
      const proc = fields.find(f => f.code === 'SVC01')?.definition;
      const fee = fields.find(f => f.code === 'SVC02')?.value;
      if (proc) summary = `Service: ${proc} ($${fee})`;
  }
  else if (segment.tag === 'HI') {
      const diag1 = fields[0]?.definition;
      if (diag1 && diag1 !== '-') summary = `Diagnoses: ${diag1.split(':')[1]}...`;
      else summary = "Diagnoses Information";
  }

  return {
    summary,
    fields
  };
};