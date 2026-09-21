"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  buildInitialFormValues,
  FormFieldsRenderer,
} from "@/components/ui/FormFieldsRenderer";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import { useI18n, translateHrmsLookup } from "@/i18n";
import type { FormField } from "@/types/hrms";

type GenericAddModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  submitLabel?: string;
  fields?: FormField[];
};

const defaultFields: FormField[] = [
  { label: "Name", name: "name", required: true },
  { label: "Owner", name: "owner" },
  {
    label: "Status",
    name: "status",
    type: "select",
    options: ["Active", "Pending", "Approved"],
    required: true,
  },
  { label: "Notes", name: "notes", type: "textarea" },
];

export function GenericAddModal({
  open,
  onClose,
  title,
  subtitle,
  submitLabel = "Save & Continue",
  fields = defaultFields,
}: GenericAddModalProps) {
  const { language, t } = useI18n();
  const [values, setValues] = useState<Record<string, FormValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) {
      setErrors({});
      return;
    }
    setValues(buildInitialFormValues(fields));
    setErrors({});
  }, [open, fields]);

  const handleFieldChange = (name: string, value: FormValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    const field = fields.find((item) => item.name === name);
    if (!field) return;

    setErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(fields, values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onClose();
  };

  const isEditTitle = title.toLowerCase().startsWith("edit ");
  const isAddTitle = title.toLowerCase().startsWith("add ");

  let rawEntityName = title;
  if (isEditTitle) rawEntityName = title.replace(/^Edit\s+/i, "");
  else if (isAddTitle) rawEntityName = title.replace(/^Add\s+/i, "");

  const localizedEntityName = translateHrmsLookup(language, "titles", rawEntityName);

  let displayTitle = translateHrmsLookup(language, "titles", title);
  if (isEditTitle && displayTitle === title) {
    displayTitle = `${localizedEntityName} ${t("common.edit")}`;
  } else if (isAddTitle && displayTitle === title) {
    displayTitle = `${t("common.addNew")} ${localizedEntityName}`;
  }

  let defaultSubtitle = "";
  if (language === "bn") {
    defaultSubtitle = isEditTitle
      ? `${localizedEntityName} বিবরণ আপডেট করুন।`
      : `নতুন ${localizedEntityName} রেকর্ড তৈরি করুন।`;
  } else if (language === "hi") {
    defaultSubtitle = isEditTitle
      ? `${localizedEntityName} विवरण अपडेट करें।`
      : `नया ${localizedEntityName} रिकॉर्ड बनाएँ।`;
  } else if (language === "or") {
    defaultSubtitle = isEditTitle
      ? `${localizedEntityName} ବିବରଣୀ ଅପଡେଟ୍ କରନ୍ତୁ।`
      : `ନୂତନ ${localizedEntityName} ରେକର୍ଡ ତିଆରି କରନ୍ତୁ।`;
  } else {
    defaultSubtitle = isEditTitle
      ? `Update ${localizedEntityName.toLowerCase()} details.`
      : `Create a new ${localizedEntityName.toLowerCase()} record.`;
  }

  const displaySubtitle = subtitle ?? defaultSubtitle;

  const displaySubmitLabel =
    submitLabel === "Save & Continue" || submitLabel === "Save"
      ? t("common.save")
      : translateHrmsLookup(language, "actions", submitLabel);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={displayTitle}
      subtitle={displaySubtitle}
      size="lg"
      footer={
        <>
          <button type="submit" form="generic-add-form" className="btn btn-primary">
            {displaySubmitLabel}
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={onClose}>
            {t("common.close")}
          </button>
        </>
      }
    >
      <form id="generic-add-form" className="form-grid form-grid-2" onSubmit={handleSubmit} noValidate>
        <FormFieldsRenderer
          fields={fields}
          values={values}
          errors={errors}
          onChange={handleFieldChange}
        />
      </form>
    </Modal>
  );
}
