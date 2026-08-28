import { APP_NAME } from "@/config/navigation";

type PageHeaderProps = {
  title: string;
  section?: string;
  action?: React.ReactNode;
  hideTitle?: boolean;
};

export function PageHeader({
  title,
  section = "Apps",
  action,
  hideTitle = false,
}: PageHeaderProps) {
  return (
    <div className={`page-title${hideTitle ? " page-title-breadcrumb-only" : ""}`}>
      <div className="container-fluid">
        <div className="page-title-inner">
          <div className="page-title-main">
            {!hideTitle ? <h1>{title}</h1> : null}
            <nav aria-label="breadcrumb" className="breadcrumb-mobile">
              <ol className="breadcrumb">
                <li>{APP_NAME}</li>
                <li>{section}</li>
                <li className="active">{title}</li>
              </ol>
            </nav>
          </div>
          <div className="page-title-actions">
            <nav aria-label="breadcrumb" className="breadcrumb-desktop">
              <ol className="breadcrumb">
                <li>{APP_NAME}</li>
                <li>{section}</li>
                <li className="active">{title}</li>
              </ol>
            </nav>
            {action}
          </div>
        </div>
      </div>
    </div>
  );
}
