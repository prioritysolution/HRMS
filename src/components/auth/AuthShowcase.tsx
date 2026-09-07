import {
  BarChart3,
  Clock3,
  LayoutDashboard,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

const features = [
  {
    icon: LayoutDashboard,
    title: "Workforce analytics",
    copy: "Headcount, attendance, and leave trends in real time.",
  },
  {
    icon: UsersRound,
    title: "Employee directory",
    copy: "Profiles, org structure, and status management.",
  },
  {
    icon: Clock3,
    title: "Attendance & leave",
    copy: "Check-ins, schedules, and approvals without friction.",
  },
  {
    icon: BarChart3,
    title: "Payroll & performance",
    copy: "Payslips, salary workflows, and team metrics together.",
  },
];

export function AuthShowcase() {
  return (
    <div className="auth-showcase">
      <div className="auth-showcase-head">
        <p className="auth-showcase-kicker">All-in-one workforce platform</p>
        <h2 className="auth-showcase-title">
          Run people, process, and payroll from one modern HRMS workspace.
        </h2>
        <p className="auth-showcase-lead">
          One place for the people side of your business — from onboarding and attendance to
          leave and payroll.
        </p>
      </div>

      <ul className="auth-feature-list">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <li key={feature.title} className="auth-feature-item">
              <span className="auth-feature-icon" aria-hidden="true">
                <Icon size={16} strokeWidth={2} />
              </span>
              <div>
                <strong className="auth-feature-title">{feature.title}</strong>
                <span className="auth-feature-copy">{feature.copy}</span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="auth-showcase-footer">
        <div className="auth-showcase-footer-icon" aria-hidden="true">
          <ShieldCheck size={18} strokeWidth={2} />
        </div>
        <p>
          Secure access for every team member — attendance, leave, and payroll in one place.
        </p>
      </div>
    </div>
  );
}
