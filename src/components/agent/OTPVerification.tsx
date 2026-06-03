"use client";

import { useRef, KeyboardEvent, ClipboardEvent } from "react";

interface OTPVerificationProps {
  value: string;
  onChange: (value: string) => void;
  /** Number of digits. Default 4. */
  length?: number;
  label?: string;
}

export function OTPVerification({
  value,
  onChange,
  length = 4,
  label = "Customer Delivery OTP",
}: OTPVerificationProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("");

  function focusAt(index: number) {
    const el = inputsRef.current[index];
    if (el) {
      el.focus();
      el.select();
    }
  }

  function handleInput(index: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const arr = value.split("");
    arr[index] = digit;
    const next = arr.join("").slice(0, length);
    onChange(next);
    if (digit && index < length - 1) focusAt(index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      focusAt(index - 1);
    } else if (e.key === "ArrowLeft" && index > 0) {
      focusAt(index - 1);
    } else if (e.key === "ArrowRight" && index < length - 1) {
      focusAt(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <label className="block text-sm font-semibold">{label}</label>
      <p className="mt-0.5 text-xs text-slate-500">
        Ask the customer for the {length}-digit delivery code.
      </p>
      <div className="mt-3 flex gap-2">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i] || ""}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            aria-label={`Digit ${i + 1}`}
            className="h-12 w-12 rounded-lg border border-slate-300 text-center text-lg font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-blue-900"
          />
        ))}
      </div>
    </div>
  );
}
