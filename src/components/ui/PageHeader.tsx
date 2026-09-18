"use client";

import { APP_NAME } from "@/config/navigation";
import { useI18n, translateHrmsLookup } from "@/i18n";

type PageHeaderProps = {
  title: string;
  section?: string;
  action?: React.ReactNode;
  hideTitle?: boolean;
  hideBreadcrumbs?: boolean;
};

export function PageHeader({
  title,
  section = "Apps",
  action,
  hideTitle = false,
  hideBreadcrumbs = false,
}: PageHeaderProps) {
  const { language } = useI18n();
  const displayTitle = translateHrmsLookup(language, "titles", title);
  const displaySection = translateHrmsLookup(language, "sections", section);

  const breadcrumbItems = (
    <>
      <li>{APP_NAME}</li>
      <li>{displaySection}</li>
      <li className="active">{displayTitle}</li>
    </>
  );

  return (
    <div className={`page-title${hideTitle ? " page-title-breadcrumb-only" : ""}`}>
      <div className="container-fluid">
        <div className="page-title-inner">
          <div className="page-title-main">
            {!hideTitle ? <h1>{displayTitle}</h1> : null}
            {!hideBreadcrumbs ? (
              <nav aria-label="breadcrumb" className="breadcrumb-mobile">
                <ol className="breadcrumb">{breadcrumbItems}</ol>
              </nav>
            ) : null}
          </div>
          <div className="page-title-actions">
            {!hideBreadcrumbs ? (
              <nav aria-label="breadcrumb" className="breadcrumb-desktop">
                <ol className="breadcrumb">{breadcrumbItems}</ol>
              </nav>
            ) : null}
            {action}
          </div>
        </div>
      </div>
    </div>
  );
}
