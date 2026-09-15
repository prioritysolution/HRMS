"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, MessageSquare, Plus } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
import { FormFieldsRenderer, buildInitialFormValues } from "@/components/ui/FormFieldsRenderer";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import type { SmsEventSetting, SmsTemplate } from "@/data/settings-mock";
import { smsConfigService } from "@/lib/api/services/sms-config.service";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { FormField, HrmsRow } from "@/types/hrms";

const gatewayFieldsTop: FormField[] = [
  {
    label: "API URL",
    name: "api_url",
    type: "text",
    required: true,
    placeholder: "https://sms.example.com/api/v1/send",
  },
];

const apiKeyField: FormField = {
  label: "API Key",
  name: "api_key",
  type: "password",
  required: false,
  minLength: 4,
  placeholder: "Enter SMS API key (leave blank to keep current)",
};

const gatewayFieldsBottom: FormField[] = [
  {
    label: "Sender ID",
    name: "sender_id",
    type: "text",
    required: true,
    minLength: 3,
    maxLength: 12,
    placeholder: "PRISOL",
  },
  {
    label: "Message Type",
    name: "message_type",
    type: "select",
    required: true,
    defaultValue: "transactional",
    options: [
      { value: "transactional", label: "Transactional" },
      { value: "promotional", label: "Promotional" },
    ],
  },
  {
    label: "Status",
    name: "status",
    type: "select",
    required: true,
    defaultValue: "1",
    options: [
      { value: "1", label: "Active" },
      { value: "0", label: "Inactive" },
    ],
  },
];

const gatewayFields: FormField[] = [...gatewayFieldsTop, apiKeyField, ...gatewayFieldsBottom];

const templateFields: FormField[] = [
  {
    label: "Template Name",
    name: "template_name",
    type: "text",
    required: true,
    minLength: 2,
    maxLength: 100,
    placeholder: "Salary Processed",
  },
  {
    label: "Event",
    name: "event",
    type: "select",
    required: true,
    options: [
      { value: "Joining", label: "Joining" },
      { value: "Salary", label: "Salary" },
      { value: "Leave", label: "Leave" },
      { value: "Attendance", label: "Attendance" },
    ],
  },
  {
    label: "Message Template",
    name: "message_template",
    type: "textarea",
    required: true,
    span: "full",
    minLength: 10,
    maxLength: 500,
    placeholder: "Dear {EmployeeName}, ...",
  },
  {
    label: "Status",
    name: "status",
    type: "select",
    required: true,
    defaultValue: "1",
    options: [
      { value: "1", label: "Active" },
      { value: "0", label: "Inactive" },
    ],
  },
];

function isMaskedSecret(value: string): boolean {
  if (!value) return false;
  return /^\*+$|^•+$|^x+$/i.test(value) || /[•*]{4,}/.test(value);
}

function toStatus(value: FormValue): 0 | 1 {
  return String(value ?? "").trim() === "0" ? 0 : 1;
}

