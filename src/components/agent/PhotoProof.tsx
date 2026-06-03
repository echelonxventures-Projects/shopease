"use client";

import { useRef, useState } from "react";

interface PhotoProofProps {
  /** Fired with a data URL when the user confirms the captured photo. */
  onCapture: (dataUrl: string) => void;
  /** Max file size in bytes. Default 5MB. */
  maxSize?: number;
}

export function PhotoProof({ onCapture, maxSize = 5 * 1024 * 1024 }: PhotoProofProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      setError(`File too large. Max ${(maxSize / 1024 / 1024).toFixed(0)} MB.`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
    };
    reader.onerror = () => setError("Could not read the file.");
    reader.readAsDataURL(file);
  }

  function handleConfirm() {
    if (preview) {
      onCapture(preview);
    }
  }

  function handleRetake() {
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold">Proof of Delivery</h3>
      <p className="mt-0.5 text-xs text-slate-500">
        Take a photo of the package at the customer&apos;s doorstep.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {preview ? (
        <div className="mt-3">
          <img
            src={preview}
            alt="Proof preview"
            className="w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
            style={{ maxHeight: 320 }}
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleRetake}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Retake
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Use This Photo
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 7a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          Capture Photo
        </button>
      )}
    </div>
  );
}
