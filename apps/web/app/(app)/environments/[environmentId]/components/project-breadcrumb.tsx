"use client";

import * as Sentry from "@sentry/nextjs";
import { useTranslate } from "@tolgee/react";
import { ChevronDownIcon, ChevronRightIcon, FolderOpenIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logger } from "@formbricks/logger";
import { BreadcrumbItem } from "@/modules/ui/components/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/modules/ui/components/dropdown-menu";

interface ProjectBreadcrumbProps {
  currentProjectId: string;
  projects: { id: string; name: string }[];
  isEnvironmentBreadcrumbVisible: boolean;
}

export const ProjectBreadcrumb = ({
  currentProjectId,
  projects,
  isEnvironmentBreadcrumbVisible,
}: ProjectBreadcrumbProps) => {
  const { t } = useTranslate();
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const currentProject = projects.find((project) => project.id === currentProjectId);

  if (!currentProject) {
    const errorMessage = `Project not found for project id: ${currentProjectId}`;
    logger.error(errorMessage);
    Sentry.captureException(new Error(errorMessage));
    return;
  }

  const handleProjectChange = (projectId: string) => {
    if (projectId === currentProjectId) return;
    setIsLoading(true);
    router.push(`/projects/${projectId}/`);
  };

  return (
    <BreadcrumbItem isActive={isProjectDropdownOpen}>
      <DropdownMenu onOpenChange={setIsProjectDropdownOpen}>
        <DropdownMenuTrigger
          className="flex cursor-pointer items-center gap-1 outline-none"
          id="projectDropdownTrigger"
          asChild>
          <div className="flex items-center gap-1">
            <FolderOpenIcon className="h-3 w-3" strokeWidth={1.5} />
            <span>{currentProject.name}</span>
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={1.5} />}
            {isProjectDropdownOpen ? (
              <ChevronDownIcon className="h-3 w-3" strokeWidth={1.5} />
            ) : (
              isEnvironmentBreadcrumbVisible && <ChevronRightIcon className="h-3 w-3" strokeWidth={1.5} />
            )}
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="mt-2">
          <div className="px-2 py-1.5 text-sm font-medium text-slate-500">
            <FolderOpenIcon className="mr-2 inline h-4 w-4" strokeWidth={1.5} />
            {t("common.choose_project")}
          </div>
          <DropdownMenuGroup>
            {projects.map((proj) => (
              <DropdownMenuCheckboxItem
                key={proj.id}
                checked={proj.id === currentProject.id}
                onClick={() => handleProjectChange(proj.id)}
                className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <span>{proj.name}</span>
                </div>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </BreadcrumbItem>
  );
};
