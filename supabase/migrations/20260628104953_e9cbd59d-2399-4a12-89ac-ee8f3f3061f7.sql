INSERT INTO public.aaple_sarkar_services (
  type, name_en, name_mr, desc_en, desc_mr, tone, price,
  extra_fields, required_docs, active, sort_order
) VALUES (
  'gazette',
  'Gazette Certificate',
  'राजपत्र प्रमाणपत्र',
  'Official Government Gazette notification for change of Name, Date of Birth, Religion, Father''s Name, Address or any personal record correction.',
  'नाव, जन्मतारीख, धर्म, वडिलांचे नाव, पत्ता किंवा वैयक्तिक नोंदीतील दुरुस्तीसाठी शासकीय राजपत्र अधिसूचना.',
  'from-[oklch(0.68_0.18_55)] to-[oklch(0.55_0.17_40)]',
  799,
  '[
    {"key":"changeType","en":"Type of Change (Name / DOB / Religion / Father''s Name / Address / Other)","mr":"बदलाचा प्रकार (नाव / जन्मतारीख / धर्म / वडिलांचे नाव / पत्ता / इतर)","type":"text","required":true},
    {"key":"oldValue","en":"Current / Old Value (as per existing records)","mr":"सध्याचे / जुने तपशील (विद्यमान नोंदीनुसार)","type":"text","required":true},
    {"key":"newValue","en":"New / Corrected Value (to be published)","mr":"नवीन / सुधारित तपशील (प्रकाशनासाठी)","type":"text","required":true},
    {"key":"reasonForChange","en":"Reason for Change","mr":"बदलाचे कारण","type":"textarea","required":true},
    {"key":"salutation","en":"Salutation (Shri / Smt / Kumari)","mr":"संबोधन (श्री / सौ / कु.)","type":"text","required":true},
    {"key":"gender","en":"Gender","mr":"लिंग","type":"text","required":true},
    {"key":"dob","en":"Date of Birth (DD-MM-YYYY)","mr":"जन्मतारीख (DD-MM-YYYY)","type":"text","required":true},
    {"key":"age","en":"Age (Years)","mr":"वय (वर्षे)","type":"number","required":true},
    {"key":"aadhaarNo","en":"Aadhaar / UID Number","mr":"आधार क्रमांक","type":"text","required":true},
    {"key":"isMinor","en":"Is Applicant a Minor? (Yes / No)","mr":"अर्जदार अल्पवयीन आहे का? (होय / नाही)","type":"text"},
    {"key":"village","en":"Village","mr":"गाव","type":"text"},
    {"key":"state","en":"State","mr":"राज्य","type":"text"},
    {"key":"caste","en":"Caste / Category","mr":"जात / प्रवर्ग","type":"text"},
    {"key":"newspaperPref","en":"Preferred Newspaper (optional)","mr":"पसंतीचे वृत्तपत्र (पर्यायी)","type":"text"}
  ]'::jsonb,
  '[
    {"id":"aadhaar","en":"Aadhaar Card","mr":"आधार कार्ड","required":true},
    {"id":"photo","en":"Passport Size Photo (under 2 MB)","mr":"पासपोर्ट आकाराचा फोटो (२ MB पेक्षा कमी)","required":true},
    {"id":"declaration","en":"Signed Declaration / Affidavit (PDF)","mr":"स्वाक्षरीत प्रतिज्ञापत्र (PDF)","required":true},
    {"id":"old_proof","en":"Proof of Old Name / Old Details","mr":"जुन्या नावाचा / तपशीलाचा पुरावा","required":true},
    {"id":"new_proof","en":"Proof of New Name / New Details","mr":"नवीन नावाचा / तपशीलाचा पुरावा","required":true},
    {"id":"address_proof","en":"Address Proof","mr":"पत्त्याचा पुरावा","required":true},
    {"id":"legal_doc","en":"Legal Document (Court / School / Marriage Cert., if any)","mr":"कायदेशीर कागदपत्र (न्यायालय / शाळा / विवाह दाखला, असल्यास)"},
    {"id":"other","en":"Other Supporting Documents","mr":"इतर सहाय्यक कागदपत्रे"}
  ]'::jsonb,
  true,
  10
)
ON CONFLICT (type) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_mr = EXCLUDED.name_mr,
  desc_en = EXCLUDED.desc_en,
  desc_mr = EXCLUDED.desc_mr,
  tone = EXCLUDED.tone,
  extra_fields = EXCLUDED.extra_fields,
  required_docs = EXCLUDED.required_docs,
  sort_order = EXCLUDED.sort_order,
  active = true,
  updated_at = now();