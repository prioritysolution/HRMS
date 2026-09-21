"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { useReportBrand } from "@/hooks/useReportBrand";
import { useI18n } from "@/i18n";
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
  emptyMessage,
  successMessage,
}: ReportExportButtonsProps) {
  const { t } = useI18n();
  const toast = useToast();
  const { brand: resolvedBrand } = useReportBrand();
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const resolvedEmpty = emptyMessage ?? t("common.export.empty");
  const resolvedSuccess = successMessage ?? t("common.export.success");

  const brand = {
    ...resolvedBrand,
    ...brandOverride,
  };

  const handleExport = async (format: "excel" | "pdf") => {
    if (rows.length === 0) {
      toast.error({
        title: t("common.export.nothingTitle"),
        message: resolvedEmpty,
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
        title:
          format === "excel"
            ? t("common.export.excelTitle")
            : t("common.export.pdfTitle"),
        message: resolvedSuccess,
      });
    } catch (error) {
      toast.error({
        title: t("common.export.failedTitle"),
        message:
          error instanceof Error
            ? error.message
            : t("common.export.failedMessage"),
      });
    } finally {
      setExporting(null);
    }
  };

  const busy = disabled || exporting !== null || rows.length === 0;

  return (
    <div className="report-header-actions">
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={() => void handleExport("excel")}
      >
        <FileSpreadsheet size={16} strokeWidth={2} />
        {exporting === "excel"
          ? t("common.export.exporting")
          : t("common.export.excel")}
      </button>
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={() => void handleExport("pdf")}
      >
        <FileDown size={16} strokeWidth={2} />
        {exporting === "pdf"
          ? t("common.export.exporting")
          : t("common.export.pdf")}
      </button>
    </div>
  );
}
