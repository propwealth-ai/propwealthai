-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true);

-- Allow authenticated users to upload images to property-images bucket
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');

-- Allow anyone to view property images (public bucket)
CREATE POLICY "Anyone can view property images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Allow authenticated users to update their uploaded images
CREATE POLICY "Authenticated users can update property images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'property-images');

-- Allow authenticated users to delete property images
CREATE POLICY "Authenticated users can delete property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'property-images');

-- Add image_url column to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS image_url TEXT;