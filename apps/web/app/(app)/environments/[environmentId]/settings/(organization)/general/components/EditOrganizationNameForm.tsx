"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { TOrganizationRole } from "@formbricks/types/memberships";
import { TOrganization, ZOrganization } from "@formbricks/types/organizations";
import { updateOrganizationNameAction } from "@/app/(app)/environments/[environmentId]/settings/(organization)/general/actions";
import { getAccessFlags } from "@/lib/membership/utils";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { Alert, AlertDescription } from "@/modules/ui/components/alert";
import {
  FormControl,
  FormError,
  FormField,
  FormItem,
  FormLabel,
  FormProvider,
} from "@/modules/ui/components/form";
import { Input } from "@/modules/ui/components/input";

interface EditOrganizationNameProps {
  environmentId: string;
  organization: TOrganization;
  membershipRole?: TOrganizationRole;
}

const ZEditOrganizationNameFormSchema = ZOrganization.pick({ name: true });
type EditOrganizationNameForm = z.infer<typeof ZEditOrganizationNameFormSchema>;

export const EditOrganizationNameForm = ({ organization, membershipRole }: EditOrganizationNameProps) => {
  const form = useForm<EditOrganizationNameForm>({
    defaultValues: {
      name: organization.name,
    },
    mode: "onChange",
    resolver: zodResolver(ZEditOrganizationNameFormSchema),
  });

  const { isOwner } = getAccessFlags(membershipRole);

  const { isSubmitting, isDirty } = form.formState;

  const handleUpdateOrganizationName: SubmitHandler<EditOrganizationNameForm> = async (data) => {
    try {
      const name = data.name.trim();
      const updatedOrganizationResponse = await updateOrganizationNameAction({
        organizationId: organization.id,
        data: { name },
      });

      if (updatedOrganizationResponse?.data) {
        toast.success("تم تحديث اسم الجامعة بنجاح");
        form.reset({ name: updatedOrganizationResponse.data.name });
      } else {
        const errorMessage = getFormattedErrorMessage(updatedOrganizationResponse);
        toast.error(errorMessage);
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    }
  };

  return (
    <>
      <FormProvider {...form}>
        <form
          className="w-full max-w-lg"
          dir="rtl"
          onSubmit={form.handleSubmit(handleUpdateOrganizationName)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold" style={{ color: "#1b335f" }}>
                  اسم الجامعة
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="text"
                    disabled={!isOwner}
                    isInvalid={!!fieldState.error?.message}
                    placeholder="مثال: جامعة NUST"
                    className="text-right"
                    required
                  />
                </FormControl>
                <FormError />
              </FormItem>
            )}
          />

          <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty || !isOwner}
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
      </FormProvider>
      {!isOwner && (
        <Alert variant="warning" className="mt-4">
          <AlertDescription>فقط مالك الجامعة يمكنه تعديل هذه الإعدادات</AlertDescription>
        </Alert>
      )}
    </>
  );
};
