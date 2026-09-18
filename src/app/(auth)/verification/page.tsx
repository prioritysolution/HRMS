"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/i18n";

export default function VerificationPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [codes, setCodes] = useState(["", "", "", ""]);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);
  const filled = codes.every((c) => c.length === 1);

  const onChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...codes];
    next[index] = digit;
    setCodes(next);
    if (digit && index < 3) inputs.current[index + 1]?.focus();
  };

  const onKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-overlay" />
      <div className="auth-container auth-container-narrow">
        <div className="auth-card auth-card-center">
          <div className="auth-center-body">
            <Image
              src="/images/pswforgot.png"
              alt={t("auth.verifyAlt")}
              width={220}
              height={160}
              className="auth-illus"
              priority
            />
            <h2 className="auth-heading">{t("auth.verifyTitle")}</h2>
            <p className="auth-subheading">{t("auth.verifySubtitle")}</p>

            <form
              className="auth-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (filled) router.push("/reset-password");
              }}
            >
              <div className="otp-row">
                {codes.map((code, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputs.current[i] = el;
                    }}
                    maxLength={1}
                    value={code}
                    onChange={(e) => onChange(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    className="opt-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary u-width-full"
                disabled={!filled}
              >
                {t("auth.confirmCode")}
              </button>

              <p className="resend-text">{t("auth.didntReceiveCode")}</p>
              <button type="button" className="btn btn-outline-primary btn-sm">
                {t("auth.resendCode")}
              </button>
            </form>

            <p className="auth-bottom-note">
              {t("auth.wrongEmail")}{" "}
              <Link href="/forgot-password">{t("auth.changeEmail")}</Link>
            </p>
          </div>
        </div>
        <p className="auth-legal">
          {t("auth.havingTrouble")} <a href="#">{t("auth.contactSupport")}</a>
        </p>
      </div>
    </section>
  );
}
