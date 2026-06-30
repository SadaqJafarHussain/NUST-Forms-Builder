import { Metadata } from "next";
import { DEFAULT_LOCALE, SURVEYS_PER_PAGE } from "@/lib/constants";
import { getPublicDomain } from "@/lib/getPublicUrl";
import { getMembershipByUserIdOrganizationId } from "@/lib/membership/service";
import { getAccessFlags } from "@/lib/membership/utils";
import { getOrganizationByEnvironmentId } from "@/lib/organization/service";
import { getUserLocale } from "@/lib/user/service";
import { getEnvironmentAuth } from "@/modules/environments/lib/utils";
import { getProjectWithTeamIdsByEnvironmentId } from "@/modules/survey/lib/project";
import { DepartmentHeader } from "@/modules/survey/list/components/department-header";
import { NewFormButton } from "@/modules/survey/list/components/new-form-button";
import { QuickStartSection } from "@/modules/survey/list/components/quick-start-section";
import { SurveysList } from "@/modules/survey/list/components/survey-list";
import { getSurveyCount } from "@/modules/survey/list/lib/survey";

export const metadata: Metadata = {
  title: "فورماتي",
};

interface SurveyTemplateProps {
  params: Promise<{ environmentId: string }>;
}

export const SurveysPage = async ({ params: paramsProps }: SurveyTemplateProps) => {
  const publicDomain = getPublicDomain();
  const params = await paramsProps;
  const project = await getProjectWithTeamIdsByEnvironmentId(params.environmentId);
  if (!project) throw new Error("Project not found");

  const { session, environment, isReadOnly, isMember } = await getEnvironmentAuth(params.environmentId);
  const surveyCount = await getSurveyCount(params.environmentId, isMember ? session.user.id : undefined);
  const currentProjectChannel = project.config.channel ?? null;
  const locale = (await getUserLocale(session.user.id)) ?? DEFAULT_LOCALE;

  const organization = await getOrganizationByEnvironmentId(params.environmentId);
  const membership = organization
    ? await getMembershipByUserIdOrganizationId(session.user.id, organization.id)
    : null;
  const { isOwner, isManager } = getAccessFlags(membership?.role);
  const canEditDepartment = isOwner || isManager;

  return (
    <div className="min-h-full" style={{ backgroundColor: "#f3f3f3" }}>
      {/* Top action bar — white, clean */}
      <div className="border-b border-slate-200 bg-white px-8 py-4" dir="rtl">
        <div className="flex items-center gap-3">
          {!isReadOnly && <NewFormButton environmentId={environment.id} userId={session.user.id} />}
        </div>
      </div>

      {/* Page content */}
      <div className="px-8 py-6">
        {/* Department name header */}
        <DepartmentHeader projectId={project.id} projectName={project.name} canEdit={canEditDepartment} />

        {/* Template section */}
        {!isReadOnly && <QuickStartSection environmentId={environment.id} userId={session.user.id} />}

        {/* My forms label */}
        <p className="mb-4 text-sm font-semibold text-slate-600" dir="rtl">
          فورماتي
        </p>

        {/* Survey grid or empty state */}
        {surveyCount === 0 && !isReadOnly ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <span className="text-5xl">📋</span>
            <p className="text-base font-medium text-slate-700">لا توجد فورمات بعد</p>
            <p className="text-sm text-slate-500">اختر قالباً من الأعلى أو أنشئ فورم فارغ</p>
          </div>
        ) : surveyCount === 0 && isReadOnly ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <p className="text-lg font-semibold text-slate-700">لا توجد فورمات بعد</p>
          </div>
        ) : (
          <SurveysList
            environmentId={environment.id}
            isReadOnly={isReadOnly}
            publicDomain={publicDomain}
            userId={session.user.id}
            surveysPerPage={SURVEYS_PER_PAGE}
            currentProjectChannel={currentProjectChannel}
            locale={locale}
          />
        )}
      </div>
    </div>
  );
};
