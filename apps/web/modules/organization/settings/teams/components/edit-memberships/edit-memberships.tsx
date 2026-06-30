import { TOrganizationRole } from "@formbricks/types/memberships";
import { TOrganization } from "@formbricks/types/organizations";
import { IS_FORMBRICKS_CLOUD } from "@/lib/constants";
import { MembersInfo } from "@/modules/organization/settings/teams/components/edit-memberships/members-info";
import { getInvitesByOrganizationId } from "@/modules/organization/settings/teams/lib/invite";
import { getMembershipByOrganizationId } from "@/modules/organization/settings/teams/lib/membership";

interface EditMembershipsProps {
  organization: TOrganization;
  currentUserId: string;
  role: TOrganizationRole;
  isAccessControlAllowed: boolean;
  isUserManagementDisabledFromUi: boolean;
}

export const EditMemberships = async ({
  organization,
  currentUserId,
  role,
  isAccessControlAllowed,
  isUserManagementDisabledFromUi,
}: EditMembershipsProps) => {
  const members = await getMembershipByOrganizationId(organization.id);
  const invites = await getInvitesByOrganizationId(organization.id);

  return (
    <div dir="rtl">
      <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        {/* Table header */}
        <div
          className="flex h-11 w-full items-center gap-x-4 px-5 text-right text-xs font-semibold uppercase tracking-wide text-white"
          style={{ backgroundColor: "#1b335f" }}>
          <div className="w-1/2 overflow-hidden">الاسم الكامل</div>
          <div className="w-1/2 overflow-hidden">البريد الإلكتروني</div>
          {isAccessControlAllowed && <div className="min-w-[100px] whitespace-nowrap">الدور</div>}
          <div className="min-w-[80px] whitespace-nowrap">الحالة</div>
          {!isUserManagementDisabledFromUi && (
            <div className="min-w-[125px] whitespace-nowrap">الإجراءات</div>
          )}
        </div>

        {role && (
          <MembersInfo
            organization={organization}
            currentUserId={currentUserId}
            invites={invites ?? []}
            members={members ?? []}
            currentUserRole={role}
            isAccessControlAllowed={isAccessControlAllowed}
            isFormbricksCloud={IS_FORMBRICKS_CLOUD}
            isUserManagementDisabledFromUi={isUserManagementDisabledFromUi}
          />
        )}
      </div>
    </div>
  );
};
