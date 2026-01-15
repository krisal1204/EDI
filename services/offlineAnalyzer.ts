

import { EdiSegment, SegmentAnalysis } from "../types";
import { PROCEDURE_CODES, ICD10_CODES } from "./referenceData";

// --- X12 DICTIONARY DATA ---

const SEGMENT_DESCRIPTIONS: Record<string, string> = {
  ISA: "Interchange Control Header",
  GS: "Functional Group Header",
  ST: "Transaction Set Header",
  BHT: "Beginning of Hierarchical Transaction",
  BGN: "Beginning Segment",
  HL: "Hierarchical Level",
  NM1: "Individual or Organizational Name",
  N1: "Name",
  N2: "Additional Name Information",
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
  LE: "Loop Trailer",
  MPI: "Military Personnel Information",
  CN1: "Contract Information",
  CLM: "Claim Information",
  SV1: "Professional Service",
  SV2: "Institutional Service",
  SV3: "Dental Service",
  SBR: "Subscriber Information",
  PAT: "Patient Information",
  LX: "Service Line Number",
  CUR: "Foreign Currency Information",
  HD: "Health Coverage",
  CAS: "Claim Adjustment",
  MOA: "Medicare Outpatient Adjudication",
  PLB: "Provider Level Adjustment",
  K3: "File Information",
  NTE: "Note/Special Instruction",
  PWK: "Paperwork",
  CR1: "Ambulance Certification",
  CR2: "Chiropractic Certification",
  CR3: "Durable Medical Equipment Certification",
  CRC: "Conditions Indicator",
  QTY: "Quantity Information",
  MEA: "Measurements",
  DN1: "Orthodontic Information",
  DN2: "Tooth Status",
  CL1: "Claim Codes",
  PS1: "Purchase Service",
  HCP: "Health Care Pricing"
};

const YES_NO = { "Y": "Yes", "N": "No", "U": "Unknown" };

