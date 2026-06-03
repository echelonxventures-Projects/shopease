"use client";

import { useState, useRef } from "react";
import { Upload, X, GripVertical } from "lucide-react";

import { toast } from "sonner";

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  };

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (validFiles.length === 0) { toast.error("Only image files allowed"); return; }
    setUploading(true);
    try {
      const urls = await Promise.all(validFiles.map(uploadFile));
      onChange([...images, ...urls]);
      toast.success(`${urls.length} image${urls.length > 1 ? "s" : ""} uploaded`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
    finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    const newImages = [...images];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newImages.length) return;
    [newImages[index], newImages[target]] = [newImages[target], newImages[index]];
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
          dragging ? "border-blue-500 bg-blue-50" : uploading ? "border-gray-300" : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">
          {uploading ? "Uploading..." : "Drag & drop images or click to browse"}
        </p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP supported</p>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative group border rounded-lg overflow-hidden bg-gray-50">
              <img src={url} alt={`Product image ${index + 1}`} className="w-full h-24 object-cover" />
              <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => moveImage(index, "up")}
                  className="w-6 h-6 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-100"
                  title="Move up"
                >
                  <GripVertical className="w-3 h-3 text-gray-600" />
                </button>
                <button
                  onClick={() => removeImage(index)}
                  className="w-6 h-6 bg-white rounded-full shadow flex items-center justify-center hover:bg-red-50"
                  title="Remove"
                >
                  <X className="w-3 h-3 text-red-500" />
                </button>
              </div>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
