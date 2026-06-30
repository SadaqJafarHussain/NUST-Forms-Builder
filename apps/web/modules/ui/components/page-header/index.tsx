import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  pageTitle: string;
  cta?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader = ({ cta, pageTitle, children }: PageHeaderProps) => {
  return (
    <div className="border-b border-slate-200" dir="rtl">
      <div className="flex items-center justify-between gap-4 pb-4">
        <h1 className={cn("text-2xl font-bold text-[#1b335f]")} suppressHydrationWarning>
          {pageTitle}
        </h1>
        {cta}
      </div>
      {children}
    </div>
  );
};
