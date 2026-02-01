"use client";

import { useTranslate } from "@tolgee/react";
import {
  BuildingIcon,
  ChevronRightIcon,
  Cog,
  FolderPlusIcon,
  LogOutIcon,
  MessageCircle,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  UserCircleIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TEnvironment } from "@formbricks/types/environment";
import { TOrganizationRole } from "@formbricks/types/memberships";
import { TOrganization } from "@formbricks/types/organizations";
import { TUser } from "@formbricks/types/user";
import { NavigationLink } from "@/app/(app)/environments/[environmentId]/components/NavigationLink";
import FBLogo from "@/images/formbricks-wordmark.svg";
import { cn } from "@/lib/cn";
import { getAccessFlags } from "@/lib/membership/utils";
import { useSignOut } from "@/modules/auth/hooks/use-sign-out";
import { CreateProjectModal } from "@/modules/projects/components/create-project-modal";
import { ProjectLimitModal } from "@/modules/projects/components/project-limit-modal";
import { ProfileAvatar } from "@/modules/ui/components/avatars";
import { Button } from "@/modules/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/modules/ui/components/dropdown-menu";
import { ModalButton } from "@/modules/ui/components/upgrade-prompt";

interface NavigationProps {
  environment: TEnvironment;
  user: TUser;
  organization: TOrganization;
  projects: { id: string; name: string }[];
  isFormbricksCloud: boolean;
  membershipRole?: TOrganizationRole;
  organizationProjectsLimit: number;
  isLicenseActive: boolean;
  isAccessControlAllowed: boolean;
}

