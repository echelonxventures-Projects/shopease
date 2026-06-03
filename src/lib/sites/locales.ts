// Common locales shown in the Site form's "Supported Languages" picker.
// Shared by /admin/sites and /admin/sites/[id] so the chip set stays in sync.

export interface LocaleOption {
  /** BCP 47 code, e.g. "en-IN". */
  value: string;
  /** Human-readable label including native script where applicable. */
  label: string;
}

export const COMMON_LOCALES: LocaleOption[] = [
  { value: "en", label: "English" },
  { value: "en-IN", label: "English (India)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "hi", label: "हिन्दी (Hindi)" },
  { value: "bn", label: "বাংলা (Bengali)" },
  { value: "ta", label: "தமிழ் (Tamil)" },
  { value: "te", label: "తెలుగు (Telugu)" },
  { value: "mr", label: "मराठी (Marathi)" },
  { value: "gu", label: "ગુજરાતી (Gujarati)" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "pt", label: "Português" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
];
