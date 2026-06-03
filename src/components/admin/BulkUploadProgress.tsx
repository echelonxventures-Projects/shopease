"use client";

import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface BulkUploadProgressProps {
  currentRow: number;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  isProcessing: boolean;
}

export function BulkUploadProgress({
  currentRow,
  totalRows,
  successCount,
  errorCount,
  errors,
  isProcessing,
}: BulkUploadProgressProps) {
  const progress = totalRows > 0 ? Math.round((currentRow / totalRows) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4">
        {isProcessing ? "Importing Products..." : "Import Complete"}
      </h2>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-600">
            {isProcessing ? `Processing row ${currentRow} of ${totalRows}` : `Processed ${totalRows} rows`}
          </span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              isProcessing ? "bg-blue-500" : "bg-green-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">Current</span>
          </div>
          <p className="text-2xl font-bold">{currentRow}</p>
          <p className="text-xs text-gray-500">of {totalRows}</p>
        </div>
        <div className="border rounded-lg p-3 text-center bg-green-50">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Success</span>
          </div>
          <p className="text-2xl font-bold text-green-700">{successCount}</p>
        </div>
        <div className="border rounded-lg p-3 text-center bg-red-50">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Errors</span>
          </div>
          <p className="text-2xl font-bold text-red-700">{errorCount}</p>
        </div>
      </div>

      {/* Detailed Error List */}
      {errors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
            <XCircle className="w-4 h-4" /> Import Errors ({errors.length})
          </h3>
          <div className="max-h-48 overflow-y-auto border border-red-200 rounded-lg">
            {errors.map((error, idx) => (
              <div
                key={idx}
                className="px-3 py-2 text-sm text-red-700 border-b last:border-0 bg-red-50"
              >
                {error}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
