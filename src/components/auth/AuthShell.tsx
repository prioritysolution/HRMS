import Image from "next/image";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <section className="auth-page auth-page--login">
      <div className="login-shell">
        {/* =========================
            LEFT SHOWCASE — full artwork, no crop
           ========================= */}
        <div
          className="login-showcase-panel"
          role="img"
          aria-label="PrioHRM — Human Resource Management System. Employee management, attendance and leave, payroll and performance, multi-branch support, and mobile access."
        />

        {/* =========================
            RIGHT LOGIN SECTION
           ========================= */}
        <div className="login-form-panel">
          <div className="login-form-card">
            <div className="login-card-brand">
              <Image
                src="/images/logos/prio-hrm-login-brand.png"
                alt="PrioHRM"
                width={420}
                height={278}
                priority
                className="login-card-brand-image"
              />
            </div>

            <div className="login-welcome">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>

            <div className="login-form-content">{children}</div>

            <div className="login-card-footer">
              <span aria-hidden="true" />
              <a
                href="https://prioritysolutions.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="login-card-footer-link"
              >
                Powered by Priority Solutions
              </a>
              <span aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
