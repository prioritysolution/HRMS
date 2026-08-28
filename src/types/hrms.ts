export type HrmsRow = Record<string, string | number | boolean | undefined> & {
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
  | "checkbox";

export type FormField = {
  name: string;
  label: string;
  type?: FormFieldType;
  options?: string[];
  required?: boolean;
  span?: "full";
  placeholder?: string;
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
  formFields: FormField[];
  modalSize?: "sm" | "md" | "lg" | "xl";
  searchKeys?: string[];
};
