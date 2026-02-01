import { SettingsNavbar } from "@/app/(app)/environments/[environmentId]/settings/(organization)/components/OrganizationSettingsNavbar";
import {
  EMAIL_VERIFICATION_DISABLED,
  IS_FORMBRICKS_CLOUD,
  IS_STORAGE_CONFIGURED,
  PASSWORD_RESET_DISABLED,
} from "@/lib/constants";
import { getAccessFlags } from "@/lib/membership/utils";
import { getOrganizationsWhereUserIsSingleOwner } from "@/lib/organization/service";
import { getUser } from "@/lib/user/service";
import { getIsMultiOrgEnabled } from "@/modules/ee/license-check/lib/utils";
import { getEnvironmentAuth } from "@/modules/environments/lib/utils";
import { Alert, AlertDescription } from "@/modules/ui/components/alert";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { getTranslate } from "@/tolgee/server";
import { DeleteAccount } from "../../(account)/profile/components/DeleteAccount";
import { EditProfileDetailsForm } from "../../(account)/profile/components/EditProfileDetailsForm";
import { SettingsCard } from "../../components/SettingsCard";
import { AdminManagement } from "./components/AdminManagement";
import { DeleteOrganization } from "./components/DeleteOrganization";
import { EditOrganizationNameForm } from "./components/EditOrganizationNameForm";

const Page = async (props: { params: Promise<{ environmentId: string }> }) => {
  const params = await props.params;
  const t = await getTranslate();

  const { session, currentUserMembership, organization, isOwner } = await getEnvironmentAuth(
    params.environmentId
  );

  const isMultiOrgEnabled = await getIsMultiOrgEnabled();
  const organizationsWithSingleOwner = await getOrganizationsWhereUserIsSingleOwner(session.user.id);
  const user = session?.user ? await getUser(session.user.id) : null;

  if (!user) {
    throw new Error(t("common.user_not_found"));
  }

  const isDeleteDisabled = !isOwner || !isMultiOrgEnabled;
  const currentUserRole = currentUserMembership?.role;
  const isPasswordResetEnabled = !PASSWORD_RESET_DISABLED && user.identityProvider === "email";
  const { isOwner: isUserOwner, isManager } = getAccessFlags(currentUserRole);
  const isOwnerOrManager = isUserOwner || isManager;

  return (
    <PageContentWrapper>
      <PageHeader pageTitle={t("common.settings")}>
        <SettingsNavbar environmentId={params.environmentId} activeId="general" />
      </PageHeader>
      {!IS_STORAGE_CONFIGURED && (
        <div className="max-w-4xl">
          <Alert variant="warning">
            <AlertDescription>{t("common.storage_not_configured")}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Profile Settings */}
      <SettingsCard
        title={t("environments.settings.profile.personal_information")}
        description={t("environments.settings.profile.update_personal_info")}>
        <EditProfileDetailsForm
          user={user}
          emailVerificationDisabled={EMAIL_VERIFICATION_DISABLED}
          isPasswordResetEnabled={isPasswordResetEnabled}
        />
      </SettingsCard>

      {/* Organization Settings - Only visible to owners and managers */}
      {isOwnerOrManager && (
        <SettingsCard
          title={t("environments.settings.general.organization_name")}
          description={t("environments.settings.general.organization_name_description")}>
          <EditOrganizationNameForm
            organization={organization}
            environmentId={params.environmentId}
            membershipRole={currentUserMembership?.role}
          />
        </SettingsCard>
      )}

      {isUserOwner && <AdminManagement organizationId={organization.id} />}

      {/* Delete Account */}
      <SettingsCard
        title={t("environments.settings.profile.delete_account")}
        description={t("environments.settings.profile.confirm_delete_account")}>
        <DeleteAccount
          session={session}
          IS_FORMBRICKS_CLOUD={IS_FORMBRICKS_CLOUD}
          user={user}
          organizationsWithSingleOwner={organizationsWithSingleOwner}
          isMultiOrgEnabled={isMultiOrgEnabled}
        />
      </SettingsCard>

      {isMultiOrgEnabled && isUserOwner && (
        <SettingsCard
          title={t("environments.settings.general.delete_organization")}
          description={t("environments.settings.general.delete_organization_description")}>
          <DeleteOrganization
            organization={organization}
            isDeleteDisabled={isDeleteDisabled}
            isUserOwner={currentUserRole === "owner"}
          />
        </SettingsCard>
      )}
    </PageContentWrapper>
  );
};

export default Page;
