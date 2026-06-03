"use client";

import { useState, useCallback, useRef } from "react";
import {
  parseBulkUpload,
  processBulkUpload,
  getBulkUploadHistory,
  downloadTemplate,
} from "@/server/actions/bulk-upload-actions";
import { BulkUploadProgress } from "@/components/admin/BulkUploadProgress";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ParseResult = Awaited<ReturnType<typeof parseBulkUpload>>;

export default function BulkUploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [_fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [processing, setProcessing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [processResult, setProcessResult] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Please upload a CSV file");
      return;
    }

    setFileName(file.name);
    setParseResult(null);
    setProcessResult(null);

    const text = await file.text();
    setFileContent(text);

    setParsing(true);
    try {
      const result = await parseBulkUpload(text);
      if ("error" in result && typeof result.error === "string") {
        toast.error(result.error);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        setParseResult(result as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        if ((result as any).errors?.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
          toast.warning(`Found ${(result as any).errors.length} validation errors`);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
          toast.success(`Parsed ${(result as any).totalRows} rows successfully`);
        }
      }
    } catch {
      toast.error("Failed to parse file");
    }
    setParsing(false);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!parseResult || "error" in parseResult) return;

    setProcessing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      const result = await processBulkUpload(parseResult as any);
      setProcessResult(result);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Imported ${result.success} products${result.failed > 0 ? `, ${result.failed} failed` : ""}`);
        loadHistory();
      }
    } catch {
      toast.error("Import failed");
    }
    setProcessing(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const template = await downloadTemplate();
      if (typeof template === "string") {
        const blob = new Blob([template], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "product-upload-template.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Template downloaded");
      }
    } catch {
      toast.error("Failed to download template");
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const result = await getBulkUploadHistory();
      if (Array.isArray(result)) setHistory(result);
    } catch {
      // ignore
    }
    setLoadingHistory(false);
  };

  const handleClear = () => {
    setFileContent(null);
    setFileName("");
    setParseResult(null);
    setProcessResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasParseResult = parseResult && !("error" in parseResult);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
  const validRows = hasParseResult ? (parseResult as any).validRows : 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
  const errorCount = hasParseResult ? (parseResult as any).errors?.length || 0 : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Bulk Product Upload</h1>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate}>
          <Download className="w-4 h-4 mr-2" /> Download Template
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 bg-gray-50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleInputChange}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700">
          {fileName ? fileName : "Drop CSV file here or click to browse"}
        </p>
        <p className="text-sm text-gray-500 mt-2">Supports .csv files with product data</p>
      </div>

      {/* Parsing State */}
      {parsing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span>Parsing CSV...</span>
        </div>
      )}

      {/* Validation Results */}
      {hasParseResult && !parsing && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Validation Results</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="w-4 h-4 mr-1" /> Clear
              </Button>
              <Button
                onClick={handleImport}
                disabled={processing || validRows === 0}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Upload className="w-4 h-4 mr-2" />
                )}
                Import {validRows} Products
              </Button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="border rounded-lg p-3 text-center">
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
              <p className="text-2xl font-bold">{(parseResult as any).totalRows}</p>
              <p className="text-sm text-gray-500">Total Rows</p>
            </div>
            <div className="border rounded-lg p-3 text-center bg-green-50">
              <p className="text-2xl font-bold text-green-700">{validRows}</p>
              <p className="text-sm text-green-600">Valid</p>
            </div>
            <div className="border rounded-lg p-3 text-center bg-red-50">
              <p className="text-2xl font-bold text-red-700">{errorCount}</p>
              <p className="text-sm text-red-600">Errors</p>
            </div>
          </div>

          {/* Errors Table */}
          {errorCount > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Validation Errors
              </h3>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-red-50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 text-red-700">Row</th>
                      <th className="text-left p-2 text-red-700">Field</th>
                      <th className="text-left p-2 text-red-700">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                    {(parseResult as any).errors.map((err: any, idx: number) => (
                      <tr key={idx} className="border-b bg-white">
                        <td className="p-2">{err.row}</td>
                        <td className="p-2 font-medium">{err.field}</td>
                        <td className="p-2 text-red-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Warnings */}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
          {(parseResult as any).warnings?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-yellow-700 mb-2">Warnings</h3>
              <div className="max-h-32 overflow-y-auto border rounded-lg">
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                {(parseResult as any).warnings.slice(0, 20).map((w: any, idx: number) => (
                  <div key={idx} className="px-3 py-1 text-sm text-yellow-700 border-b">
                    Row {w.row}: {w.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Preview */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Data Preview (first 5 rows)</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                    {(parseResult as any).headers?.map((h: string) => (
                      <th key={h} className="text-left p-2 font-medium text-gray-600 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                  {(parseResult as any).rows?.slice(0, 5).map((row: Record<string, unknown>, idx: number) => {
                    const rowNum = idx + 2;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                    const rowHasError = (parseResult as any).errors?.some((e: { row: number; message: string }) => e.row === rowNum);
                    return (
                      <tr key={idx} className={`border-b ${rowHasError ? "bg-red-50" : "bg-green-50"}`}>
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                        {(parseResult as any).headers?.map((h: string) => (
                          <td key={h} className="p-2 whitespace-nowrap max-w-[200px] truncate">
                            {String(row[h] || "—")}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Import Progress */}
      {processing && (
        <BulkUploadProgress
          currentRow={0}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
          totalRows={(parseResult as any)?.totalRows || 0}
          successCount={0}
          errorCount={0}
          errors={[]}
          isProcessing={true}
        />
      )}

      {/* Process Result */}
      {processResult && !processResult.error && (
        <BulkUploadProgress
          currentRow={processResult.success + processResult.failed}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
          totalRows={(parseResult as any)?.totalRows || 0}
          successCount={processResult.success}
          errorCount={processResult.failed}
          errors={processResult.errors || []}
          isProcessing={false}
        />
      )}

      {/* Upload History */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Upload History</h2>
          <Button variant="outline" size="sm" onClick={loadHistory} disabled={loadingHistory}>
            {loadingHistory ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm">No uploads yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">File</th>
                <th className="text-left p-3">Rows</th>
                <th className="text-left p-3">Success</th>
                <th className="text-left p-3">Errors</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Uploaded By</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{h.fileName}</td>
                  <td className="p-3">{h.totalRows}</td>
                  <td className="p-3 text-green-600">{h.validRows}</td>
                  <td className="p-3 text-red-600">{h.errorRows}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      h.status === "completed" ? "bg-green-100 text-green-700" :
                      h.status === "partial" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{h.uploadedBy}</td>
                  <td className="p-3 text-gray-500">{new Date(h.uploadedAt).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
