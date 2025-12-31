-- Add category column to menu_items
ALTER TABLE public.menu_items
ADD COLUMN category text DEFAULT 'Juices';

-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true);

-- Allow public read access to menu images
CREATE POLICY "Public can view menu images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-images');

-- Allow public upload to menu images
CREATE POLICY "Public can upload menu images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'menu-images');

-- Allow public update menu images
CREATE POLICY "Public can update menu images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'menu-images');

-- Allow public delete menu images
CREATE POLICY "Public can delete menu images"
ON storage.objects FOR DELETE
USING (bucket_id = 'menu-images');