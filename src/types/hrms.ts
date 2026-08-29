export type HrmsRow = Record<string, string | number | boolean | File | null | undefined> & {
  id: string;
};

export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "time"
  | "number"
  | "select"
  | "textarea"
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
};

export type FormSection = {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
};

export type TableColumnType = "text" | "status" | "person" | "date" | "time" | "currency" | "boolean";

export type TableColumn = {
  key: string;
  header: string;
  type?: TableColumnType;
  subtitleKey?: string;
  avatarKey?: string;
  filterable?: boolean;
};

export type HrmsModuleConfig = {
  id: string;
  title: string;
  section: string;
  tableName: string;
  actionLabel: string;
  nameKey: string;
  columns: TableColumn[];
  formFields?: FormField[];
  formSections?: FormSection[];
  modalSize?: "sm" | "md" | "lg" | "xl";
  searchKeys?: string[];
  usesApi?: boolean;
};
