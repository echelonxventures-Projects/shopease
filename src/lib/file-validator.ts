/**
 * Magic byte detection and image dimension validation for file uploads.
 */

const MAGIC_SIGNATURES: Record<string, [number[], number]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff], 0],
  "image/png": [[0x89, 0x50, 0x4e, 0x47], 0],
  "image/gif": [[0x47, 0x49, 0x46, 0x38], 0],
};

// WEBP specific: "RIFF" header + "WEBP" at offset 8
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50];

export interface ValidationResult {
  valid: boolean;
  mimeType?: string;
  error?: string;
}

/**
 * Validate file type by checking magic bytes against known signatures.
 */
export function validateFileType(buffer: Buffer): ValidationResult {
  // Check RIFF container first (for WEBP)
  if (buffer.length >= 12 &&
      matchesSignature(buffer, WEBP_RIFF, 0) &&
      matchesSignature(buffer, WEBP_MARKER, 8)) {
    return { valid: true, mimeType: "image/webp" };
  }

  for (const [mimeType, [signature, offset]] of Object.entries(MAGIC_SIGNATURES)) {
    if (mimeType === "image/webp") continue; // Already handled
    if (buffer.length >= signature.length + offset && matchesSignature(buffer, signature, offset)) {
      return { valid: true, mimeType };
    }
  }

  return { valid: false, error: "File type not recognized by magic byte inspection" };
}

function matchesSignature(buffer: Buffer, signature: number[], offset: number): boolean {
  if (buffer.length < signature.length + offset) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) return false;
  }
  return true;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImageValidationResult extends ValidationResult {
  dimensions?: ImageDimensions;
}

/**
 * Validate image dimensions against max allowed size.
 */
export function validateImageDimensions(
  buffer: Buffer,
  mimeType: string,
  maxWidth = 10000,
  maxHeight = 10000
): ImageValidationResult {
  const dims = getImageDimensions(buffer, mimeType);
  if (!dims) {
    return { valid: true, mimeType, error: "Could not parse dimensions — allowing upload" };
  }

  if (dims.width > maxWidth || dims.height > maxHeight) {
    return {
      valid: false,
      mimeType,
      dimensions: dims,
      error: `Image too large (${dims.width}x${dims.height}). Max: ${maxWidth}x${maxHeight}`,
    };
  }

  return { valid: true, mimeType, dimensions: dims };
}

function getImageDimensions(buffer: Buffer, mimeType: string): ImageDimensions | null {
  try {
    switch (mimeType) {
      case "image/jpeg": {
        const segments = readJpegSegments(buffer);
        for (const seg of segments) {
          if (seg[0] === 0xff && seg[1] >= 0xc0 && seg[1] <= 0xc3) {
            return { height: (seg[3] << 8) | seg[4], width: (seg[5] << 8) | seg[6] };
          }
        }
        break;
      }
      case "image/png": {
        if (buffer.length >= 24) {
          return {
            width: buffer.readUInt32BE(16),
            height: buffer.readUInt32BE(20),
          };
        }
        break;
      }
      case "image/gif": {
        if (buffer.length >= 10) {
          return {
            width: buffer.readUInt16LE(6),
            height: buffer.readUInt16LE(8),
          };
        }
        break;
      }
      case "image/webp": {
        if (buffer.length >= 30 && buffer.readUInt32LE(12) === 0x46464952) {
          return {
            width: buffer.readUInt16LE(26),
            height: buffer.readUInt16LE(28),
          };
        }
        break;
      }
    }
  } catch {
    // Ignore parsing errors
  }
  return null;
}

function readJpegSegments(buffer: Buffer): Buffer[] {
  const segments: Buffer[] = [];
  let i = 2; // Skip SOI marker
  while (i < buffer.length) {
    if (buffer[i] !== 0xff) break;
    segments.push(buffer.slice(i));
    i += 2 + (buffer[i + 2] << 8 | buffer[i + 3]);
  }
  return segments;
}
