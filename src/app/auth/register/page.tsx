"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/server/actions/auth-actions";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    if (!consentPrivacy || !consentTerms) {
      setError("You must agree to the Privacy Policy and Terms of Service");
      return;
    }
    formData.set("consent_privacy_policy", consentPrivacy ? "on" : "off");
    formData.set("consent_terms_of_service", consentTerms ? "on" : "off");
    formData.set("consent_marketing_emails", consentMarketing ? "on" : "off");

    const result = await registerUser(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/auth/login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow w-full max-w-md">
        <Link href="/" className="text-xl font-bold text-blue-600">ShopEase</Link>
        <h1 className="text-2xl font-bold mb-6 mt-4">Create Account</h1>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input name="name" type="text" required className="w-full border rounded-lg px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input name="email" type="email" required className="w-full border rounded-lg px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input name="phone" type="tel" className="w-full border rounded-lg px-4 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input name="password" type="password" required minLength={6} className="w-full border rounded-lg px-4 py-2" />
          </div>

          <div className="space-y-3 pt-2 border-t">
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={consentPrivacy} onChange={(e) => setConsentPrivacy(e.target.checked)} className="mt-1" />
              <span className="text-sm text-gray-700">
                I agree to the{" "}
                <Link href="/privacy" target="_blank" className="text-blue-600 underline">Privacy Policy</Link>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={consentTerms} onChange={(e) => setConsentTerms(e.target.checked)} className="mt-1" />
              <span className="text-sm text-gray-700">
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="text-blue-600 underline">Terms of Service</Link>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={consentMarketing} onChange={(e) => setConsentMarketing(e.target.checked)} className="mt-1" />
              <span className="text-sm text-gray-500">
                Send me marketing emails and updates (optional)
              </span>
            </label>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
            Create Account
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
