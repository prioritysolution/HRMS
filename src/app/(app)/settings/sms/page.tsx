"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, MessageSquare, Plus } from "lucide-react";
import { DataTable, ClampedText, type Column } from "@/components/ui/DataTable";
import { FormFieldLabel } from "@/components/ui/FormFieldLabel";
import { FormFieldsRenderer, buildInitialFormValues } from "@/components/ui/FormFieldsRenderer";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { StatusToggle } from "@/components/ui/StatusToggle";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import {
  applOptionService,
  applOptionsToSelectOptions,
} from "@/lib/api";
import {
  SMS_MESSAGE_TYPE_OPT_GRP_ID,
  smsConfigService,
  type SmsEventSetting,
  type SmsTemplate,
} from "@/lib/api/services/sms-config.service";
import { validateFormField, validateFormFields, type FormValue } from "@/lib/form-validation";
import { cn } from "@/lib/utils";
import type { FormField, HrmsRow } from "@/types/hrms";

const gatewayFieldsTop: FormField[] = [
  {
    label: "API URL",
    name: "api_url",
    type: "text",
    required: true,
    placeholder: "https://sms.prioritysolutions.in/api/v1/send",
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

const gatewayStatusField: FormField = {
  label: "Status",
  name: "status",
  type: "select",
  required: true,
  defaultValue: "1",
  options: [
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
  ],
};

function buildGatewayFieldsBottom(
  messageTypeOptions: Array<{ value: string; label: string }>,
): FormField[] {
  return [
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
      defaultValue: messageTypeOptions[0]?.value ?? "",
      options: messageTypeOptions,
    },
    gatewayStatusField,
  ];
}

function buildGatewayFields(
  messageTypeOptions: Array<{ value: string; label: string }>,
): FormField[] {
  return [
    ...gatewayFieldsTop,
    apiKeyField,
    ...buildGatewayFieldsBottom(messageTypeOptions),
  ];
}

function resolveMessageTypeValue(
  raw: string,
  options: Array<{ value: string; label: string }>,
): string {
  const text = String(raw ?? "").trim();
  if (!text) return options[0]?.value ?? "";
  const exact = options.find((option) => option.value === text);
  if (exact) return exact.value;
  const byValue = options.find(
    (option) => option.value.toLowerCase() === text.toLowerCase(),
  );
  if (byValue) return byValue.value;
  const byLabel = options.find(
    (option) => option.label.toLowerCase() === text.toLowerCase(),
  );
  if (byLabel) return byLabel.value;
  return text;
}

function buildTemplateFields(
  eventOptions: Array<{ value: string; label: string }>,
): FormField[] {
  return [
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
      name: "event_id",
      type: "select",
      required: true,
      options: eventOptions,
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
}

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
  const [gatewayExists, setGatewayExists] = useState(false);
  const [messageTypeOptions, setMessageTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const gatewayFields = useMemo(
    () => buildGatewayFields(messageTypeOptions),
    [messageTypeOptions],
  );
  const gatewayFieldsBottom = useMemo(
    () => buildGatewayFieldsBottom(messageTypeOptions),
    [messageTypeOptions],
  );

  const [gatewayValues, setGatewayValues] = useState<Record<string, FormValue>>(() =>
    buildInitialFormValues(buildGatewayFields([])),
  );
  const [gatewayErrors, setGatewayErrors] = useState<Record<string, string>>({});
  const [events, setEvents] = useState<SmsEventSetting[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<SmsTemplate | null>(null);
  const [templateValues, setTemplateValues] = useState<Record<string, FormValue>>({});
  const [templateErrors, setTemplateErrors] = useState<Record<string, string>>({});

  const eventOptions = useMemo(
    () =>
      events
        .filter((item) => item.event_id > 0)
        .map((item) => ({
          value: String(item.event_id),
          label: item.label,
        })),
    [events],
  );

  const templateFields = useMemo(
    () => buildTemplateFields(eventOptions),
    [eventOptions],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gatewayResult, eventsResult, templatesResult, messageTypeOpts] =
        await Promise.all([
          smsConfigService.getGateway(),
          smsConfigService.getEvents(),
          smsConfigService.listTemplates(),
          applOptionService.list({
            opt_grp_id: SMS_MESSAGE_TYPE_OPT_GRP_ID,
            is_active: 1,
          }),
        ]);

      const mappedMessageTypes = applOptionsToSelectOptions(messageTypeOpts);
      setMessageTypeOptions(mappedMessageTypes);
      const fields = buildGatewayFields(mappedMessageTypes);

      if (!gatewayResult.ok && !gatewayResult.data) {
        toast.error({
          title: "Unable to load gateway",
          message: gatewayResult.message,
        });
      } else if (gatewayResult.data) {
        setGatewayExists(Boolean(gatewayResult.data.exists));
        setGatewayValues(
          buildInitialFormValues(fields, {
            id: "sms-gateway",
            ...gatewayResult.data,
            message_type: resolveMessageTypeValue(
              gatewayResult.data.message_type,
              mappedMessageTypes,
            ),
            status: String(gatewayResult.data.status),
            api_key: isMaskedSecret(gatewayResult.data.api_key)
              ? ""
              : gatewayResult.data.api_key,
          }),
        );
      } else {
        setGatewayValues(buildInitialFormValues(fields));
      }

      if (!eventsResult.ok) {
        toast.error({
          title: "Unable to load events",
          message: eventsResult.message,
        });
      } else if (eventsResult.data) {
        setEvents(eventsResult.data);
      }

      if (!templatesResult.ok) {
        toast.error({
          title: "Unable to load templates",
          message: templatesResult.message,
        });
      } else if (templatesResult.data) {
        setTemplates(templatesResult.data);
      }
    } catch (error) {
      toast.error({
        title: "Unable to load settings",
        message:
          error instanceof Error
            ? error.message
            : "Failed to load SMS configuration. Please try again.",
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
          event_id: String(editTemplate.event_id || ""),
          status: String(editTemplate.status),
        }),
      );
    } else {
      setTemplateValues(buildInitialFormValues(templateFields));
    }
    setTemplateErrors({});
  }, [templateModalOpen, editTemplate, templateFields]);

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
    const fieldsForValidation = gatewayExists
      ? gatewayFields
      : gatewayFields.map((field) =>
          field.name === "api_key" ? { ...field, required: true } : field,
        );
    const nextErrors = validateFormFields(fieldsForValidation, gatewayValues);
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
      const result = await smsConfigService.saveGateway({
        api_url: String(gatewayValues.api_url ?? "").trim(),
        api_key: String(gatewayValues.api_key ?? "").trim(),
        sender_id: String(gatewayValues.sender_id ?? "").trim(),
        message_type: String(gatewayValues.message_type ?? "").trim(),
        status: toStatus(gatewayValues.status),
        exists: gatewayExists,
      });
      if (!result.ok || !result.data) {
        toast.error({ title: "Save failed", message: result.message });
        return;
      }
      setGatewayExists(true);
      setGatewayValues(
        buildInitialFormValues(gatewayFields, {
          id: "sms-gateway",
          ...result.data,
          message_type: resolveMessageTypeValue(
            result.data.message_type,
            messageTypeOptions,
          ),
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

    const eventId = Number(templateValues.event_id);
    if (!Number.isFinite(eventId) || eventId <= 0) {
      setTemplateErrors((prev) => ({ ...prev, event_id: "Select an event." }));
      toast.error({
        title: "Validation error",
        message: "Please select a valid SMS event.",
      });
      return;
    }

    const payload = {
      template_name: String(templateValues.template_name ?? "").trim(),
      event_id: eventId,
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
        render: (row) => <ClampedText text={String(row.message_template ?? "")} />,
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
                  <FormFieldLabel
                    htmlFor="api_key"
                    label={apiKeyField.label}
                    required={!gatewayExists}
                  />
                  <div className="ess-password-input-wrap">
                    <input
                      id="api_key"
                      name="api_key"
                      type={showApiKey ? "text" : "password"}
                      className="form-control"
                      value={typeof gatewayValues.api_key === "string" ? gatewayValues.api_key : ""}
                      placeholder={
                        gatewayExists
                          ? apiKeyField.placeholder
                          : "Enter SMS API key"
                      }
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
                    {savingGateway
                      ? "Saving..."
                      : gatewayExists
                        ? "Save Gateway"
                        : "Create Gateway"}
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
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No SMS events available from the server.
                    </p>
                  ) : (
                    events.map((item) => (
                      <div
                        key={item.event_id || item.event_code}
                        className="notification-option"
                      >
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
                          name={`sms-event-${item.event_id || item.event_code}`}
                          value={String(item.enabled)}
                          onChange={(nextValue) =>
                            setEvents((prev) =>
                              prev.map((eventItem) =>
                                eventItem.event_id === item.event_id &&
                                eventItem.event_code === item.event_code
                                  ? {
                                      ...eventItem,
                                      enabled: nextValue === "0" ? 0 : 1,
                                    }
                                  : eventItem,
                              ),
                            )
                          }
                          disabled={savingEvents}
                        />
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={savingEvents || events.length === 0}
                  >
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
                    disabled={eventOptions.length === 0}
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
