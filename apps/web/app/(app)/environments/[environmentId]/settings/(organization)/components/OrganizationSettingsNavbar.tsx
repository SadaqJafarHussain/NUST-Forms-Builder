"use client";

import { usePathname } from "next/navigation";
import { SecondaryNavigation } from "@/modules/ui/components/secondary-navigation";

interface SettingsNavbarProps {
  environmentId?: string;
  activeId: string;
  loading?: boolean;
}

export const SettingsNavbar = ({ environmentId, activeId, loading }: SettingsNavbarProps) => {
  const pathname = usePathname();

  const navigation = [
    {
      id: "general",
      label: "عام",
      href: `/environments/${environmentId}/settings/general`,
      current: pathname?.includes("/general"),
      hidden: false,
    },
  ];

  return <SecondaryNavigation navigation={navigation} activeId={activeId} loading={loading} />;
};

// Keep for backwards compatibility
export const OrganizationSettingsNavbar = SettingsNavbar;
