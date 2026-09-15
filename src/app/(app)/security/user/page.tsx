import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function UserManagementPage() {
  return (
    <MasterDataPage
      moduleId="users"
      emptyStateMessage="No user accounts are available for this organization yet."
    />
  );
}
