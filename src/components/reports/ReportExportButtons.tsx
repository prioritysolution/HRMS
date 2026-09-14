"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { useReportBrand } from "@/hooks/useReportBrand";
import {
  exportReport,
  type ReportBrand,
  type ReportCardTitle,
  type ReportExportColumn,
  type ReportFieldGroup,
  type ReportPdfLayout,
} from "@/lib/report-export";
import type { HrmsRow } from "@/types/hrms";

type ReportExportButtonsProps = {
  title: string;
  rows: HrmsRow[];
  columns: ReportExportColumn[];
  filterSummary?: string;
  /** Override brand; defaults to shared org brand hook. */
  brand?: Partial<ReportBrand>;
  pdfLayout?: ReportPdfLayout;
  fieldGroups?: ReportFieldGroup[];
  cardTitle?: ReportCardTitle;
  sheetName?: string;
  disabled?: boolean;
  emptyMessage?: string;
  successMessage?: string;
};

/** Common Export Excel / Export PDF actions for any DataTable report page. */
export function ReportExportButtons({
  title,
  rows,
  columns,
  filterSummary,
  brand: brandOverride,
  pdfLayout,
  fieldGroups,
  cardTitle,
  sheetName,
  disabled = false,
  emptyMessage = "No records match the current filters.",
  successMessage = "Download started for the filtered report.",
}: ReportExportButtonsProps) {
  const toast = useToast();
  const { brand: resolvedBrand } = useReportBrand();
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const brand = {
    ...resolvedBrand,
    ...brandOverride,
  };

  const handleExport = async (format: "excel" | "pdf") => {
    if (rows.length === 0) {
      toast.error({
        title: "Nothing to export",
        message: emptyMessage,
      });
      return;
    }

    setExporting(format);
    try {
      await exportReport({
        format,
        title,
        rows,
        columns,
        filterSummary,
        brand,
        layout: pdfLayout,
        fieldGroups,
        cardTitle,
        sheetName,
      });
      toast.success({
        title: format === "excel" ? "Excel exported" : "PDF exported",
        message: successMessage,
      });
    } catch (error) {
      toast.error({
        title: "Export failed",
        message:
          error instanceof Error ? error.message : "Unable to generate the file.",
      });
    } finally {
      setExporting(null);
    }
  };

  const busy = disabled || exporting !== null || rows.length === 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={() => void handleExport("excel")}
      >
        <FileSpreadsheet size={16} strokeWidth={2} />
        {exporting === "excel" ? "Exporting…" : "Export Excel"}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={() => void handleExport("pdf")}
      >
        <FileDown size={16} strokeWidth={2} />
        {exporting === "pdf" ? "Exporting…" : "Export PDF"}
      </button>
    </div>
  );
}
