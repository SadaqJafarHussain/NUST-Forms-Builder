"use client";

import { TEnvironment } from "@formbricks/types/environment";
import { ProjectAndOrgSwitch } from "@/app/(app)/environments/[environmentId]/components/project-and-org-switch";
import { useEnvironment } from "@/app/(app)/environments/[environmentId]/context/environment-context";

interface TopControlBarProps {
  environments: TEnvironment[];
  currentOrganizationId: string;
  organizations: { id: string; name: string }[];
  currentProjectId: string;
  projects: { id: string; name: string }[];
  isMultiOrgEnabled: boolean;
}

export const TopControlBar = ({
  environments,
  currentOrganizationId,
  organizations,
  currentProjectId,
  projects,
  isMultiOrgEnabled,
}: TopControlBarProps) => {
  const { environment } = useEnvironment();

  return (
    <div
      className="flex h-14 w-full items-center justify-between bg-slate-50 px-6"
      data-testid="fb__global-top-control-bar">
      <ProjectAndOrgSwitch
        currentEnvironmentId={environment.id}
        environments={environments}
        currentOrganizationId={currentOrganizationId}
        organizations={organizations}
        currentProjectId={currentProjectId}
        projects={projects}
        isMultiOrgEnabled={isMultiOrgEnabled}
      />
    </div>
  );
};
