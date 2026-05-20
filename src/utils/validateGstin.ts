export const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export type GstinValidationResult = {
  isValid: boolean;
  message: string;
  normalized: string;
};

export function normalizeGstin(value: string) {
  return value.replace(/\s+/g, "").toUpperCase().slice(0, 15);
}

export function validateGstin(value: string): GstinValidationResult {
  const normalized = normalizeGstin(value);

  if (!normalized) {
    return {
      isValid: false,
      message: "GST number is required",
      normalized,
    };
  }

  if (normalized.length !== 15) {
    return {
      isValid: false,
      message: "GST number must be exactly 15 characters",
      normalized,
    };
  }

  if (!GSTIN_REGEX.test(normalized)) {
    return {
      isValid: false,
      message: "Enter a valid GSTIN format",
      normalized,
    };
  }

  return {
    isValid: true,
    message: "GST number format is valid",
    normalized,
  };
}
