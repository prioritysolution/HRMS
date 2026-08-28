import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Email"
      section="Apps"
      actionLabel="Compose"
      columns={["Subject", "Folder", "Received"]}
      stats={[
        {
          title: "Inbox",
          value: "126",
          change: "18 unread",
          hint: "today",
          description: "Messages in primary inbox",
          tone: "primary",
          icon: "users",
        },
        {
          title: "Sent Today",
          value: "34",
          change: "+6%",
          hint: "day",
          description: "Outbound emails today",
          tone: "success",
          icon: "trendingDown",
        },
        {
          title: "Scheduled",
          value: "7",
          change: "2 soon",
          hint: "queue",
          description: "Emails waiting to send",
          tone: "info",
          icon: "calendar",
        },
      ]}
      rows={[
        {
          primary: "Liam Brooks",
          secondary: "liam@atomsoft.io",
          avatar: "/images/avatars/avatar4.jpg",
          c1: "Renewal proposal draft",
          c2: "Inbox",
          c3: "27 Aug, 09:12",
          status: "Unread",
        },
        {
          primary: "HR Ops",
          secondary: "hr@staffu.app",
          avatar: "/images/avatars/avatar5.jpg",
          c1: "August payroll summary",
          c2: "Inbox",
          c3: "26 Aug, 16:40",
          status: "Read",
        },
        {
          primary: "Ethan Park",
          secondary: "ethan@lumion.io",
          avatar: "/images/avatars/avatar6.jpg",
          c1: "Contract redlines attached",
          c2: "Important",
          c3: "25 Aug, 11:05",
          status: "Starred",
        },
      ]}
    />
  );
}
