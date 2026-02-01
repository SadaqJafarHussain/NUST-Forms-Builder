"use client";

import { useMemo } from "react";
import { EnvironmentBreadcrumb } from "@/app/(app)/environments/[environmentId]/components/environment-breadcrumb";
import { OrganizationBreadcrumb } from "@/app/(app)/environments/[environmentId]/components/organization-breadcrumb";
import { ProjectBreadcrumb } from "@/app/(app)/environments/[environmentId]/components/project-breadcrumb";
import { Breadcrumb, BreadcrumbList } from "@/modules/ui/components/breadcrumb";

interface ProjectAndOrgSwitchProps {
  currentOrganizationId: string;
  organizations: { id: string; name: string }[];
  currentProjectId?: string;
  projects: { id: string; name: string }[];
  currentEnvironmentId?: string;
  environments: { id: string; type: string }[];
  isMultiOrgEnabled: boolean;
}

export const ProjectAndOrgSwitch = ({
  currentOrganizationId,
  organizations,
  currentProjectId,
  projects,
  currentEnvironmentId,
  environments,
  isMultiOrgEnabled,
}: ProjectAndOrgSwitchProps) => {
  const sortedProjects = useMemo(
    () => projects.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  );
  const sortedOrganizations = useMemo(
    () => organizations.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [organizations]
  );
  const currentEnvironment = environments.find((env) => env.id === currentEnvironmentId);
  const showEnvironmentBreadcrumb = currentEnvironment?.type === "development";

  return (
    <Breadcrumb>
      <BreadcrumbList className="gap-0">
        <OrganizationBreadcrumb
          currentOrganizationId={currentOrganizationId}
          organizations={sortedOrganizations}
          isMultiOrgEnabled={isMultiOrgEnabled}
        />
        {currentProjectId && currentEnvironmentId && (
          <ProjectBreadcrumb
            currentProjectId={currentProjectId}
            projects={sortedProjects}
            isEnvironmentBreadcrumbVisible={showEnvironmentBreadcrumb}
          />
        )}
        {showEnvironmentBreadcrumb && (
          <EnvironmentBreadcrumb environments={environments} currentEnvironment={currentEnvironment} />
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