// STC01-1 Claim Status Categories
export const STATUS_CATEGORIES: Record<string, string> = {
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

// STC01-2 Claim Status Codes (Extensive List)
export const STATUS_CODES: Record<string, string> = {
    "1": "For more detailed information, see the remittance advice.",
    "2": "More detailed information is available in the letter or email.",
    "4": "The procedure code is inconsistent with the modifier used.",
    "6": "The procedure/revenue code is inconsistent with the patient's age.",
    "7": "The procedure/revenue code is inconsistent with the patient's gender.",
    "8": "The procedure/revenue code is inconsistent with the provider type.",
    "9": "The diagnosis is inconsistent with the patient's age.",
    "10": "The diagnosis is inconsistent with the patient's gender.",
    "11": "The diagnosis is inconsistent with the procedure.",
    "12": "The diagnosis is inconsistent with the provider type.",
    "15": "Authorization number is missing, invalid, or does not apply.",
    "16": "Claim/Encounter has been forwarded to entity.",
    "18": "Duplicate claim/service.",
    "19": "Entity acknowledges receipt of claim/encounter.",
    "20": "Accepted for processing.",
    "21": "Missing or invalid information.",
    "23": "Prior to this payment, a total deduction of payment was made.",
    "26": "Expenses incurred prior to coverage.",
    "27": "Expenses incurred after coverage terminated.",
    "29": "Time limit for filing has expired.",
    "33": "Subscriber and policy number not found.",
    "35": "Claim/Encounter not found.",
    "37": "Predetermination is on file, awaiting processing.",
    "45": "Charge exceeds fee schedule/maximum allowable or contracted/legislated fee arrangement.",
    "89": "Professional fees removed from charges.",
    "97": "Payment is included in the allowance for another service/procedure.",
    "187": "Date(s) of service.",
    "197": "Precertification/authorization/notification/pre-treatment absent.",
    "243": "Services not authorized by network/primary care providers.",
    "479": "Missing or invalid Explanation of Benefits (EOB).",
    "568": "Review in progress.",
    "663": "Entity acknowledges receipt of claim/encounter; claim/encounter is being adjudicated.",
    "720": "Alert: This claim/encounter is part of a cyclic filing."
};

// Claim Adjustment Group Codes (CAS01)
export const ADJUSTMENT_GROUP_CODES: Record<string, string> = {
    "CO": "Contractual Obligation",
    "CR": "Correction and Reversals",
    "OA": "Other adjustments",
    "PI": "Payer Initiated Reductions",
    "PR": "Patient Responsibility"
};

// Claim Adjustment Reason Codes (CARC) - CAS02
// Source: https://x12.org/codes/claim-adjustment-reason-codes
export const ADJUSTMENT_REASON_CODES: Record<string, string> = {
    "1": "Deductible Amount",
    "2": "Coinsurance Amount",
    "3": "Co-payment Amount",
    "4": "The procedure code is inconsistent with the modifier used or a required modifier is missing.",
    "5": "The procedure code/bill type is inconsistent with the place of service.",
    "16": "Claim/service lacks information or has submission/billing error(s).",
    "18": "Exact duplicate claim/service.",
    "22": "This care may be covered by another payer per coordination of benefits.",
    "23": "The impact of prior payer(s) adjudication including payments and/or adjustments.",
    "26": "Expenses incurred prior to coverage.",
    "27": "Expenses incurred after coverage terminated.",
    "29": "The time limit for filing has expired.",
    "35": "Lifetime benefit maximum has been reached.",
    "45": "Charge exceeds fee schedule/maximum allowable or contracted/legislated fee arrangement.",
    "50": "These are non-covered services because this is not deemed a 'medical necessity' by the payer.",
    "96": "Non-covered charge(s).",
    "97": "The benefit for this service is included in the payment/allowance for another service/procedure that has already been adjudicated.",
    "109": "Claim not covered by this payer/contractor. You must send the claim to the correct payer/contractor.",
    "131": "Claim specific negotiated discount.",
    "197": "Precertification/authorization/notification absent.",
    "204": "This service/equipment/drug is not covered under the patient's current benefit plan."
};

// CLP02 Claim Status Codes (835)
export const REMITTANCE_STATUS_CODES: Record<string, string> = {
    "1": "Processed as Primary",
    "2": "Processed as Secondary",
    "3": "Processed as Tertiary",
    "4": "Denied",
    "19": "Processed as Primary, Forwarded to Additional Payer(s)",
    "20": "Processed as Secondary, Forwarded to Additional Payer(s)",
    "21": "Processed as Tertiary, Forwarded to Additional Payer(s)",
    "22": "Reversal of Previous Payment",
    "23": "Not Our Claim, Forwarded to Additional Payer(s)",
    "25": "Predetermination Pricing Only - No Payment"
};

// Service Type Codes (EB03, EQ01)
// Source: https://x12.org/codes/service-type-codes
const X12_SERVICE_TYPES: Record<string, string> = {
    "1": "Medical Care",
    "2": "Surgical",
    "3": "Consultation",
    "4": "Diagnostic X-Ray",
    "5": "Diagnostic Lab",
    "6": "Radiation Therapy",
    "7": "Anesthesia",
    "8": "Surgical Assistance",
    "9": "Other Medical",
    "10": "Blood Charges",
    "11": "Used Durable Medical Equipment",
    "12": "Durable Medical Equipment",
    "13": "Hearing",
    "14": "Renal Supplies",
    "15": "Alternate Method Dialysis",
    "16": "Chronic Renal Disease (CRD) Equipment",
    "17": "Pre-Admission Testing",
    "18": "Durable Medical Equipment - Rental",
    "19": "Pneumonia Vaccine",
    "20": "Second Surgical Opinion",
    "21": "Third Surgical Opinion",
    "22": "Social Work",
    "23": "Diagnostic Dental",
    "24": "Periodontics",
    "25": "Restorative",
    "26": "Endodontics",
    "27": "Maxillofacial Prosthetics",
    "28": "Adjunctive Dental Services",
    "30": "Health Benefit Plan Coverage",
    "31": "Benefit Disclaimer",
    "32": "Plan Wait Period",
    "33": "Chiropractic",
    "34": "Chiropractic Office Visits",
    "35": "Dental Care",
    "36": "Dental Crowns",
    "37": "Dental Accident",
    "38": "Orthodontics",
    "39": "Prosthodontics",
    "40": "Oral Surgery",
    "41": "Preventive Dental",
    "42": "Psychiatric - Inpatient",
    "45": "Hospice",
    "47": "Hospital",
    "48": "Hospital - Inpatient",
    "49": "Hospital - Room and Board",
    "50": "Hospital - Outpatient",
    "51": "Hospital - Emergency Accident",
    "52": "Hospital - Emergency Medical",
    "53": "Hospital - Ambulatory Surgical",
    "54": "Long Term Care",
    "55": "Major Medical",
    "56": "Medically Related Transportation",
    "57": "Air Transportation",
    "58": "Cabulance",
    "59": "Licensed Ambulance",
    "60": "Home Health Care",
    "61": "Home Health Prescriptions",
    "62": "MRI/CAT Scan",
    "63": "Donor Procedures",
    "64": "Acupuncture",
    "65": "Newborn Care",
    "66": "Pathology",
    "67": "Smoking Cessation",
    "68": "Well Baby Care",
    "69": "Maternity",
    "70": "Transplants",
    "71": "Audiology",
    "72": "Inhalation Therapy",
    "73": "Diagnostic Medical",
    "74": "Private Duty Nursing",
    "75": "Prosthetic Device",
    "76": "Dialysis",
    "78": "Chemotherapy",
    "79": "Allergy Testing",
    "80": "Immunizations",
    "81": "Routine Physical",
    "82": "Family Planning",
    "83": "Infertility",
    "84": "Abortion",
    "85": "AIDS",
    "86": "Emergency Services",
    "87": "Cancer",
    "88": "Pharmacy",
    "89": "Free Standing Prescription Drug",
    "90": "Mail Order Prescription Drug",
    "91": "Brand Name Prescription Drug",
    "92": "Generic Prescription Drug",
    "93": "Podiatry",
    "94": "Podiatry - Office Visits",
    "95": "Podiatry - Nursing Home Visits",
    "96": "Professional (Physician)",
    "97": "Anesthesiologist",
    "98": "Professional Visit - Office",
    "99": "Shift Nursing",
    "A0": "Specialty",
    "A1": "Specialty - Office",
    "A2": "Specialty - Inpatient",
    "A3": "Specialty - Outpatient",
    "A4": "Psychiatric",
    "A5": "Psychiatric - Room and Board",
    "A6": "Psychotherapy",
    "A7": "Psychiatric - Inpatient",
    "A8": "Psychiatric - Outpatient",
    "A9": "Rehabilitation",
    "AA": "Rehabilitation - Room and Board",
    "AB": "Rehabilitation - Inpatient",
    "AC": "Rehabilitation - Outpatient",
    "AD": "Occupational Therapy",
    "AE": "Physical Medicine",
    "AF": "Speech Therapy",
    "AG": "Skilled Nursing Care",
    "AH": "Skilled Nursing Care - Room and Board",
    "AI": "Substance Abuse",
    "AJ": "Alcoholism",
    "AK": "Drug Addiction",
    "AL": "Vision (Optometry)",
    "AM": "Frames",
    "AN": "Lenses",
    "AO": "Routine Eye Exam",
    "AQ": "Mammogram/Pap Smear",
    "AR": "Experimental Drug Therapy",
    "B1": "Burn Care",
    "B2": "Brand Name Prescription Drug",
    "B3": "Generic Prescription Drug",
    "BA": "Independent Medical Exam",
    "BB": "Partial Hospitalization (Psychiatric)",
    "BC": "Day Care (Psychiatric)",
    "BD": "Cognitive Therapy",
    "BE": "Massage Therapy",
    "BF": "Pulmonary Rehabilitation",
    "BG": "Cardiac Rehabilitation",
    "BH": "Pediatric",
    "BI": "Nursery",
    "BJ": "Skin",
    "BK": "Orthopedic",
    "BL": "Cardiac",
    "BM": "Lymphatic",
    "BN": "Gastrointestinal",
    "BP": "Endocrine",
    "BQ": "Neurology",
    "BR": "Eye",
    "BS": "Invasive Procedures",
    "BT": "Gynecological",
    "BU": "Obstetrical",
    "BV": "Obstetrical/Gynecological",
    "BW": "Mail Order Prescription Drug",
    "BX": "No Service Type Code",
    "BY": "Physician Care - 24hr",
    "BZ": "Nursing Service - 24hr",
    "C1": "Gynecological",
    "CA": "Rehabilitation",
    "CB": "Rehabilitation - Inpatient",
    "CC": "Rehabilitation - Outpatient",
    "CD": "Occupational Therapy",
    "CE": "Physical Therapy",
    "CF": "Speech Therapy",
    "CG": "Hospice",
    "CH": "Outpatient Hospital Facility",
    "CI": "Peripheral Vascular",
    "CJ": "Co-payment",
    "CK": "Deductible",
    "CL": "Co-insurance",
    "CM": "Deductible & Co-insurance",
    "CN": "Co-payment & Deductible",
    "CO": "Co-payment, Deductible & Co-insurance",
    "CP": "Co-payment & Co-insurance",
    "CQ": "Case Management",
    "DG": "Dermatology",
    "DM": "DME",
    "DS": "Diabetic Supplies",
    "GF": "Generic Prescription Drug - Formulary",
    "GN": "Generic Prescription Drug - Non-Formulary",
    "GY": "Allergy",
    "IC": "Intensive Care",
    "MH": "Mental Health",
    "NI": "Neonatal Intensive Care",
    "ON": "Oncology",
    "PT": "Physical Therapy",
    "PU": "Pulmonary",
    "RN": "Renal",
    "RT": "Residential Treatment",
    "TC": "Transitional Care",
    "TN": "Transitional Nursery Care",
    "UC": "Urgent Care"
};

// Maps Segment Tag -> Element Index (1-based) -> Definition
const ELEMENT_DEFINITIONS: Record<string, Record<number, { name: string, codes?: Record<string, string> }>> = {
  ISA: {
    1: { name: "Authorization Information Qualifier", codes: { "00": "No Authorization Information Present", "03": "Additional Data Identification" } },
    6: { name: "Interchange Sender ID" },
    8: { name: "Interchange Receiver ID" },
    11: { name: "Repetition Separator" },
    12: { name: "Interchange Control Version", codes: { "00501": "Standards Approved for Publication by X12 Procedures Review Board through October 2003" } },
    13: { name: "Interchange Control Number" },
    14: { name: "Acknowledgment Requested", codes: { "0": "No Acknowledgment Requested", "1": "Interchange Acknowledgment Requested (TA1)" } },
    15: { name: "Usage Indicator", codes: { "P": "Production", "T": "Test" } }
  },
  GS: {
    1: { 
        name: "Functional Identifier Code", 
        codes: { 
            "HS": "Eligibility Inquiry (270)", 
            "HB": "Eligibility Response (271)",
            "HR": "Claim Status Request (276)",
            "HN": "Claim Status Response (277)",
            "HP": "Health Care Claim Payment/Advice (835)",
            "HC": "Health Care Claim (837)",
            "FA": "Functional Acknowledgment (997)",
            "BE": "Benefit Enrollment (834)"
        } 
    },
    8: { name: "Version Code", codes: { "005010X279A1": "HIPAA 5010 270/271", "005010X212": "HIPAA 5010 276/277", "005010X220A1": "HIPAA 5010 834", "005010X222A1": "HIPAA 5010 837 Prof", "005010X223A2": "HIPAA 5010 837 Inst" } }
  },
  BGN: {
      1: { name: "Transaction Set Purpose Code", codes: { "00": "Original", "15": "Re-Submission", "22": "Information Copy", "01": "Cancellation", "04": "Verified" }},
      2: { name: "Reference Identification" },
      3: { name: "Date" },
      8: { name: "Action Code", codes: { "2": "Change (Update)", "4": "Verify", "1": "Add", "3": "Delete", "RX": "Replace" }}
  },
  BHT: {
    1: { name: "Hierarchical Structure Code", codes: { "0022": "Info Source -> Info Receiver -> Subscriber -> Dependent", "0010": "Information Source, Receiver, Provider, Subscriber, Dependent", "0019": "Info Source, Receiver, Provider, Subscriber, Dependent (Claim)" } },
    2: { name: "Purpose Code", codes: { "13": "Request", "11": "Response", "01": "Cancellation", "00": "Original", "08": "Status" } },
    6: { name: "Transaction Type Code", codes: { "RT": "Real Time", "RP": "Reporting", "CH": "Chargeable" } }
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
  N1: {
      1: { name: "Entity Identifier Code", codes: { "P5": "Plan Sponsor", "IN": "Insurer", "PR": "Payer", "1P": "Provider", "85": "Billing Provider", "IL": "Insured" } },
      2: { name: "Name" },
      3: { name: "ID Code Qualifier", codes: { "FI": "Tax ID", "XV": "CMS Plan ID", "91": "Assigned by Vendor", "XX": "NPI", "MI": "Member ID" }}
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
        "41": "Submitter",
        "40": "Receiver",
        "00": "Other",
        "2B": "Third-Party Administrator",
        "36": "Employer",
        "73": "Other Physician",
        "77": "Service Location",
        "82": "Rendering Provider",
        "85": "Billing Provider",
        "87": "Pay-to Provider",
        "98": "Receiver",
        "GP": "Gateway Provider",
        "P3": "Primary Care Provider",
        "P4": "Prior Insurance Carrier",
        "P7": "Third Party Administrator",
        "PRP": "Primary Payer",
        "SEP": "Secondary Payer",
        "TTP": "Tertiary Payer",
        "QD": "Responsible Party",
        "74": "Corrected Insured"
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
        "46": "ETIN",
        "FA": "Facility ID",
        "NI": "NAIC ID",
        "PP": "Pharmacy Processor Number",
        "SV": "Service Provider Number",
        "91": "Assigned by Vendor",
        "92": "Assigned by Payer"
      } 
    }
  },
  PER: {
    1: {
        name: "Contact Function Code",
        codes: {
            "IC": "Information Contact",
            "IP": "Information Provider",
            "FQ": "Facsimile Qualifier",
            "CX": "Payers Claim Office",
            "BL": "Technical Department"
        }
    },
    3: {
        name: "Communication Number Qualifier",
        codes: {
            "TE": "Telephone",
            "FX": "Facsimile",
            "EM": "Email",
            "EX": "Telephone Extension",
            "UR": "URL"
        }
    },
    5: {
        name: "Communication Number Qualifier",
        codes: {
            "TE": "Telephone",
            "FX": "Facsimile",
            "EM": "Email",
            "EX": "Telephone Extension",
            "UR": "URL"
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
        "1L": "Group or Policy Number",
        "1W": "Member ID",
        "28": "Employee Identification Number",
        "3H": "Case Number",
        "49": "Family Unit Number", 
        "6P": "Group Number",
        "9A": "Purchase Order Number",
        "9B": "Repriced Claim Ref Number",
        "9D": "Referral Number",
        "HPI": "NPI",
        "IG": "Insurance Policy Number",
        "Q4": "Prior Authorization Number",
        "9F": "Referral Number",
        "G1": "Prior Authorization Number",
        "G2": "Provider Commercial Number",
        "G3": "Predetermination of Benefits ID",
        "0K": "Policy Form Identifying Number",
        "1K": "Payer Claim Number",
        "D9": "Claim Number",
        "BLT": "Billing Type",
        "CK": "Check Number",
        "EO": "Submitter Identification Number",
        "F8": "Original Reference Number",
        "EA": "Medical Record Identification Number",
        "BB": "Authorization Number",
        "CE": "Class of Contract Code",
        "CT": "Contract Number",
        "EJ": "Patient Account Number",
        "F6": "Health Insurance Claim (HIC) Number",
        "GH": "Identification Card Serial Number",
        "HJ": "Identity Card Number",
        "IF": "Issue Number",
        "N6": "Plan Network Identification Number",
        "NQ": "Medicaid Provider Identifier",
        "X4": "Clinical Laboratory Improvement Amendment Number",
        "Y4": "Agency Claim Number",
        "F5": "Medicare Claim Number",
        "0B": "State License Number",
        "LU": "Location Number",
        "0F": "Subscriber Number",
        "6R": "Provider Control Number",
        "A6": "Employee Identification Number",
        "NT": "Administrator's Reference Number"
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
        "007": "Effective",
        "036": "Expiration",
        "050": "Received",
        "090": "Report Start",
        "091": "Report End",
        "102": "Issue",
        "150": "Service Period Start",
        "151": "Service Period End",
        "193": "Period Start",
        "194": "Period End",
        "198": "Completion",
        "232": "Claim Statement Period Start",
        "233": "Claim Statement Period End",
        "290": "Coordination of Benefits",
        "291": "Plan", 
        "292": "Benefit",
        "295": "Primary Care Provider",
        "304": "Latest Visit or Consultation",
        "307": "Eligibility", 
        "318": "Added",
        "346": "Plan Begin",
        "348": "Benefit Begin",
        "349": "Benefit End",
        "356": "Eligibility Begin",
        "357": "Eligibility End",
        "360": "Initial Disability Period Start",
        "361": "Initial Disability Period End",
        "382": "Enrollment",
        "431": "Onset of Current Symptom or Illness",
        "435": "Admission", 
        "439": "Accident",
        "453": "Acute Manifestation of a Chronic Condition",
        "454": "Initial Treatment",
        "455": "Last X-Ray",
        "472": "Service Date",
        "484": "Last Menstrual Period",
        "539": "Policy Effective",
        "540": "Policy Expiration",
        "573": "Date Claim Paid",
        "576": "Check Date",
        "636": "Date of Last Update",
        "738": "Most Recent Hemoglobin or Hematocrit or Glucagon Test",
        "739": "Most Recent Serum Creatine Test",
        "771": "Status"
      } 
    },
    2: { name: "Format", codes: { "D8": "Date", "RD8": "Date Range (start-end)", "DTS": "Date Time range" } }
  },
  INS: {
      1: { name: "Member Indicator", codes: { "Y": "Subscriber", "N": "Dependent" } },
      2: { name: "Relationship Code", codes: { "18": "Self", "01": "Spouse", "19": "Child", "21": "Unknown", "20": "Employee", "31": "Court Appointed Guardian" } },
      3: { name: "Maintenance Type Code", codes: { "001": "Change", "021": "Add", "024": "Cancel/Term", "030": "Audit", "025": "Reinstate" } },
      4: { name: "Maintenance Reason Code", codes: { "01": "Divorce", "02": "Birth", "03": "Death", "07": "Term of Employment", "28": "Initial Enrollment", "05": "Marriage", "41": "Re-enrollment", "43": "Change of Location" } }
  },
  HD: {
      1: { name: "Maintenance Type Code", codes: { "001": "Change", "021": "Add", "024": "Cancel/Term", "030": "Audit" } },
      3: { name: "Insurance Line Code", codes: { "HLT": "Health", "DEN": "Dental", "VIS": "Vision", "LIF": "Life", "DIS": "Disability" } },
      4: { name: "Plan Coverage Description" },
      5: { name: "Coverage Level Code", codes: { "EMP": "Employee Only", "FAM": "Family", "ESP": "Employee + Spouse", "ECH": "Employee + Children", "IND": "Individual", "SPC": "Spouse + Children" } }
  },
  EB: {
    1: {
        name: "Benefit Info Code",
        codes: { 
          "1": "Active Coverage", 
          "2": "Active - Full Risk Capitation", 
          "3": "Active - Services Capitated", 
          "4": "Active - Services Capitated to PCP", 
          "5": "Active - Services Capitated to PCP",
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
          "Y": "Spend Down",
          "Z": "Off-Site Service",
          "CB": "Coverage Basis",
          "MC": "Managed Care",
          "SD": "Same Day"
        }
    },
    2: {
        name: "Coverage Level",
        codes: { 
            "CHD": "Children Only", 
            "DEP": "Dependents Only", 
            "FAM": "Family", 
            "IND": "Individual", 
            "SPC": "Spouse and Children", 
            "SPO": "Spouse Only",
            "ECH": "Employee and Children",
            "EMP": "Employee",
            "ESP": "Employee and Spouse" 
        }
    },
    3: {
        name: "Service Type",
        codes: X12_SERVICE_TYPES
    },
    4: { name: "Insurance Type", codes: { "MA": "Medicare A", "MB": "Medicare B", "MC": "Medicaid", "CI": "Commercial", "HM": "HMO", "PO": "PPO", "QM": "Qualified Medicare Beneficiary", "TV": "Title V" } },
    6: { name: "Time Period", codes: { "6": "Hour", "7": "Day", "13": "24 Hours", "21": "Years", "22": "Service Year", "23": "Calendar Year", "24": "Year to Date", "25": "Contract", "26": "Total", "27": "Visit", "29": "Remaining", "32": "Lifetime", "34": "Month", "35": "Week", "36": "Admission" } },
    9: { name: "Quantity Qualifier", codes: { "99": "Quantity Used", "CA": "Covered - Actual", "CE": "Covered - Estimated", "DB": "Deductible Billed", "DY": "Days", "HS": "Hours", "VS": "Visits" } },
    11: { name: "Auth/Cert Required", codes: YES_NO },
    12: { name: "In Plan Network", codes: YES_NO }
  },
  EQ: {
     1: {
         name: "Service Type",
         codes: X12_SERVICE_TYPES
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
          "49": "Provider not enrolled",
          "50": "Provider not active",
          "51": "Provider not authorized",
          "62": "Patient Not Found",
          "64": "Invalid Patient ID",
          "71": "Date of Birth does not match",
          "72": "Invalid Subscriber/Insured ID",
          "73": "Invalid/Missing Subscriber/Insured Name",
          "74": "Invalid/Missing Subscriber/Insured Gender",
          "75": "Subscriber/Insured Not Found",
          "76": "Duplicate Subscriber/Insured",
          "97": "Invalid/Missing Patient Gender"
      }}
  },
  MSG: {
      1: { name: "Free Form Message Text" }
  },
  III: {
      1: { name: "Code List Qualifier", codes: { "ZZ": "Mutually Defined", "LQ": "LOINC" } },
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
  },
  PRV: {
      1: { name: "Provider Code", codes: { "PE": "Performing", "BI": "Billing", "AT": "Attending", "RF": "Referring" } },
      2: { name: "Reference ID Qualifier", codes: { "PXC": "Taxonomy Code" } }
  },
  CLM: {
      1: { name: "Claim Submitter Identifier" },
      2: { name: "Total Claim Charge Amount" },
      5: { name: "Place of Service / Type of Bill" }, // Composite
      6: { name: "Provider Signature on File", codes: YES_NO },
      7: { name: "Assignment Accept", codes: { "A": "Assigned", "B": "Assigned on Clinical Lab", "C": "Not Assigned" } },
      8: { name: "Benefits Assignment Cert", codes: YES_NO },
      9: { name: "Release of Information", codes: YES_NO }
  },
  SV1: {
      1: { name: "Composite Medical Procedure" },
      2: { name: "Line Item Charge Amount" },
      3: { name: "Unit Qualifier", codes: { "UN": "Units", "MJ": "Minutes" } },
      4: { name: "Service Unit Count" }
  },
  SV2: {
      1: { name: "Revenue Code" },
      2: { name: "Composite Medical Procedure" },
      3: { name: "Line Item Charge Amount" },
      4: { name: "Unit Qualifier", codes: { "UN": "Units", "DA": "Days" } },
      5: { name: "Service Unit Count" }
  },
  SBR: {
      1: { name: "Payer Responsibility Code", codes: { "P": "Primary", "S": "Secondary", "T": "Tertiary", "A": "Payer Responsibility Unknown", "B": "Self-Pay" } },
      2: { name: "Individual Relationship Code", codes: { "18": "Self", "01": "Spouse", "19": "Child", "20": "Employee" } },
      9: { name: "Claim Filing Indicator Code", codes: { "CI": "Commercial Insurance", "MB": "Medicare Part B", "MA": "Medicare Part A", "MC": "Medicaid", "ZZ": "Mutually Defined" } }
  },
  PAT: {
      1: { name: "Individual Relationship Code" }
  },
  LX: {
      1: { name: "Assigned Number" }
  },
  CAS: {
      1: { name: "Claim Adjustment Group Code", codes: ADJUSTMENT_GROUP_CODES },
      2: { name: "Adjustment Reason Code", codes: ADJUSTMENT_REASON_CODES },
      5: { name: "Adjustment Reason Code", codes: ADJUSTMENT_REASON_CODES },
      8: { name: "Adjustment Reason Code", codes: ADJUSTMENT_REASON_CODES },
      11: { name: "Adjustment Reason Code", codes: ADJUSTMENT_REASON_CODES },
      14: { name: "Adjustment Reason Code", codes: ADJUSTMENT_REASON_CODES },
      17: { name: "Adjustment Reason Code", codes: ADJUSTMENT_REASON_CODES }
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
    return ICD10_CODES[code] || "Diagnosis " + code;
};

