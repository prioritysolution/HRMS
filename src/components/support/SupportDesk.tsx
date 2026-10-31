"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, ImagePlus, Send, X } from "lucide-react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/auth/AuthProvider";
import { authService } from "@/lib/api/services/auth.service";
import { readSignedInSupportPhone } from "@/lib/support/phone";
import { useI18n } from "@/i18n";
import {
  SupportError,
  ensureSupportClientToken,
  filesToScreenshots,
  firstFieldErrors,
  getSupportApiKey,
  getSupportDomain,
  readSupportSession,
  requestSupportClientToken,
  saveSupportSession,
  supportFetch,
  type SupportMessage,
  type SupportPriority,
  type SupportStatus,
  type SupportTicket,
  type SupportTicketList,
} from "@/lib/support/client";
import { useSupportLive } from "@/components/support/SupportLive";

const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

type View = "list" | "create" | "thread";

type Filters = {
  search: string;
  status: "" | SupportStatus;
  priority: "" | SupportPriority;
  fromDate: string;
  toDate: string;
  page: number;
  pageSize: number;
};

const emptyFilters: Filters = {
  search: "",
  status: "",
  priority: "",
  fromDate: "",
  toDate: "",
  page: 1,
  pageSize: 10,
};

function statusToneFor(status: SupportStatus) {
  if (status === "OPEN") return "primary" as const;
  if (status === "IN_PROGRESS") return "warning" as const;
  return "danger" as const;
}

function priorityTone(priority: SupportPriority) {
  if (priority === "URGENT") return "danger" as const;
  if (priority === "HIGH") return "warning" as const;
  if (priority === "LOW") return "info" as const;
  return "success" as const;
}

export function SupportPage() {
  const { user, ready } = useAuth();
  const signedInPhone = readSignedInSupportPhone();

  return (
    <SupportWorkspace
      defaultName={user?.name ?? ""}
      defaultEmail={user?.email && user.email.includes("@") ? user.email : ""}
      signedInPhone={signedInPhone}
      authReady={ready}
    />
  );
}

