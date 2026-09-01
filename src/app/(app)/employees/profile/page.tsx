"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  GitBranch,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { SoftStatus } from "@/components/ui/DataTable";
import { authService } from "@/lib/api/services/auth.service";
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

  return (
    <Image src={src} alt={alt} width={width} height={height} className={className} />
  );
}

function ProfileField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof UserRound;
}) {
  return (
    <div className="employee-profile-field">
      <div className="employee-profile-field-label">
        {Icon ? <Icon size={15} aria-hidden="true" /> : null}
        <span>{label}</span>
      </div>
      <div className="employee-profile-field-value">{value}</div>
    </div>
  );
}

function ProfileCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card h-full">
      <div className="card-body">
        <h4 className="employee-profile-card-title">{title}</h4>
        {children}
      </div>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const [profile, setProfile] = useState<AuthMeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await authService.getMeProfile();
      if (!data) {
        setError("Unable to load your profile. Please sign in again.");
        setProfile(null);
        return;
      }
      setProfile(data);
    } catch {
      setError("Unable to load your profile. Check your connection and try again.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
      <PageHeader title="My Profile" section="Employee Management" hideTitle />
      <div className="container-fluid">
        {loading ? (
          <div className="employee-profile-loading">
            <RoundLoader />
            <p>Loading profile...</p>
          </div>
        ) : error ? (
          <div className="card">
            <div className="card-body employee-profile-error">
              <p>{error}</p>
              <button type="button" className="btn btn-primary" onClick={() => void loadProfile()}>
                Retry
              </button>
            </div>
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
                      <SoftStatus value={profile.loginStatus || "Active"} />
                    </div>
                    <div className="employee-profile-hero-meta">
                      <span className="badge bg-soft-primary">{profile.roleName}</span>
                      {profile.isAdmin ? (
                        <span className="badge bg-soft-warning">Administrator</span>
                      ) : null}
                      <span className="text-muted">@{profile.userName}</span>
                    </div>
                    <p className="employee-profile-hero-subtitle">
                      {profile.orgName}
                      {profile.branchName ? ` · ${profile.branchName}` : ""}
                    </p>
                  </div>
                </div>
                {orgLogoUrl ? (
                  <RemoteImage
                    src={orgLogoUrl}
                    alt={profile.orgName}
                    width={72}
                    height={72}
                    className="employee-profile-org-logo"
                  />
                ) : null}
              </div>
            </div>

            <div className="profile-modal-grid">
              <ProfileCard title="Personal Information">
                <ProfileField
                  label="Display Name"
                  value={displayValue(profile.displayName)}
                  icon={UserRound}
                />
                <ProfileField
                  label="Username"
                  value={displayValue(profile.userName)}
                  icon={UserRound}
                />
                <ProfileField
                  label="First Name"
                  value={displayValue(profile.firstName)}
                />
                <ProfileField
                  label="Last Name"
                  value={displayValue(profile.lastName)}
                />
                <ProfileField
                  label="Email"
                  value={displayValue(profile.email ?? undefined)}
                  icon={Mail}
                />
                <ProfileField
                  label="Mobile"
                  value={displayValue(profile.mobile)}
                  icon={Phone}
                />
              </ProfileCard>

              <ProfileCard title="Account & Access">
                <ProfileField
                  label="Primary Role"
                  value={displayValue(profile.roleName)}
                  icon={ShieldCheck}
                />
                <ProfileField
                  label="Administrator"
                  value={profile.isAdmin ? "Yes" : "No"}
                />
                <ProfileField
                  label="Login Status"
                  value={displayValue(profile.loginStatus)}
                />
                <div className="employee-profile-roles">
                  <div className="employee-profile-field-label">
                    <Users size={15} aria-hidden="true" />
                    <span>Assigned Roles</span>
                  </div>
                  {profile.roles.length > 0 ? (
                    <div className="employee-profile-role-list">
                      {profile.roles.map((role) => (
                        <span key={role.roleId} className="badge bg-soft-primary">
                          {role.roleName}
                          {role.isAdmin ? " · Admin" : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="employee-profile-field-value">—</div>
                  )}
                </div>
              </ProfileCard>

              <ProfileCard title="Organization">
                <ProfileField
                  label="Organization"
                  value={displayValue(profile.orgName)}
                  icon={Building2}
                />
                <ProfileField label="Organization Code" value={displayValue(profile.orgCode)} />
              </ProfileCard>

              <ProfileCard title="Branch & Employee">
                <ProfileField
                  label="Branch"
                  value={displayValue(profile.branchName)}
                  icon={GitBranch}
                />
                <ProfileField label="Branch Code" value={displayValue(profile.branchCode)} />
                <ProfileField
                  label="Employee Code"
                  value={displayValue(profile.employeeCode)}
                />
              </ProfileCard>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
