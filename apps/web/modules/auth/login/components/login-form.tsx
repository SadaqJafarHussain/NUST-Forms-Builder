"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/dist/client/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { cn } from "@/lib/cn";
import { FORMBRICKS_LOGGED_IN_WITH_LS } from "@/lib/localStorage";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { createEmailTokenAction } from "@/modules/auth/actions";
import { SSOOptions } from "@/modules/ee/sso/components/sso-options";
import { TwoFactor } from "@/modules/ee/two-factor-auth/components/two-factor";
import { TwoFactorBackup } from "@/modules/ee/two-factor-auth/components/two-factor-backup";
import { Button } from "@/modules/ui/components/button";
import { FormControl, FormError, FormField, FormItem } from "@/modules/ui/components/form";
import { PasswordInput } from "@/modules/ui/components/password-input";

const ZLoginForm = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(128, { message: "Password must be 128 characters or less" }),
  totpCode: z.string().optional(),
  backupCode: z.string().optional(),
});

type TLoginForm = z.infer<typeof ZLoginForm>;

interface LoginFormProps {
  emailAuthEnabled: boolean;
  publicSignUpEnabled: boolean;
  passwordResetEnabled: boolean;
  googleOAuthEnabled: boolean;
  githubOAuthEnabled: boolean;
  azureOAuthEnabled: boolean;
  oidcOAuthEnabled: boolean;
  oidcDisplayName?: string;
  isMultiOrgEnabled: boolean;
  isSsoEnabled: boolean;
  samlSsoEnabled: boolean;
  samlTenant: string;
  samlProduct: string;
}

