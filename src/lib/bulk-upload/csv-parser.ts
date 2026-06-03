/**
 * CSV parser with validation for bulk product uploads.
 * Parses CSV text into structured rows with error reporting.
 */

export interface CSVRow {
  [key: string]: string;
}

export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
}

export interface CSVValidationWarning {
  row: number;
  field: string;
  message: string;
}

export interface CSVParseResult {
  rows: CSVRow[];
  headers: string[];
  errors: CSVValidationError[];
  warnings: CSVValidationWarning[];
  totalRows: number;
  validRows: number;
}

export interface FieldDefinition {
  name: string;
  required?: boolean;
  type?: "string" | "number" | "boolean" | "date";
  min?: number;
  max?: number;
  pattern?: RegExp;
  validate?: (value: string) => string | null; // return error message or null
}

/**
 * Parse a single CSV line, handling quoted fields and escaped quotes.
 */
function parseCSVLine(line: string, delimiter: string = ","): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote ""
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
          continue;
        }
        // End of quoted field
        inQuotes = false;
        i++;
        continue;
      }
      current += char;
      i++;
    } else {
      if (char === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (char === delimiter) {
        fields.push(current.trim());
        current = "";
        i++;
        continue;
      }
      current += char;
      i++;
    }
  }

  fields.push(current.trim());
  return fields;
}

/**
 * Detect the delimiter used in the CSV (comma, tab, semicolon).
 */
function detectDelimiter(firstLine: string): string {
  const counts = {
    ",": (firstLine.match(/,/g) || []).length,
    "\t": (firstLine.match(/\t/g) || []).length,
    ";": (firstLine.match(/;/g) || []).length,
    "|": (firstLine.match(/\|/g) || []).length,
  };

  let best = ",";
  let bestCount = 0;
  for (const [delim, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count;
      best = delim;
    }
  }

  return best;
}

/**
 * Parse CSV text into structured data.
 */
export function parseCSV(csvText: string): { headers: string[]; rows: CSVRow[]; rawRows: string[][] } {
  const lines = csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return { headers: [], rows: [], rawRows: [] };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCSVLine(lines[0], delimiter).map((h) => h.trim());
  const rows: CSVRow[] = [];
  const rawRows: string[][] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i], delimiter);
    rawRows.push(fields);

    const row: CSVRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (fields[j] || "").trim();
    }
    rows.push(row);
  }

  return { headers, rows, rawRows };
}

/**
 * Validate parsed CSV rows against field definitions.
 */
export function validateCSV(
  rows: CSVRow[],
  fieldDefinitions: FieldDefinition[]
): { errors: CSVValidationError[]; warnings: CSVValidationWarning[] } {
  const errors: CSVValidationError[] = [];
  const warnings: CSVValidationWarning[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // +2 because row 1 is headers, 0-indexed loop

    for (const field of fieldDefinitions) {
      const value = row[field.name];

      // Required check
      if (field.required && (!value || value.trim() === "")) {
        errors.push({
          row: rowNumber,
          field: field.name,
          message: `"${field.name}" is required`,
        });
        continue;
      }

      // Skip further validation if empty and not required
      if (!value || value.trim() === "") continue;

      // Type validation
      if (field.type === "number") {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push({
            row: rowNumber,
            field: field.name,
            message: `"${field.name}" must be a valid number, got "${value}"`,
          });
          continue;
        }
        if (field.min !== undefined && num < field.min) {
          errors.push({
            row: rowNumber,
            field: field.name,
            message: `"${field.name}" must be >= ${field.min}, got ${num}`,
          });
        }
        if (field.max !== undefined && num > field.max) {
          errors.push({
            row: rowNumber,
            field: field.name,
            message: `"${field.name}" must be <= ${field.max}, got ${num}`,
          });
        }
      }

      if (field.type === "boolean") {
        const valid = ["true", "false", "yes", "no", "1", "0"].includes(value.toLowerCase());
        if (!valid) {
          warnings.push({
            row: rowNumber,
            field: field.name,
            message: `"${field.name}" should be true/false, got "${value}"`,
          });
        }
      }

      if (field.type === "date") {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors.push({
            row: rowNumber,
            field: field.name,
            message: `"${field.name}" must be a valid date, got "${value}"`,
          });
        }
      }

      // Pattern validation
      if (field.pattern && !field.pattern.test(value)) {
        errors.push({
          row: rowNumber,
          field: field.name,
          message: `"${field.name}" does not match expected format`,
        });
      }

      // Custom validation
      if (field.validate) {
        const errorMsg = field.validate(value);
        if (errorMsg) {
          errors.push({
            row: rowNumber,
            field: field.name,
            message: errorMsg,
          });
        }
      }
    }

    // Warn about unknown fields
    const knownFields = new Set(fieldDefinitions.map((f) => f.name));
    for (const key of Object.keys(row)) {
      if (!knownFields.has(key) && row[key]) {
        warnings.push({
          row: rowNumber,
          field: key,
          message: `Unknown column "${key}" will be ignored`,
        });
      }
    }
  }

  return { errors, warnings };
}

