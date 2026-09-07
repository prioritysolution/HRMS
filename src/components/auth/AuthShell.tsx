import { AuthShowcase } from "@/components/auth/AuthShowcase";
import { AuthBrandLogo } from "@/components/ui/AuthBrandLogo";

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
                  <AuthBrandLogo />
                </div>
                <span className="auth-eyebrow">{eyebrow}</span>
                <h1 className="auth-heading">{title}</h1>
                <p className="auth-subheading">{subtitle}</p>
              </header>

              <div className="auth-form-panel">{children}</div>

              {footer ? <footer className="auth-footer-link">{footer}</footer> : null}

              <p className="auth-legal auth-legal--form">
                By continuing, you agree to our{" "}
                <a href="#">Terms of Service</a> and{" "}
                <a href="#">Privacy Policy</a>
              </p>
            </div>
          </div>

          <div className="auth-pane auth-pane-media">
            <AuthShowcase />
          </div>
        </div>
      </div>
    </section>
  );
}
