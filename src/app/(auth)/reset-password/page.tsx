"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/i18n";

function FloatingPassword({
  id,
  label,
  defaultValue,
  name,
  showLabel,
  hideLabel,
}: {
  id: string;
  label: string;
  defaultValue?: string;
  name: string;
  showLabel: string;
  hideLabel: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-floating auth-floating-password">
      <button
        type="button"
        className="auth-eye"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? hideLabel : showLabel}
      >
        {show ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        className="auth-control auth-control-floating"
        placeholder=" "
        defaultValue={defaultValue}
        required
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();

  return (
    <section className="auth-page">
      <div className="auth-overlay" />
      <div className="auth-container auth-container-narrow">
        <div className="auth-card auth-card-center">
          <div className="auth-center-body auth-center-padded">
            <h2 className="auth-heading">{t("auth.resetTitle")}</h2>
            <p className="auth-subheading mb-8">{t("auth.resetSubtitle")}</p>

            <form className="auth-form" action="/login">
              <FloatingPassword
                id="currentPassword"
                label={t("auth.currentPassword")}
                name="currentPassword"
                defaultValue="012345678"
                showLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
              />
              <FloatingPassword
                id="newPassword"
                label={t("auth.newPassword")}
                name="newPassword"
                defaultValue="Joyce#012"
                showLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
              />

              <button type="submit" className="btn btn-primary u-width-full">
                {t("auth.updatePassword")}
              </button>
            </form>

            <p className="auth-bottom-note">
              {t("auth.rememberPassword")} <Link href="/login">{t("auth.login")}</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