function SupportWorkspace({
  defaultName,
  defaultEmail,
  signedInPhone,
  authReady,
}: {
  defaultName: string;
  defaultEmail: string;
  signedInPhone: string;
  authReady: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketFromUrl = searchParams.get("ticket");
  const openedTicketRef = useRef("");
  const domain = getSupportDomain();
  const [view, setView] = useState<View>("list");
  const [projectName, setProjectName] = useState("");
  const [projectError, setProjectError] = useState("");
  const [token, setToken] = useState("");
  const [phone, setPhone] = useState("");
  const [lookupPhone, setLookupPhone] = useState(signedInPhone);
  const [projectReady, setProjectReady] = useState(false);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [list, setList] = useState<SupportTicketList | null>(null);
  const [listError, setListError] = useState("");
  const [listLoading, setListLoading] = useState(false);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [activeNumber, setActiveNumber] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [threadError, setThreadError] = useState("");
  const { connected, notices, setOpenNumber, subscribe, clearTicket } = useSupportLive();
  const unreadNumbers = useMemo(
    () => new Set(notices.filter((notice) => notice.unread && notice.number).map((notice) => notice.number)),
    [notices],
  );
  const [notice, setNotice] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const filtersRef = useRef(filters);
  const ticketNumberRef = useRef<string | null>(null);
  filtersRef.current = filters;
  ticketNumberRef.current = view === "thread" ? activeNumber : null;

  const loadList = useCallback(
    async (nextFilters: Filters, nextToken = token, nextPhone = phone, retried = false) => {
      if (!nextToken || !nextPhone) {
        setList(null);
        return;
      }
      setListLoading(true);
      setListError("");
      const params = new URLSearchParams({
        phone: nextPhone,
        page: String(nextFilters.page),
        pageSize: String(nextFilters.pageSize),
      });
      if (nextFilters.search.trim()) params.set("search", nextFilters.search.trim());
      if (nextFilters.status) params.set("status", nextFilters.status);
      if (nextFilters.priority) params.set("priority", nextFilters.priority);
      if (nextFilters.fromDate) params.set("fromDate", nextFilters.fromDate);
      if (nextFilters.toDate) params.set("toDate", nextFilters.toDate);

      try {
        const result = await supportFetch<SupportTicketList>(
          `/integrations/redirect/tickets?${params.toString()}`,
          { token: nextToken },
        );
        setList(result.data);
      } catch (error) {
        const mobile = readSignedInSupportPhone() || nextPhone;
        if (error instanceof SupportError && error.status === 401 && !retried && mobile) {
          try {
            const session = await requestSupportClientToken(mobile, domain);
            setToken(session.token);
            setPhone(session.phone);
            await loadList(nextFilters, session.token, session.phone, true);
            return;
          } catch (refreshError) {
            setListError(refreshError instanceof Error ? refreshError.message : t("topbar.supportLoadFailed"));
            return;
          }
        }
        setListError(error instanceof Error ? error.message : t("topbar.supportLoadFailed"));
      } finally {
        setListLoading(false);
      }
    },
    [domain, phone, t, token],
  );

  const loadTicket = useCallback(
    async (number: string, nextToken = token, nextPhone = phone) => {
      if (!nextToken || !nextPhone) return;
      const result = await supportFetch<SupportTicket>(
        `/integrations/redirect/tickets/${encodeURIComponent(number)}?phone=${encodeURIComponent(nextPhone)}`,
        { token: nextToken },
      );
      setTicket(result.data);
    },
    [phone, token],
  );

  const loadMessages = useCallback(
    async (number: string, nextToken = token, nextPhone = phone) => {
      if (!nextToken || !nextPhone) return;
      const result = await supportFetch<SupportMessage[]>(
        `/integrations/redirect/tickets/${encodeURIComponent(number)}/messages?phone=${encodeURIComponent(nextPhone)}`,
        { token: nextToken },
      );
      setMessages(result.data);
    },
    [phone, token],
  );

  const loadersRef = useRef({ loadList, loadTicket, loadMessages });
  loadersRef.current = { loadList, loadTicket, loadMessages };

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    if (!getSupportApiKey()) {
      setProjectError(t("topbar.supportNoKey"));
      return;
    }

    async function start() {
      setListLoading(true);
      setProjectReady(false);
      try {
        const project = await supportFetch<{ name: string; domain: string }>(
          `/integrations/redirect/project?domain=${encodeURIComponent(domain)}`,
        );
        if (cancelled) return;
        setProjectName(project.data.name);
        setProjectError("");
        setProjectReady(true);
      } catch (error: unknown) {
        if (cancelled) return;
        setProjectError(error instanceof Error ? error.message : t("topbar.supportLoadFailed"));
        setListLoading(false);
        return;
      }

      let mobile = readSignedInSupportPhone() || signedInPhone;
      if (!mobile) {
        const profile = await authService.getMeProfile();
        if (cancelled) return;
        mobile = profile?.mobile?.trim() || readSignedInSupportPhone();
      }
      if (!mobile) {
        const session = readSupportSession(domain);
        mobile = session.phone;
      }
      if (cancelled) return;
      if (mobile) setLookupPhone(mobile);
      else setListLoading(false);
    }

    void start();
    return () => {
      cancelled = true;
    };
  }, [authReady, domain, signedInPhone, t]);

  useEffect(() => {
    if (signedInPhone) setLookupPhone(signedInPhone);
  }, [signedInPhone]);

  useEffect(() => {
    if (!authReady || !projectReady || projectError) return;
    const mobile = lookupPhone.trim();
    if (!mobile) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const session = await ensureSupportClientToken(mobile, domain);
          if (cancelled) return;
          setToken(session.token);
          setPhone(session.phone);
          setListError("");
          await loadersRef.current.loadList(filtersRef.current, session.token, session.phone);
        } catch (error: unknown) {
          if (cancelled) return;
          setListError(error instanceof Error ? error.message : t("topbar.supportLoadFailed"));
          setListLoading(false);
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [authReady, domain, lookupPhone, projectError, projectReady, t]);

  const handleServerQuery = useCallback((query: { search: string; filters: Record<string, string> }) => {
    const search = query.search.trim();
    const status = (query.filters.status ?? "") as Filters["status"];
    const priority = (query.filters.priority ?? "") as Filters["priority"];
    setFilters((current) => {
      if (current.search === search && current.status === status && current.priority === priority) {
        return current;
      }
      return { ...current, search, status, priority, page: 1 };
    });
  }, []);

  useEffect(() => {
    if (!token || !phone || projectError) return;
    const timer = window.setTimeout(() => {
      void loadList(filters);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [filters, loadList, phone, projectError, token]);

  useEffect(() => {
    setOpenNumber(view === "thread" ? activeNumber : null);
    return () => setOpenNumber(null);
  }, [activeNumber, setOpenNumber, view]);

  useEffect(() => {
    const waiting = new Set<string>();
    let timer = 0;
    let latestNumber = "";

    const unsubscribe = subscribe((event) => {
      if (event.number) latestNumber = event.number;
      for (const section of event.refresh ?? []) waiting.add(section);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const sections = [...waiting];
        waiting.clear();
        const number = latestNumber || ticketNumberRef.current || "";
        if (sections.includes("tickets") || number) void loadersRef.current.loadList(filtersRef.current);
        if (number && ticketNumberRef.current === number) {
          if (sections.includes("messages")) void loadersRef.current.loadMessages(number);
          if (sections.includes("ticket")) void loadersRef.current.loadTicket(number);
        }
      }, 300);
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [subscribe]);

  const openTicket = useCallback(async (number: string) => {
    clearTicket(number);
    setView("thread");
    setActiveNumber(number);
    setThreadError("");
    setTicket(null);
    setMessages([]);
    try {
      await Promise.all([loadTicket(number), loadMessages(number)]);
    } catch (error) {
      setThreadError(error instanceof Error ? error.message : t("topbar.supportLoadFailed"));
    }
  }, [clearTicket, loadMessages, loadTicket, t]);

  useEffect(() => {
    if (!ticketFromUrl || !token || openedTicketRef.current === ticketFromUrl) return;
    openedTicketRef.current = ticketFromUrl;
    void openTicket(ticketFromUrl);
  }, [openTicket, ticketFromUrl, token]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const number = (event as CustomEvent<string>).detail;
      if (!number || openedTicketRef.current === number) return;
      openedTicketRef.current = number;
      void openTicket(number);
    };
    window.addEventListener("support-open-ticket", onOpen);
    return () => window.removeEventListener("support-open-ticket", onOpen);
  }, [openTicket]);

  const columns = useMemo<Column<SupportTicketList["items"][number]>[]>(
    () => [
      {
        key: "number",
        header: t("topbar.supportNumber"),
        render: (row) => (
          <span className="inline-flex items-center gap-2">
            {row.number}
            {unreadNumbers.has(row.number) ? (
              <span className="support-row-badge">{t("topbar.supportNewReply")}</span>
            ) : null}
          </span>
        ),
      },
      {
        key: "subject",
        header: t("topbar.supportSubject"),
        render: (row) => row.subject,
      },
      {
        key: "priority",
        header: t("topbar.supportPriority"),
        render: (row) => <StatusBadge label={labelPriority(t, row.priority)} tone={priorityTone(row.priority)} />,
      },
      {
        key: "status",
        header: t("topbar.supportStatus"),
        render: (row) => <StatusBadge label={labelStatus(t, row.status)} tone={statusToneFor(row.status)} />,
      },
      {
        key: "remark",
        header: t("topbar.supportRemark"),
        render: (row) => row.remark || "—",
      },
      {
        key: "createdAt",
        header: t("topbar.supportRaisedOn"),
        render: (row) => row.createdAt,
      },
    ],
    [t, unreadNumbers],
  );

  const filterFields = useMemo(
    () => [
      {
        key: "status",
        label: t("topbar.supportStatus"),
        options: [
          { value: "OPEN", label: t("topbar.supportStatusOpen") },
          { value: "IN_PROGRESS", label: t("topbar.supportStatusProgress") },
          { value: "CLOSED", label: t("topbar.supportStatusClosed") },
        ],
      },
      {
        key: "priority",
        label: t("topbar.supportPriority"),
        options: [
          { value: "URGENT", label: t("topbar.supportUrgent") },
          { value: "HIGH", label: t("topbar.supportHigh") },
          { value: "MEDIUM", label: t("topbar.supportMedium") },
          { value: "LOW", label: t("topbar.supportLow") },
        ],
      },
    ],
    [t],
  );

  const closeThread = () => {
    openedTicketRef.current = "";
    setView("list");
    setActiveNumber(null);
    setTicket(null);
    setThreadError("");
    if (ticketFromUrl) router.replace("/support");
  };

  return (
    <>
      <PageHeader title={t("topbar.support")} section={t("topbar.support")} hideTitle />
      <div className="container-fluid">
        {projectError || listError || notice ? (
          <div className="card mb-4">
            <div className="card-body">
              <p className="form-field-error m-0">{projectError || listError || notice}</p>
            </div>
          </div>
        ) : null}

        <DataTable
          title={
            <span className="inline-flex items-center gap-2">
              {t("topbar.support")}
              {connected ? <span className="support-live">{t("topbar.supportLive")}</span> : null}
            </span>
          }
          columns={columns}
          rows={list?.items ?? []}
          getRowClassName={(row) => (unreadNumbers.has(row.number) ? "support-row-updated" : undefined)}
          loading={listLoading && Boolean(token)}
          searchPlaceholder={t("topbar.supportSearch")}
          searchKeys={["number", "subject", "remark"]}
          filterFields={filterFields}
          onServerQueryChange={projectError ? undefined : handleServerQuery}
          onFiltersReset={() =>
            setFilters((current) =>
              current.fromDate || current.toDate ? { ...current, fromDate: "", toDate: "", page: 1 } : current,
            )
          }
          filterExtra={
            <>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="support-phone-lookup">
                  {t("topbar.supportPhone")}
                </label>
                <input
                  id="support-phone-lookup"
                  className="form-control"
                  value={lookupPhone}
                  maxLength={30}
                  onChange={(event) => setLookupPhone(event.target.value)}
                />
              </div>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="support-from">
                  {t("topbar.supportFrom")}
                </label>
                <input
                  id="support-from"
                  type="date"
                  className="form-control"
                  value={filters.fromDate}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, fromDate: event.target.value, page: 1 }))
                  }
                />
              </div>
              <div className="table-filter-item">
                <label className="table-filter-label" htmlFor="support-to">
                  {t("topbar.supportTo")}
                </label>
                <input
                  id="support-to"
                  type="date"
                  className="form-control"
                  value={filters.toDate}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, toDate: event.target.value, page: 1 }))
                  }
                />
              </div>
            </>
          }
          actionLabel={t("topbar.supportRaise")}
          onAction={() => {
            setNotice("");
            setView("create");
          }}
          showRowActions
          renderRowActions={(row) => (
            <div className="table-actions">
              <button
                type="button"
                className="btn-action btn-action-edit"
                aria-label={t("topbar.supportView")}
                onClick={() => void openTicket(row.number)}
              >
                <Eye size={16} strokeWidth={2.25} />
              </button>
            </div>
          )}
          serverPagination={{
            page: filters.page,
            pageSize: filters.pageSize,
            total: token ? (list?.total ?? 0) : 0,
            onPageChange: (page) => setFilters((current) => ({ ...current, page })),
            onPageSizeChange: (pageSize) => setFilters((current) => ({ ...current, pageSize, page: 1 })),
          }}
          emptyStateTitle={projectError || listError || (lookupPhone.trim() ? t("topbar.supportNone") : t("topbar.supportEmpty"))}
          emptyStateMessage={projectError || listError || (lookupPhone.trim() ? t("topbar.supportNone") : t("topbar.supportEmpty"))}
        />
      </div>

      <Modal
        open={view === "create"}
        onClose={() => setView("list")}
        title={t("topbar.supportRaise")}
        subtitle={projectName ? `${projectName} · ${domain}` : domain}
        size="lg"
        footer={
          <>
            <button type="submit" form="support-ticket-form" className="btn btn-primary" disabled={createBusy}>
              {createBusy ? t("topbar.supportSending") : t("topbar.supportSubmit")}
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={() => setView("list")}>
              {t("common.cancel")}
            </button>
          </>
        }
      >
        <CreateTicket
          domain={domain}
          defaultName={defaultName}
          defaultEmail={defaultEmail}
          defaultPhone={lookupPhone || phone || signedInPhone}
          notice={notice}
          onBusy={setCreateBusy}
          onPhoneChange={setLookupPhone}
          onCreated={(next) => {
            saveSupportSession({ token: next.token, phone: next.phone, domain });
            setToken(next.token);
            setPhone(next.phone);
            setNotice("");
            setFilters(emptyFilters);
            setView("list");
          }}
        />
      </Modal>

      <Modal
        open={view === "thread"}
        onClose={closeThread}
        title={ticket ? `${ticket.number} · ${ticket.subject}` : t("topbar.support")}
        subtitle={ticket ? labelStatus(t, ticket.status) : t("topbar.supportLoading")}
        size="xl"
        footer={
          <button type="button" className="btn btn-light" onClick={closeThread}>
            {t("common.close")}
          </button>
        }
      >
        {ticket ? (
          <TicketThread
            ticket={ticket}
            messages={messages}
            token={token}
            phone={phone}
            error={threadError}
            onSent={(message) => setMessages((current) => [...current, message])}
            onError={setThreadError}
          />
        ) : (
          <p className="m-0 text-[var(--muted)]">{threadError || t("topbar.supportLoading")}</p>
        )}
      </Modal>
    </>
  );
}

