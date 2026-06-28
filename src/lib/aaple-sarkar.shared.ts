import logoAsset from "@/assets/aaple-sarkar-logo.png.asset.json";

export const AAPLE_SARKAR_LOGO = logoAsset.url;

export type Lang = "en" | "mr";

export type StatusKey =
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "completed";

export const STATUS_META: Record<
  StatusKey,
  { en: string; mr: string; badge: string; step: number }
> = {
  submitted: {
    en: "Submitted",
    mr: "सादर केले",
    badge: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    step: 1,
  },
  under_review: {
    en: "Under Review",
    mr: "तपासणी सुरू",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    step: 2,
  },
  approved: {
    en: "Approved",
    mr: "मंजूर",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    step: 3,
  },
  completed: {
    en: "Completed",
    mr: "पूर्ण झाले",
    badge: "border-emerald-600/40 bg-emerald-600/15 text-emerald-700 dark:text-emerald-300",
    step: 4,
  },
  rejected: {
    en: "Rejected",
    mr: "नाकारले",
    badge: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    step: 0,
  },
};

export type ExtraField = {
  key: string;
  en: string;
  mr: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
};

export type RequiredDoc = {
  id: string;
  en: string;
  mr: string;
  required?: boolean;
};

export type SarkarService = {
  type: string;
  en: string;
  mr: string;
  descEn: string;
  descMr: string;
  tone: string;
  price: number;
  extraFields: ExtraField[];
  requiredDocs: RequiredDoc[];
};

const COMMON_DOCS: RequiredDoc[] = [
  { id: "aadhaar", en: "Aadhaar Card", mr: "आधार कार्ड", required: true },
  { id: "photo", en: "Passport Size Photo", mr: "पासपोर्ट आकाराचा फोटो", required: true },
  { id: "ration", en: "Ration Card", mr: "रेशन कार्ड" },
];

