"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { uploadToCloudinaryDirect } from "@/server/config/cloudinary";
import { toast } from "sonner";

export interface UploadedImage {
  url: string;  // cloudinary secure_url
  name: string;
}

interface ImageUploaderProps {
  onChange?: (images: UploadedImage[]) => void;
}

export default function ImageUploader({ onChange }: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [previews, setPreviews] = useState<{ file: File; previewUrl: string }[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    const invalid = files.filter(f => !f.type.startsWith("image/"));
    if (invalid.length > 0) {
      toast.error(`${invalid.map(f => f.name).join(", ")} are not image files`);
    }
    const valid = files.filter(f => f.type.startsWith("image/"));
    const newPreviews = valid.map(f => ({ file: f, previewUrl: URL.createObjectURL(f) }));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemovePreview = (idx: number) => {
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx].previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUploadAll = async () => {
    if (previews.length === 0) {
      toast.error("Please select images first.");
      return;
    }
    const uploaded: UploadedImage[] = [...images];
    for (let i = 0; i < previews.length; i++) {
      setUploadingIdx(i);
      try {
        const res = await uploadToCloudinaryDirect(previews[i].file);
        uploaded.push({ url: res.secure_url, name: previews[i].file.name });
      } catch {
        toast.error(`Failed to upload ${previews[i].file.name}`);
      }
    }
    setUploadingIdx(null);
    setImages(uploaded);
    onChange?.(uploaded);
    setPreviews([]);
    toast.success("Images uploaded successfully");
  };

  const handleRemoveUploaded = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-4">
      {/* Uploaded images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <Card key={idx} className="overflow-hidden relative group">
              <CardContent className="p-2">
                <img src={img.url} alt={`Uploaded ${idx + 1}`} className="rounded-lg object-cover w-full h-32" />
                <Button type="button" variant="destructive" size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                  onClick={() => handleRemoveUploaded(idx)}>
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Previews (not yet uploaded) */}
      {previews.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Preview — click Upload Image to save</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {previews.map((p, idx) => (
              <Card key={idx} className="overflow-hidden relative group border-dashed border-2 border-primary/40">
                <CardContent className="p-2">
                  <img src={p.previewUrl} alt={p.file.name} className="rounded-lg object-cover w-full h-32 opacity-80" />
                  {uploadingIdx === idx && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <Spinner className="text-white" />
                    </div>
                  )}
                  <Button type="button" variant="destructive" size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                    onClick={() => handleRemovePreview(idx)}
                    disabled={uploadingIdx !== null}>
                    ×
                  </Button>
                  <p className="text-xs text-muted-foreground truncate mt-1">{p.file.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-4 space-y-3">
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
          <div className="flex gap-2">
            <Button variant="outline" type="button" className="flex-1" onClick={() => inputRef.current?.click()}>
              Select Images
            </Button>
            <Button variant="secondary" type="button" onClick={handleUploadAll}
              disabled={uploadingIdx !== null || previews.length === 0} className="flex-1">
              {uploadingIdx !== null ? <><Spinner className="mr-2" /> Uploading...</> : "Upload Image"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
