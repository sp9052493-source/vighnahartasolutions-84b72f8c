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

export type SarkarService = {
  type: string;
  en: string;
  mr: string;
  descEn: string;
  descMr: string;
  tone: string;
};

export const SARKAR_SERVICES: SarkarService[] = [
  {
    type: "income",
    en: "Income Certificate",
    mr: "उत्पन्न प्रमाणपत्र",
    descEn: "Certificate of annual income from the Revenue Department.",
    descMr: "महसूल विभागाकडून वार्षिक उत्पन्नाचे प्रमाणपत्र.",
    tone: "from-[oklch(0.55_0.15_255)] to-[oklch(0.4_0.12_265)]",
  },
  {
    type: "domicile",
    en: "Domicile Certificate",
    mr: "अधिवास प्रमाणपत्र",
    descEn: "Proof of permanent residence in Maharashtra.",
    descMr: "महाराष्ट्रातील कायमस्वरूपी रहिवासाचा पुरावा.",
    tone: "from-[oklch(0.6_0.15_155)] to-[oklch(0.5_0.13_160)]",
  },
  {
    type: "caste",
    en: "Caste Certificate",
    mr: "जात प्रमाणपत्र",
    descEn: "SC / ST / OBC / VJNT caste certificate.",
    descMr: "अनुसूचित जाती / जमाती / ओबीसी / वि.जा.भ.ज. जात प्रमाणपत्र.",
    tone: "from-[oklch(0.7_0.16_55)] to-[oklch(0.62_0.16_45)]",
  },
  {
    type: "age_nationality_domicile",
    en: "Age, Nationality & Domicile",
    mr: "वय, राष्ट्रीयत्व व अधिवास",
    descEn: "Combined age, nationality and domicile certificate.",
    descMr: "वय, राष्ट्रीयत्व व अधिवास यांचे एकत्रित प्रमाणपत्र.",
    tone: "from-[oklch(0.58_0.18_25)] to-[oklch(0.5_0.16_20)]",
  },
  {
    type: "non_creamy_layer",
    en: "Non-Creamy Layer",
    mr: "नॉन-क्रिमिलेअर प्रमाणपत्र",
    descEn: "Non-creamy layer certificate for OBC / VJNT applicants.",
    descMr: "ओबीसी / वि.जा.भ.ज. अर्जदारांसाठी नॉन-क्रिमिलेअर प्रमाणपत्र.",
    tone: "from-[oklch(0.5_0.13_300)] to-[oklch(0.42_0.12_295)]",
  },
  {
    type: "senior_citizen",
    en: "Senior Citizen Certificate",
    mr: "ज्येष्ठ नागरिक प्रमाणपत्र",
    descEn: "Certificate confirming senior citizen status.",
    descMr: "ज्येष्ठ नागरिक असल्याचे प्रमाणपत्र.",
    tone: "from-[oklch(0.6_0.16_20)] to-[oklch(0.5_0.14_15)]",
  },
  {
    type: "solvency",
    en: "Solvency Certificate",
    mr: "आर्थिक सक्षमता प्रमाणपत्र",
    descEn: "Financial solvency certificate from the Revenue Department.",
    descMr: "महसूल विभागाकडून आर्थिक सक्षमता प्रमाणपत्र.",
    tone: "from-[oklch(0.55_0.14_220)] to-[oklch(0.45_0.12_230)]",
  },
  {
    type: "ews",
    en: "EWS Certificate",
    mr: "आर्थिकदृष्ट्या दुर्बल घटक प्रमाणपत्र",
    descEn: "Economically Weaker Section (EWS) certificate.",
    descMr: "आर्थिकदृष्ट्या दुर्बल घटक (EWS) प्रमाणपत्र.",
    tone: "from-[oklch(0.6_0.13_185)] to-[oklch(0.5_0.12_190)]",
  },
];

export const TX = {
  title: { en: "Aaple Sarkar", mr: "आपले सरकार" },
  subtitle: {
    en: "Government of Maharashtra Right-to-Service. Apply for certificates online — fill the details, upload documents, and track the status. No need to visit any other website.",
    mr: "महाराष्ट्र शासन सेवा हमी. ऑनलाइन प्रमाणपत्रांसाठी अर्ज करा — माहिती भरा, कागदपत्रे अपलोड करा आणि स्थिती पाहा. इतर कोणत्याही संकेतस्थळावर जाण्याची गरज नाही.",
  },
  apply: { en: "New Application", mr: "नवीन अर्ज" },
  myApps: { en: "My Applications", mr: "माझे अर्ज" },
  selectService: { en: "Select a service", mr: "सेवा निवडा" },
  applicantDetails: { en: "Applicant Details", mr: "अर्जदाराची माहिती" },
  uploadDocs: { en: "Upload Documents", mr: "कागदपत्रे अपलोड करा" },
  uploadHint: {
    en: "Attach supporting documents (Aadhaar, ration card, photo, etc.). PDF or images, up to 8 files.",
    mr: "आवश्यक कागदपत्रे जोडा (आधार, रेशन कार्ड, फोटो इ.). PDF किंवा फोटो, जास्तीत जास्त ८ फायली.",
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
  submit: { en: "Submit Application", mr: "अर्ज सादर करा" },
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
} as const;

export function t(key: keyof typeof TX, lang: Lang) {
  return TX[key][lang];
}