export const SARKAR_SERVICES: SarkarService[] = [
  {
    type: "income",
    en: "Income Certificate",
    mr: "उत्पन्न प्रमाणपत्र",
    descEn: "Certificate of annual income from the Revenue Department.",
    descMr: "महसूल विभागाकडून वार्षिक उत्पन्नाचे प्रमाणपत्र.",
    tone: "from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)]",
    price: 50,
    extraFields: [
      { key: "annualIncome", en: "Annual Income (₹)", mr: "वार्षिक उत्पन्न (₹)", type: "number", required: true },
      { key: "occupation", en: "Occupation", mr: "व्यवसाय", required: true },
    ],
    requiredDocs: [
      ...COMMON_DOCS,
      { id: "income_proof", en: "Income Proof / Salary Slip", mr: "उत्पन्नाचा पुरावा / पगार स्लिप", required: true },
      { id: "talathi", en: "Talathi Report", mr: "तलाठी अहवाल" },
    ],
  },
  {
    type: "domicile",
    en: "Domicile Certificate",
    mr: "अधिवास प्रमाणपत्र",
    descEn: "Proof of permanent residence in Maharashtra.",
    descMr: "महाराष्ट्रातील कायमस्वरूपी रहिवासाचा पुरावा.",
    tone: "from-[oklch(0.6_0.15_155)] to-[oklch(0.5_0.13_160)]",
    price: 60,
    extraFields: [
      { key: "yearsOfResidence", en: "Years of Residence in Maharashtra", mr: "महाराष्ट्रातील वास्तव्य (वर्षे)", type: "number", required: true },
      { key: "birthPlace", en: "Place of Birth", mr: "जन्मस्थान", required: true },
    ],
    requiredDocs: [
      ...COMMON_DOCS,
      { id: "school_leaving", en: "School Leaving Certificate", mr: "शाळा सोडल्याचा दाखला", required: true },
      { id: "electricity", en: "Electricity / Property Bill", mr: "वीज / मालमत्ता बिल" },
    ],
  },
  {
    type: "caste",
    en: "Caste Certificate",
    mr: "जात प्रमाणपत्र",
    descEn: "SC / ST / OBC / VJNT caste certificate.",
    descMr: "अनुसूचित जाती / जमाती / ओबीसी / वि.जा.भ.ज. जात प्रमाणपत्र.",
    tone: "from-[oklch(0.7_0.16_55)] to-[oklch(0.62_0.16_45)]",
    price: 80,
    extraFields: [
      { key: "caste", en: "Caste", mr: "जात", required: true },
      { key: "subCaste", en: "Sub-Caste", mr: "पोट जात" },
      { key: "religion", en: "Religion", mr: "धर्म", required: true },
    ],
    requiredDocs: [
      ...COMMON_DOCS,
      { id: "father_caste", en: "Father's Caste Certificate / Proof", mr: "वडिलांचे जात प्रमाणपत्र / पुरावा", required: true },
      { id: "school_leaving", en: "School Leaving Certificate", mr: "शाळा सोडल्याचा दाखला", required: true },
    ],
  },
  {
    type: "age_nationality_domicile",
    en: "Age, Nationality & Domicile",
    mr: "वय, राष्ट्रीयत्व व अधिवास",
    descEn: "Combined age, nationality and domicile certificate.",
    descMr: "वय, राष्ट्रीयत्व व अधिवास यांचे एकत्रित प्रमाणपत्र.",
    tone: "from-[oklch(0.58_0.18_25)] to-[oklch(0.5_0.16_20)]",
    price: 70,
    extraFields: [
      { key: "dob", en: "Date of Birth", mr: "जन्म दिनांक", required: true },
      { key: "birthPlace", en: "Place of Birth", mr: "जन्मस्थान", required: true },
    ],
    requiredDocs: [
      ...COMMON_DOCS,
      { id: "birth_cert", en: "Birth Certificate", mr: "जन्म दाखला", required: true },
      { id: "school_leaving", en: "School Leaving Certificate", mr: "शाळा सोडल्याचा दाखला", required: true },
    ],
  },
  {
    type: "non_creamy_layer",
    en: "Non-Creamy Layer",
    mr: "नॉन-क्रिमिलेअर प्रमाणपत्र",
    descEn: "Non-creamy layer certificate for OBC / VJNT applicants.",
    descMr: "ओबीसी / वि.जा.भ.ज. अर्जदारांसाठी नॉन-क्रिमिलेअर प्रमाणपत्र.",
    tone: "from-[oklch(0.5_0.13_300)] to-[oklch(0.42_0.12_295)]",
    price: 90,
    extraFields: [
      { key: "caste", en: "Caste", mr: "जात", required: true },
      { key: "annualIncome", en: "Family Annual Income (₹)", mr: "कुटुंबाचे वार्षिक उत्पन्न (₹)", type: "number", required: true },
    ],
    requiredDocs: [
      ...COMMON_DOCS,
      { id: "caste_cert", en: "Caste Certificate", mr: "जात प्रमाणपत्र", required: true },
      { id: "income_proof", en: "Income Proof (3 years)", mr: "उत्पन्नाचा पुरावा (३ वर्षे)", required: true },
    ],
  },
  {
    type: "senior_citizen",
    en: "Senior Citizen Certificate",
    mr: "ज्येष्ठ नागरिक प्रमाणपत्र",
    descEn: "Certificate confirming senior citizen status.",
    descMr: "ज्येष्ठ नागरिक असल्याचे प्रमाणपत्र.",
    tone: "from-[oklch(0.6_0.16_20)] to-[oklch(0.5_0.14_15)]",
    price: 40,
    extraFields: [
      { key: "dob", en: "Date of Birth", mr: "जन्म दिनांक", required: true },
    ],
    requiredDocs: [
      ...COMMON_DOCS,
      { id: "age_proof", en: "Age Proof (Aadhaar / PAN / Birth Cert.)", mr: "वयाचा पुरावा (आधार / पॅन / जन्म दाखला)", required: true },
    ],
  },
  {
    type: "solvency",
    en: "Solvency Certificate",
    mr: "आर्थिक सक्षमता प्रमाणपत्र",
    descEn: "Financial solvency certificate from the Revenue Department.",
    descMr: "महसूल विभागाकडून आर्थिक सक्षमता प्रमाणपत्र.",
    tone: "from-[oklch(0.55_0.14_220)] to-[oklch(0.45_0.12_230)]",
    price: 120,
    extraFields: [
      { key: "solvencyAmount", en: "Required Solvency Amount (₹)", mr: "आवश्यक सक्षमता रक्कम (₹)", type: "number", required: true },
      { key: "purposeDetail", en: "Purpose / Tender Reference", mr: "कारण / निविदा संदर्भ", type: "textarea", required: true },
    ],
    requiredDocs: [
      ...COMMON_DOCS,
      { id: "bank_statement", en: "Bank Statement (6 months)", mr: "बँक स्टेटमेंट (६ महिने)", required: true },
      { id: "property_docs", en: "Property / Asset Documents", mr: "मालमत्ता / स्थावर मिळकत कागदपत्रे", required: true },
      { id: "itr", en: "Income Tax Return", mr: "आयकर विवरणपत्र (ITR)" },
    ],
  },
  {
    type: "ews",
    en: "EWS Certificate",
    mr: "आर्थिकदृष्ट्या दुर्बल घटक प्रमाणपत्र",
    descEn: "Economically Weaker Section (EWS) certificate.",
    descMr: "आर्थिकदृष्ट्या दुर्बल घटक (EWS) प्रमाणपत्र.",
    tone: "from-[oklch(0.6_0.13_185)] to-[oklch(0.5_0.12_190)]",
    price: 80,
    extraFields: [
      { key: "annualIncome", en: "Family Annual Income (₹)", mr: "कुटुंबाचे वार्षिक उत्पन्न (₹)", type: "number", required: true },
      { key: "landHolding", en: "Agricultural Land (acres)", mr: "शेतजमीन (एकर)", type: "number" },
    ],
    requiredDocs: [
      ...COMMON_DOCS,
      { id: "income_proof", en: "Income Proof", mr: "उत्पन्नाचा पुरावा", required: true },
      { id: "land_proof", en: "Land / Property Records (7/12)", mr: "जमिनीचे रेकॉर्ड (७/१२)" },
    ],
  },
];

