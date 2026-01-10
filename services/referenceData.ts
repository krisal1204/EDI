// Large dictionary of common CPT/HCPCS and ICD-10 Codes
// In a full production app, this might be fetched from a database or a compressed asset.

export const PROCEDURE_CODES: Record<string, string> = {
    // --- Evaluation & Management (E/M) ---
    "99201": "Office/outpatient visit, new patient, level 1",
    "99202": "Office/outpatient visit, new patient, level 2",
    "99203": "Office/outpatient visit, new patient, level 3",
    "99204": "Office/outpatient visit, new patient, level 4",
    "99205": "Office/outpatient visit, new patient, level 5",
    "99211": "Office/outpatient visit, est patient, level 1",
    "99212": "Office/outpatient visit, est patient, level 2",
    "99213": "Office/outpatient visit, est patient, level 3",
    "99214": "Office/outpatient visit, est patient, level 4",
    "99215": "Office/outpatient visit, est patient, level 5",
    "99221": "Initial hospital care, low complexity",
    "99222": "Initial hospital care, moderate complexity",
    "99223": "Initial hospital care, high complexity",
    "99231": "Subsequent hospital care, low complexity",
    "99232": "Subsequent hospital care, moderate complexity",
    "99233": "Subsequent hospital care, high complexity",
    "99238": "Hospital discharge day management, 30 min or less",
    "99239": "Hospital discharge day management, more than 30 min",
    "99281": "Emergency department visit, level 1",
    "99282": "Emergency department visit, level 2",
    "99283": "Emergency department visit, level 3",
    "99284": "Emergency department visit, level 4",
    "99285": "Emergency department visit, level 5",
    "99291": "Critical care, evaluation and management of the critically ill or critically injured patient; first 30-74 minutes",
    "99381": "Prev visit, new, infant < 1yr",
    "99385": "Prev visit, new, age 18-39",
    "99391": "Prev visit, est, infant < 1yr",
    "99395": "Prev visit, est, age 18-39",
    "99441": "Telephone evaluation and management service; 5-10 minutes",
    "99442": "Telephone evaluation and management service; 11-20 minutes",
    "99443": "Telephone evaluation and management service; 21-30 minutes",

    // --- Anesthesia ---
    "00100": "Anesthesia for procedures on salivary glands, including biopsy",
    "00102": "Anesthesia for procedures involving plastic repair of cleft lip",
    "00120": "Anesthesia for procedures on external, middle, and inner ear including biopsy; not otherwise specified",
    "00140": "Anesthesia for procedures on eye; not otherwise specified",
    "00300": "Anesthesia for all procedures on the integumentary system, muscles and nerves of head, neck, and posterior trunk, not otherwise specified",
    "00400": "Anesthesia for procedures on the integumentary system on the extremities, anterior trunk and perineum; not otherwise specified",
    
    // --- Surgery: Integumentary ---
    "10060": "Drainage of skin abscess",
    "10061": "Drainage of skin abscess, complicated",
    "10140": "Drainage of hematoma/fluid",
    "11042": "Debridement, subcutaneous tissue; first 20 sq cm or less",
    "12001": "Repair superficial wound(s) up to 2.5cm",
    "12002": "Repair superficial wound(s) 2.6cm to 7.5cm",
    "17000": "Destruction of benign/premalignant lesions",
    "17110": "Destruction of benign lesions other than skin tags or cutaneous vascular proliferative lesions; up to 14 lesions",

    // --- Surgery: Musculoskeletal ---
    "20610": "Arthrocentesis, aspiration and/or injection, major joint or bursa",
    "27130": "Arthroplasty, hip, total",
    "27447": "Arthroplasty, knee, condyle and plateau",
    "29881": "Arthroscopy, knee, with meniscectomy",
    "29827": "Arthroscopy, shoulder, surgical; with rotator cuff repair",
    "29880": "Arthroscopy, knee, surgical; with meniscectomy (medial AND lateral)",

    // --- Surgery: Cardiovascular ---
    "33405": "Replacement, aortic valve, with cardiopulmonary bypass; with prosthetic valve other than homograft or stentless valve",
    "33533": "Coronary artery bypass, using arterial graft(s); single arterial graft",
    "36415": "Collection of venous blood by venipuncture",
    "36556": "Insertion of non-tunneled centrally inserted central venous catheter; age 5 years or older",

    // --- Surgery: Digestive ---
    "43239": "EGD biopsy single/multiple",
    "43235": "Esophagogastroduodenoscopy, flexible, transoral; diagnostic",
    "44970": "Laparoscopy, surgical, appendectomy",
    "45378": "Colonoscopy, flexible; diagnostic",
    "45380": "Colonoscopy, flexible; with biopsy",
    "45385": "Colonoscopy, flexible; with removal of tumor(s)",
    "47562": "Laparoscopic cholecystectomy",

    // --- Surgery: Maternity ---
    "59400": "Routine obstetric care, vaginal delivery",
    "59510": "Routine obstetric care, cesarean delivery",
    "59610": "Routine obstetric care including antepartum care, vaginal delivery (after previous cesarean delivery) and postpartum care",

    // --- Surgery: Eye ---
    "66984": "Cataract surgery with IOL, 1 stage",
    "66821": "Discission of secondary membranous cataract (after cataract surgery and/or IOL implant) (YAG laser)",

    // --- Radiology ---
    "70450": "CT head/brain; without contrast",
    "70551": "MRI brain; without contrast",
    "70553": "MRI brain; without contrast, followed by contrast",
    "71045": "Radiologic exam, chest; single view",
    "71046": "Radiologic exam, chest; 2 views",
    "72148": "MRI lumbar spine; without contrast",
    "73030": "Radiologic exam, shoulder; complete, min 2 views",
    "73560": "Radiologic exam, knee; 1 or 2 views",
    "73721": "MRI joint of lower extremity; without contrast",
    "74176": "CT abdomen and pelvis; without contrast",
    "74177": "CT abdomen and pelvis; with contrast",
    "76700": "Ultrasound, abdominal, real time with image documentation",
    "76801": "Ultrasound, pregnant uterus, real time with image documentation, < 14 weeks",
    "77067": "Screening mammography, bilateral",
    
    // --- Pathology and Laboratory ---
    "80048": "Basic metabolic panel (BMP)",
    "80050": "General health panel",
    "80053": "Comprehensive metabolic panel (CMP)",
    "80061": "Lipid panel",
    "81001": "Urinalysis, automated with microscopy",
    "82306": "Vitamin D; 25 hydroxy, includes fraction(s), if performed",
    "83036": "Hemoglobin; glycosylated (A1C)",
    "84436": "Thyroxine; total",
    "84443": "Thyroid stimulating hormone (TSH)",
    "85025": "Blood count; complete (CBC), automated",
    "85027": "Blood count; complete (CBC), automated (no diff)",
    "85610": "Prothrombin time",
    "87086": "Culture, bacterial; quantitative colony count, urine",
    "87804": "Infectious agent antigen detection by immunoassay with direct optical observation; Influenza",
    "87880": "Infectious agent antigen detection by IA; Strep A",
    "88305": "Tissue Exam by Pathologist",

    // --- Medicine & Immunization ---
    "90471": "Immunization administration",
    "90632": "Hepatitis A vaccine, adult",
    "90658": "Influenza virus vaccine, split virus, 3 yrs+",
    "90715": "Tdap vaccine, 7 yrs+",
    "90732": "Pneumococcal polysaccharide vaccine, 23-valent (PPSV23), adult or immunosuppressed patient dosage",
    "93000": "Electrocardiogram, routine ECG with at least 12 leads",
    "96372": "Therapeutic, prophylactic, or diagnostic injection",
    "97110": "Therapeutic procedure, 1 or more areas, each 15 min",
    "97112": "Neuromuscular reeducation of movement, balance, coordination, kinesthetic sense, posture, and/or proprioception for sitting and/or standing activities",
    "97140": "Manual therapy techniques (eg, mobilization/ manipulation, manual lymphatic drainage, manual traction), 1 or more regions, each 15 minutes",
    "98940": "Chiropractic manipulative treatment (CMT); spinal, 1-2 regions",
    "98941": "Chiropractic manipulative treatment (CMT); spinal, 3-4 regions",

    // --- HCPCS (J-Codes, etc) ---
    "J0120": "Injection, tetracycline, up to 250 mg",
    "J0290": "Injection, ampicillin sodium, 500 mg",
    "J1030": "Injection, methylprednisolone acetate, 40 mg",
    "J1100": "Injection, dexamethasone sodium phosphate, 1 mg",
    "J1745": "Injection, infliximab, excludes biosimilar, 10 mg",
    "J3420": "Injection, vitamin B-12 cyanocobalamin, up to 1000 mcg",
    "J7613": "Albuterol, inhalation solution, fda-approved final product, non-compounded, unit dose, 1 mg",
    "E0100": "Cane, includes canes of all materials, adjustable or fixed, with tip",
    "E0135": "Walker, folding (pickup), adjustable or fixed height",
    "E0570": "Nebulizer, with compressor",
    "A0425": "Ground mileage, per statute mile",
    "A0427": "Ambulance service, advanced life support, emergency transport, level 1 (ALS 1 - emergency)",
    "A0429": "Ambulance service, basic life support, emergency transport (BLS - emergency)",
    "G0402": "Initial preventive physical examination; face-to-face visit, services limited to new beneficiary during the first 12 months of medicare enrollment",
    "G0438": "Annual wellness visit; includes a personalized prevention plan of service (pps), initial visit",
    "G0439": "Annual wellness visit, includes a personalized prevention plan of service (pps), subsequent visit"
};

