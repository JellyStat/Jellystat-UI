// Report files: exported from the reports screen or designer, checked by the API (Reports/ValidateImport) on import.
import client from "@/lib/api";
import type { ReportDefinition, ReportImportResult } from "@/lib/models/reports";
import { downloadBlob, exportFileName } from "./clientExport";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

export function downloadReportFile(name: string, description: string | null | undefined, definition: ReportDefinition): void {
  const file = {
    format: "jellystat-report",
    formatVersion: 1,
    exportedAt: new Date().toISOString(),
    name,
    description: description ?? null,
    definition,
  };
  downloadBlob(new Blob([JSON.stringify(file, null, 2)], { type: "application/json" }), exportFileName(name || "report", "report.json"));
}

/** Nothing is saved here: the result says whether the file is usable, and carries the checked report if it is. */
export async function checkReportFile(file: File): Promise<ReportImportResult> {
  // Checked here too, so a huge file isn't read into memory and uploaded just to be refused
  if (file.size > MAX_FILE_BYTES) {
    return { valid: false, errors: ["The file is larger than 20 MB."], warnings: [] };
  }
  return client.Reports.validateImport({ content: await file.text() });
}

export const reportNameFromFile = (file: File) => file.name.replace(/\.(report\.)?json$/i, "") || "Imported report";
