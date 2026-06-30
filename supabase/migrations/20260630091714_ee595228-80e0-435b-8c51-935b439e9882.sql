INSERT INTO public.services (code, name, description, category, price, retailer_commission, distributor_commission, input_label, active, sort_order, api_provider, api_endpoint, api_enabled, api_notes)
VALUES (
  'PAN',
  'PAN Details',
  'Verify any PAN number and fetch the full PAN details (name, category, status) via the APIZONE PAN verification API.',
  'document',
  20.00,
  0,
  2.00,
  'PAN Number',
  true,
  35,
  'apizone',
  'https://www.apizone.info/api/verify_pan/pan_details.php',
  true,
  'APIZONE PAN Details — uses the shared APIZONE_API_KEY backend secret. Configure endpoint here if APIZONE changes the URL.'
)
ON CONFLICT (code) DO NOTHING;