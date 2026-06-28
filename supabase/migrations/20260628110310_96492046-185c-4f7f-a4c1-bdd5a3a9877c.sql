-- Add a flexible config JSONB column to aaple_sarkar_services for service-specific rules
-- (e.g. Gazette change-type list, conditional field/document rules).
ALTER TABLE public.aaple_sarkar_services
  ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Seed Gazette config with default change types + tag extra_fields / required_docs with
-- an "appearsFor" array so the editor and the public page share the same shape.
UPDATE public.aaple_sarkar_services
SET config = jsonb_build_object(
  'change_types', jsonb_build_array(
    jsonb_build_object('value','name','en','Change of Name','mr','नावात बदल','needsOld',true,'needsNew',true,'active',true),
    jsonb_build_object('value','dob','en','Change of Date of Birth','mr','जन्मतारखेत बदल','needsOld',true,'needsNew',true,'active',true),
    jsonb_build_object('value','religion','en','Change of Religion','mr','धर्मात बदल','needsOld',true,'needsNew',true,'active',true),
    jsonb_build_object('value','father','en','Change of Father''s / Husband''s Name','mr','वडील / पतीच्या नावात बदल','needsOld',true,'needsNew',true,'active',true),
    jsonb_build_object('value','address','en','Change of Address','mr','पत्त्यात बदल','needsOld',true,'needsNew',true,'active',true),
    jsonb_build_object('value','minor','en','Minor Correction (Spelling / Surname)','mr','लहान दुरुस्ती','needsOld',true,'needsNew',true,'active',true),
    jsonb_build_object('value','other','en','Other Personal Record Correction','mr','इतर वैयक्तिक नोंद दुरुस्ती','needsOld',true,'needsNew',true,'active',true)
  )
)
WHERE type = 'gazette';
