"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { ZUserPassword } from "@formbricks/types/user";
import { Dialog, DialogBody, DialogContent, DialogTitle } from "@/modules/ui/components/dialog";
import { FormControl, FormField, FormItem } from "@/modules/ui/components/form";
import { PasswordInput } from "@/modules/ui/components/password-input";

interface PasswordConfirmationModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  oldEmail: string;
  newEmail: string;
  onConfirm: (password: string) => Promise<void>;
}

const PasswordConfirmationSchema = z.object({
  password: ZUserPassword,
});

type FormValues = z.infer<typeof PasswordConfirmationSchema>;

export const PasswordConfirmationModal = ({
  open,
  setOpen,
  oldEmail,
  newEmail,
  onConfirm,
}: PasswordConfirmationModalProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(PasswordConfirmationSchema),
  });
  const { isSubmitting, isDirty } = form.formState;

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      await onConfirm(data.password);
      form.reset();
    } catch (error) {
      form.setError("password", {
        message: error instanceof Error ? error.message : "فشلت المصادقة",
      });
    }
  };
  const handleCancel = () => {
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <VisuallyHidden>
          <DialogTitle>تأكيد تغيير البريد الإلكتروني</DialogTitle>
        </VisuallyHidden>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Header */}
            <div className="px-6 pb-4 pt-6" dir="rtl">
              <div className="mb-1 flex items-center gap-2">
                <div className="h-5 w-1 rounded-full" style={{ backgroundColor: "#f4bf00" }} />
                <h2 className="text-base font-bold" style={{ color: "#1b335f" }}>
                  تأكيد تغيير البريد الإلكتروني
                </h2>
              </div>
              <p className="pr-3 text-xs text-slate-500">
                أدخل كلمة المرور الحالية لتأكيد هويتك قبل تطبيق التغيير
              </p>
            </div>

            <DialogBody>
              <div className="space-y-4" dir="rtl">
                {/* Email change summary */}
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5">
                    <span className="text-xs text-slate-500">البريد الحالي</span>
                    <span className="font-mono text-xs text-slate-600" dir="ltr">
                      {oldEmail.toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 border-b border-t border-slate-100 bg-white py-2">
                    <div className="h-px w-8 bg-slate-200" />
                    <span className="text-xs text-slate-400">يتغير إلى</span>
                    <div className="h-px w-8 bg-slate-200" />
                  </div>
                  <div className="flex items-center justify-between bg-white px-4 py-2.5">
                    <span className="text-xs text-slate-500">البريد الجديد</span>
                    <span className="font-mono text-xs font-semibold" style={{ color: "#1b335f" }} dir="ltr">
                      {newEmail.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Password field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState: { error } }) => (
                    <FormItem className="w-full">
                      <label className="mb-1.5 block text-xs font-semibold" style={{ color: "#1b335f" }}>
                        كلمة المرور الحالية
                      </label>
                      <FormControl>
                        <div>
                          <PasswordInput
                            id="password"
                            autoComplete="current-password"
                            placeholder="أدخل كلمة المرور"
                            aria-label="password"
                            required
                            className="pr-10"
                            value={field.value ?? ""}
                            onChange={(password) => field.onChange(password)}
                          />
                          {error?.message && (
                            <p className="mt-1 text-right text-xs text-red-500">{error.message}</p>
                          )}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </DialogBody>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50">
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isDirty || oldEmail.toLowerCase() === newEmail.toLowerCase()}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#1b335f" }}>
                {isSubmitting && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                تأكيد التغيير
              </button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