export const analyzeSegmentOffline = (segment: EdiSegment): SegmentAnalysis => {
  const segDef = SEGMENT_DESCRIPTIONS[segment.tag] || "Unknown Segment";
  const elemDefs = ELEMENT_DEFINITIONS[segment.tag] || {};

  const fields = segment.elements.map(el => {
    const def = elemDefs[el.index];
    let definition = "-";
    
    // -- Handle Repeats --
    if (el.repeats && el.repeats.length > 0) {
        // If element has repeats, map each value to its definition and join them
        const definitions = el.repeats.map(val => {
            if (def && def.codes && def.codes[val]) return `${val}: ${def.codes[val]}`;
            return val;
        });
        // Limit to reasonable display number if huge
        definition = definitions.join("\n"); 
    } 
    else {
        // -- Normal Single Value Logic --
        
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
             ((el.index === 3 || el.index === 2) && (segment.tag === 'DTP' || segment.tag === 'DMG' || segment.tag === 'STC' || segment.tag === 'BGN'))) {
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
          // SV1 Procedure Code lookup (Prof)
          else if (segment.tag === 'SV1' && el.index === 1) {
              const parts = el.value.split(':');
              // SV1:01 is Composite (HC:Code)
              const code = parts.length > 1 ? parts[1] : parts[0];
              definition = getProcedureDefinition(code);
          }
          // SV2 Procedure Code lookup (Inst)
          else if (segment.tag === 'SV2' && el.index === 2) {
              // SV2:02 is Composite
              const parts = el.value.split(':');
              const code = parts.length > 1 ? parts[1] : parts[0];
              definition = getProcedureDefinition(code);
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
          // CLM05 Place of Service (Prof) or Type of Bill (Inst)
          else if (segment.tag === 'CLM' && el.index === 5) {
              const parts = el.value.split(':');
              if (parts[0]) {
                 // Heuristic: If 3 digits, probably TOB. If 2, probably POS.
                 if (parts[0].length === 3) definition = `Type of Bill: ${parts[0]}`;
                 else definition = `Place of Service: ${parts[0]}`;
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
     const serviceField = fields.find(f => f.code === 'EB03');
     const service = serviceField?.definition !== '-' && serviceField?.definition !== 'Code not in dictionary' ? serviceField?.definition : serviceField?.value;
     
     if (coverage) {
        summary = `Benefit: ${coverage}`;
        if (service) {
            // Truncate summary if service list is huge
            const serviceSummary = service.includes('\n') ? service.split('\n')[0] + '...' : service;
            summary += ` for ${serviceSummary}`;
        }
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
  else if (segment.tag === 'CLM') {
      const id = fields.find(f => f.code === 'CLM01')?.value;
      const amt = fields.find(f => f.code === 'CLM02')?.value;
      summary = `Claim ${id} ($${amt})`;
  }
  else if (segment.tag === 'INS') {
      const rel = fields.find(f => f.code === 'INS02')?.definition;
      const type = fields.find(f => f.code === 'INS03')?.definition;
      summary = `Member: ${rel} - ${type}`;
  }
  else if (segment.tag === 'HD') {
      const type = fields.find(f => f.code === 'HD01')?.definition;
      summary = `Coverage: ${type}`;
  }
  else if (segment.tag === 'CAS') {
      const reason = fields.find(f => f.code === 'CAS02')?.definition;
      const amt = fields.find(f => f.code === 'CAS03')?.value;
      if (reason) summary = `Adj: ${reason} ($${amt})`;
  }

  return {
    summary,
    fields
  };
};
