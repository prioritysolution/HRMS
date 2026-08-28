import { ModulePage } from "@/components/ui/ModulePage";

export default function Page() {
  return (
    <ModulePage
      title="Gallery"
      section="Pages"
      actionLabel="Upload Media"
      columns={["Album", "Uploaded By", "Added"]}
      stats={[
        {
          title: "Assets",
          value: "246",
          change: "+18",
          hint: "month",
          description: "Images in media library",
          tone: "primary",
          icon: "briefcase",
        },
        {
          title: "Albums",
          value: "12",
          change: "+2",
          hint: "month",
          description: "Organized gallery folders",
          tone: "info",
          icon: "users",
        },
        {
          title: "Pending Review",
          value: "5",
          change: "2 new",
          hint: "queue",
          description: "Uploads awaiting approval",
          tone: "warning",
          icon: "clock",
        },
      ]}
      rows={[
        {
          primary: "Office kickoff day",
          secondary: "event-cover.jpg",
          avatar: "/images/avatars/avatar4.jpg",
          c1: "Events",
          c2: "Maya Chen",
          c3: "24 Aug 2026",
          status: "Published",
        },
        {
          primary: "Product UI shots",
          secondary: "dashboard-hero.png",
          avatar: "/images/avatars/avatar5.jpg",
          c1: "Product",
          c2: "Ava Collins",
          c3: "22 Aug 2026",
          status: "Published",
        },
        {
          primary: "Team portraits",
          secondary: "headshots.zip",
          avatar: "/images/avatars/avatar6.jpg",
          c1: "People",
          c2: "HR Ops",
          c3: "20 Aug 2026",
          status: "Pending",
        },
      ]}
    />
  );
}
