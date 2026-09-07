import Image from "next/image";
import Link from "next/link";

type AuthBrandLogoProps = {
  href?: string;
  className?: string;
};

/**
 * Dark-theme-friendly brand mark for auth pages.
 * Uses the circular mark + wordmark so the white full-logo plate
 * does not clash with the dark login background.
 */
export function AuthBrandLogo({ href = "/dashboard", className }: AuthBrandLogoProps) {
  return (
    <Link href={href} className={`auth-brand-logo ${className ?? ""}`} aria-label="PrioHRM home">
      <span className="auth-brand-mark">
        <Image
          src="/images/logos/prio-hrm-mark.png"
          alt=""
          width={36}
          height={36}
          className="auth-brand-mark-img"
        />
      </span>
      <span className="auth-brand-copy">
        <span className="auth-brand-name">PrioHRM</span>
        <span className="auth-brand-tag">Human Resource Management System</span>
      </span>
    </Link>
  );
}
