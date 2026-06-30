"use client";

import { useMemo } from "react";
import { type Control, Controller } from "react-hook-form";
import { TOrganizationRole } from "@formbricks/types/memberships";
import { getAccessFlags } from "@/lib/membership/utils";
import { Label } from "@/modules/ui/components/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";

const ROLE_LABELS: Record<string, string> = {
  owner: "مالك",
  manager: "مدير",
  member: "عضو",
  billing: "مالية",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "صلاحيات كاملة على الجامعة والأقسام والكليات",
  manager: "يدير الأعضاء والأقسام والكليات، لكن لا يمكنه حذف الجامعة",
  member: "يمكنه الوصول إلى الأقسام والكليات المحددة له فقط",
  billing: "يدير الفواتير والاشتراكات فقط",
};

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  owner: { bg: "#fef3c7", color: "#92400e" },
  manager: { bg: "#e0e7ff", color: "#3730a3" },
  member: { bg: "#f1f5f9", color: "#475569" },
  billing: { bg: "#eff6ff", color: "#1d4ed8" },
};

interface AddMemberRoleProps {
  control: Control<{ name: string; email: string; role: TOrganizationRole; teamIds: string[] }>;
  isAccessControlAllowed: boolean;
  isFormbricksCloud: boolean;
  membershipRole?: TOrganizationRole;
}

export function AddMemberRole({
  control,
  isAccessControlAllowed,
  isFormbricksCloud,
  membershipRole,
}: AddMemberRoleProps) {
  const { isMember, isOwner } = getAccessFlags(membershipRole);

  const roles = useMemo(() => {
    let rolesArray = ["member"];
    if (isOwner) {
      rolesArray.push("manager", "owner");
      if (isFormbricksCloud) rolesArray.push("billing");
    }
    return rolesArray;
  }, [isOwner, isFormbricksCloud]);

  if (isMember) return null;

  return (
    <Controller
      control={control}
      name="role"
      render={({ field: { onChange, value } }) => (
        <div className="flex flex-col space-y-2" dir="rtl">
          <Label className="text-xs font-semibold" style={{ color: "#1b335f" }}>
            الدور في الجامعة
          </Label>
          <Select
            defaultValue={isAccessControlAllowed ? "member" : "owner"}
            disabled={!isAccessControlAllowed}
            onValueChange={(v) => onChange(v as TOrganizationRole)}
            value={value}>
            <SelectTrigger>
              <SelectValue>
                {value && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: ROLE_STYLES[value]?.bg, color: ROLE_STYLES[value]?.color }}>
                    {ROLE_LABELS[value] ?? value}
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent dir="rtl">
              <SelectGroup>
                {roles.map((role) => (
                  <SelectItem key={role} value={role} className="py-2">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="inline-block w-fit rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: ROLE_STYLES[role]?.bg, color: ROLE_STYLES[role]?.color }}>
                        {ROLE_LABELS[role] ?? role}
                      </span>
                      <span className="text-xs text-slate-400">{ROLE_DESCRIPTIONS[role]}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}
    />
  );
}
