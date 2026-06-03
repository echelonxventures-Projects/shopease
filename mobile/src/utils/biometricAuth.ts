import * as LocalAuthentication from "expo-local-authentication";

export type BiometricType = "fingerprint" | "facial" | "iris" | "none";

interface BiometricAvailability {
  available: boolean;
  type: BiometricType;
  enrolled: boolean;
  error?: string;
}

/**
 * Check if the device supports biometric authentication and
 * whether the user has enrolled at least one biometric.
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { available: false, type: "none", enrolled: false, error: "No biometric hardware." };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return {
        available: false,
        type: "none",
        enrolled: false,
        error: "No biometrics enrolled. Set up fingerprint or face recognition in device settings.",
      };
    }

    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    let type: BiometricType = "none";
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      type = "fingerprint";
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      type = "facial";
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      type = "iris";
    }

    return { available: true, type, enrolled: true };
  } catch (error) {
    return {
      available: false,
      type: "none",
      enrolled: false,
      error: error instanceof Error ? error.message : "Unable to check biometric availability.",
    };
  }
}

/**
 * Authenticate the user using biometrics.
 * Falls back to device passcode if biometrics fail and fallback is allowed.
 *
 * @param promptMessage - The message shown to the user during authentication.
 * @param allowFallback - If true, falls back to device PIN/password when biometrics fail.
 * @returns true if authentication succeeded, false otherwise.
 */
export async function authenticateWithBiometrics(
  promptMessage: string = "Authenticate to continue",
  allowFallback: boolean = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const availability = await checkBiometricAvailability();
    if (!availability.available) {
      if (!allowFallback) {
        return { success: false, error: availability.error || "Biometrics not available." };
      }
      // Fall through to device passcode
    }

    const biometricName =
      availability.type === "fingerprint"
        ? "Fingerprint"
        : availability.type === "facial"
          ? "Face ID"
          : availability.type === "iris"
            ? "Iris"
            : "Biometric";

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: allowFallback ? "Use Passcode" : undefined,
      cancelLabel: "Cancel",
      disableDeviceFallback: !allowFallback,
      requireConfirmation: true,
    });

    if (result.success) {
      return { success: true };
    }

    // User cancelled or auth failed
    if (result.error === "user_cancel") {
      return { success: false, error: "Authentication cancelled." };
    }

    if (result.error === "lockout") {
      return {
        success: false,
        error: "Too many failed attempts. Biometric authentication is temporarily locked.",
      };
    }

    if (result.error === "user_fallback") {
      return { success: false, error: "User chose fallback method." };
    }

    return { success: false, error: "Authentication failed." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Biometric authentication error.",
    };
  }
}

/**
 * Quick helper — returns true if biometric auth succeeds.
 */
export async function quickBiometricCheck(): Promise<boolean> {
  const result = await authenticateWithBiometrics("Verify your identity");
  return result.success;
}
