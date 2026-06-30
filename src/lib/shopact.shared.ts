export const SHOPACT_STATUSES = [
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

export type ShopactStatus = (typeof SHOPACT_STATUSES)[number];

export const SHOPACT_STATUS_LABEL: Record<ShopactStatus, string> = {
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

export const SHOPACT_STATUS_TONE: Record<ShopactStatus, string> = {
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

export const SHOPACT_DOC_TYPES = [
  { id: "applicant_photo", label: "Applicant Photo", required: true },
  { id: "aadhaar", label: "Aadhaar Card", required: true },
  { id: "pan", label: "PAN Card", required: true },
  { id: "signature", label: "Signature", required: true },
  { id: "shop_photo", label: "Shop Photo", required: true },
  { id: "rent_agreement", label: "Rent Agreement", required: true },
  { id: "electric_bill", label: "Electricity Bill", required: true },
  { id: "additional", label: "Additional Documents", required: false },
] as const;

export const SHOPACT_BUSINESS_TYPES = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited",
  "Public Limited",
  "HUF",
  "Society",
  "Trust",
  "Other",
] as const;

export const GENDERS = ["Male", "Female", "Other"] as const;
