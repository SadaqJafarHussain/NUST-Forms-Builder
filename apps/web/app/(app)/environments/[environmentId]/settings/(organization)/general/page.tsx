import { SettingsNavbar } from "@/app/(app)/environments/[environmentId]/settings/(organization)/components/OrganizationSettingsNavbar";
import { EMAIL_VERIFICATION_DISABLED, IS_STORAGE_CONFIGURED, PASSWORD_RESET_DISABLED } from "@/lib/constants";
import { getAccessFlags } from "@/lib/membership/utils";
import { getUser } from "@/lib/user/service";
import { getEnvironmentAuth } from "@/modules/environments/lib/utils";
import { Alert, AlertDescription } from "@/modules/ui/components/alert";
import { PageContentWrapper } from "@/modules/ui/components/page-content-wrapper";
import { PageHeader } from "@/modules/ui/components/page-header";
import { getTranslate } from "@/tolgee/server";
import { EditProfileDetailsForm } from "../../(account)/profile/components/EditProfileDetailsForm";
import { SettingsCard } from "../../components/SettingsCard";
import { AdminManagement } from "./components/AdminManagement";
import { DefaultBannerCard } from "./components/DefaultBannerCard";
import { EditOrganizationNameForm } from "./components/EditOrganizationNameForm";

const Page = async (props: { params: Promise<{ environmentId: string }> }) => {
  const params = await props.params;
  const t = await getTranslate();

  const { session, currentUserMembership, organization } = await getEnvironmentAuth(params.environmentId);

  const user = session?.user ? await getUser(session.user.id) : null;
  const defaultBannerConfig = (organization as any).defaultBannerConfig ?? null;

  if (!user) {
    throw new Error(t("common.user_not_found"));
  }

  const currentUserRole = currentUserMembership?.role;
  const isPasswordResetEnabled = !PASSWORD_RESET_DISABLED && user.identityProvider === "email";
  const { isOwner: isUserOwner, isManager } = getAccessFlags(currentUserRole);
  const isOwnerOrManager = isUserOwner || isManager;

  return (
    <PageContentWrapper>
      <PageHeader pageTitle={t("common.settings")}>
        <SettingsNavbar environmentId={params.environmentId} activeId="general" />
      </PageHeader>

      {/* NUST Settings Banner */}
      <div
        className="mb-6 mt-4 max-w-4xl overflow-hidden rounded-xl shadow-sm"
        style={{
          background: "linear-gradient(135deg, #1b335f 0%, #243f70 60%, #1b335f 100%)",
          border: "1px solid #0f314c",
        }}>
        <div className="h-1 w-full" style={{ backgroundColor: "#f4bf00" }} />
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">الإعدادات</h2>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
              إدارة الحساب الشخصي والجامعة
            </p>
          </div>
          <div className="flex items-center gap-2 opacity-60">
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: "#f4bf00", opacity: 0.3 }} />
            <div className="h-5 w-5 rounded-full" style={{ backgroundColor: "#f4bf00", opacity: 0.2 }} />
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#f4bf00", opacity: 0.15 }} />
          </div>
        </div>
      </div>

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

      {isOwnerOrManager && (
        <SettingsCard
          title="البانر الافتراضي للجامعة"
          description="يظهر هذا البانر في أعلى جميع النماذج التي لا تملك بانراً مخصصاً. مطلوب لنشر أي نموذج.">
          <DefaultBannerCard
            organizationId={organization.id}
            environmentId={params.environmentId}
            initialBannerConfig={defaultBannerConfig}
          />
        </SettingsCard>
      )}

      {isUserOwner && <AdminManagement organizationId={organization.id} />}
    </PageContentWrapper>
  );
};

export default Page;
