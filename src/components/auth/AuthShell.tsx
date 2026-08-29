import Image from "next/image";
import { AuthCarousel } from "@/components/auth/AuthCarousel";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthShell({ eyebrow, title, subtitle, children, footer }: AuthShellProps) {
  return (
    <section className="auth-page">
      <div className="auth-ambient" aria-hidden="true">
        <span className="auth-orb auth-orb-primary" />
        <span className="auth-orb auth-orb-info" />
        <span className="auth-orb auth-orb-success" />
        <span className="auth-grid" />
      </div>
      <div className="auth-overlay" />

      <div className="auth-container">
        <div className="auth-card auth-card-split">
          <div className="auth-pane auth-pane-form">
            <div className="auth-pane-inner">
              <header className="auth-header">
                <div className="auth-logo">
                  <Image
                    src="/images/logos/logo_light.png"
                    alt="Staffu"
                    width={132}
                    height={34}
                    priority
                  />
                </div>
                <span className="auth-eyebrow">{eyebrow}</span>
                <h1 className="auth-heading">{title}</h1>
                <p className="auth-subheading">{subtitle}</p>
              </header>

              <div className="auth-form-panel">{children}</div>

              {footer ? <footer className="auth-footer-link">{footer}</footer> : null}
            </div>
          </div>

          <div className="auth-pane auth-pane-media">
            <AuthCarousel />
          </div>
        </div>

        <p className="auth-legal">
          By continuing, you agree to our <a href="#">Terms of Service</a> and{" "}
          <a href="#">Privacy Policy</a>
        </p>
      </div>
    </section>
  );
}
