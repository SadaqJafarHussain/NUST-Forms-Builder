"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { TOrganizationRole, ZOrganizationRole } from "@formbricks/types/memberships";
import { ZUserEmail, ZUserName, ZUserPassword } from "@formbricks/types/user";
import { AddMemberRole } from "@/modules/ee/role-management/components/add-member-role";
import { TOrganizationTeam } from "@/modules/ee/teams/team-list/types/team";
import { FormField, FormItem, FormLabel } from "@/modules/ui/components/form";
import { Input } from "@/modules/ui/components/input";
import { Label } from "@/modules/ui/components/label";
import { MultiSelect } from "@/modules/ui/components/multi-select";
import { PasswordInput } from "@/modules/ui/components/password-input";
import { createMemberAccountAction } from "../../actions";

interface IndividualInviteTabProps {
  setOpen: (v: boolean) => void;
  onSubmit: (data: { name: string; email: string; role: TOrganizationRole }[]) => void;
  teams: TOrganizationTeam[];
  isAccessControlAllowed: boolean;
  isFormbricksCloud: boolean;
  environmentId: string;
  membershipRole?: TOrganizationRole;
  organizationId: string;
}

const ZFormSchema = z.object({
  name: ZUserName,
  email: ZUserEmail,
  password: ZUserPassword,
  role: ZOrganizationRole,
  teamIds: z.array(z.string()),
});

type TFormData = z.infer<typeof ZFormSchema>;

export const IndividualInviteTab = ({
  setOpen,
  teams,
  isAccessControlAllowed,
  isFormbricksCloud,
  membershipRole,
  organizationId,
}: IndividualInviteTabProps) => {
  const router = useRouter();

  const form = useForm<TFormData>({
    resolver: zodResolver(ZFormSchema),
    defaultValues: {
      role: isAccessControlAllowed ? "member" : "owner",
      teamIds: [],
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting, errors },
  } = form;

  const onSubmit = async (data: TFormData) => {
    const result = await createMemberAccountAction({
      organizationId,
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      role: data.role || OrganizationRole.member,
    });

    if (result?.data) {
      toast.success("تم إنشاء الحساب بنجاح");
      router.refresh();
      setOpen(false);
      reset();
    } else {
      const msg =
        (result as any)?.serverError ??
        (result as any)?.validationErrors?.email?._errors?.[0] ??
        "حدث خطأ، يرجى المحاولة مرة أخرى";
      toast.error(msg);
    }
  };

  const teamOptions = teams.map((team) => ({
    label: team.name,
    value: team.id,
  }));

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" dir="rtl">
        {/* Name */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="memberNameInput" className="text-xs font-semibold" style={{ color: "#1b335f" }}>
            الاسم الكامل
          </Label>
          <Input
            id="memberNameInput"
            placeholder="مثال: أحمد محمد"
            {...register("name")}
            className="text-right"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="memberEmailInput" className="text-xs font-semibold" style={{ color: "#1b335f" }}>
            البريد الإلكتروني
          </Label>
          <Input
            id="memberEmailInput"
            type="email"
            placeholder="example@nust.edu.iq"
            dir="ltr"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="memberPasswordInput" className="text-xs font-semibold" style={{ color: "#1b335f" }}>
            كلمة المرور
          </Label>
          <PasswordInput
            id="memberPasswordInput"
            placeholder="أدخل كلمة مرور للحساب"
            value={form.watch("password") ?? ""}
            onChange={(e) => form.setValue("password", e.target.value, { shouldValidate: true })}
          />
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        {/* Role */}
        <AddMemberRole
          control={control as any}
          isAccessControlAllowed={isAccessControlAllowed}
          isFormbricksCloud={isFormbricksCloud}
          membershipRole={membershipRole}
        />

        {/* Teams */}
        {isAccessControlAllowed && teamOptions.length > 0 && (
          <FormField
            control={control}
            name="teamIds"
            render={({ field }) => (
              <FormItem className="flex flex-col space-y-1.5">
                <FormLabel className="text-xs font-semibold" style={{ color: "#1b335f" }}>
                  إضافة إلى فريق
                </FormLabel>
                <MultiSelect
                  value={field.value}
                  options={teamOptions}
                  placeholder="اختر فريقاً..."
                  onChange={(val) => field.onChange(val)}
                />
              </FormItem>
            )}
          />
        )}

        {/* Actions */}
        <div className="flex items-center justify-start gap-2 border-t border-slate-100 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "#1b335f" }}>
            {isSubmitting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            إنشاء الحساب
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
            إلغاء
          </button>
        </div>
      </form>
    </FormProvider>
  );
};
