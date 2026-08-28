import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Customer Engagement"
      section="Reports"
      actionLabel="Export Report"
      columns={["Touches", "Owner", "Last Active"]}
      stats={[
        {
          title: "Engaged Accounts",
          value: "94",
          change: "+9%",
          hint: "month",
          description: "Customers with recent activity",
          tone: "success",
          icon: "users",
        },
        {
          title: "NPS Score",
          value: "62",
          change: "+4",
          hint: "quarter",
          description: "Net promoter score",
          tone: "primary",
          icon: "trendingDown",
        },
        {
          title: "Silent Accounts",
          value: "17",
          change: "-2",
          hint: "month",
          description: "No activity in 30 days",
          tone: "orange",
          icon: "clock",
        },
      ]}
      rows={[
        {
          primary: "Stellar Media",
          secondary: "Growth plan",
          avatar: "/images/lead_com_logos/stellar.png",
          c1: "24 touches",
          c2: "Sofia Reyes",
          c3: "26 Aug 2026",
          status: "High",
        },
        {
          primary: "Vestige Co",
          secondary: "Enterprise",
          avatar: "/images/lead_com_logos/vestige.png",
          c1: "18 touches",
          c2: "Liam Brooks",
          c3: "25 Aug 2026",
          status: "Healthy",
        },
        {
          primary: "Quinscape",
          secondary: "Starter",
          avatar: "/images/lead_com_logos/quinscape.png",
          c1: "3 touches",
          c2: "Ethan Park",
          c3: "08 Aug 2026",
          status: "At Risk",
        },
      ]}
    />
  );
}
