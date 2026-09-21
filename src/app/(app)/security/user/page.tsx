"use client";

import { MasterDataPage } from "@/components/ui/MasterDataPage";
import { useI18n } from "@/i18n";

export default function UserManagementPage() {
  const { t } = useI18n();
  return (
    <MasterDataPage
      moduleId="users"
      emptyStateMessage={t("security.pages.users.empty")}
    />
  );
}
