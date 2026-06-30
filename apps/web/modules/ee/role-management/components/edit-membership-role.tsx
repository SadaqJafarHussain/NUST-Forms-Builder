"use client";

import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import type { TOrganizationRole } from "@formbricks/types/memberships";
import { getAccessFlags } from "@/lib/membership/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/modules/ui/components/dropdown-menu";
import { updateInviteAction, updateMembershipAction } from "../actions";

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك",
  manager: "مدير",
  member: "عضو",
  billing: "مالية",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "صلاحيات كاملة على الجامعة",
  manager: "يدير الأعضاء والأقسام والكليات",
  member: "وصول للأقسام والكليات المحددة",
  billing: "إدارة الفواتير فقط",
};

const ROLE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  owner: { bg: "#fef3c7", color: "#92400e", border: "#f4bf00" },
  manager: { bg: "#1b335f", color: "#ffffff", border: "#1b335f" },
  member: { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" },
  billing: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
};

interface Role {
  currentUserRole: TOrganizationRole;
  memberRole: TOrganizationRole;
  organizationId: string;
  memberId?: string;
  userId: string;
  memberAccepted?: boolean;
  inviteId?: string;
  doesOrgHaveMoreThanOneOwner?: boolean;
  isFormbricksCloud: boolean;
  isUserManagementDisabledFromUi: boolean;
}

export function EditMembershipRole({
  memberRole,
  organizationId,
  currentUserRole,
  memberId,
  userId,
  memberAccepted,
  inviteId,
  doesOrgHaveMoreThanOneOwner,
  isFormbricksCloud,
  isUserManagementDisabledFromUi,
}: Role) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { isOwner, isManager } = getAccessFlags(currentUserRole);
  const isOwnerOrManager = isOwner || isManager;

  const disableRole =
    isUserManagementDisabledFromUi ||
    memberId === userId ||
    (memberRole === "owner" && !doesOrgHaveMoreThanOneOwner) ||
    (currentUserRole === "manager" && memberRole === "owner");

  const handleMemberRoleUpdate = async (role: TOrganizationRole) => {
    setLoading(true);

    try {
      if (memberAccepted && memberId) {
        await updateMembershipAction({ userId: memberId, organizationId, data: { role } });
      }

      if (inviteId) {
        await updateInviteAction({ inviteId: inviteId, organizationId, data: { role } });
      }
    } catch (error) {
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى");
    }

    setLoading(false);
    router.refresh();
  };

  const handleRoleChange = (role: TOrganizationRole) => {
    handleMemberRoleUpdate(role);
  };

  const getMembershipRoles = () => {
    let roles: string[] = ["member"];

    if (isOwner) {
      roles.push("manager", "owner");

      if (isFormbricksCloud) {
        roles.push("billing");
      }
    }
    return roles;
  };

  const roleStyle = ROLE_STYLES[memberRole] ?? ROLE_STYLES.member;
  const roleLabel = ROLE_LABELS[memberRole] ?? memberRole;

  if (isOwnerOrManager) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disableRole || loading}>
          <button
            role="button-role"
            disabled={disableRole || loading}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor: roleStyle.bg,
              color: roleStyle.color,
              border: `1px solid ${roleStyle.border}`,
            }}>
            {loading ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : null}
            {roleLabel}
            {!disableRole && <ChevronDownIcon className="h-3 w-3 opacity-60" />}
          </button>
        </DropdownMenuTrigger>
        {!disableRole && (
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuRadioGroup
              onValueChange={(value) => handleRoleChange(value as TOrganizationRole)}
              value={memberRole}>
              {getMembershipRoles().map((role) => {
                const s = ROLE_STYLES[role] ?? ROLE_STYLES.member;
                return (
                  <DropdownMenuRadioItem
                    key={role}
                    value={role}
                    className="flex flex-col items-start gap-0.5 py-2">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: s.bg, color: s.color }}>
                      {ROLE_LABELS[role] ?? role}
                    </span>
                    <span className="pr-6 text-xs text-slate-400">{ROLE_DESCRIPTIONS[role]}</span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    );
  }

  return (
    <span
      role="badge-role"
      className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        backgroundColor: roleStyle.bg,
        color: roleStyle.color,
        border: `1px solid ${roleStyle.border}`,
      }}>
      {roleLabel}
    </span>
  );
}
