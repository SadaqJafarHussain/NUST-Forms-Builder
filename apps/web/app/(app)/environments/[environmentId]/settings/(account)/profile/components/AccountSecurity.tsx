"use client";

import { useState } from "react";
import { TUser } from "@formbricks/types/user";
import { DisableTwoFactorModal } from "@/modules/ee/two-factor-auth/components/disable-two-factor-modal";
import { EnableTwoFactorModal } from "@/modules/ee/two-factor-auth/components/enable-two-factor-modal";
import { Switch } from "@/modules/ui/components/switch";

interface AccountSecurityProps {
  user: TUser;
}

export const AccountSecurity = ({ user }: AccountSecurityProps) => {
  const [twoFactorModalOpen, setTwoFactorModalOpen] = useState(false);
  const [disableTwoFactorModalOpen, setDisableTwoFactorModalOpen] = useState(false);

  return (
    <div dir="rtl" className="w-full max-w-lg">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold" style={{ color: "#1b335f" }}>
            المصادقة الثنائية
          </p>
          <p className="text-xs text-slate-500">أضف طبقة حماية إضافية لحسابك عند تسجيل الدخول</p>
          <span
            className="mt-1 inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium"
            style={
              user.twoFactorEnabled
                ? { backgroundColor: "#dcfce7", color: "#16a34a" }
                : { backgroundColor: "#f1f5f9", color: "#64748b" }
            }>
            {user.twoFactorEnabled ? "مفعّلة" : "معطّلة"}
          </span>
        </div>
        <Switch
          checked={user.twoFactorEnabled}
          onCheckedChange={(checked) => {
            if (checked) {
              setTwoFactorModalOpen(true);
            } else {
              setDisableTwoFactorModalOpen(true);
            }
          }}
        />
      </div>
      <EnableTwoFactorModal open={twoFactorModalOpen} setOpen={setTwoFactorModalOpen} />
      <DisableTwoFactorModal open={disableTwoFactorModalOpen} setOpen={setDisableTwoFactorModalOpen} />
    </div>
  );
};
