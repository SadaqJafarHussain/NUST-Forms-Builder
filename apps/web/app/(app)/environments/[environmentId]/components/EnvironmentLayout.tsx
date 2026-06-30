import type { Session } from "next-auth";
import { TopNavbar } from "@/app/(app)/environments/[environmentId]/components/TopNavbar";
import { IS_FORMBRICKS_CLOUD } from "@/lib/constants";
import { getEnvironment } from "@/lib/environment/service";
import { getMembershipByUserIdOrganizationId } from "@/lib/membership/service";
import { getAccessFlags } from "@/lib/membership/utils";
import {
  getMonthlyActiveOrganizationPeopleCount,
  getMonthlyOrganizationResponseCount,
  getOrganizationByEnvironmentId,
} from "@/lib/organization/service";
import { getProjectByEnvironmentId, getProjects } from "@/lib/project/service";
import { getUser } from "@/lib/user/service";
import { getEnterpriseLicense } from "@/modules/ee/license-check/lib/license";
import { LimitsReachedBanner } from "@/modules/ui/components/limits-reached-banner";
import { PendingDowngradeBanner } from "@/modules/ui/components/pending-downgrade-banner";
import { getTranslate } from "@/tolgee/server";

interface EnvironmentLayoutProps {
  environmentId: string;
  session: Session;
  children?: React.ReactNode;
}

export const EnvironmentLayout = async ({ environmentId, session, children }: EnvironmentLayoutProps) => {
  const t = await getTranslate();
  const [user, environment, organization] = await Promise.all([
    getUser(session.user.id),
    getEnvironment(environmentId),
    getOrganizationByEnvironmentId(environmentId),
  ]);

  if (!user) {
    throw new Error(t("common.user_not_found"));
  }

  if (!organization) {
    throw new Error(t("common.organization_not_found"));
  }

  if (!environment) {
    throw new Error(t("common.environment_not_found"));
  }

  const currentUserMembership = await getMembershipByUserIdOrganizationId(session?.user.id, organization.id);
  if (!currentUserMembership) {
    throw new Error(t("common.membership_not_found"));
  }

  const { isOwner } = getAccessFlags(currentUserMembership.role);

  const [projects, currentProject, { lastChecked, isPendingDowngrade, active }] = await Promise.all([
    getProjects(organization.id),
    getProjectByEnvironmentId(environmentId),
    getEnterpriseLicense(),
  ]);

  let peopleCount = 0;
  let responseCount = 0;

  if (IS_FORMBRICKS_CLOUD) {
    [peopleCount, responseCount] = await Promise.all([
      getMonthlyActiveOrganizationPeopleCount(organization.id),
      getMonthlyOrganizationResponseCount(organization.id),
    ]);
  }

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden">
      {IS_FORMBRICKS_CLOUD && (
        <LimitsReachedBanner
          organization={organization}
          environmentId={environment.id}
          peopleCount={peopleCount}
          responseCount={responseCount}
        />
      )}

      <PendingDowngradeBanner
        lastChecked={lastChecked}
        isPendingDowngrade={isPendingDowngrade ?? false}
        active={active}
        environmentId={environment.id}
        locale={user.locale}
      />

      <TopNavbar
        user={user}
        organization={organization}
        environmentId={environmentId}
        projects={projects ?? []}
        currentProject={currentProject ?? null}
        canCreateProject={isOwner}
      />

      <div id="mainContent" className="flex flex-1 flex-col overflow-hidden bg-slate-50">
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
