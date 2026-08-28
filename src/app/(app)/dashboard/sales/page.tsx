import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Sales Dashboard"
      section="Dashboards"
      actionLabel="Add Deal"
      columns={["Pipeline", "Owner", "Value"]}
      stats={[
        {
          title: "Closed Won",
          value: "$186k",
          change: "+14%",
          hint: "month",
          description: "Revenue closed this month",
          tone: "success",
          icon: "briefcase",
        },
        {
          title: "Open Deals",
          value: "42",
          change: "+6%",
          hint: "week",
          description: "Active opportunities in pipeline",
          tone: "primary",
          icon: "trendingDown",
        },
        {
          title: "Avg. Deal Size",
          value: "$9.4k",
          change: "+3%",
          hint: "quarter",
          description: "Average won deal value",
          tone: "info",
          icon: "users",
        },
      ]}
      rows={[
        {
          primary: "Atom Soft",
          secondary: "Enterprise plan",
          avatar: "/images/lead_com_logos/atom.png",
          c1: "Negotiation",
          c2: "Liam Brooks",
          c3: "$24,500",
          status: "Active",
        },
        {
          primary: "Global Reach",
          secondary: "Upsell seats",
          avatar: "/images/lead_com_logos/global.png",
          c1: "Proposal",
          c2: "Sofia Reyes",
          c3: "$18,200",
          status: "Pending",
        },
        {
          primary: "Lumion Labs",
          secondary: "Annual renewal",
          avatar: "/images/lead_com_logos/lumion.png",
          c1: "Closed",
          c2: "Ethan Park",
          c3: "$54,000",
          status: "Approved",
        },
      ]}
    />
  );
}
