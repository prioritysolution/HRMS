import Image from "next/image";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <section className="auth-page auth-page--login">
      <div className="login-background" aria-hidden="true">
        <Image
          src="/images/login-hero-background.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="login-background-image"
        />
      </div>

      <div className="login-shell">
        <div className="login-showcase-panel">
          <header className="login-showcase-headline">
            <h2>
              Empowering People.
              <br />
              Driving Performance.
            </h2>
            <span className="login-showcase-rule" aria-hidden="true" />
          </header>

          <div className="login-showcase-art">
            <Image
              src="/images/login-hero-left-logo.png"
              alt="PrioHRM — employee management, attendance, payroll, and mobile access"
              fill
              priority
              sizes="(max-width: 980px) 0px, 58vw"
              className="login-showcase-art-image"
            />
          </div>

          <p className="login-showcase-footer">
            Smarter HR <span aria-hidden="true">|</span> Better Teams{" "}
            <span aria-hidden="true">|</span> Greater Success
          </p>
        </div>

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
