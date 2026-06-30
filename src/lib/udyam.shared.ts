export const UDYAM_STATUSES = [
  "draft",
  "submitted",
  "payment_received",
  "documents_verified",
  "processing",
  "approved",
  "rejected",
  "completed",
] as const;

export type UdyamStatus = (typeof UDYAM_STATUSES)[number];

export const UDYAM_STATUS_LABEL: Record<UdyamStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  payment_received: "Payment Received",
  documents_verified: "Documents Verified",
  processing: "Processing",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export const UDYAM_STATUS_TONE: Record<UdyamStatus, string> = {
  draft: "bg-slate-500/15 text-slate-700",
  submitted: "bg-amber-500/15 text-amber-700",
  payment_received: "bg-sky-500/15 text-sky-700",
  documents_verified: "bg-indigo-500/15 text-indigo-700",
  processing: "bg-blue-500/15 text-blue-700",
  approved: "bg-emerald-500/15 text-emerald-700",
  rejected: "bg-rose-500/15 text-rose-700",
  completed: "bg-emerald-600/20 text-emerald-800",
};

export const UDYAM_DOC_TYPES = [
  { id: "aadhaar", label: "Aadhaar Card", required: true },
  { id: "pan", label: "PAN Card", required: true },
  { id: "bank_passbook", label: "Bank Passbook / Cancelled Cheque", required: true },
  { id: "business_proof", label: "Business Proof", required: true },
  { id: "photo", label: "Passport-size Photograph", required: true },
  { id: "supporting", label: "Any Supporting Document", required: false },
] as const;

export type UdyamDocType = (typeof UDYAM_DOC_TYPES)[number]["id"];

export const BUSINESS_TYPES = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited",
  "Public Limited",
  "HUF",
  "Co-operative",
  "Society",
  "Trust",
  "Other",
] as const;

export const GENDERS = ["Male", "Female", "Other"] as const;
export const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"] as const;
