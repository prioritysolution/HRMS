"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { authService } from "@/lib/api/services/auth.service";
import { ApiError } from "@/lib/api/client";
import { useI18n } from "@/i18n";

type ChangePasswordFormProps = {
  compact?: boolean;
  className?: string;
};

export function ChangePasswordForm({ compact = false, className }: ChangePasswordFormProps) {
  const toast = useToast();
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error(t("profile.passwordMinLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("profile.passwordMismatch"));
      return;
    }

    if (currentPassword === newPassword) {
      toast.error(t("profile.passwordSameAsCurrent"));
      return;
    }

    setSaving(true);
    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success(t("profile.passwordSuccess"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : t("profile.passwordFailed");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`ess-password-card ${className ?? ""}`.trim()}>
      {!compact ? (
        <div className="ess-password-header">
          <div className="avatar avatar-xxl avatar-soft-primary">
            <Lock size={28} />
          </div>
          <div>
            <h5 className="mb-1">{t("profile.passwordUpdateTitle")}</h5>
            <p className="text-muted mb-0">{t("profile.passwordUpdateHint")}</p>
          </div>
        </div>
      ) : (
        <div className="employee-profile-security-intro">
          <div className="employee-profile-security-icon">
            <Lock size={18} />
          </div>
          <div>
            <h5>{t("profile.passwordTitle")}</h5>
            <p>{t("profile.passwordHint")}</p>
          </div>
        </div>
      )}

      <form onSubmit={(event) => void handleSubmit(event)} className="ess-password-form">
        <div className="form-group mb-3">
          <label htmlFor="profile-current-password">{t("profile.currentPassword")}</label>
          <div className="ess-password-input-wrap">
            <input
              id="profile-current-password"
              type={showCurrent ? "text" : "password"}
              className="form-control"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="ess-password-toggle"
              onClick={() => setShowCurrent((value) => !value)}
              aria-label={showCurrent ? t("profile.hidePassword") : t("profile.showPassword")}
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-group mb-3">
          <label htmlFor="profile-new-password">{t("profile.newPassword")}</label>
          <div className="ess-password-input-wrap">
            <input
              id="profile-new-password"
              type={showNew ? "text" : "password"}
              className="form-control"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="ess-password-toggle"
              onClick={() => setShowNew((value) => !value)}
              aria-label={showNew ? t("profile.hidePassword") : t("profile.showPassword")}
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-group mb-4">
          <label htmlFor="profile-confirm-password">{t("profile.confirmPassword")}</label>
          <input
            id="profile-confirm-password"
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>

        <div className="ess-password-tips mb-4">
          <ShieldCheck size={16} />
          <span>{t("profile.passwordTip")}</span>
        </div>

        <div className="ess-password-actions">
          <button
            type="submit"
            className="btn btn-primary ess-password-submit"
            disabled={saving}
          >
            {saving ? t("profile.updating") : t("profile.changePassword")}
          </button>
        </div>
      </form>
    </div>
  );
}
