export function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container-fluid">
        <div className="footer-inner">
          <p className="footer-text mb-0">© {year} HRMS. All Rights Reserved.</p>
          <p className="footer-text mb-0 text-center md:text-right">
            Developed by{" "}
            <a
              href="https://prioritysolutions.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Priority Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
