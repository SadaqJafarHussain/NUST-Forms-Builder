import Link from "next/link";
import { Logo } from "@/modules/ui/components/logo";

interface FormWrapperProps {
  children: React.ReactNode;
}

export const FormWrapper = ({ children }: FormWrapperProps) => {
  return (
    <div dir="ltr" className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12">
      {/* Mobile-only: show branding above card (hidden on desktop where splash panel is shown) */}
      <div className="mb-6 text-center lg:hidden">
        <div className="inline-block rounded-full p-2" style={{ backgroundColor: "#f4bf00" }}>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white p-1.5">
            <img src="/images/logo.png" alt="NUST" className="h-full w-full object-contain" />
          </div>
        </div>
        <p className="mt-2 text-sm font-bold" style={{ color: "#1b335f" }}>
          الجامعة الوطنية للعلوم والتكنولوجيا
        </p>
      </div>

      <div
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
        style={{ boxShadow: "0 4px 32px rgba(27,51,95,0.12)", border: "1px solid rgba(27,51,95,0.08)" }}>
        {/* Logo + heading */}
        <div className="mb-7 text-center">
          <Link target="_blank" href="https://nustwebsite.com/ar/" rel="noopener noreferrer">
            <Logo className="mx-auto w-3/4" />
          </Link>
          <p className="mt-3 text-xs text-slate-400" style={{ direction: "rtl" }}>
            تسجيل الدخول إلى المنصة
          </p>
        </div>
        {children}
      </div>

      <p className="mt-6 text-center text-xs text-slate-400" style={{ direction: "rtl" }}>
        منصة النماذج الإلكترونية · NUST
      </p>
    </div>
  );
};
