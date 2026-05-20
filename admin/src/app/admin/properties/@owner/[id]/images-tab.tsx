"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Square, Trash, Loader2, MapPin, Building2 } from "lucide-react";
import { api } from "@/hooks/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { uploadToCloudinaryDirect } from "@/server/config/cloudinary";

type ImageItem = { url: string; name: string; category?: string };

const ImageSection = ({
  title,
  description,
  icon,
  images,
  category,
  propertyId,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  images: ImageItem[];
  category: "property" | "nearby";
  propertyId?: string;
}) => {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<{ file: File; previewUrl: string }[]>([]);
  const inputRef = useState<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const handleDelete = async (imageUrl: string) => {
    if (!propertyId) return;
    setDeleting(imageUrl);
    try {
      await api.delete(`/properties/${propertyId}/images`, { data: { url: imageUrl } });
      toast.success("Image deleted");
      queryClient.invalidateQueries({ queryKey: ["guest_houses", propertyId] });
    } catch {
      toast.error("Failed to delete image");
    } finally {
      setDeleting(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const invalid = files.filter(f => !f.type.startsWith("image/"));
    if (invalid.length > 0) toast.error(`${invalid.map(f => f.name).join(", ")} are not image files`);
    const valid = files.filter(f => f.type.startsWith("image/"));
    setPreviews(prev => [...prev, ...valid.map(f => ({ file: f, previewUrl: URL.createObjectURL(f) }))]);
  };

  const handleRemovePreview = (idx: number) => {
    setPreviews(prev => { URL.revokeObjectURL(prev[idx].previewUrl); return prev.filter((_, i) => i !== idx); });
  };

  const handleUploadAll = async () => {
    if (!propertyId || previews.length === 0) return;
    setUploading(true);
    for (const p of previews) {
      try {
        const res = await uploadToCloudinaryDirect(p.file);
        await api.post(`/properties/${propertyId}/images`, { url: res.secure_url, name: p.file.name, category });
      } catch { toast.error(`Failed to upload ${p.file.name}`); }
    }
    setUploading(false);
    setPreviews([]);
    toast.success("Images uploaded");
    queryClient.invalidateQueries({ queryKey: ["guest_houses", propertyId] });
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} disabled={uploading} />
              <Button size="sm" asChild variant="outline" disabled={uploading}>
                <span>Select Images</span>
              </Button>
            </label>
            {previews.length > 0 && (
              <Button size="sm" onClick={handleUploadAll} disabled={uploading}>
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</> : "Upload Image"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Previews */}
      {previews.length > 0 && (
        <CardContent className="pt-0 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Preview — click Upload Image to save</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {previews.map((p, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border-2 border-dashed border-primary/40">
                <img src={p.previewUrl} alt={p.file.name} className="w-full aspect-video object-cover opacity-80" />
                <button onClick={() => handleRemovePreview(i)} disabled={uploading}
                  className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash className="w-4 h-4" />
                </button>
                <p className="text-xs text-muted-foreground truncate px-1 pb-1">{p.file.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {images.length === 0 && previews.length === 0 ? (
        <div className="w-full flex justify-center items-center py-10">
          <div className="text-center">
            <Square className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No {title.toLowerCase()} added yet</p>
          </div>
        </div>
      ) : images.length > 0 ? (
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-0">
          {images.map((image, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden">
              <img src={image.url} alt={image.name} className="w-full aspect-video object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              <button onClick={() => handleDelete(image.url)} disabled={deleting === image.url}
                className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90 disabled:opacity-50">
                {deleting === image.url ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
};

const ImagesTab = ({
  images,
  propertyId,
}: {
  images: ImageItem[];
  propertyId?: string;
}) => {
  const propertyImages = images.filter((img) => !img.category || img.category === "property");
  const nearbyImages = images.filter((img) => img.category === "nearby");

  return (
    <TabsContent value="images">
      <ImageSection
        title="Property Images"
        description="Main images shown in the property gallery"
        icon={<Building2 className="w-5 h-5 text-muted-foreground" />}
        images={propertyImages}
        category="property"
        propertyId={propertyId}
      />
      <ImageSection
        title="Nearby Attractions"
        description="Images of nearby places and attractions"
        icon={<MapPin className="w-5 h-5 text-muted-foreground" />}
        images={nearbyImages}
        category="nearby"
        propertyId={propertyId}
      />
    </TabsContent>
  );
};

export default ImagesTab;
