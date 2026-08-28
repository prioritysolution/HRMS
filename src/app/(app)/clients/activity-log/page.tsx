import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Activity Log"
      section="Clients"
      actionLabel="Log Activity"
      columns={["Type", "Owner", "When"]}
      stats={[
        {
          title: "Calls Logged",
          value: "48",
          change: "+12%",
          hint: "week",
          description: "Outbound and inbound calls",
          tone: "info",
          icon: "clock",
        },
        {
          title: "Meetings",
          value: "23",
          change: "+5",
          hint: "week",
          description: "Client meetings completed",
          tone: "success",
          icon: "calendar",
        },
        {
          title: "Emails Sent",
          value: "156",
          change: "+9%",
          hint: "week",
          description: "CRM-tracked email activity",
          tone: "primary",
          icon: "users",
        },
      ]}
      rows={[
        {
          primary: "Follow-up call",
          secondary: "Atom Soft",
          avatar: "/images/lead_com_logos/atom.png",
          c1: "Call",
          c2: "Liam Brooks",
          c3: "27 Aug, 10:14",
          status: "Completed",
        },
        {
          primary: "Demo meeting",
          secondary: "Global Reach",
          avatar: "/images/lead_com_logos/global.png",
          c1: "Meeting",
          c2: "Sofia Reyes",
          c3: "26 Aug, 15:30",
          status: "Completed",
        },
        {
          primary: "Proposal email",
          secondary: "Stellar Media",
          avatar: "/images/lead_com_logos/stellar.png",
          c1: "Email",
          c2: "Ethan Park",
          c3: "25 Aug, 09:05",
          status: "Sent",
        },
      ]}
    />
  );
}
