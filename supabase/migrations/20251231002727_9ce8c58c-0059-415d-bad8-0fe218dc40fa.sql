-- Add color and image_url columns to menu_items
ALTER TABLE public.menu_items
ADD COLUMN color text DEFAULT '#22c55e',
ADD COLUMN image_url text;