function CreateTicket({
  domain,
  defaultName,
  defaultEmail,
  defaultPhone,
  notice,
  onBusy,
  onPhoneChange,
  onCreated,
}: {
  domain: string;
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  notice: string;
  onBusy?: (busy: boolean) => void;
  onPhoneChange?: (phone: string) => void;
  onCreated: (session: { token: string; phone: string }) => void;
}) {
  const { t } = useI18n();
  const [customerName, setCustomerName] = useState(defaultName);
  const [customerPhone, setCustomerPhone] = useState(defaultPhone);
  useEffect(() => {
    if (defaultPhone) setCustomerPhone(defaultPhone);
  }, [defaultPhone]);
  const [customerEmail, setCustomerEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<SupportPriority>("MEDIUM");
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(notice);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    onBusy?.(submitting);
  }, [onBusy, submitting]);

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  const onFiles = (selected: FileList | null) => {
    const next = [...files, ...Array.from(selected ?? [])].slice(0, MAX_IMAGES);
    const invalid = next.find((file) => file.size > MAX_IMAGE_BYTES || !file.type.startsWith("image/"));
    if (invalid) {
      setFormError(t("topbar.supportImageRule"));
      return;
    }
    setFormError("");
    setFiles(next);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setErrors({});
    setSubmitting(true);
    try {
      const screenshots = files.length ? await filesToScreenshots(files) : undefined;
      const result = await supportFetch<{ accessToken: string }>("/integrations/redirect/tickets", {
        method: "POST",
        body: JSON.stringify({
          domain,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          ...(customerEmail.trim() ? { customerEmail: customerEmail.trim() } : {}),
          subject: subject.trim(),
          description: description.trim(),
          priority,
          ...(screenshots ? { screenshots } : {}),
        }),
      });
      onCreated({ token: result.data.accessToken, phone: customerPhone.trim() });
    } catch (error) {
      if (error instanceof SupportError) {
        setErrors(firstFieldErrors(error.errors));
        setFormError(error.message);
      } else {
        setFormError(t("topbar.supportLoadFailed"));
      }
      setSubmitting(false);
    }
  };

  return (
    <form id="support-ticket-form" className="form-grid form-grid-2" onSubmit={submit}>
      {formError ? <p className="form-field-error form-span-full m-0">{formError}</p> : null}
      <Field label={t("topbar.supportName")} error={errors.customerName} required>
        <input id="support-name" className="form-control" value={customerName} maxLength={150} onChange={(event) => setCustomerName(event.target.value)} required />
      </Field>
      <Field label={t("topbar.supportPhone")} error={errors.customerPhone} required>
        <input
          id="support-phone"
          className="form-control"
          value={customerPhone}
          maxLength={30}
          onChange={(event) => {
            setCustomerPhone(event.target.value);
            onPhoneChange?.(event.target.value);
          }}
          required
        />
      </Field>
      <Field label={t("topbar.supportEmail")} error={errors.customerEmail}>
        <input id="support-email" className="form-control" type="email" value={customerEmail} maxLength={255} onChange={(event) => setCustomerEmail(event.target.value)} />
      </Field>
      <Field label={t("topbar.supportPriority")} error={errors.priority}>
        <select id="support-priority" className="form-control" value={priority} onChange={(event) => setPriority(event.target.value as SupportPriority)}>
          <option value="LOW">{t("topbar.supportLow")}</option>
          <option value="MEDIUM">{t("topbar.supportMedium")}</option>
          <option value="HIGH">{t("topbar.supportHigh")}</option>
          <option value="URGENT">{t("topbar.supportUrgent")}</option>
        </select>
      </Field>
      <Field label={t("topbar.supportSubject")} error={errors.subject} required className="form-span-full">
        <input id="support-subject" className="form-control" value={subject} maxLength={255} onChange={(event) => setSubject(event.target.value)} required />
      </Field>
      <Field label={t("topbar.supportDescription")} error={errors.description} required className="form-span-full">
        <textarea id="support-description" className="form-control" rows={4} value={description} maxLength={4000} onChange={(event) => setDescription(event.target.value)} required />
      </Field>
      <div className="form-span-full">
        <ImagePicker files={previews} onFiles={onFiles} onRemove={(index) => setFiles((current) => current.filter((_, item) => item !== index))} />
      </div>
    </form>
  );
}

