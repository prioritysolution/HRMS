import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Pricing"
      section="Pages"
      actionLabel="Add Plan"
      columns={["Billing", "Seats", "Price"]}
      stats={[
        {
          title: "Active Plans",
          value: "4",
          change: "live",
          hint: "catalog",
          description: "Published pricing tiers",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "Subscribers",
          value: "128",
          change: "+7%",
          hint: "month",
          description: "Customers on paid plans",
          tone: "success",
          icon: "users",
        },
        {
          title: "Upgrades",
          value: "11",
          change: "+3",
          hint: "week",
          description: "Plan upgrades this week",
          tone: "info",
          icon: "trendingDown",
        },
      ]}
      rows={[
        {
          primary: "Starter",
          secondary: "For small teams",
          avatar: "/images/lead_com_logos/atom.png",
          c1: "Monthly",
          c2: "Up to 25",
          c3: "$49",
          status: "Active",
        },
        {
          primary: "Growth",
          secondary: "Scaling companies",
          avatar: "/images/lead_com_logos/stellar.png",
          c1: "Monthly",
          c2: "Up to 100",
          c3: "$149",
          status: "Popular",
        },
        {
          primary: "Enterprise",
          secondary: "Custom security & SSO",
          avatar: "/images/lead_com_logos/vestige.png",
          c1: "Annual",
          c2: "Unlimited",
          c3: "Custom",
          status: "Active",
        },
      ]}
    />
  );
}
