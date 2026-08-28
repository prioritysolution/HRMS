import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Companies"
      section="Clients"
      actionLabel="Add Company"
      columns={["Industry", "Employees", "Location"]}
      stats={[
        {
          title: "Companies",
          value: "64",
          change: "+5%",
          hint: "month",
          description: "Organizations in CRM",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "Enterprise",
          value: "18",
          change: "+2",
          hint: "quarter",
          description: "Accounts with 200+ seats",
          tone: "info",
          icon: "users",
        },
        {
          title: "Prospects",
          value: "22",
          change: "+8%",
          hint: "week",
          description: "Companies not yet customers",
          tone: "orange",
          icon: "userPlus",
        },
      ]}
      rows={[
        {
          primary: "Mitsubishi",
          secondary: "manufacturing",
          avatar: "/images/lead_com_logos/mitsubishi.png",
          c1: "Manufacturing",
          c2: "1,200+",
          c3: "Tokyo",
          status: "Active",
        },
        {
          primary: "McLaren Group",
          secondary: "automotive",
          avatar: "/images/lead_com_logos/mclaren.png",
          c1: "Automotive",
          c2: "450",
          c3: "Woking",
          status: "Active",
        },
        {
          primary: "Atom Soft",
          secondary: "saas",
          avatar: "/images/lead_com_logos/atom.png",
          c1: "Software",
          c2: "85",
          c3: "Austin",
          status: "Prospect",
        },
      ]}
    />
  );
}
