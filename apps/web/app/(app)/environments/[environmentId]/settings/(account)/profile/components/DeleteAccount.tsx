"use client";

import type { Session } from "next-auth";
import { useState } from "react";
import { TOrganization } from "@formbricks/types/organizations";
import { TUser } from "@formbricks/types/user";
import { DeleteAccountModal } from "@/modules/account/components/DeleteAccountModal";
import { TooltipRenderer } from "@/modules/ui/components/tooltip";

export const DeleteAccount = ({
  session,
  IS_FORMBRICKS_CLOUD,
  user,
  organizationsWithSingleOwner,
  isMultiOrgEnabled,
}: {
  session: Session | null;
  IS_FORMBRICKS_CLOUD: boolean;
  user: TUser;
  organizationsWithSingleOwner: TOrganization[];
  isMultiOrgEnabled: boolean;
}) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const isDeleteDisabled = !isMultiOrgEnabled && organizationsWithSingleOwner.length > 0;

  if (!session) {
    return null;
  }

  return (
    <div dir="rtl" className="w-full max-w-lg">
      <DeleteAccountModal
        open={isModalOpen}
        setOpen={setModalOpen}
        user={user}
        isFormbricksCloud={IS_FORMBRICKS_CLOUD}
        organizationsWithSingleOwner={organizationsWithSingleOwner}
      />

      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-red-500" />
          <p className="text-sm font-semibold text-red-700">حذف الحساب</p>
        </div>
        <p className="mb-3 text-xs text-red-600">
          هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بياناتك بشكل نهائي.
        </p>
        <TooltipRenderer
          shouldRender={isDeleteDisabled}
          tooltipContent="لا يمكن حذف الحساب لأنك المالك الوحيد لجامعة نشطة">
          <button
            onClick={() => setModalOpen(!isModalOpen)}
            disabled={isDeleteDisabled}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
            حذف حسابي
          </button>
        </TooltipRenderer>
      </div>
    </div>
  );
};
