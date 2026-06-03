"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyMFALogin, useBackupCode as redeemBackupCode } from "@/server/actions/mfa-actions";

function VerifyMFAInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") || "";

  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [backupMode, setBackupMode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle code digit input with auto-advance
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newCode.every((d) => d !== "")) {
      handleVerify(newCode.join(""));
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split("");
      setCode(digits);
      digits.forEach((d, i) => {
        if (inputRefs.current[i]) inputRefs.current[i]!.value = d;
      });
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  // Verify TOTP code
  const handleVerify = async (fullCode?: string) => {
    const codeStr = fullCode || code.join("");
    if (codeStr.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }
    if (!userId) {
      toast.error("Session expired. Please log in again.");
      router.push("/auth/login");
      return;
    }

    setVerifying(true);
    try {
      const res = await verifyMFALogin(userId, codeStr);
      if ("error" in (res as any)) {
        toast.error((res as any).error);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.success("Verified! Redirecting...");
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err.message);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
    setVerifying(false);
  };

  // Verify backup code
  const handleBackupVerify = async () => {
    if (!backupCode.trim()) {
      toast.error("Please enter your backup code");
      return;
    }
    if (!userId) {
      toast.error("Session expired. Please log in again.");
      router.push("/auth/login");
      return;
    }

    setVerifying(true);
    try {
      const res = await redeemBackupCode(userId, backupCode.trim());
      if ("error" in (res as any)) {
        toast.error((res as any).error);
      } else {
        toast.success("Verified! Redirecting...");
        router.push("/");
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setVerifying(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-4">
              <Shield className="w-7 h-7 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
            <p className="text-gray-500 mt-2 text-sm">
              {backupMode
                ? "Enter one of your backup codes to verify your identity"
                : "Enter the 6-digit code from your authenticator app"}
            </p>
          </div>

          {!backupMode ? (
            /* TOTP Code Input */
            <div className="space-y-6">
              <div>
                <Label className="text-center block mb-3">Authentication Code</Label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-mono font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      disabled={verifying}
                    />
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleVerify()}
                disabled={verifying || code.join("").length !== 6}
                className="w-full"
              >
                {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Verify
              </Button>

              <div className="text-center">
                <button
                  onClick={() => setBackupMode(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Use a backup code instead
                </button>
              </div>
            </div>
          ) : (
            /* Backup Code Input */
            <div className="space-y-4">
              <div>
                <Label>Backup Code</Label>
                <Input
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                  placeholder="XXXXX-XXXXX"
                  className="font-mono text-center text-lg tracking-wider mt-2"
                  disabled={verifying}
                />
              </div>

              <Button
                onClick={handleBackupVerify}
                disabled={verifying || !backupCode.trim()}
                className="w-full"
              >
                {verifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Verify Backup Code
              </Button>

              <div className="text-center">
                <button
                  onClick={() => setBackupMode(false)}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Use authenticator code instead
                </button>
              </div>
            </div>
          )}

          {/* Back to login */}
          <div className="mt-8 pt-6 border-t text-center">
            <button
              onClick={() => router.push("/auth/login")}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyMFAPage() {
  return (
    <Suspense fallback={null}>
      <VerifyMFAInner />
    </Suspense>
  );
}