export const LoginForm = ({
  emailAuthEnabled,
  passwordResetEnabled,
  googleOAuthEnabled,
  githubOAuthEnabled,
  azureOAuthEnabled,
  oidcOAuthEnabled,
  oidcDisplayName,
  isSsoEnabled,
  samlSsoEnabled,
  samlTenant,
  samlProduct,
}: LoginFormProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null);
  const callbackUrl = searchParams?.get("callbackUrl") ?? "";

  const form = useForm<TLoginForm>({
    defaultValues: {
      email: searchParams?.get("email") ?? "",
      password: "",
      totpCode: "",
      backupCode: "",
    },
    resolver: zodResolver(ZLoginForm),
  });

  const onSubmit: SubmitHandler<TLoginForm> = async (data) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(FORMBRICKS_LOGGED_IN_WITH_LS, "Email");
    }
    try {
      const signInResponse = await signIn("credentials", {
        callbackUrl: callbackUrl ?? "/",
        email: data.email.toLowerCase(),
        password: data.password,
        ...(totpLogin && { totpCode: data.totpCode }),
        ...(totpBackup && { backupCode: data.backupCode }),
        redirect: false,
      });

      if (signInResponse?.error === "second factor required") {
        setTotpLogin(true);
        return;
      }

      if (signInResponse?.error === "Email Verification is Pending") {
        const emailTokenActionResponse = await createEmailTokenAction({ email: data.email });
        if (emailTokenActionResponse?.data) {
          router.push(`/auth/verification-requested?token=${emailTokenActionResponse?.data}`);
        } else {
          const errorMessage = getFormattedErrorMessage(emailTokenActionResponse);
          toast.error(errorMessage);
        }
        return;
      }

      if (signInResponse?.error) {
        toast.error(signInResponse.error);
        return;
      }

      if (!signInResponse?.error) {
        router.push(searchParams?.get("callbackUrl") ?? "/");
      }
    } catch (error) {
      toast.error(error.toString());
    }
  };

  const [showLogin, setShowLogin] = useState(false);
  const [totpLogin, setTotpLogin] = useState(false);
  const [totpBackup, setTotpBackup] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const formLabelAr = useMemo(() => {
    if (totpBackup) return "أدخل رمز النسخ الاحتياطي";
    if (totpLogin) return "أدخل رمز المصادقة الثنائية";
    return "تسجيل الدخول";
  }, [totpBackup, totpLogin]);

  const TwoFactorComponent = useMemo(() => {
    if (totpBackup) return <TwoFactorBackup form={form} />;
    if (totpLogin) return <TwoFactor form={form} />;
    return null;
  }, [form, totpBackup, totpLogin]);

  return (
    <FormProvider {...form}>
      <style>{`
        .nust-input {
          display: block;
          width: 100%;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 0.875rem;
          color: #1e293b;
          background: #f8fafc;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .nust-input:focus {
          border-color: #1b335f;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(27, 51, 95, 0.1);
        }
        .nust-input::placeholder { color: #94a3b8; }
        .nust-btn {
          background-color: #1b335f !important;
          color: #ffffff !important;
          border: none !important;
          transition: background-color 0.15s !important;
        }
        .nust-btn:hover:not(:disabled) { background-color: #0f314c !important; }
        .nust-btn:disabled { opacity: 0.65 !important; }
        .nust-link { color: #1b335f; font-weight: 600; text-decoration: underline; font-size: 0.75rem; }
        .nust-link:hover { color: #0f314c; }
      `}</style>

      <div dir="ltr" className="text-left">
        {/* Arabic heading with navy left accent */}
        <div className="mb-6 border-r-0" dir="rtl">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full" style={{ backgroundColor: "#f4bf00" }} />
            <h1 className="text-lg font-bold" style={{ color: "#1b335f" }}>
              {formLabelAr}
            </h1>
          </div>
          {!totpLogin && !totpBackup && (
            <p className="mt-1 text-xs text-slate-400">أدخل بياناتك للوصول إلى المنصة</p>
          )}
        </div>

        <div className="space-y-3">
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            {TwoFactorComponent}

            {showLogin && (
              <div className={cn(totpLogin && "hidden", "space-y-3")}>
                {/* Email field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState: { error } }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <div>
                          <label
                            htmlFor="email"
                            className="mb-1 block text-xs font-semibold"
                            style={{ color: "#1b335f", direction: "rtl" }}>
                            البريد الإلكتروني
                          </label>
                          <input
                            id="email"
                            ref={emailRef}
                            type="email"
                            autoComplete="email"
                            required
                            value={field.value}
                            onChange={(e) => field.onChange(e)}
                            placeholder="example@nust.edu.iq"
                            className="nust-input"
                          />
                          {error?.message && <FormError className="text-left">{error.message}</FormError>}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Password field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState: { error } }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <div>
                          <div className="mb-1 flex items-center justify-between">
                            <label
                              htmlFor="password"
                              className="text-xs font-semibold"
                              style={{ color: "#1b335f" }}>
                              كلمة المرور
                            </label>
                            {passwordResetEnabled && (
                              <Link href="/auth/forgot-password" className="nust-link text-xs">
                                نسيت كلمة المرور؟
                              </Link>
                            )}
                          </div>
                          <PasswordInput
                            id="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            required
                            className="nust-input pr-10"
                            value={field.value}
                            onChange={(e) => field.onChange(e)}
                          />
                          {error?.message && <FormError className="text-left">{error.message}</FormError>}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {emailAuthEnabled && (
              <Button
                onClick={() => {
                  if (!showLogin) {
                    setShowLogin(true);
                    setTimeout(() => emailRef.current?.focus(), 100);
                  } else if (formRef.current) {
                    formRef.current.requestSubmit();
                  }
                }}
                className="nust-btn relative mt-1 w-full justify-center rounded-lg py-2.5 text-sm font-semibold"
                loading={form.formState.isSubmitting}>
                {totpLogin ? "تأكيد" : showLogin ? "تسجيل الدخول" : "المتابعة"}
              </Button>
            )}
          </form>

          {/* SSO section */}
          {isSsoEnabled && (
            <SSOOptions
              googleOAuthEnabled={googleOAuthEnabled}
              githubOAuthEnabled={githubOAuthEnabled}
              azureOAuthEnabled={azureOAuthEnabled}
              oidcOAuthEnabled={oidcOAuthEnabled}
              oidcDisplayName={oidcDisplayName}
              samlSsoEnabled={samlSsoEnabled}
              samlTenant={samlTenant}
              samlProduct={samlProduct}
              callbackUrl={callbackUrl}
              source="signin"
            />
          )}
        </div>

        {/* 2FA backup options */}
        {totpLogin && !totpBackup && (
          <div className="mt-6 space-y-2 text-center text-xs">
            <button type="button" className="nust-link block w-full" onClick={() => setTotpBackup(true)}>
              استخدام رمز النسخ الاحتياطي
            </button>
            <button
              type="button"
              className="block w-full text-slate-400 underline hover:text-slate-600"
              onClick={() => setTotpLogin(false)}>
              العودة
            </button>
          </div>
        )}
        {totpBackup && (
          <div className="mt-6 text-center text-xs">
            <button
              type="button"
              className="text-slate-400 underline hover:text-slate-600"
              onClick={() => setTotpBackup(false)}>
              العودة
            </button>
          </div>
        )}
      </div>
    </FormProvider>
  );
};