export const MainNavigation = ({
  environment,
  organization,
  user,
  projects,
  membershipRole,
  isFormbricksCloud,
  organizationProjectsLimit,
  isLicenseActive: _isLicenseActive,
  isAccessControlAllowed,
}: NavigationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const { signOut: signOutWithAudit } = useSignOut({ id: user.id, email: user.email });

  const project = projects.find((project) => project.id === environment.projectId);
  const { isManager, isOwner, isBilling, isMember } = getAccessFlags(membershipRole);

  const isOwnerOrManager = isManager || isOwner;

  // State for project creation modals
  const [openCreateProjectModal, setOpenCreateProjectModal] = useState(false);
  const [openLimitModal, setOpenLimitModal] = useState(false);

  const handleAddProject = () => {
    if (projects.length >= organizationProjectsLimit) {
      setOpenLimitModal(true);
      return;
    }
    setOpenCreateProjectModal(true);
  };

  const LimitModalButtons = (): [ModalButton, ModalButton] => {
    if (isFormbricksCloud) {
      return [
        {
          text: t("environments.settings.billing.upgrade"),
          href: `/environments/${environment.id}/settings/billing`,
        },
        {
          text: t("common.cancel"),
          onClick: () => setOpenLimitModal(false),
        },
      ];
    }

    return [
      {
        text: t("common.cancel"),
        onClick: () => setOpenLimitModal(false),
      },
      {
        text: t("common.cancel"),
        onClick: () => setOpenLimitModal(false),
      },
    ];
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    localStorage.setItem("isMainNavCollapsed", isCollapsed ? "false" : "true");
  };

  useEffect(() => {
    const isCollapsedValueFromLocalStorage = localStorage.getItem("isMainNavCollapsed") === "true";
    setIsCollapsed(isCollapsedValueFromLocalStorage);
  }, []);

  useEffect(() => {
    const toggleTextOpacity = () => {
      setIsTextVisible(isCollapsed);
    };
    const timeoutId = setTimeout(toggleTextOpacity, 150);
    return () => clearTimeout(timeoutId);
  }, [isCollapsed]);

  useEffect(() => {
    // Auto collapse project navbar on org and account settings
    if (pathname?.includes("/settings")) {
      setIsCollapsed(true);
    }
  }, [pathname]);

  const mainNavigation = useMemo(
    () => [
      {
        name: t("common.surveys"),
        href: `/environments/${environment.id}/surveys`,
        icon: MessageCircle,
        isActive: pathname?.includes("/surveys"),
        isHidden: false,
      },
      {
        name: t("common.configuration"),
        href: `/environments/${environment.id}/project/general`,
        icon: Cog,
        isActive: pathname?.includes("/project"),
        isHidden: isMember, // Hide configuration for members
      },
    ],
    [t, environment.id, pathname, isMember]
  );

  const dropdownNavigation = [
    {
      label: t("common.settings"),
      href: `/environments/${environment.id}/settings/general`,
      icon: UserCircleIcon,
    },
  ];

  const mainNavigationLink = `/environments/${environment.id}/${isBilling ? "settings/billing/" : "surveys/"}`;

  return (
    <>
      {project && (
        <aside
          className={cn(
            "z-40 flex flex-col justify-between rounded-r-xl border-r border-slate-200 bg-white pt-3 shadow-md transition-all duration-100",
            !isCollapsed ? "w-sidebar-collapsed" : "w-sidebar-expanded"
          )}>
          <div>
            {/* Logo and Toggle */}

            <div className="flex items-center justify-between px-3 pb-4">
              {!isCollapsed && (
                <Link
                  href={mainNavigationLink}
                  className={cn(
                    "flex items-center justify-center transition-opacity duration-100",
                    isTextVisible ? "opacity-0" : "opacity-100"
                  )}>
                  <Image src={FBLogo} width={160} height={30} alt={t("environments.formbricks_logo")} />
                </Link>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className={cn(
                  "rounded-xl bg-slate-50 p-1 text-slate-600 transition-all hover:bg-slate-100 focus:outline-none focus:ring-0 focus:ring-transparent"
                )}>
                {isCollapsed ? (
                  <PanelLeftOpenIcon strokeWidth={1.5} />
                ) : (
                  <PanelLeftCloseIcon strokeWidth={1.5} />
                )}
              </Button>
            </div>

            {/* Main Nav Switch */}
            {!isBilling && (
              <ul>
                {mainNavigation.map(
                  (item) =>
                    !item.isHidden && (
                      <NavigationLink
                        key={item.name}
                        href={item.href}
                        isActive={item.isActive}
                        isCollapsed={isCollapsed}
                        isTextVisible={isTextVisible}
                        linkText={item.name}>
                        <item.icon strokeWidth={1.5} />
                      </NavigationLink>
                    )
                )}
              </ul>
            )}

            {/* Admin Section - Only for owners/managers */}
            {isOwnerOrManager && !isBilling && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                <ul>
                  {/* Create New Project */}
                  <li>
                    <button
                      onClick={handleAddProject}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
                        isCollapsed ? "justify-center px-2" : "px-4"
                      )}>
                      <FolderPlusIcon className="h-5 w-5" strokeWidth={1.5} />
                      {!isCollapsed && !isTextVisible && (
                        <span className="text-sm">{t("common.add_new_project")}</span>
                      )}
                    </button>
                  </li>
                  {/* Organization Settings */}
                  <li>
                    <Link
                      href={`/environments/${environment.id}/settings/general`}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900",
                        isCollapsed ? "justify-center px-2" : "px-4",
                        pathname?.includes("/settings/general") && "bg-slate-100 text-slate-900"
                      )}>
                      <BuildingIcon className="h-5 w-5" strokeWidth={1.5} />
                      {!isCollapsed && !isTextVisible && (
                        <span className="text-sm">{t("common.organization_settings")}</span>
                      )}
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div>
            {/* User Switch */}
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  id="userDropdownTrigger"
                  className="w-full rounded-br-xl border-t py-4 transition-colors duration-200 hover:bg-slate-50 focus:outline-none">
                  <div
                    className={cn(
                      "flex cursor-pointer flex-row items-center gap-3",
                      isCollapsed ? "justify-center px-2" : "px-4"
                    )}>
                    <ProfileAvatar userId={user.id} />
                    {!isCollapsed && !isTextVisible && (
                      <>
                        <div
                          className={cn(isTextVisible ? "opacity-0" : "opacity-100", "grow overflow-hidden")}>
                          <p
                            title={user?.email}
                            className={cn(
                              "ph-no-capture ph-no-capture -mb-0.5 truncate text-sm font-bold text-slate-700"
                            )}>
                            {user?.name ? <span>{user?.name}</span> : <span>{user?.email}</span>}
                          </p>
                          <p className="text-sm text-slate-700">{t("common.account")}</p>
                        </div>
                        <ChevronRightIcon
                          className={cn("h-5 w-5 shrink-0 text-slate-700 hover:text-slate-500")}
                        />
                      </>
                    )}
                  </div>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  id="userDropdownInnerContentWrapper"
                  side="right"
                  sideOffset={10}
                  alignOffset={5}
                  align="end">
                  {/* Dropdown Items */}

                  {dropdownNavigation.map((link) => (
                    <Link href={link.href} className="flex w-full items-center" key={link.label}>
                      <DropdownMenuItem>
                        <link.icon className="mr-2 h-4 w-4" strokeWidth={1.5} />
                        {link.label}
                      </DropdownMenuItem>
                    </Link>
                  ))}
                  {/* Logout */}
                  <DropdownMenuItem
                    onClick={async () => {
                      const route = await signOutWithAudit({
                        reason: "user_initiated",
                        redirectUrl: "/auth/login",
                        organizationId: organization.id,
                        redirect: false,
                        callbackUrl: "/auth/login",
                        clearEnvironmentId: true,
                      });
                      router.push(route?.url || "/auth/login"); // NOSONAR // We want to check for empty strings
                    }}
                    icon={<LogOutIcon className="mr-2 h-4 w-4" strokeWidth={1.5} />}>
                    {t("common.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>
      )}

      {/* Project Creation Modals */}
      {openLimitModal && (
        <ProjectLimitModal
          open={openLimitModal}
          setOpen={setOpenLimitModal}
          buttons={LimitModalButtons()}
          projectLimit={organizationProjectsLimit}
        />
      )}
      {openCreateProjectModal && (
        <CreateProjectModal
          open={openCreateProjectModal}
          setOpen={setOpenCreateProjectModal}
          organizationId={organization.id}
          isAccessControlAllowed={isAccessControlAllowed}
        />
      )}
    </>
  );
};
