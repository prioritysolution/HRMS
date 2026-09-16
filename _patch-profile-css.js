const fs = require("fs");
const path = "d:/Priority Solution/HRMS/src/app/globals.css";
let text = fs.readFileSync(path, "utf8");
const start = text.indexOf(".profile-modal-grid {");
const end = text.indexOf("[data-theme=\"dark\"] {\n  --modal-bg: rgb(25, 43, 75);");
if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}

const replacement = `.profile-modal-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 1.25rem;
}

.employee-profile-page {
  width: 100%;
  max-width: 1280px;
  min-width: 0;
}

.employee-profile-page > .card,
.employee-profile-page .employee-profile-layout,
.employee-profile-page .employee-profile-main,
.employee-profile-page .employee-profile-aside {
  min-width: 0;
  width: 100%;
}

.employee-profile-loading {
  display: flex;
  min-height: 280px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  color: var(--muted);
}

.employee-profile-error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
}

.employee-profile-hero-card .card-body {
  padding: 1.25rem 1.35rem;
}

.employee-profile-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  min-width: 0;
}

.employee-profile-hero-main {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  min-width: 0;
  flex: 1 1 auto;
}

.employee-profile-hero-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.employee-profile-avatar {
  width: 84px;
  height: 84px;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
}

.employee-profile-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    145deg,
    rgba(var(--primary-rgb), 0.18),
    rgba(var(--primary-rgb), 0.08)
  );
  color: var(--primary);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.employee-profile-hero-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.55rem 0.65rem;
}

.employee-profile-hero-title h2 {
  margin: 0;
  font-size: clamp(1.15rem, 2.4vw, 1.45rem);
  font-weight: 800;
  color: var(--title);
  word-break: break-word;
}

.employee-profile-hero-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.45rem;
}

.employee-profile-username {
  color: var(--muted);
  font-size: 0.9rem;
}

.employee-profile-hero-subtitle {
  margin: 0.45rem 0 0;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.45;
  word-break: break-word;
}

.employee-profile-hero-side {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
}

.employee-profile-org-logo {
  width: 64px;
  height: 64px;
  border-radius: 0.9rem;
  object-fit: contain;
  border: 1px solid var(--border);
  background: var(--card-soft);
  padding: 0.3rem;
  flex-shrink: 0;
}

.employee-profile-stat-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  min-width: 0;
  width: 100%;
}

.employee-profile-stat {
  min-width: 0;
  padding: 0.55rem 0.7rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  background: var(--card-soft);
}

.employee-profile-stat span {
  display: block;
  font-size: 0.72rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.employee-profile-stat strong {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.95rem;
  color: var(--title);
  word-break: break-word;
}

.employee-profile-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 0.85fr);
  gap: 1rem;
  align-items: start;
  min-width: 0;
}

.employee-profile-section-head {
  margin-bottom: 0.95rem;
}

.employee-profile-section-head h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--title);
}

.employee-profile-section-head p {
  margin: 0.25rem 0 0;
  color: var(--muted);
  font-size: 0.84rem;
}

.employee-profile-fact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.employee-profile-fact {
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  min-width: 0;
  padding: 0.7rem 0.8rem;
  border-radius: 0.75rem;
  background: var(--card-soft);
  border: 1px solid transparent;
}

.employee-profile-fact--roles {
  grid-column: 1 / -1;
}

.employee-profile-fact-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--muted);
  font-size: 0.78rem;
}

.employee-profile-fact-value {
  font-weight: 650;
  color: var(--title);
  word-break: break-word;
  font-size: 0.94rem;
  line-height: 1.35;
}

.employee-profile-card-title {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--title);
}

.employee-profile-field+.employee-profile-field,
.employee-profile-roles {
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px dashed var(--border);
}

.employee-profile-field-label {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  color: var(--muted);
  font-size: 0.88rem;
}

.employee-profile-field-value {
  margin-top: 0.3rem;
  font-weight: 600;
  color: var(--title);
  word-break: break-word;
}

.employee-profile-role-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.15rem;
}

.employee-profile-security-card {
  position: sticky;
  top: 1rem;
}

.employee-profile-security-card .card-body {
  padding: 1.15rem 1.2rem;
}

.employee-profile-security-intro {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1.15rem;
}

.employee-profile-security-icon {
  width: 38px;
  height: 38px;
  border-radius: 0.7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--primary-rgb), 0.12);
  color: var(--primary);
  flex-shrink: 0;
}

.employee-profile-security-intro h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--title);
}

.employee-profile-security-intro p {
  margin: 0.2rem 0 0;
  color: var(--muted);
  font-size: 0.84rem;
  line-height: 1.4;
}

@media (max-width: 1200px) {
  .employee-profile-layout {
    grid-template-columns: 1fr;
  }

  .employee-profile-security-card {
    position: static;
  }
}

@media (max-width: 992px) {
  .employee-profile-hero {
    flex-direction: column;
    align-items: stretch;
  }

  .employee-profile-hero-side {
    width: 100%;
    justify-content: flex-start;
  }

  .employee-profile-stat-strip {
    flex: 1 1 auto;
  }

  .employee-profile-hero-card .card-body,
  .employee-profile-page .card > .card-body {
    padding: 1rem 1.05rem;
  }
}

@media (max-width: 900px) {
  .form-grid,
  .form-grid-2,
  .profile-modal-grid {
    grid-template-columns: 1fr;
  }

  .form-span-2 {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .employee-profile-hero-main {
    align-items: flex-start;
  }

  .employee-profile-avatar {
    width: 68px;
    height: 68px;
  }

  .employee-profile-avatar-fallback {
    font-size: 1.1rem;
  }

  .employee-profile-fact-grid {
    grid-template-columns: 1fr;
  }

  .employee-profile-hero-side {
    flex-direction: column;
    align-items: stretch;
  }

  .employee-profile-org-logo {
    display: none;
  }
}

@media (max-width: 576px) {
  .employee-profile-hero-card .card-body,
  .employee-profile-page .card > .card-body,
  .employee-profile-security-card .card-body {
    padding: 0.9rem;
  }

  .employee-profile-hero-main {
    gap: 0.8rem;
  }

  .employee-profile-avatar {
    width: 56px;
    height: 56px;
  }

  .employee-profile-stat-strip {
    grid-template-columns: 1fr;
    gap: 0.45rem;
  }

  .employee-profile-stat {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.65rem 0.75rem;
  }

  .employee-profile-stat span {
    margin: 0;
  }

  .employee-profile-stat strong {
    margin: 0;
    text-align: right;
  }

  .employee-profile-hero-title h2 {
    font-size: 1.15rem;
  }

  .employee-profile-fact {
    padding: 0.65rem 0.7rem;
  }

  .employee-profile-security-intro {
    margin-bottom: 0.95rem;
  }
}

`;

text = text.slice(0, start) + replacement + text.slice(end);
fs.writeFileSync(path, text);
console.log("updated profile responsive css");
