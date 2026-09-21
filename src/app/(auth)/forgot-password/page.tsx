"use client";

import Image from "next/image";
import Link from "next/link";
import { Headphones, Mail } from "lucide-react";
import { useI18n } from "@/i18n";

export default function ForgotPasswordPage() {
  const { t } = useI18n();

  return (
    <section className="auth-page">
      <div className="auth-overlay" />
      <div className="auth-container auth-container-narrow">
        <div className="auth-card auth-card-center">
          <div className="auth-center-body">
            <Image
              src="/images/pswforgot.png"
              alt={t("auth.forgotTitle")}
              width={220}
              height={160}
              className="auth-illus"
              priority
            />
            <h1 className="auth-heading">{t("auth.forgotTitle")}</h1>
            <p className="auth-subheading">{t("auth.forgotSubtitle")}</p>

            <form className="auth-form" action="/verification">
              <div className="auth-floating">
                <span className="auth-floating-icon">
                  <Mail size={16} />
                </span>
                <input
                  id="emailVerify"
                  name="emailId"
                  type="email"
                  className="auth-control auth-control-floating"
                  placeholder=" "
                  required
                />
                <label htmlFor="emailVerify">{t("auth.emailAddress")}</label>
              </div>
              <div className="auth-help text-left">{t("auth.otpHint")}</div>

              <button type="submit" className="btn btn-primary u-width-full mt-4">
                {t("auth.confirmEmail")}
              </button>

              <hr className="auth-divider mt-6" />
              <div className="auth-help-row">
                <small>
                  {t("auth.rememberPassword")}{" "}
                  <Link href="/login">{t("auth.login")}</Link>
                </small>
                <a href="#" className="auth-help-link">
                  <Headphones size={14} /> {t("auth.help")}
                </a>
              </div>
            </form>
          </div>
        </div>
        <p className="auth-legal">
          {t("auth.termsAgree")} <a href="#">{t("auth.termsOfService")}</a> {t("auth.and")}{" "}
          <a href="#">{t("auth.privacyPolicy")}</a>
        </p>
      </div>
    </section>
  );
}
