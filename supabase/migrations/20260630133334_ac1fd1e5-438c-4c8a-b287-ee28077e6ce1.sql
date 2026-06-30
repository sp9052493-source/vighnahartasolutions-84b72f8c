ALTER TABLE public.site_settings ALTER COLUMN city SET DEFAULT 'Chhatrapati Sambhajinagar';
UPDATE public.site_settings SET city = 'Chhatrapati Sambhajinagar' WHERE city = 'Aurangabad';
