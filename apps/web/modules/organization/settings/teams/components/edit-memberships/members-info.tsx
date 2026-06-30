"use client";

import { TMember, TOrganizationRole } from "@formbricks/types/memberships";
import { TOrganization } from "@formbricks/types/organizations";
import { getAccessFlags } from "@/lib/membership/utils";
import { getFormattedDateTimeString } from "@/lib/utils/datetime";
import { EditMembershipRole } from "@/modules/ee/role-management/components/edit-membership-role";
import { MemberActions } from "@/modules/organization/settings/teams/components/edit-memberships/member-actions";
import { isInviteExpired } from "@/modules/organization/settings/teams/lib/utils";
import { TInvite } from "@/modules/organization/settings/teams/types/invites";
import { TooltipRenderer } from "@/modules/ui/components/tooltip";

interface MembersInfoProps {
  organization: TOrganization;
  members: TMember[];
  invites: TInvite[];
  currentUserRole: TOrganizationRole;
  currentUserId: string;
  isAccessControlAllowed: boolean;
  isFormbricksCloud: boolean;
  isUserManagementDisabledFromUi: boolean;
}

// Type guard to check if member is an invitee
const isInvitee = (member: TMember | TInvite): member is TInvite => {
  return (member as TInvite).expiresAt !== undefined;
};

export const MembersInfo = ({
  organization,
  invites,
  currentUserRole,
  members,
  currentUserId,
  isAccessControlAllowed,
  isFormbricksCloud,
  isUserManagementDisabledFromUi,
}: MembersInfoProps) => {
  const allMembers = [...members, ...invites];

  const getMembershipBadge = (member: TMember | TInvite) => {
    if (isInvitee(member)) {
      return isInviteExpired(member) ? (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
          data-testid="expired-badge">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          منتهية
        </span>
      ) : (
        <TooltipRenderer tooltipContent={`دُعي بتاريخ ${getFormattedDateTimeString(member.createdAt)}`}>
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ backgroundColor: "#fef3c7", color: "#d97706" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
            معلّق
          </span>
        </TooltipRenderer>
      );
    }

    if (!member.isActive) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          غير نشط
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
        نشط
      </span>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "؟";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const { isOwner, isManager } = getAccessFlags(currentUserRole);
  const isOwnerOrManager = isOwner || isManager;

  const doesOrgHaveMoreThanOneOwner = allMembers.filter((member) => member.role === "owner").length > 1;

  const showDeleteButton = (member: TMember | TInvite) => {
    if (isInvitee(member)) {
      return isOwnerOrManager;
    }

    if (!isOwnerOrManager) {
      return false;
    }

    if (member.userId === currentUserId) {
      return false;
    }

    if (isManager) {
      return member.role !== "owner";
    }

    if (member.role === "owner") {
      return doesOrgHaveMoreThanOneOwner;
    }

    return true;
  };

  return (
    <div className="divide-y divide-slate-100" id="membersInfoWrapper">
      {allMembers.map((member, idx) => (
        <div
          id="singleMemberInfo"
          className="flex w-full items-center gap-x-4 px-5 py-3.5 text-sm transition-colors hover:bg-slate-50"
          key={member.email}
          style={{ direction: "rtl" }}>
          {/* Avatar + name */}
          <div className="ph-no-capture flex w-1/2 items-center gap-3 overflow-hidden">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: idx % 2 === 0 ? "#1b335f" : "#0f314c" }}>
              {getInitials(member.name ?? "")}
            </div>
            <p className="truncate font-medium text-slate-800">{member.name || "—"}</p>
          </div>

          {/* Email */}
          <div className="ph-no-capture w-1/2 overflow-hidden">
            <p className="truncate text-slate-500">{member.email}</p>
          </div>

          {/* Role */}
          {isAccessControlAllowed && allMembers?.length > 0 && (
            <div className="ph-no-capture min-w-[100px]">
              <EditMembershipRole
                currentUserRole={currentUserRole}
                memberRole={member.role}
                memberId={!isInvitee(member) ? member.userId : ""}
                organizationId={organization.id}
                userId={currentUserId}
                memberAccepted={!isInvitee(member) ? member.accepted : undefined}
                inviteId={isInvitee(member) ? member.id : ""}
                doesOrgHaveMoreThanOneOwner={doesOrgHaveMoreThanOneOwner}
                isFormbricksCloud={isFormbricksCloud}
                isUserManagementDisabledFromUi={isUserManagementDisabledFromUi}
              />
            </div>
          )}

          {/* Status badge */}
          <div className="min-w-[80px]">{getMembershipBadge(member)}</div>

          {/* Actions */}
          {!isUserManagementDisabledFromUi && (
            <MemberActions
              organization={organization}
              member={!isInvitee(member) ? member : undefined}
              invite={isInvitee(member) ? member : undefined}
              showDeleteButton={showDeleteButton(member)}
            />
          )}
        </div>
      ))}
    </div>
  );
};