/**
 * Standard product field definitions for bulk upload.
 */
export const PRODUCT_FIELD_DEFINITIONS: FieldDefinition[] = [
  { name: "name", required: true, type: "string", min: 1, max: 255 },
  { name: "sku", required: true, type: "string" },
  { name: "price", required: true, type: "number", min: 0 },
  { name: "comparePrice", type: "number", min: 0 },
  { name: "stock", required: true, type: "number", min: 0 },
  { name: "category", type: "string" },
  { name: "brand", type: "string" },
  { name: "description", type: "string" },
  { name: "shortDescription", type: "string" },
  { name: "weight", type: "number", min: 0 },
  { name: "isActive", type: "boolean" },
  { name: "images", type: "string" }, // comma-separated URLs
  { name: "tags", type: "string" }, // comma-separated
];

/**
 * Full parse + validate pipeline.
 */
export function parseAndValidateCSV(csvText: string, fieldDefinitions?: FieldDefinition[]): CSVParseResult {
  const fields = fieldDefinitions || PRODUCT_FIELD_DEFINITIONS;
  const { headers, rows } = parseCSV(csvText);

  if (headers.length === 0) {
    return {
      rows: [],
      headers: [],
      errors: [{ row: 0, field: "file", message: "CSV file is empty or has no headers" }],
      warnings: [],
      totalRows: 0,
      validRows: 0,
    };
  }

  // Check that required columns exist in headers
  const headerErrors: CSVValidationError[] = [];
  for (const field of fields) {
    if (field.required && !headers.includes(field.name)) {
      headerErrors.push({
        row: 1,
        field: field.name,
        message: `Required column "${field.name}" is missing from CSV headers`,
      });
    }
  }

  const { errors, warnings } = validateCSV(rows, fields);
  const allErrors = [...headerErrors, ...errors];
  const errorRows = new Set(allErrors.map((e) => e.row));
  const validRows = rows.length - errorRows.size;

  return {
    rows,
    headers,
    errors: allErrors,
    warnings,
    totalRows: rows.length,
    validRows: Math.max(0, validRows),
  };
}

/**
 * Generate CSV template string for product bulk upload.
 */
export function generateProductCSVTemplate(): string {
  const headers = PRODUCT_FIELD_DEFINITIONS.map((f) => f.name);
  const sampleRow = [
    "Sample Product",
    "SKU-001",
    "999",
    "1299",
    "100",
    "Electronics",
    "BrandX",
    "A great product description",
    "Short desc",
    "0.5",
    "true",
    "https://example.com/img1.jpg",
    "electronics,gadgets",
  ];
  return [headers.join(","), sampleRow.join(",")].join("\n");
}
