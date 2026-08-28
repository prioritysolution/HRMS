import { ModulePage } from "@/components/ui/ModulePage";

const leadRows = [
  {
    primary: "Atom Soft",
    secondary: "liam@atomsoft.io",
    avatar: "/images/lead_com_logos/atom.png",
    c1: "Website",
    c2: "Liam Brooks",
    c3: "$12,400",
    status: "New",
  },
  {
    primary: "Global Reach",
    secondary: "sofia@globalreach.com",
    avatar: "/images/lead_com_logos/global.png",
    c1: "Referral",
    c2: "Sofia Reyes",
    c3: "$28,900",
    status: "Qualified",
  },
  {
    primary: "Lumion Labs",
    secondary: "ethan@lumion.io",
    avatar: "/images/lead_com_logos/lumion.png",
    c1: "Campaign",
    c2: "Ethan Park",
    c3: "$54,200",
    status: "Negotiation",
  },
];

export default function Page() {
  return (
    <ModulePage
      title="Leads"
      section="Clients"
      actionLabel="Add Lead"
      columns={["Source", "Contact", "Value"]}
      stats={[
        {
          title: "New Leads",
          value: "36",
          change: "+8%",
          hint: "week",
          description: "Fresh inbound opportunities",
          tone: "primary",
          icon: "userPlus",
        },
        {
          title: "Qualified",
          value: "18",
          change: "+5%",
          hint: "week",
          description: "Ready for sales follow-up",
          tone: "success",
          icon: "briefcase",
        },
        {
          title: "Pipeline Value",
          value: "$214k",
          change: "+12%",
          hint: "month",
          description: "Open lead opportunity value",
          tone: "info",
          icon: "trendingDown",
        },
      ]}
      rows={leadRows}
    />
  );
}
