import type { HrmsRow } from "@/types/hrms";

export type ReportExportColumn = {
  key: string;
  header: string;
  /** PDF cards: render this field across the full card width */
  fullWidth?: boolean;
};

export type ReportFieldGroup = {
  title: string;
  fields: ReportExportColumn[];
};

export type ReportBrand = {
  companyName: string;
  logoUrl: string;
};

/** How each PDF record card shows its title bar. */
export type ReportCardTitle = {
  /** Main label key, e.g. Display_name */
  primaryKey: string;
  /** Subtitle key, e.g. Employee_code */
  secondaryKey?: string;
  /** Right-side badge key, e.g. Status */
  badgeKey?: string;
};

export type ReportPdfLayout = "cards" | "table";

export type ReportExportBaseOptions = {
  title: string;
  filename?: string;
  rows: HrmsRow[];
  columns: ReportExportColumn[];
  filterSummary?: string;
  brand?: Partial<ReportBrand>;
  /** Excel sheet tab name */
  sheetName?: string;
};

export type ReportExcelOptions = ReportExportBaseOptions & {
  includeSerial?: boolean;
};

export type ReportPdfOptions = ReportExportBaseOptions & {
  /** `cards` = structured profile sections; `table` = branded tabular list */
  layout?: ReportPdfLayout;
  fieldGroups?: ReportFieldGroup[];
  cardTitle?: ReportCardTitle;
  orientation?: "portrait" | "landscape";
};

export type ReportExportOptions = ReportExportBaseOptions & {
  format: "excel" | "pdf";
  layout?: ReportPdfLayout;
  fieldGroups?: ReportFieldGroup[];
  cardTitle?: ReportCardTitle;
  includeSerial?: boolean;
  orientation?: "portrait" | "landscape";
};
