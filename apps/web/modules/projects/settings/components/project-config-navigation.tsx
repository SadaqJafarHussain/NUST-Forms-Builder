"use client";

import { useTranslate } from "@tolgee/react";
import { BrushIcon, UsersIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { SecondaryNavigation } from "@/modules/ui/components/secondary-navigation";

interface ProjectConfigNavigationProps {
  activeId: string;
  environmentId?: string;
  loading?: boolean;
}

export const ProjectConfigNavigation = ({
  activeId,
  environmentId,
  loading,
}: ProjectConfigNavigationProps) => {
  const { t } = useTranslate();
  const pathname = usePathname();

  let navigation = [
    {
      id: "general",
      label: t("common.general"),
      icon: <UsersIcon className="h-5 w-5" />,
      href: `/environments/${environmentId}/project/general`,
      current: pathname?.includes("/general"),
    },
    {
      id: "look",
      label: t("common.look_and_feel"),
      icon: <BrushIcon className="h-5 w-5" />,
      href: `/environments/${environmentId}/project/look`,
      current: pathname?.includes("/look"),
    },
  ];

  return <SecondaryNavigation navigation={navigation} activeId={activeId} loading={loading} />;
};
