INSERT INTO public.services
  (code, name, description, input_label, category, price, distributor_commission, retailer_commission, active, sort_order, api_enabled, api_provider, api_endpoint, api_notes)
VALUES
  ('A2P', 'Aadhaar to PAN', 'Find the PAN number linked to an Aadhaar number using the official APIZONE finder.', 'Aadhaar Number (12 digits)', 'finder', 12.00, 2.00, 0.00, true, 7, true, 'apizone', 'https://www.apizone.info/api/find_pan/aadhaar_to_pan.php', 'APIZONE Aadhaar→PAN finder. Requires APIZONE_API_KEY secret. Param: aadhaar_no (12 digits).')
ON CONFLICT (code) DO NOTHING;