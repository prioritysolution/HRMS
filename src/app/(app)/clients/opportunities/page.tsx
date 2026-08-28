import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Opportunities"
      section="Clients"
      actionLabel="Add Opportunity"
      columns={["Stage", "Owner", "Amount"]}
      stats={[
        {
          title: "Open Pipeline",
          value: "$312k",
          change: "+11%",
          hint: "month",
          description: "Total open opportunity value",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "Win Rate",
          value: "34%",
          change: "+4%",
          hint: "quarter",
          description: "Closed-won conversion",
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: "Closing Soon",
          value: "9",
          change: "3 urgent",
          hint: "week",
          description: "Deals expected this week",
          tone: "warning",
          icon: "calendar",
        },
      ]}
      rows={[
        {
          primary: "Zoom Workspace",
          secondary: "Seat expansion",
          avatar: "/images/lead_com_logos/zoom.png",
          c1: "Discovery",
          c2: "Sofia Reyes",
          c3: "$32,000",
          status: "New",
        },
        {
          primary: "Google Meet Pro",
          secondary: "Annual contract",
          avatar: "/images/lead_com_logos/googlemeet.png",
          c1: "Proposal",
          c2: "Liam Brooks",
          c3: "$48,500",
          status: "Qualified",
        },
        {
          primary: "Lumion Labs",
          secondary: "Platform upgrade",
          avatar: "/images/lead_com_logos/lumion.png",
          c1: "Negotiation",
          c2: "Ethan Park",
          c3: "$61,200",
          status: "Negotiation",
        },
      ]}
    />
  );
}
