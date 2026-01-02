import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PropertyImageUploadProps {
  propertyId: string;
  currentImageUrl?: string | null;
  onUploadComplete: (url: string) => void;
  className?: string;
}

const PropertyImageUpload: React.FC<PropertyImageUploadProps> = ({
  propertyId,
  currentImageUrl,
  onUploadComplete,
  className
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);

      // Update property with image URL
      const { error: updateError } = await supabase
        .from('properties')
        .update({ image_url: publicUrl })
        .eq('id', propertyId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onUploadComplete(publicUrl);

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({ image_url: null })
        .eq('id', propertyId);

      if (error) throw error;

      setPreviewUrl(null);
      onUploadComplete('');
      
      toast({
        title: "Success",
        description: "Image removed"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Property"
            className="w-full h-32 sm:h-40 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-1" />
              Replace
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleRemoveImage}
              disabled={uploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 sm:h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-secondary/30 transition-all"
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Upload Photo</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default PropertyImageUpload;
