"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslate } from "@tolgee/react";
import { useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { TUser, TUserUpdateInput, ZUser, ZUserEmail } from "@formbricks/types/user";
import { PasswordConfirmationModal } from "@/app/(app)/environments/[environmentId]/settings/(account)/profile/components/password-confirmation-modal";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { useSignOut } from "@/modules/auth/hooks/use-sign-out";
import { Button } from "@/modules/ui/components/button";
import { FormControl, FormError, FormField, FormItem, FormLabel } from "@/modules/ui/components/form";
import { Input } from "@/modules/ui/components/input";
import { resetPasswordAction, updateUserAction } from "../actions";

// Schema & types - locale removed since we only support Arabic
const ZEditProfileNameFormSchema = ZUser.pick({ name: true, email: true }).extend({
  email: ZUserEmail.transform((val) => val?.trim().toLowerCase()),
});
type TEditProfileNameForm = z.infer<typeof ZEditProfileNameFormSchema>;

interface IEditProfileDetailsFormProps {
  user: TUser;
  isPasswordResetEnabled?: boolean;
  emailVerificationDisabled: boolean;
}

export const EditProfileDetailsForm = ({
  user,
  isPasswordResetEnabled,
  emailVerificationDisabled,
}: IEditProfileDetailsFormProps) => {
  const { t } = useTranslate();

  const form = useForm<TEditProfileNameForm>({
    defaultValues: {
      name: user.name,
      email: user.email,
    },
    mode: "onChange",
    resolver: zodResolver(ZEditProfileNameFormSchema),
  });

  const { isSubmitting, isDirty } = form.formState;

  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { signOut: signOutWithAudit } = useSignOut({ id: user.id, email: user.email });

  const handleConfirmPassword = async (password: string) => {
    const values = form.getValues();
    const dirtyFields = form.formState.dirtyFields;

    const emailChanged = "email" in dirtyFields;
    const nameChanged = "name" in dirtyFields;

    const name = values.name.trim();
    const email = values.email.trim().toLowerCase();

    const data: TUserUpdateInput = {};

    if (emailChanged) {
      data.email = email;
      data.password = password;
    }
    if (nameChanged) {
      data.name = name;
    }

    const updatedUserResult = await updateUserAction(data);

    if (updatedUserResult?.data) {
      if (!emailVerificationDisabled) {
        toast.success(t("auth.verification-requested.new_email_verification_success"));
      } else {
        toast.success(t("environments.settings.profile.email_change_initiated"));
        await signOutWithAudit({
          reason: "email_change",
          redirectUrl: "/email-change-without-verification-success",
          redirect: true,
          callbackUrl: "/email-change-without-verification-success",
          clearEnvironmentId: true,
        });
        return;
      }
    } else {
      const errorMessage = getFormattedErrorMessage(updatedUserResult);
      toast.error(errorMessage);
      return;
    }

    window.location.reload();
    setShowModal(false);
  };

  const onSubmit: SubmitHandler<TEditProfileNameForm> = async (data) => {
    if (data.email !== user.email) {
      setShowModal(true);
    } else {
      try {
        await updateUserAction({
          ...data,
          name: data.name.trim(),
        });
        toast.success(t("environments.settings.profile.profile_updated_successfully"));
        window.location.reload();
        form.reset(data);
      } catch (error: any) {
        toast.error(`${t("common.error")}: ${error.message}`);
      }
    }
  };

  const handleResetPassword = async () => {
    setIsResettingPassword(true);

    const result = await resetPasswordAction();
    if (result?.data) {
      toast.success(t("auth.forgot-password.email-sent.heading"));

      await signOutWithAudit({
        reason: "password_reset",
        redirectUrl: "/auth/login",
        redirect: true,
        callbackUrl: "/auth/login",
        clearEnvironmentId: true,
      });
    } else {
      const errorMessage = getFormattedErrorMessage(result);
      toast.error(errorMessage);
    }

    setIsResettingPassword(false);
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "؟";

  return (
    <>
      <FormProvider {...form}>
        <div dir="rtl" className="w-full max-w-lg">
          {/* User avatar card */}
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-sm"
              style={{ backgroundColor: "#1b335f" }}>
              {initials}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
              <span
                className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: "#1b335f18", color: "#1b335f" }}>
                {user.identityProvider === "email" ? "حساب محلي" : user.identityProvider?.toUpperCase()}
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold" style={{ color: "#1b335f" }}>
                    الاسم الكامل
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      required
                      placeholder="أدخل اسمك الكامل"
                      isInvalid={!!form.formState.errors.name}
                      className="text-right"
                    />
                  </FormControl>
                  <FormError />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold" style={{ color: "#1b335f" }}>
                    البريد الإلكتروني
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      required
                      dir="ltr"
                      isInvalid={!!form.formState.errors.email}
                      disabled={user.identityProvider !== "email"}
                      className="text-left"
                    />
                  </FormControl>
                  {user.identityProvider !== "email" && (
                    <p className="text-xs text-slate-400">
                      البريد الإلكتروني مرتبط بموفر خارجي ولا يمكن تغييره من هنا
                    </p>
                  )}
                  <FormError />
                </FormItem>
              )}
            />

            {/* Save button */}
            <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#1b335f" }}>
                {isSubmitting && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                حفظ التغييرات
              </button>
              {isDirty && (
                <button
                  type="button"
                  onClick={() => form.reset()}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                  إلغاء
                </button>
              )}
            </div>
          </form>

          {/* Password reset section */}
          {isPasswordResetEnabled && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full" style={{ backgroundColor: "#f4bf00" }} />
                <h3 className="text-sm font-semibold" style={{ color: "#1b335f" }}>
                  إعادة تعيين كلمة المرور
                </h3>
              </div>
              <p className="mb-3 text-xs text-slate-500">
                سيتم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  defaultValue={user.email}
                  disabled
                  dir="ltr"
                  className="text-left text-sm"
                />
                <Button
                  onClick={handleResetPassword}
                  loading={isResettingPassword}
                  disabled={isResettingPassword}
                  size="sm"
                  variant="secondary"
                  className="flex-shrink-0">
                  إرسال الرابط
                </Button>
              </div>
            </div>
          )}
        </div>
      </FormProvider>

      <PasswordConfirmationModal
        open={showModal}
        setOpen={setShowModal}
        oldEmail={user.email}
        newEmail={form.getValues("email") || user.email}
        onConfirm={handleConfirmPassword}
      />
    </>
  );
};
