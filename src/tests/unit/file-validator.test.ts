import { describe, it, expect } from "vitest";
import {
  validateFileType,
  validateImageDimensions,
} from "@/lib/file-validator";

describe("File Validator", () => {
  describe("validateFileType", () => {
    it("detects JPEG from magic bytes", () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const result = validateFileType(buffer);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe("image/jpeg");
    });

    it("detects PNG from magic bytes", () => {
      const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      const result = validateFileType(buffer);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe("image/png");
    });

    it("detects GIF from magic bytes", () => {
      const buffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      const result = validateFileType(buffer);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe("image/gif");
    });

    it("detects WEBP from magic bytes", () => {
      const buffer = Buffer.alloc(16);
      buffer.write("RIFF", 0);
      buffer.write("WEBP", 8);
      const result = validateFileType(buffer);
      expect(result.valid).toBe(true);
      expect(result.mimeType).toBe("image/webp");
    });

    it("rejects unknown file types", () => {
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const result = validateFileType(buffer);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects empty buffer", () => {
      const result = validateFileType(Buffer.alloc(0));
      expect(result.valid).toBe(false);
    });
  });

  describe("validateImageDimensions", () => {
    it("validates PNG dimensions", () => {
      // Minimal PNG header with 100x200 dimensions
      const buffer = Buffer.alloc(32);
      buffer.set([0x89, 0x50, 0x4e, 0x47], 0); // PNG magic
      buffer.writeUInt32BE(100, 16); // width
      buffer.writeUInt32BE(200, 20); // height

      const result = validateImageDimensions(buffer, "image/png");
      expect(result.valid).toBe(true);
      expect(result.dimensions).toEqual({ width: 100, height: 200 });
    });

    it("rejects oversized images", () => {
      const buffer = Buffer.alloc(32);
      buffer.set([0x89, 0x50, 0x4e, 0x47], 0);
      buffer.writeUInt32BE(20000, 16); // 20000 width
      buffer.writeUInt32BE(20000, 20);

      const result = validateImageDimensions(buffer, "image/png", 10000, 10000);
      expect(result.valid).toBe(false);
    });
  });
});