export default function SmsConfigPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [savingGateway, setSavingGateway] = useState(false);
  const [savingEvents, setSavingEvents] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [gatewayValues, setGatewayValues] = useState<Record<string, FormValue>>(() =>
    buildInitialFormValues(gatewayFields),
  );
  const [gatewayErrors, setGatewayErrors] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<SmsEventSetting[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<SmsTemplate | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, FormValue>>(() =>
    buildInitialFormValues(templateFields),
  );
  const [templateErrors, setTemplateErrors] = useState<Record<string, string>>({});

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gatewayResult, eventsResult, templatesResult] = await Promise.all([
        smsConfigService.getGateway(),
        smsConfigService.getEvents(),
        smsConfigService.listTemplates(),
      ]);

      if (gatewayResult.data) {
        setGatewayValues(
          buildInitialFormValues(gatewayFields, {
            id: "sms-gateway",
            ...gatewayResult.data,
            status: String(gatewayResult.data.status),
            // Never seed masked demo secrets into the editable field
            api_key: isMaskedSecret(gatewayResult.data.api_key) ? "" : gatewayResult.data.api_key,
          }),
        );
      }
      if (eventsResult.data) setEvents(eventsResult.data);
      if (templatesResult.data) setTemplates(templatesResult.data);
    } catch {
      toast.error({
        title: "Unable to load settings",
        message: "Failed to load SMS configuration. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!templateModalOpen) {
      setEditTemplate(null);
      setTemplateValues(buildInitialFormValues(templateFields));
      setTemplateErrors({});
      return;
    }
    if (editTemplate) {
      setTemplateValues(
        buildInitialFormValues(templateFields, {
          ...(editTemplate as unknown as HrmsRow),
          status: String(editTemplate.status),
        }),
      );
    } else {
      setTemplateValues(buildInitialFormValues(templateFields));
    }
    setTemplateErrors({});
  }, [templateModalOpen, editTemplate]);

  const handleGatewayChange = (name: string, value: FormValue) => {
    setGatewayValues((prev) => ({ ...prev, [name]: value }));
    const field = gatewayFields.find((item) => item.name === name);
    if (!field) return;
    setGatewayErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const handleSaveGateway = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(gatewayFields, gatewayValues);
    if (Object.keys(nextErrors).length > 0) {
      setGatewayErrors(nextErrors);
      toast.error({
        title: "Validation error",
        message: "Please fill all mandatory gateway fields.",
      });
      return;
    }

    setSavingGateway(true);
    try {
      const result = await smsConfigService.updateGateway({
        api_url: String(gatewayValues.api_url ?? "").trim(),
        api_key: String(gatewayValues.api_key ?? "").trim(),
        sender_id: String(gatewayValues.sender_id ?? "").trim(),
        message_type:
          String(gatewayValues.message_type ?? "transactional") === "promotional"
            ? "promotional"
            : "transactional",
        status: toStatus(gatewayValues.status),
      });
      if (!result.ok || !result.data) {
        toast.error({ title: "Save failed", message: result.message });
        return;
      }
      setGatewayValues(
        buildInitialFormValues(gatewayFields, {
          id: "sms-gateway",
          ...result.data,
          status: String(result.data.status),
          api_key: String(gatewayValues.api_key ?? ""),
        }),
      );
      toast.success({ title: "Saved", message: result.message });
    } catch {
      toast.error({
        title: "Save failed",
        message: "Failed to save SMS gateway configuration.",
      });
    } finally {
      setSavingGateway(false);
    }
  };

  const handleSaveEvents = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingEvents(true);
    try {
      const result = await smsConfigService.updateEvents(events);
      if (!result.ok || !result.data) {
        toast.error({ title: "Save failed", message: result.message });
        return;
      }
      setEvents(result.data);
      toast.success({ title: "Saved", message: result.message });
    } catch {
      toast.error({
        title: "Save failed",
        message: "Failed to save SMS event settings.",
      });
    } finally {
      setSavingEvents(false);
    }
  };

  const handleTemplateChange = (name: string, value: FormValue) => {
    setTemplateValues((prev) => ({ ...prev, [name]: value }));
    const field = templateFields.find((item) => item.name === name);
    if (!field) return;
    setTemplateErrors((prev) => {
      const next = { ...prev };
      const error = validateFormField(field, value);
      if (error) next[name] = error;
      else delete next[name];
      return next;
    });
  };

  const openAddTemplate = () => {
    setEditTemplate(null);
    setTemplateModalOpen(true);
  };

  const openEditTemplate = (row: SmsTemplate) => {
    setEditTemplate(row);
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateFormFields(templateFields, templateValues);
    if (Object.keys(nextErrors).length > 0) {
      setTemplateErrors(nextErrors);
      toast.error({
        title: "Validation error",
        message: "Please fill all mandatory template fields.",
      });
      return;
    }

    const payload = {
      template_name: String(templateValues.template_name ?? "").trim(),
      event: String(templateValues.event ?? "").trim(),
      message_template: String(templateValues.message_template ?? "").trim(),
      status: toStatus(templateValues.status),
    };

    setSavingTemplate(true);
    try {
      const result = editTemplate
        ? await smsConfigService.updateTemplate(editTemplate.id, payload)
        : await smsConfigService.createTemplate(payload);

      if (!result.ok) {
        toast.error({ title: "Save failed", message: result.message });
        return;
      }

      const list = await smsConfigService.listTemplates();
      if (list.data) setTemplates(list.data);
      setTemplateModalOpen(false);
      toast.success({ title: "Saved", message: result.message });
    } catch {
      toast.error({
        title: "Save failed",
        message: "Failed to save SMS template.",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (row: SmsTemplate) => {
    try {
      const result = await smsConfigService.removeTemplate(row.id);
      if (!result.ok) {
        toast.error({ title: "Delete failed", message: result.message });
        return;
      }
      setTemplates((prev) => prev.filter((item) => item.id !== row.id));
      toast.success({ title: "Deleted", message: result.message });
    } catch {
      toast.error({
        title: "Delete failed",
        message: "Failed to delete SMS template.",
      });
    }
  };

  const templateColumns = useMemo<Column<SmsTemplate>[]>(
    () => [
      {
        key: "template_name",
        header: "TEMPLATE NAME",
        render: (row) => row.template_name,
      },
      {
        key: "event",
        header: "EVENT",
        render: (row) => row.event,
      },
      {
        key: "message_template",
        header: "MESSAGE TEMPLATE",
        render: (row) => {
          const text = row.message_template;
          const preview = text.length > 56 ? `${text.slice(0, 56)}…` : text;
          return (
            <span title={text} className="text-sm text-muted-foreground">
              {preview}
            </span>
          );
        },
      },
      {
        key: "status",
        header: "STATUS",
        render: (row) => (
          <StatusBadge
            label={row.status === 1 ? "Active" : "Inactive"}
            tone={statusTone(row.status === 1 ? "Active" : "Inactive")}
          />
        ),
      },
    ],
    [],
  );

  const apiKeyError = gatewayErrors.api_key;

  return (
    <>
      <PageHeader title="SMS Configuration" section="Settings" hideTitle />

      {loading ? (
        <div className="container-fluid">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="SMS Configuration" />
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>Loading SMS configuration…</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-fluid space-y-4">
          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="Gateway Configuration" />

              <form
                id="sms-gateway-form"
                className="form-grid form-grid-2"
                onSubmit={(event) => void handleSaveGateway(event)}
                noValidate
              >
                <FormFieldsRenderer
                  fields={gatewayFieldsTop}
                  values={gatewayValues}
                  errors={gatewayErrors}
                  onChange={handleGatewayChange}
                />

                <div className={cn("form-field", apiKeyError && "is-invalid")}>
                  <FormFieldLabel htmlFor="api_key" label={apiKeyField.label} required />
                  <div className="ess-password-input-wrap">
                    <input
                      id="api_key"
                      name="api_key"
                      type={showApiKey ? "text" : "password"}
                      className="form-control"
                      value={typeof gatewayValues.api_key === "string" ? gatewayValues.api_key : ""}
                      placeholder={apiKeyField.placeholder}
                      autoComplete="new-password"
                      onChange={(event) => handleGatewayChange("api_key", event.target.value)}
                    />
                    <button
                      type="button"
                      className="ess-password-toggle"
                      onClick={() => setShowApiKey((visible) => !visible)}
                      aria-label={showApiKey ? "Hide API key" : "Show API key"}
                    >
                      {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {apiKeyError ? (
                    <p className="form-field-error" role="alert">
                      {apiKeyError}
                    </p>
                  ) : null}
                </div>

                <FormFieldsRenderer
                  fields={gatewayFieldsBottom}
                  values={gatewayValues}
                  errors={gatewayErrors}
                  onChange={handleGatewayChange}
                />

                <div className="form-span-full flex justify-end pt-2">
                  <button type="submit" className="btn btn-primary" disabled={savingGateway}>
                    {savingGateway ? "Saving..." : "Save Gateway"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <TableSectionHeader title="SMS Event Settings" />

              <form id="sms-events-form" onSubmit={(event) => void handleSaveEvents(event)}>
                <div className="notification-option-list">
                  {events.map((item) => (
                    <div key={item.key} className="notification-option">
                      <div className="notification-option-main">
                        <div className="avatar avatar-soft-primary">
                          <MessageSquare size={18} />
                        </div>
                        <div className="notification-option-copy">
                          <h6>{item.label}</h6>
                          <p>{item.description}</p>
                        </div>
                      </div>
                      <StatusToggle
                        name={item.key}
                        value={String(item.enabled)}
                        onChange={(nextValue) =>
                          setEvents((prev) =>
                            prev.map((eventItem) =>
                              eventItem.key === item.key
                                ? { ...eventItem, enabled: nextValue === "0" ? 0 : 1 }
                                : eventItem,
                            ),
                          )
                        }
                        disabled={savingEvents}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="btn btn-primary" disabled={savingEvents}>
                    {savingEvents ? "Saving..." : "Save Event Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <TableSectionHeader
                title="SMS Template Setup"
                action={
                  <button
                    type="button"
                    className="btn btn-primary inline-flex items-center gap-2"
                    onClick={openAddTemplate}
                  >
                    <Plus size={16} />
                    Add Template
                  </button>
                }
              />

              <DataTable
                columns={templateColumns}
                rows={templates}
                searchPlaceholder="Search templates..."
                showRowActions
                onRowEdit={openEditTemplate}
                onRowDelete={handleDeleteTemplate}
              />
            </div>
          </div>
        </div>
      )}

      <Modal
        open={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title={editTemplate ? "Edit SMS Template" : "Add SMS Template"}
        subtitle="Configure the SMS message body and linked event."
        size="md"
        footer={
          <>
            <button
              type="submit"
              form="sms-template-form"
              className="btn btn-primary"
              disabled={savingTemplate}
            >
              {savingTemplate ? "Saving..." : "Save Template"}
            </button>
            <button
              type="button"
              className="btn btn-outline-danger"
              onClick={() => setTemplateModalOpen(false)}
              disabled={savingTemplate}
            >
              Cancel
            </button>
          </>
        }
      >
        <form
          id="sms-template-form"
          className="form-grid form-grid-2"
          onSubmit={(event) => void handleSaveTemplate(event)}
          noValidate
        >
          <FormFieldsRenderer
            fields={templateFields}
            values={templateValues}
            errors={templateErrors}
            onChange={handleTemplateChange}
          />
        </form>
      </Modal>
    </>
  );
}
