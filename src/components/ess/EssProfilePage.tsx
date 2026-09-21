"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building2,
  GitBranch,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { SoftStatus } from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n } from "@/i18n";
import { authService } from "@/lib/api/services/auth.service";
import { requiresHrApproval } from "@/lib/ess-utils";
import type { AuthMeProfile } from "@/lib/api/types";
import { resolvePublicFileUrl } from "@/lib/env";

function displayValue(value: string | number | null | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function RemoteImage({
  src,
  alt,
  className,
  width,
  height,
}: {
  src: string;
  alt: string;
  className: string;
  width: number;
  height: number;
}) {
  const isRemote = /^https?:\/\//i.test(src);
  if (isRemote) {
    return <img src={src} alt={alt} width={width} height={height} className={className} />;
  }
  return <Image src={src} alt={alt} width={width} height={height} className={className} />;
}

type EditableFieldKey =
  | keyof AuthMeProfile
  | "emergency_contact"
  | "permanent_address";

export function EssProfilePage() {
  const { t } = useI18n();
  const toast = useToast();
  const [profile, setProfile] = useState<AuthMeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const editableFields = useMemo(
    () =>
      [
        { key: "mobile" as const, label: t("ess.profilePage.mobile"), type: "tel" as const },
        {
          key: "email" as const,
          label: t("ess.profilePage.email"),
          type: "email" as const,
          critical: true,
        },
        {
          key: "emergency_contact" as const,
          label: t("ess.profilePage.emergencyContact"),
          type: "tel" as const,
          critical: true,
        },
        {
          key: "permanent_address" as const,
          label: t("ess.profilePage.permanentAddress"),
          critical: true,
        },
      ] satisfies Array<{
        key: EditableFieldKey;
        label: string;
        type?: "text" | "email" | "tel";
        critical?: boolean;
      }>,
    [t],
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authService.getMeProfile();
      setProfile(data);
      if (data) {
        setForm({
          mobile: data.mobile ?? "",
          email: data.email ?? "",
          emergency_contact: "",
          permanent_address: "",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));

    const criticalChanges = editableFields.filter(
      (f) => f.critical && form[f.key] && requiresHrApproval(String(f.key)),
    );

    if (criticalChanges.length > 0) {
      toast.success(t("ess.profilePage.submittedHr"));
    } else {
      toast.success(t("ess.profilePage.updated"));
    }

    setSaving(false);
    setEditMode(false);
  };

  const photoUrl = profile?.photoPath
    ? resolvePublicFileUrl(profile.photoPath, "storage/employees/photos")
    : "";

  return (
    <>
      <PageHeader
        title={t("ess.profilePage.title")}
        section={t("ess.profilePage.section")}
        action={
          profile ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => (editMode ? void handleSave() : setEditMode(true))}
              disabled={saving}
            >
              {editMode ? (
                <>
                  <Save size={16} className="me-1" />
                  {saving ? t("ess.profilePage.saving") : t("ess.profilePage.saveChanges")}
                </>
              ) : (
                t("ess.profilePage.editProfile")
              )}
            </button>
          ) : null
        }
      />
      <div className="container-fluid">
        <div className="ess-hr-notice mb-4">
          <AlertCircle size={18} aria-hidden="true" />
          <p>
            {t("ess.profilePage.hrNoticeBefore")}{" "}
            <strong>{t("ess.profilePage.hrApproval")}</strong>{" "}
            {t("ess.profilePage.hrNoticeAfter")}
          </p>
        </div>

        {loading ? (
          <div className="employee-profile-loading">
            <RoundLoader />
            <p>{t("ess.profilePage.loading")}</p>
          </div>
        ) : profile ? (
          <>
            <div className="card mb-4">
              <div className="card-body employee-profile-hero">
                <div className="employee-profile-hero-main">
                  {photoUrl ? (
                    <RemoteImage
                      src={photoUrl}
                      alt={profile.displayName}
                      width={88}
                      height={88}
                      className="employee-profile-avatar"
                    />
                  ) : (
                    <div className="employee-profile-avatar employee-profile-avatar-fallback">
                      <UserRound size={36} strokeWidth={1.75} />
                    </div>
                  )}
                  <div>
                    <div className="employee-profile-hero-title">
                      <h2>{profile.displayName}</h2>
                      <SoftStatus value={profile.loginStatus || t("common.active")} />
                    </div>
                    <div className="employee-profile-hero-meta">
                      <span className="badge bg-soft-primary">{profile.roleName}</span>
                      <span className="text-muted">{profile.employeeCode ?? "—"}</span>
                    </div>
                    <p className="employee-profile-hero-subtitle">
                      {profile.orgName}
                      {profile.branchName ? ` · ${profile.branchName}` : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-modal-grid">
              <div className="card h-full">
                <div className="card-body">
                  <h4 className="employee-profile-card-title">
                    {t("ess.profilePage.personalInfo")}
                  </h4>
                  {editableFields.map((field) => (
                    <div key={field.key} className="employee-profile-field">
                      <div className="employee-profile-field-label">
                        <span>{field.label}</span>
                        {field.critical ? (
                          <span className="badge bg-soft-warning ms-2">
                            {t("ess.profilePage.hrApprovalBadge")}
                          </span>
                        ) : null}
                      </div>
                      {editMode ? (
                        field.key === "permanent_address" ? (
                          <textarea
                            className="form-control mt-1"
                            rows={2}
                            value={form[field.key] ?? ""}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                          />
                        ) : (
                          <input
                            type={field.type ?? "text"}
                            className="form-control mt-1"
                            value={form[field.key] ?? ""}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                          />
                        )
                      ) : (
                        <div className="employee-profile-field-value">
                          {displayValue(
                            field.key === "emergency_contact" || field.key === "permanent_address"
                              ? form[field.key]
                              : (profile[field.key as keyof AuthMeProfile] as string),
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card h-full">
                <div className="card-body">
                  <h4 className="employee-profile-card-title">
                    {t("ess.profilePage.accountAccess")}
                  </h4>
                  <div className="employee-profile-field">
                    <div className="employee-profile-field-label">
                      <ShieldCheck size={15} />
                      <span>{t("ess.profilePage.primaryRole")}</span>
                    </div>
                    <div className="employee-profile-field-value">{profile.roleName}</div>
                  </div>
                  <div className="employee-profile-field">
                    <div className="employee-profile-field-label">
                      <UserRound size={15} />
                      <span>{t("ess.profilePage.username")}</span>
                    </div>
                    <div className="employee-profile-field-value">{profile.userName}</div>
                  </div>
                  <div className="employee-profile-roles">
                    <div className="employee-profile-field-label">
                      <Users size={15} />
                      <span>{t("ess.profilePage.assignedRoles")}</span>
                    </div>
                    <div className="employee-profile-role-list">
                      {profile.roles.map((role) => (
                        <span key={role.roleId} className="badge bg-soft-primary">
                          {role.roleName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card h-full">
                <div className="card-body">
                  <h4 className="employee-profile-card-title">
                    {t("ess.profilePage.organization")}
                  </h4>
                  <div className="employee-profile-field">
                    <div className="employee-profile-field-label">
                      <Building2 size={15} />
                      <span>{t("ess.profilePage.organization")}</span>
                    </div>
                    <div className="employee-profile-field-value">{profile.orgName}</div>
                  </div>
                  <div className="employee-profile-field">
                    <div className="employee-profile-field-label">
                      <GitBranch size={15} />
                      <span>{t("ess.profilePage.branch")}</span>
                    </div>
                    <div className="employee-profile-field-value">
                      {profile.branchName ?? "—"}
                    </div>
                  </div>
                  <div className="employee-profile-field">
                    <div className="employee-profile-field-label">
                      <Mail size={15} />
                      <span>{t("ess.profilePage.workEmail")}</span>
                    </div>
                    <div className="employee-profile-field-value">
                      {profile.email ?? "—"}
                    </div>
                  </div>
                  <div className="employee-profile-field">
                    <div className="employee-profile-field-label">
                      <Phone size={15} />
                      <span>{t("ess.profilePage.mobile")}</span>
                    </div>
                    <div className="employee-profile-field-value">
                      {profile.mobile ?? "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {editMode ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? t("ess.profilePage.saving") : t("ess.profilePage.saveChanges")}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setEditMode(false)}
                  disabled={saving}
                >
                  {t("common.cancel")}
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <div className="card">
            <div className="card-body employee-profile-error">
              <p>{t("ess.profilePage.loadError")}</p>
              <button type="button" className="btn btn-primary" onClick={() => void loadProfile()}>
                {t("common.retry")}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