export function getSarkarService(type: string): SarkarService | undefined {
  return SARKAR_SERVICES.find((s) => s.type === type);
}

export const TX = {
  title: { en: "Aaple Sarkar", mr: "आपले सरकार" },
  subtitle: {
    en: "Government of Maharashtra Right-to-Service. Apply for certificates online — fill the details, upload documents, pay from your wallet and track the status live.",
    mr: "महाराष्ट्र शासन सेवा हमी. ऑनलाइन प्रमाणपत्रांसाठी अर्ज करा — माहिती भरा, कागदपत्रे अपलोड करा, वॉलेटमधून शुल्क भरा आणि स्थिती थेट पाहा.",
  },
  apply: { en: "New Application", mr: "नवीन अर्ज" },
  myApps: { en: "My Applications", mr: "माझे अर्ज" },
  selectService: { en: "Select a service", mr: "सेवा निवडा" },
  applicantDetails: { en: "Applicant Details", mr: "अर्जदाराची माहिती" },
  serviceDetails: { en: "Service-Specific Details", mr: "सेवा विशिष्ट माहिती" },
  uploadDocs: { en: "Upload Required Documents", mr: "आवश्यक कागदपत्रे अपलोड करा" },
  uploadHint: {
    en: "Attach the documents listed below. PDF or image, up to 5 MB each.",
    mr: "खालील कागदपत्रे जोडा. PDF किंवा फोटो, प्रत्येकी जास्तीत जास्त ५ MB.",
  },
  name: { en: "Applicant Name (English)", mr: "अर्जदाराचे नाव (इंग्रजी)" },
  nameMr: { en: "Applicant Name (Marathi)", mr: "अर्जदाराचे नाव (मराठी)" },
  father: { en: "Father / Husband Name", mr: "वडील / पतीचे नाव" },
  mobile: { en: "Mobile Number", mr: "मोबाईल क्रमांक" },
  email: { en: "Email (optional)", mr: "ईमेल (पर्यायी)" },
  address: { en: "Full Address", mr: "संपूर्ण पत्ता" },
  district: { en: "District", mr: "जिल्हा" },
  taluka: { en: "Taluka", mr: "तालुका" },
  pincode: { en: "Pincode", mr: "पिनकोड" },
  purpose: { en: "Purpose", mr: "कारण / प्रयोजन" },
  notes: { en: "Additional Notes", mr: "अतिरिक्त माहिती" },
  submit: { en: "Pay & Submit Application", mr: "शुल्क भरून अर्ज सादर करा" },
  receiptTitle: { en: "Application Submitted", mr: "अर्ज सादर झाला" },
  receiptNo: { en: "Receipt Number", mr: "पावती क्रमांक" },
  status: { en: "Status", mr: "स्थिती" },
  service: { en: "Service", mr: "सेवा" },
  date: { en: "Date", mr: "दिनांक" },
  documents: { en: "Documents", mr: "कागदपत्रे" },
  issuedDoc: { en: "Issued Certificate", mr: "जारी केलेले प्रमाणपत्र" },
  remarks: { en: "Office Remarks", mr: "कार्यालयाचा शेरा" },
  download: { en: "Download", mr: "डाउनलोड" },
  viewDetails: { en: "View", mr: "पहा" },
  noApps: { en: "No applications yet.", mr: "अद्याप कोणतेही अर्ज नाहीत." },
  required: { en: "Required", mr: "आवश्यक" },
  optional: { en: "Optional", mr: "पर्यायी" },
  chooseService: {
    en: "Choose a service above to open the application form.",
    mr: "अर्ज फॉर्म उघडण्यासाठी वरील सेवा निवडा.",
  },
  translateBtn: { en: "Translate to Marathi", mr: "मराठीत भाषांतर करा" },
  translating: { en: "Translating…", mr: "भाषांतर सुरू…" },
  translateHint: {
    en: "Enter details in English, then translate them to Marathi automatically.",
    mr: "माहिती इंग्रजीत भरा, नंतर ती आपोआप मराठीत भाषांतरित करा.",
  },
  labelLang: { en: "Labels", mr: "लेबल भाषा" },
  fatherMr: { en: "Father / Husband Name (Marathi)", mr: "वडील / पतीचे नाव (मराठी)" },
  addressMr: { en: "Full Address (Marathi)", mr: "संपूर्ण पत्ता (मराठी)" },
  serviceFee: { en: "Service Fee", mr: "सेवा शुल्क" },
  walletBalance: { en: "Wallet Balance", mr: "वॉलेट शिल्लक" },
  liveUpdates: { en: "Live status — updates automatically", mr: "थेट स्थिती — आपोआप अद्यतनित होते" },
  uploaded: { en: "Uploaded", mr: "अपलोड केले" },
  pending: { en: "Pending", mr: "प्रलंबित" },
  attach: { en: "Attach", mr: "जोडा" },
} as const;

export function t(key: keyof typeof TX, lang: Lang) {
  return TX[key][lang];
}
