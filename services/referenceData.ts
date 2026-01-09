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
    "99281": "Emergency department visit, level 1",
    "99282": "Emergency department visit, level 2",
    "99283": "Emergency department visit, level 3",
    "99284": "Emergency department visit, level 4",
    "99285": "Emergency department visit, level 5",
    "99381": "Prev visit, new, infant < 1yr",
    "99385": "Prev visit, new, age 18-39",
    "99391": "Prev visit, est, infant < 1yr",
    "99395": "Prev visit, est, age 18-39",
    
    // --- Surgery ---
    "10060": "Drainage of skin abscess",
    "10140": "Drainage of hematoma/fluid",
    "12001": "Repair superficial wound(s) up to 2.5cm",
    "17000": "Destruction of benign/premalignant lesions",
    "27130": "Arthroplasty, hip, total",
    "27447": "Arthroplasty, knee, condyle and plateau",
    "29881": "Arthroscopy, knee, with meniscectomy",
    "43239": "EGD biopsy single/multiple",
    "45378": "Colonoscopy, flexible; diagnostic",
    "45380": "Colonoscopy, flexible; with biopsy",
    "45385": "Colonoscopy, flexible; with removal of tumor(s)",
    "47562": "Laparoscopic cholecystectomy",
    "59400": "Routine obstetric care, vaginal delivery",
    "59510": "Routine obstetric care, cesarean delivery",
    "66984": "Cataract surgery with IOL, 1 stage",

    // --- Radiology ---
    "70450": "CT head/brain; without contrast",
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
    "83036": "Hemoglobin; glycosylated (A1C)",
    "84443": "Thyroid stimulating hormone (TSH)",
    "85025": "Blood count; complete (CBC), automated",
    "85027": "Blood count; complete (CBC), automated (no diff)",
    "85610": "Prothrombin time",
    "87086": "Culture, bacterial; quantitative colony count, urine",
    "87880": "Infectious agent antigen detection by IA; Strep A",
    "88305": "Tissue Exam by Pathologist",

    // --- Medicine & Immunization ---
    "90471": "Immunization administration",
    "90632": "Hepatitis A vaccine, adult",
    "90658": "Influenza virus vaccine, split virus, 3 yrs+",
    "90715": "Tdap vaccine, 7 yrs+",
    "93000": "Electrocardiogram, routine ECG with at least 12 leads",
    "96372": "Therapeutic, prophylactic, or diagnostic injection",
    "97110": "Therapeutic procedure, 1 or more areas, each 15 min",
    "98940": "Chiropractic manipulative treatment (CMT); spinal, 1-2 regions",
    "98941": "Chiropractic manipulative treatment (CMT); spinal, 3-4 regions",

    // --- HCPCS (J-Codes, etc) ---
    "J0120": "Injection, tetracycline, up to 250 mg",
    "J0290": "Injection, ampicillin sodium, 500 mg",
    "J1030": "Injection, methylprednisolone acetate, 40 mg",
    "J1100": "Injection, dexamethasone sodium phosphate, 1 mg",
    "J3420": "Injection, vitamin B-12 cyanocobalamin, up to 1000 mcg",
    "J7613": "Albuterol, inhalation solution, fda-approved final product, non-compounded, unit dose, 1 mg",
    "E0100": "Cane, includes canes of all materials, adjustable or fixed, with tip",
    "E0135": "Walker, folding (pickup), adjustable or fixed height",
    "A0425": "Ground mileage, per statute mile",
    "A0427": "Ambulance service, advanced life support, emergency transport, level 1 (ALS 1 - emergency)",
    "A0429": "Ambulance service, basic life support, emergency transport (BLS - emergency)",
};

export const ICD10_CODES: Record<string, string> = {
    // --- Infectious ---
    "A09": "Infectious gastroenteritis and colitis, unspecified",
    "B20": "Human immunodeficiency virus [HIV] disease",
    "B34.9": "Viral infection, unspecified",
    
    // --- Neoplasms ---
    "C34.90": "Malignant neoplasm of unspecified part of unspecified bronchus or lung",
    "C50.911": "Malignant neoplasm of unspecified site of right female breast",
    "C50.912": "Malignant neoplasm of unspecified site of left female breast",
    "C61": "Malignant neoplasm of prostate",
    "D64.9": "Anemia, unspecified",

    // --- Endocrine ---
    "E03.9": "Hypothyroidism, unspecified",
    "E11.9": "Type 2 diabetes mellitus without complications",
    "E11.21": "Type 2 diabetes mellitus with diabetic nephropathy",
    "E11.65": "Type 2 diabetes mellitus with hyperglycemia",
    "E55.9": "Vitamin D deficiency, unspecified",
    "E78.00": "Pure hypercholesterolemia, unspecified",
    "E78.5": "Hyperlipidemia, unspecified",

    // --- Mental Health ---
    "F32.9": "Major depressive disorder, single episode, unspecified",
    "F41.1": "Generalized anxiety disorder",
    "F43.10": "Post-traumatic stress disorder, unspecified",

    // --- Nervous System ---
    "G40.909": "Epilepsy, unspecified, not intractable, without status epilepticus",
    "G43.909": "Migraine, unspecified, not intractable, without status migrainosus",
    "G47.00": "Insomnia, unspecified",
    "G89.29": "Other chronic pain",

    // --- Circulatory ---
    "I10": "Essential (primary) hypertension",
    "I20.9": "Angina pectoris, unspecified",
    "I21.9": "Acute myocardial infarction, unspecified",
    "I25.10": "Atherosclerotic heart disease of native coronary artery without angina pectoris",
    "I48.0": "Paroxysmal atrial fibrillation",
    "I48.91": "Unspecified atrial fibrillation",
    "I50.9": "Heart failure, unspecified",
    "I63.9": "Cerebral infarction, unspecified",

    // --- Respiratory ---
    "J01.90": "Acute sinusitis, unspecified",
    "J02.9": "Acute pharyngitis, unspecified",
    "J06.9": "Acute upper respiratory infection, unspecified",
    "J11.1": "Influenza due to unidentified influenza virus with other respiratory manifestations",
    "J18.9": "Pneumonia, unspecified organism",
    "J20.9": "Acute bronchitis, unspecified",
    "J44.9": "Chronic obstructive pulmonary disease, unspecified",
    "J45.909": "Unspecified asthma, uncomplicated",

    // --- Digestive ---
    "K21.9": "Gastro-esophageal reflux disease without esophagitis",
    "K58.9": "Irritable bowel syndrome without diarrhea",
    "K59.00": "Constipation, unspecified",
    "K80.20": "Calculus of gallbladder without cholecystitis without obstruction",

    // --- Skin ---
    "L03.90": "Cellulitis, unspecified",
    "L20.9": "Atopic dermatitis, unspecified",
    "L70.0": "Acne vulgaris",

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

    // --- Genitourinary ---
    "N17.9": "Acute kidney failure, unspecified",
    "N18.30": "Chronic kidney disease, stage 3 unspecified",
    "N18.9": "Chronic kidney disease, unspecified",
    "N39.0": "Urinary tract infection, site not specified",
    "N40.0": "Benign prostatic hyperplasia without lower urinary tract symptoms",

    // --- Pregnancy ---
    "O80": "Encounter for full-term uncomplicated delivery",
    "O99.019": "Anemia complicating pregnancy, unspecified trimester",

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
    "Z86.718": "Personal history of other venous thrombosis and embolism"
};