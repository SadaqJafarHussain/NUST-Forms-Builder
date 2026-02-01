"use client";

import { useTranslate } from "@tolgee/react";
import { usePathname } from "next/navigation";
import { SecondaryNavigation } from "@/modules/ui/components/secondary-navigation";

interface AccountSettingsNavbarProps {
  environmentId?: string;
  activeId: string;
  loading?: boolean;
}

export const AccountSettingsNavbar = ({ environmentId, activeId, loading }: AccountSettingsNavbarProps) => {
  const pathname = usePathname();
  const { t } = useTranslate();
  // Notifications tab removed - only profile settings
  const navigation = [
    {
      id: "profile",
      label: t("common.profile"),
      href: `/environments/${environmentId}/settings/profile`,
      current: pathname?.includes("/profile"),
    },
  ];

  return <SecondaryNavigation navigation={navigation} activeId={activeId} loading={loading} />;
};