export const ICD10_CODES: Record<string, string> = {
    // --- Infectious ---
    "A09": "Infectious gastroenteritis and colitis, unspecified",
    "B20": "Human immunodeficiency virus [HIV] disease",
    "B34.9": "Viral infection, unspecified",
    "A41.9": "Sepsis, unspecified organism",
    "B02.9": "Zoster without complications",
    
    // --- Neoplasms ---
    "C34.90": "Malignant neoplasm of unspecified part of unspecified bronchus or lung",
    "C50.911": "Malignant neoplasm of unspecified site of right female breast",
    "C50.912": "Malignant neoplasm of unspecified site of left female breast",
    "C61": "Malignant neoplasm of prostate",
    "C18.9": "Malignant neoplasm of colon, unspecified",
    "D64.9": "Anemia, unspecified",

    // --- Endocrine ---
    "E03.9": "Hypothyroidism, unspecified",
    "E11.9": "Type 2 diabetes mellitus without complications",
    "E11.21": "Type 2 diabetes mellitus with diabetic nephropathy",
    "E11.65": "Type 2 diabetes mellitus with hyperglycemia",
    "E55.9": "Vitamin D deficiency, unspecified",
    "E78.00": "Pure hypercholesterolemia, unspecified",
    "E78.5": "Hyperlipidemia, unspecified",
    "E66.9": "Obesity, unspecified",
    "E66.3": "Overweight",

    // --- Mental Health ---
    "F32.9": "Major depressive disorder, single episode, unspecified",
    "F33.1": "Major depressive disorder, recurrent, moderate",
    "F41.1": "Generalized anxiety disorder",
    "F43.10": "Post-traumatic stress disorder, unspecified",
    "F10.20": "Alcohol dependence, uncomplicated",

    // --- Nervous System ---
    "G40.909": "Epilepsy, unspecified, not intractable, without status epilepticus",
    "G43.909": "Migraine, unspecified, not intractable, without status migrainosus",
    "G47.00": "Insomnia, unspecified",
    "G89.29": "Other chronic pain",
    "G56.00": "Carpal tunnel syndrome, unspecified upper limb",
    "G30.9": "Alzheimer's disease, unspecified",

    // --- Circulatory ---
    "I10": "Essential (primary) hypertension",
    "I11.9": "Hypertensive heart disease without heart failure",
    "I20.9": "Angina pectoris, unspecified",
    "I21.9": "Acute myocardial infarction, unspecified",
    "I25.10": "Atherosclerotic heart disease of native coronary artery without angina pectoris",
    "I48.0": "Paroxysmal atrial fibrillation",
    "I48.91": "Unspecified atrial fibrillation",
    "I50.9": "Heart failure, unspecified",
    "I63.9": "Cerebral infarction, unspecified",
    "I95.9": "Hypotension, unspecified",

    // --- Respiratory ---
    "J01.90": "Acute sinusitis, unspecified",
    "J02.9": "Acute pharyngitis, unspecified",
    "J06.9": "Acute upper respiratory infection, unspecified",
    "J11.1": "Influenza due to unidentified influenza virus with other respiratory manifestations",
    "J18.9": "Pneumonia, unspecified organism",
    "J20.9": "Acute bronchitis, unspecified",
    "J44.9": "Chronic obstructive pulmonary disease, unspecified",
    "J45.909": "Unspecified asthma, uncomplicated",
    "J30.9": "Allergic rhinitis, unspecified",

    // --- Digestive ---
    "K21.9": "Gastro-esophageal reflux disease without esophagitis",
    "K58.9": "Irritable bowel syndrome without diarrhea",
    "K59.00": "Constipation, unspecified",
    "K80.20": "Calculus of gallbladder without cholecystitis without obstruction",
    "K52.9": "Noninfective gastroenteritis and colitis, unspecified",

    // --- Skin ---
    "L03.90": "Cellulitis, unspecified",
    "L20.9": "Atopic dermatitis, unspecified",
    "L70.0": "Acne vulgaris",
    "L29.9": "Pruritus, unspecified",

    // --- Musculoskeletal ---
    "M17.11": "Unilateral primary osteoarthritis, right knee",
    "M17.12": "Unilateral primary osteoarthritis, left knee",
    "M25.50": "Pain in unspecified joint",
    "M25.511": "Pain in right shoulder",
    "M25.512": "Pain in left shoulder",
    "M25.561": "Pain in right knee",
    "M25.562": "Pain in left knee",
    "M47.812": "Spondylosis without myelopathy or radiculopathy, cervical region",
    "M54.12": "Radiculopathy, cervical region",
    "M54.30": "Sciatica, unspecified side",
    "M54.40": "Lumbago with sciatica, unspecified side",
    "M54.50": "Low back pain, unspecified",
    "M54.5": "Low back pain",
    "M54.9": "Dorsalgia, unspecified",
    "M79.1": "Myalgia",
    "M79.7": "Fibromyalgia",
    "M10.9": "Gout, unspecified",

    // --- Genitourinary ---
    "N17.9": "Acute kidney failure, unspecified",
    "N18.30": "Chronic kidney disease, stage 3 unspecified",
    "N18.9": "Chronic kidney disease, unspecified",
    "N39.0": "Urinary tract infection, site not specified",
    "N40.0": "Benign prostatic hyperplasia without lower urinary tract symptoms",
    "N20.0": "Calculus of kidney",

    // --- Pregnancy ---
    "O80": "Encounter for full-term uncomplicated delivery",
    "O99.019": "Anemia complicating pregnancy, unspecified trimester",
    "O26.899": "Other specified pregnancy related conditions, unspecified trimester",

    // --- Symptoms ---
    "R00.0": "Tachycardia, unspecified",
    "R05.9": "Cough, unspecified",
    "R06.02": "Shortness of breath",
    "R07.9": "Chest pain, unspecified",
    "R10.9": "Unspecified abdominal pain",
    "R11.2": "Nausea with vomiting, unspecified",
    "R42": "Dizziness and giddiness",
    "R50.9": "Fever, unspecified",
    "R51.9": "Headache, unspecified",
    "R53.83": "Other fatigue",
    "R55": "Syncope and collapse",
    "R60.0": "Localized edema",
    "R73.09": "Other abnormal glucose",
    "R31.9": "Hematuria, unspecified",

    // --- Injury/Factors ---
    "S93.401A": "Sprain of unspecified ligament of right ankle, initial encounter",
    "S93.402A": "Sprain of unspecified ligament of left ankle, initial encounter",
    "Z00.00": "Encounter for general adult medical exam without abnormal findings",
    "Z01.419": "Encounter for gynecological examination (general) (routine) without abnormal findings",
    "Z12.31": "Encounter for screening mammogram for malignant neoplasm of breast",
    "Z23": "Encounter for immunization",
    "Z79.4": "Long term (current) use of insulin",
    "Z79.82": "Long term (current) use of aspirin",
    "Z79.899": "Other long term (current) drug therapy",
    "Z86.718": "Personal history of other venous thrombosis and embolism",
    "Z00.129": "Encounter for routine child health examination without abnormal findings",
    "Z51.11": "Encounter for antineoplastic chemotherapy",
    "Z71.3": "Dietary counseling and surveillance"
};

export const SERVICE_TYPE_CODES: Record<string, string> = {
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
  "PT": "Physical Therapy"
};
