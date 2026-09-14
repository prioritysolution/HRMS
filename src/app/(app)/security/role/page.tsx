import { MasterDataPage } from "@/components/ui/MasterDataPage";

export default function RoleManagementPage() {
  return (
    <MasterDataPage
      moduleId="roles"
      modalSubtitle="Create and manage security roles for system access."
      emptyStateMessage="No roles yet. Add a role to assign permissions and access levels."
    />
  );
}
