import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="KPI Dashboards"
      section="Reports"
      actionLabel="Configure KPI"
      columns={["Target", "Actual", "Owner"]}
      stats={[
        {
          title: "Revenue KPI",
          value: "108%",
          change: "+8%",
          hint: "target",
          description: "Monthly recurring revenue vs goal",
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: "Hiring KPI",
          value: "86%",
          change: "-4%",
          hint: "target",
          description: "Open roles filled this quarter",
          tone: "warning",
          icon: "userPlus",
          positive: false,
        },
        {
          title: "Retention KPI",
          value: "97%",
          change: "+1%",
          hint: "target",
          description: "Employee retention rate",
          tone: "primary",
          icon: "users",
        },
      ]}
      rows={[
        {
          primary: "Monthly Recurring Revenue",
          secondary: "Finance",
          avatar: "/images/avatars/avatar1.jpg",
          c1: "$400k",
          c2: "$432k",
          c3: "Finance Ops",
          status: "Met",
        },
        {
          primary: "Time to Hire",
          secondary: "People",
          avatar: "/images/avatars/avatar2.jpg",
          c1: "28 days",
          c2: "34 days",
          c3: "HR Ops",
          status: "Behind",
        },
        {
          primary: "Customer Retention",
          secondary: "Success",
          avatar: "/images/avatars/avatar3.jpg",
          c1: "95%",
          c2: "96%",
          c3: "CS Team",
          status: "Met",
        },
      ]}
    />
  );
}
