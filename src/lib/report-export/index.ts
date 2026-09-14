import { exportReportExcel } from "@/lib/report-export/excel-template";
import { exportReportPdf } from "@/lib/report-export/pdf-template";
import type {
  ReportExcelOptions,
  ReportExportOptions,
  ReportPdfOptions,
} from "@/lib/report-export/types";

export type {
  ReportBrand,
  ReportCardTitle,
  ReportExcelOptions,
  ReportExportColumn,
  ReportExportOptions,
  ReportFieldGroup,
  ReportPdfLayout,
  ReportPdfOptions,
} from "@/lib/report-export/types";

export {
  DEFAULT_REPORT_BRAND,
  DEFAULT_REPORT_LOGO,
  resolveReportBrand,
} from "@/lib/report-export/brand";

export { exportReportExcel } from "@/lib/report-export/excel-template";
export { exportReportPdf } from "@/lib/report-export/pdf-template";

/** Single entry-point for common Excel / PDF report templates. */
export async function exportReport(options: ReportExportOptions) {
  if (options.format === "excel") {
    await exportReportExcel(options);
    return;
  }
  await exportReportPdf(options);
}

/** @deprecated Prefer `exportReportExcel` / `exportReport`. */
export async function exportRowsToExcel(options: ReportExcelOptions) {
  await exportReportExcel(options);
}

/** @deprecated Prefer `exportReportPdf` / `exportReport`. */
export async function exportRowsToPdf(options: ReportPdfOptions) {
  await exportReportPdf(options);
}
