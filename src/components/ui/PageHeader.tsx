import { APP_NAME } from "@/config/navigation";

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
  const breadcrumbItems = (
    <>
      <li>{APP_NAME}</li>
      <li>{section}</li>
      <li className="active">{title}</li>
    </>
  );

  return (
    <div className={`page-title${hideTitle ? " page-title-breadcrumb-only" : ""}`}>
      <div className="container-fluid">
        <div className="page-title-inner">
          <div className="page-title-main">
            {!hideTitle ? <h1>{title}</h1> : null}
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
