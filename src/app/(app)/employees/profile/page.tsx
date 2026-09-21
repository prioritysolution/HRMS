"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  GitBranch,
  Hash,
  IdCard,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { SoftStatus } from "@/components/ui/DataTable";
import { authService } from "@/lib/api/services/auth.service";
import type { AuthMeProfile } from "@/lib/api/types";
import { resolvePublicFileUrl } from "@/lib/env";
import { useI18n } from "@/i18n";

function displayValue(value: string | number | null | undefined): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value);
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
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
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} width={width} height={height} className={className} />
    );
  }

  return (
    <Image src={src} alt={alt} width={width} height={height} className={className} />
  );
}

function ProfileFact({
  label,
  value,
  icon: Icon,
  span = "default",
}: {
  label: string;
  value: string;
  icon?: typeof UserRound;
  span?: "default" | "wide" | "full";
}) {
  const spanClass =
    span === "full"
      ? "employee-profile-fact--full"
      : span === "wide"
        ? "employee-profile-fact--wide"
        : "";

  return (
    <div className={`employee-profile-fact ${spanClass}`.trim()}>
      <div className="employee-profile-fact-label">
        {Icon ? <Icon size={14} aria-hidden="true" /> : null}
        <span>{label}</span>
      </div>
      <div className="employee-profile-fact-value">{value}</div>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { t } = useI18n();
  const [profile, setProfile] = useState<AuthMeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authService.getMeProfile();
      if (!data) {
        setError(t("profile.loadErrorAuth"));
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch {
      setError(t("profile.loadErrorNetwork"));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const photoUrl = profile?.photoPath
    ? resolvePublicFileUrl(profile.photoPath, "storage/employees/photos")
    : "";
  const orgLogoUrl = profile?.orgLogo
    ? resolvePublicFileUrl(profile.orgLogo, "storage/organizations/logos")
    : "";

  return (
    <>
      <PageHeader title={t("profile.title")} section={t("profile.section")} hideTitle />
      <div className="container-fluid employee-profile-page">
        {loading ? (
          <div className="employee-profile-loading">
            <RoundLoader />
            <p>{t("profile.loading")}</p>
          </div>
        ) : error ? (
          <div className="card">
            <div className="card-body employee-profile-error">
              <p>{error}</p>
              <button type="button" className="btn btn-primary" onClick={() => void loadProfile()}>
                {t("common.retry")}
              </button>
            </div>
          </div>
        ) : profile ? (
          <>
            <div className="card employee-profile-hero-card mb-3">
              <div className="card-body employee-profile-hero">
                <div className="employee-profile-hero-main">
                  {photoUrl ? (
                    <RemoteImage
                      src={photoUrl}
                      alt={profile.displayName}
                      width={84}
                      height={84}
                      className="employee-profile-avatar"
                    />
                  ) : (
                    <div className="employee-profile-avatar employee-profile-avatar-fallback">
                      <span>{initialsFromName(profile.displayName || profile.userName)}</span>
                    </div>
                  )}
                  <div className="employee-profile-hero-copy">
                    <div className="employee-profile-hero-title">
                      <h2>{profile.displayName || profile.userName}</h2>
                      <SoftStatus value={profile.loginStatus || "Active"} />
                    </div>
                    <div className="employee-profile-hero-meta">
                      <span className="badge bg-soft-primary">{profile.roleName}</span>
                      {profile.isAdmin ? (
                        <span className="badge bg-soft-warning">{t("profile.administrator")}</span>
                      ) : null}
                      <span className="employee-profile-username">@{profile.userName}</span>
                    </div>
                    <p className="employee-profile-hero-subtitle">
                      {profile.orgName}
                      {profile.branchName ? ` · ${profile.branchName}` : ""}
                    </p>
                  </div>
                </div>

                <div className="employee-profile-hero-side">
                  {orgLogoUrl ? (
                    <RemoteImage
                      src={orgLogoUrl}
                      alt={profile.orgName}
                      width={64}
                      height={64}
                      className="employee-profile-org-logo"
                    />
                  ) : null}
                  <div className="employee-profile-stat-strip">
                    <div className="employee-profile-stat">
                      <span>{t("profile.userId")}</span>
                      <strong>{displayValue(profile.userId)}</strong>
                    </div>
                    <div className="employee-profile-stat">
                      <span>{t("profile.orgCode")}</span>
                      <strong>{displayValue(profile.orgCode)}</strong>
                    </div>
                    <div className="employee-profile-stat">
                      <span>{t("profile.branch")}</span>
                      <strong>{displayValue(profile.branchCode)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="employee-profile-content">
              <div className="employee-profile-info-grid">
                <div className="card">
                  <div className="card-body">
                    <div className="employee-profile-section-head">
                      <h4>{t("profile.personalInfo")}</h4>
                      <p>{t("profile.personalInfoHint")}</p>
                    </div>
                    <div className="employee-profile-fact-grid">
                      <ProfileFact
                        label={t("profile.displayName")}
                        value={displayValue(profile.displayName)}
                        icon={UserRound}
                      />
                      <ProfileFact
                        label={t("profile.username")}
                        value={displayValue(profile.userName)}
                        icon={IdCard}
                      />
                      <ProfileFact
                        label={t("profile.firstName")}
                        value={displayValue(profile.firstName)}
                      />
                      <ProfileFact
                        label={t("profile.lastName")}
                        value={displayValue(profile.lastName)}
                      />
                      <ProfileFact
                        label={t("profile.email")}
                        value={displayValue(profile.email)}
                        icon={Mail}
                      />
                      <ProfileFact
                        label={t("profile.mobile")}
                        value={displayValue(profile.mobile)}
                        icon={Phone}
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="employee-profile-section-head">
                      <h4>{t("profile.organizationBranch")}</h4>
                      <p>{t("profile.organizationBranchHint")}</p>
                    </div>
                    <div className="employee-profile-fact-grid employee-profile-fact-grid--org">
                      <ProfileFact
                        label={t("profile.organization")}
                        value={displayValue(profile.orgName)}
                        icon={Building2}
                        span="full"
                      />
                      <ProfileFact
                        label={t("profile.branch")}
                        value={displayValue(profile.branchName)}
                        icon={GitBranch}
                        span="wide"
                      />
                      <ProfileFact
                        label={t("profile.organizationCode")}
                        value={displayValue(profile.orgCode)}
                        icon={Hash}
                      />
                      <ProfileFact
                        label={t("profile.branchCode")}
                        value={displayValue(profile.branchCode)}
                        icon={Hash}
                      />
                      <ProfileFact
                        label={t("profile.employeeCode")}
                        value={displayValue(profile.employeeCode)}
                        icon={IdCard}
                      />
                      <ProfileFact
                        label={t("profile.employeeId")}
                        value={displayValue(profile.employeeId)}
                      />
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <div className="employee-profile-section-head">
                      <h4>{t("profile.accountAccess")}</h4>
                      <p>{t("profile.accountAccessHint")}</p>
                    </div>
                    <div className="employee-profile-fact-grid">
                      <ProfileFact
                        label={t("profile.primaryRole")}
                        value={displayValue(profile.roleName)}
                        icon={ShieldCheck}
                      />
                      <ProfileFact
                        label={t("profile.administrator")}
                        value={profile.isAdmin ? t("common.yes") : t("common.no")}
                      />
                      <ProfileFact
                        label={t("profile.loginStatus")}
                        value={displayValue(profile.loginStatus)}
                      />
                      <div className="employee-profile-fact employee-profile-fact--roles">
                        <div className="employee-profile-fact-label">
                          <Users size={14} aria-hidden="true" />
                          <span>{t("profile.assignedRoles")}</span>
                        </div>
                        {profile.roles.length > 0 ? (
                          <div className="employee-profile-role-list">
                            {profile.roles.map((role) => (
                              <span key={role.roleId} className="badge bg-soft-primary">
                                {role.roleName}
                                {role.isAdmin ? ` · ${t("profile.adminShort")}` : ""}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="employee-profile-fact-value">—</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card employee-profile-security-card">
                <div className="card-body">
                  <ChangePasswordForm compact />
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
