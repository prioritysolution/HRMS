export type HrmsRow = Record<string, string | number | boolean | File | null | undefined> & {
  id: string;
};

export type FormFieldType =
  | "text"
  | "email"
  | "password"
  | "tel"
  | "date"
  | "time"
  | "number"
  | "select"
  |  "multi-select"
  | "textarea"
  | "radio"
  | "checkbox"
  | "file";

export type FormField = {
  name: string;
  label: string;
  type?: FormFieldType;
  options?: Array<string | { value: string; label: string }>;
  required?: boolean;
  span?: "full";
  placeholder?: string;
  defaultValue?: string;
  accept?: string;
  maxSizeMb?: number;
  hint?: string;
  previewKey?: string;
  fileNameKey?: string;
  hideOnCreate?: boolean;
  hideOnEdit?: boolean;
  readOnlyOnEdit?: boolean;
  /** Always disabled in the form (create + edit). */
  readOnly?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  pattern?: RegExp;
  patternMessage?: string;
  unique?: boolean;
};

export type FormSection = {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
};

export type TableColumnType =
  | "text"
  | "status"
  | "person"
  | "date"
  | "time"
  | "currency"
  | "boolean"
  | "duration"
  | "clamp"
  | "json";

export type TableColumn = {
  key: string;
  header: string;
  type?: TableColumnType;
  subtitleKey?: string;
  avatarKey?: string;
  filterable?: boolean;
  wrap?: boolean;
};

export type StatCardConfig = {
  title: string;
  value: (rows: HrmsRow[]) => string;
  change: (rows: HrmsRow[]) => string;
  hint: string;
  description: string;
  tone: "primary" | "info" | "success" | "warning" | "danger" | "orange";
  icon: "users" | "userPlus" | "clock" | "calendar" | "briefcase" | "trendingDown";
  positive?: boolean;
};

export type ModuleReportExportConfig = {
  columns: Array<{ key: string; header: string; fullWidth?: boolean }>;
  fieldGroups?: Array<{
    title: string;
    fields: Array<{ key: string; header: string; fullWidth?: boolean }>;
  }>;
  pdfLayout?: "cards" | "table";
  cardTitle?: {
    primaryKey: string;
    secondaryKey?: string;
    badgeKey?: string;
  };
  sheetName?: string;
  emptyMessage?: string;
  successMessage?: string;
};

export type HrmsModuleConfig = {
  id: string;
  title: string;
  section: string;
  tableName: string;
  actionLabel?: string;
  nameKey: string;
  columns: TableColumn[];
  formFields?: FormField[];
  formSections?: FormSection[];
  modalSize?: "sm" | "md" | "lg" | "xl";
  searchKeys?: string[];
  usesApi?: boolean;
  statusToggle?: boolean;
  /** List-only modules: hide row actions and add/edit flows. */
  readOnly?: boolean;
  /** Use API page/per_page instead of client-side table paging. */
  serverPagination?: boolean;
  disableEditSubmit?: boolean;
  stats?: StatCardConfig[];
  /** When set, MasterDataPage shows Excel/PDF export for this module. */
  reportExport?: ModuleReportExportConfig;
};
