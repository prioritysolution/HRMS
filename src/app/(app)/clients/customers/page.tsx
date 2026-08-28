import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Customers"
      section="Clients"
      actionLabel="Add Customer"
      columns={["Plan", "Owner", "MRR"]}
      stats={[
        {
          title: "Active Customers",
          value: "128",
          change: "+7%",
          hint: "month",
          description: "Paying customer accounts",
          tone: "primary",
          icon: "users",
        },
        {
          title: "New This Month",
          value: "14",
          change: "+3",
          hint: "month",
          description: "Customers onboarded",
          tone: "success",
          icon: "userPlus",
        },
        {
          title: "Churn Risk",
          value: "6",
          change: "-2",
          hint: "week",
          description: "Accounts flagged for review",
          tone: "warning",
          icon: "trendingDown",
        },
      ]}
      rows={[
        {
          primary: "Stellar Media",
          secondary: "ops@stellar.io",
          avatar: "/images/lead_com_logos/stellar.png",
          c1: "Growth",
          c2: "Sofia Reyes",
          c3: "$4,200",
          status: "Active",
        },
        {
          primary: "Vestige Co",
          secondary: "hello@vestige.co",
          avatar: "/images/lead_com_logos/vestige.png",
          c1: "Enterprise",
          c2: "Liam Brooks",
          c3: "$12,800",
          status: "Active",
        },
        {
          primary: "Quinscape",
          secondary: "billing@quinscape.com",
          avatar: "/images/lead_com_logos/quinscape.png",
          c1: "Starter",
          c2: "Ethan Park",
          c3: "$890",
          status: "Pending",
        },
      ]}
    />
  );
}
