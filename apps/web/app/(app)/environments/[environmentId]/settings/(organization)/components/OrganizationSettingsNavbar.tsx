"use client";

import { useTranslate } from "@tolgee/react";
import { usePathname } from "next/navigation";
import { SecondaryNavigation } from "@/modules/ui/components/secondary-navigation";

interface SettingsNavbarProps {
  environmentId?: string;
  activeId: string;
  loading?: boolean;
}

export const SettingsNavbar = ({ environmentId, activeId, loading }: SettingsNavbarProps) => {
  const pathname = usePathname();
  const { t } = useTranslate();

  const navigation = [
    {
      id: "general",
      label: t("common.general"),
      href: `/environments/${environmentId}/settings/general`,
      current: pathname?.includes("/general"),
      hidden: false,
    },
  ];

  return <SecondaryNavigation navigation={navigation} activeId={activeId} loading={loading} />;
};

// Keep for backwards compatibility
export const OrganizationSettingsNavbar = SettingsNavbar;
