export const FSSAI_STATUSES = [
  "draft",
  "submitted",
  "payment_received",
  "documents_verified",
  "processing",
  "need_more_documents",
  "approved",
  "rejected",
  "completed",
] as const;

export type FssaiStatus = (typeof FSSAI_STATUSES)[number];

export const FSSAI_STATUS_LABEL: Record<FssaiStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  payment_received: "Payment Received",
  documents_verified: "Documents Verified",
  processing: "Processing",
  need_more_documents: "Need More Documents",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export const FSSAI_STATUS_TONE: Record<FssaiStatus, string> = {
  draft: "bg-slate-500/15 text-slate-700",
  submitted: "bg-amber-500/15 text-amber-700",
  payment_received: "bg-sky-500/15 text-sky-700",
  documents_verified: "bg-indigo-500/15 text-indigo-700",
  processing: "bg-blue-500/15 text-blue-700",
  need_more_documents: "bg-orange-500/15 text-orange-700",
  approved: "bg-emerald-500/15 text-emerald-700",
  rejected: "bg-rose-500/15 text-rose-700",
  completed: "bg-emerald-600/20 text-emerald-800",
};

export const FSSAI_DOC_TYPES = [
  { id: "applicant_photo", label: "Applicant Photo", required: true },
  { id: "aadhaar", label: "Aadhaar Card", required: true },
  { id: "pan", label: "PAN Card", required: true },
  { id: "electric_bill", label: "Electricity Bill", required: true },
  { id: "rent_agreement", label: "Rent Agreement", required: true },
  { id: "noc", label: "NOC from Owner", required: false },
  { id: "shop_photo", label: "Shop / Premises Photo", required: true },
  { id: "legal", label: "Legal Documents", required: false },
  { id: "other", label: "Other Documents", required: false },
] as const;

export const FSSAI_LICENSE_TYPES = [
  { id: "Basic", label: "Basic (Turnover up to ₹12L)" },
  { id: "State", label: "State (₹12L – ₹20Cr)" },
  { id: "Central", label: "Central (Above ₹20Cr)" },
] as const;

export const FSSAI_FOOD_CATEGORIES = [
  "Restaurant / Hotel",
  "Food Manufacturer",
  "Food Trader / Wholesaler",
  "Retail Shop / Kirana",
  "Cloud Kitchen",
  "Bakery / Confectionery",
  "Dairy / Milk Products",
  "Packaged Food / Beverages",
  "Catering Services",
  "Other",
] as const;

export const FSSAI_BUSINESS_TYPES = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited",
  "HUF",
  "Society",
  "Trust",
  "Other",
] as const;

export const GENDERS = ["Male", "Female", "Other"] as const;