function TicketThread({
  ticket,
  messages,
  token,
  phone,
  error,
  onSent,
  onError,
}: {
  ticket: SupportTicket;
  messages: SupportMessage[];
  token: string;
  phone: string;
  error: string;
  onSent: (message: SupportMessage) => void;
  onError: (message: string) => void;
}) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const closed = ticket.status === "CLOSED";
  const scroller = useRef<HTMLDivElement>(null);

  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    if (closed || sending) return;
    if (!text.trim() && files.length === 0) {
      onError(t("topbar.supportReplyRequired"));
      return;
    }
    setSending(true);
    onError("");
    try {
      const screenshots = files.length ? await filesToScreenshots(files) : undefined;
      const result = await supportFetch<SupportMessage>(
        `/integrations/redirect/tickets/${encodeURIComponent(ticket.number)}/messages?phone=${encodeURIComponent(phone)}`,
        {
          method: "POST",
          token,
          body: JSON.stringify({
            ...(text.trim() ? { message: text.trim() } : {}),
            ...(screenshots ? { screenshots } : {}),
          }),
        },
      );
      onSent(result.data);
      setText("");
      setFiles([]);
    } catch (sendError) {
      onError(sendError instanceof Error ? sendError.message : t("topbar.supportLoadFailed"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="support-thread">
      <div className="support-thread-scroll" ref={scroller}>
        <div className="card mb-3">
          <div className="card-body">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <strong>{ticket.number}</strong>
              <StatusBadge label={labelStatus(t, ticket.status)} tone={statusToneFor(ticket.status)} />
            </div>
            <p className="m-0 whitespace-pre-wrap">{ticket.description}</p>
            <ScreenshotRow screenshots={ticket.screenshots} />
            {ticket.remark ? <p className="mb-0 mt-3 text-sm text-[var(--muted)]">{ticket.remark}</p> : null}
          </div>
        </div>
        {error ? <p className="form-field-error">{error}</p> : null}
        <div className="support-messages">
          {messages.map((message) => (
            <article key={message.id} className={`support-message is-${message.side}`}>
              <header>
                <strong>{message.authorName}</strong>
                <time>{message.createdAt}</time>
              </header>
              {message.message ? <p>{message.message}</p> : null}
              <ScreenshotRow screenshots={message.screenshots} />
            </article>
          ))}
        </div>
      </div>
      {closed ? (
        <p className="support-closed-note">{t("topbar.supportClosed")}</p>
      ) : (
        <form className="support-composer" onSubmit={send}>
          <ImagePicker
            files={previews}
            onFiles={(selected) => {
              const next = [...files, ...Array.from(selected ?? [])].slice(0, MAX_IMAGES);
              if (next.some((file) => file.size > MAX_IMAGE_BYTES || !file.type.startsWith("image/"))) return;
              setFiles(next);
            }}
            onRemove={(index) => setFiles((current) => current.filter((_, item) => item !== index))}
          />
          <div className="support-composer-row">
            <textarea
              className="form-control"
              rows={2}
              maxLength={4000}
              value={text}
              placeholder={t("topbar.supportReplyPlaceholder")}
              onChange={(event) => setText(event.target.value)}
            />
            <button type="submit" className="btn btn-primary" disabled={sending} aria-label={t("topbar.supportReply")}>
              <Send size={16} />
              {t("topbar.supportReply")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`form-field${error ? " is-invalid" : ""}${className ? ` ${className}` : ""}`}>
      <label className="form-field-label">
        {label}
        {required ? <span className="field-required">*</span> : null}
      </label>
      {children}
      {error ? <p className="form-field-error">{error}</p> : null}
    </div>
  );
}

function ImagePicker({
  files,
  onFiles,
  onRemove,
}: {
  files: Array<{ file: File; url: string }>;
  onFiles: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="support-images">
      <label className="support-image-add">
        <ImagePlus size={16} />
        {t("topbar.supportScreenshots")}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={(event) => {
            onFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {files.length > 0 ? (
        <div className="support-image-row">
          {files.map((file, index) => (
            <span key={`${file.file.name}-${index}`} className="support-image-thumb">
              {/* Local preview of a file the user just picked. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={file.url} alt={file.file.name} />
              <button type="button" onClick={() => onRemove(index)} aria-label={t("topbar.supportRemoveImage")}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ScreenshotRow({ screenshots }: { screenshots: Array<{ name?: string; url: string }> }) {
  if (!screenshots.length) return null;
  return (
    <div className="support-image-row">
      {screenshots.map((shot) => (
        <a key={shot.url} href={shot.url} target="_blank" rel="noreferrer" className="support-image-thumb">
          {/* Screenshot URLs come from the support API. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shot.url} alt={shot.name || "Screenshot"} />
        </a>
      ))}
    </div>
  );
}

function labelStatus(t: (key: string) => string, status: SupportStatus) {
  if (status === "OPEN") return t("topbar.supportStatusOpen");
  if (status === "IN_PROGRESS") return t("topbar.supportStatusProgress");
  return t("topbar.supportStatusClosed");
}

function labelPriority(t: (key: string) => string, priority: SupportPriority) {
  if (priority === "LOW") return t("topbar.supportLow");
  if (priority === "HIGH") return t("topbar.supportHigh");
  if (priority === "URGENT") return t("topbar.supportUrgent");
  return t("topbar.supportMedium");
}
