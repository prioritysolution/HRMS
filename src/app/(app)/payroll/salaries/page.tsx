import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Salaries"
      section="Payroll"
      actionLabel="Run Payroll"
      columns={["Role", "Net Pay", "Cycle"]}
      stats={[
        {
          title: "Payroll Total",
          value: "$428k",
          change: "+3%",
          hint: "month",
          description: "Total salaries this cycle",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "Processed",
          value: "198",
          change: "96%",
          hint: "cycle",
          description: "Employees paid this run",
          tone: "success",
          icon: "users",
        },
        {
          title: "Pending",
          value: "8",
          change: "2 holds",
          hint: "review",
          description: "Payslips awaiting approval",
          tone: "warning",
          icon: "clock",
        },
      ]}
      rows={[
        {
          primary: "Priya Sharma",
          secondary: "EMP-1042",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "Engineering Lead",
          c2: "$6,850",
          c3: "Aug 2026",
          status: "Paid",
        },
        {
          primary: "Daniel Ortiz",
          secondary: "EMP-1108",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "Sales Manager",
          c2: "$5,920",
          c3: "Aug 2026",
          status: "Paid",
        },
        {
          primary: "Ava Collins",
          secondary: "EMP-1184",
          avatar: "/images/avatars/avatar7.jpg",
          c1: "Product Designer",
          c2: "$4,760",
          c3: "Aug 2026",
          status: "Pending",
        },
      ]}
    />
  );
}
