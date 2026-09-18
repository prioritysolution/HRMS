"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { FormFieldsRenderer, buildInitialFormValues } from "@/components/ui/FormFieldsRenderer";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import type { FormField, HrmsRow } from "@/types/hrms";
import { useToast } from "@/components/ui/ToastProvider";
import { codeSeriesService, type CodeSeriesConfig } from "@/lib/api/services/code-series.service";
import { useI18n, translateHrmsLookup } from "@/i18n";

type CodeSeriesRow = {
  id: string;
  module: string;
  module_name: string;
  customPrefix: string;
  nextCounter: number | null;
  paddingDigits: number | null;
  suffix: string;
  status: number;
  liveFormattedSample: string;
};

const configFields: FormField[] = [
  { label: "Custom Prefix", name: "customPrefix", type: "text", required: true },
  { label: "Next Counter", name: "nextCounter", type: "number", required: true },
  { label: "Padding Digits", name: "paddingDigits", type: "number", required: true },
  { label: "Suffix", name: "suffix", type: "text" },
  {
    label: "Status",
    name: "status",
    type: "select",
    options: [
      { value: "1", label: "Active" },
      { value: "0", label: "Inactive" },
    ],
    required: true,
  },
];

export default function ConfigureNumberingSequencePage() {
  const { t, language } = useI18n();
  const [data, setData] = useState<CodeSeriesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editRow, setEditRow] = useState<CodeSeriesRow | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const [values, setValues] = useState<Record<string, FormValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const translatedConfigFields = useMemo(
    () =>
      configFields.map((field) => ({
        ...field,
        label: t(`settings.numbering.fields.${field.name}`),
      })),
    [t],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [modules, configs] = await Promise.all([
        codeSeriesService.modules(),
        codeSeriesService.list(),
      ]);

      const configMap = new Map<string, CodeSeriesConfig>(
        configs.map((c) => [c.Module_key, c]),
      );

      const rows: CodeSeriesRow[] = modules.map((m) => {
        const conf = configMap.get(m.module);
        return {
          id: m.module,
          module: m.module,
          module_name: m.module_name,
          customPrefix: conf?.Prefix ?? "",
          nextCounter: conf?.Next_counter ?? null,
          paddingDigits: conf?.Padding_digits ?? null,
          suffix: conf?.Suffix ?? "",
          status: conf?.Status ?? 1,
          liveFormattedSample: conf?.formatted_sample ?? "",
        };
      });
      setData(rows);
    } catch {
      toast.error({
        title: t("settings.common.error"),
        message: t("settings.numbering.loadError"),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!editRow) {
      setValues({});
      setErrors({});
      return;
    }
    setValues(buildInitialFormValues(configFields, editRow as unknown as HrmsRow));
    setErrors({});
  }, [editRow]);

  const handleFieldChange = (name: string, value: FormValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const field = configFields.find((item) => item.name === name);
    if (!field) return;

    setErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(configFields, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (!editRow) return;

    setSaving(true);
    try {
      await codeSeriesService.update({
        module: editRow.module,
        module_name: editRow.module_name,
        prefix: String(values.customPrefix ?? ""),
        next_counter: Number(values.nextCounter),
        padding_digits: Number(values.paddingDigits),
        suffix: String(values.suffix ?? ""),
        status: Number(values.status ?? 1),
      });

      toast.success({
        title: t("settings.common.success"),
        message: t("settings.numbering.updateSuccess"),
      });
      await loadData();
      setEditRow(null);
    } catch {
      toast.error({
        title: t("settings.common.error"),
        message: t("settings.numbering.updateError"),
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<Column<CodeSeriesRow>[]>(
    () => [
      {
        key: "module_name",
        header: t("settings.numbering.columns.module"),
        render: (row) => row.module_name,
      },
      {
        key: "customPrefix",
        header: t("settings.numbering.columns.customPrefix"),
        render: (row) =>
          row.customPrefix ? (
            <span className="badge bg-soft-primary text-primary">{row.customPrefix}</span>
          ) : (
            <span className="text-muted">—</span>
          ),
      },
      {
        key: "nextCounter",
        header: t("settings.numbering.columns.nextCounter"),
        render: (row) => row.nextCounter ?? <span className="text-muted">—</span>,
      },
      {
        key: "paddingDigits",
        header: t("settings.numbering.columns.paddingDigits"),
        render: (row) => row.paddingDigits ?? <span className="text-muted">—</span>,
      },
      {
        key: "suffix",
        header: t("settings.numbering.columns.suffix"),
        render: (row) => row.suffix || <span className="text-muted">—</span>,
      },
      {
        key: "liveFormattedSample",
        header: t("settings.numbering.columns.sample"),
        render: (row) =>
          row.liveFormattedSample || (
            <span className="text-muted">{t("settings.common.notConfigured")}</span>
          ),
      },
      {
        key: "status",
        header: t("settings.numbering.columns.status"),
        render: (row) => (
          <StatusBadge
            label={translateHrmsLookup(language, "labels", row.status === 1 ? "Active" : "Inactive")}
            tone={statusTone(row.status === 1 ? "Active" : "Inactive")}
          />
        ),
      },
      {
        key: "actions",
        header: t("settings.numbering.columns.actions"),
        render: (row) => (
          <button
            type="button"
            onClick={() => setEditRow(row)}
            className="btn btn-sm bg-soft-success text-success hover:bg-success hover:text-white flex items-center gap-1.5 text-xs font-medium border-0 transition-colors"
          >
            <SlidersHorizontal size={14} /> {t("settings.common.configureSeries")}
          </button>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="container-fluid py-4">
      <DataTable
        title={
          <div className="text-lg font-semibold">{t("settings.numbering.title")}</div>
        }
        columns={columns}
        rows={data}
        loading={loading}
        searchPlaceholder={t("settings.common.filterRecords")}
      />

      <Modal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        title={t("settings.numbering.configureTitle")}
        subtitle={t("settings.numbering.configureSubtitle", {
          module: editRow?.module_name ?? "",
        })}
        size="md"
        footer={
          <>
            <button
              type="submit"
              form="configure-series-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? t("settings.common.saving")
                : t("settings.common.saveConfiguration")}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => setEditRow(null)}
              disabled={saving}
            >
              {t("common.cancel")}
            </button>
          </>
        }
      >
        <form
          id="configure-series-form"
          className="form-grid form-grid-1"
          onSubmit={handleSave}
          noValidate
        >
          <FormFieldsRenderer
            fields={translatedConfigFields}
            values={values}
            errors={errors}
            onChange={handleFieldChange}
          />
        </form>
      </Modal>
    </div>
  );
}
