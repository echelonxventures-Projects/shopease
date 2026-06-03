"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { Mic, Camera, X, Loader2 } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const router = useRouter();
  const { locale } = useLocaleStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams();
      params.set("q", query);
      if (locale && locale !== "en") params.set("locale", locale);
      router.push(`/search?${params.toString()}`);
    }
  };

  const startListening = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Web Speech API types vary across browsers
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = locale || "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event: { results: { 0: { 0: { transcript: string } } } }) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setListening(false);
      // Auto-submit
      const params = new URLSearchParams();
      params.set("q", transcript);
      router.push(`/search?${params.toString()}`);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/search/image", { method: "POST", body: formData });
      const data = await res.json();
      if (data.query) {
        const params = new URLSearchParams();
        params.set("q", data.query);
        router.push(`/search?${params.toString()}`);
      }
    } catch {
      // Fallback: search with generic term
      const params = new URLSearchParams();
      params.set("q", "upload");
      router.push(`/search?${params.toString()}`);
    } finally {
      setUploading(false);
      setShowImageSearch(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products..."
          aria-label="Search products"
          role="searchbox"
          className="w-full px-4 py-2 border border-input rounded-lg pl-10 pr-20 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
        />
        <svg className="absolute left-3 top-2.5 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {/* Voice search button */}
        <button
          type="button"
          onClick={startListening}
          disabled={listening}
          className={`absolute right-10 top-1.5 p-1.5 rounded-md transition-colors ${
            listening ? "text-red-500 animate-pulse" : "text-muted-foreground hover:text-primary"
          }`}
          aria-label="Voice search"
          title="Voice search"
        >
          {listening ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
        </button>
        {/* Image search button */}
        <button
          type="button"
          onClick={() => setShowImageSearch(!showImageSearch)}
          className="absolute right-2.5 top-1.5 p-1.5 rounded-md text-muted-foreground hover:text-primary transition-colors"
          aria-label="Image search"
          title="Search by image"
        >
          <Camera className="w-5 h-5" />
        </button>
      </form>

      {/* Image search modal */}
      {showImageSearch && (
        <div className="absolute z-50 top-full mt-2 right-0 w-80 bg-popover border border-border rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Search by Image</h3>
            <button onClick={() => setShowImageSearch(false)} aria-label="Close image search">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent transition-colors"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <>
                <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Tap to upload or take photo</p>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
