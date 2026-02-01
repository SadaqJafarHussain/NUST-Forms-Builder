import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  pageTitle: string;
  cta?: React.ReactNode;
  children?: React.ReactNode;
}

export const PageHeader = ({ cta, pageTitle, children }: PageHeaderProps) => {
  return (
    <div className="border-b border-slate-200">
      <div className="flex items-center justify-between space-x-4 pb-4 rtl:space-x-reverse">
        <h1 className={cn("text-3xl font-bold capitalize text-slate-800")} suppressHydrationWarning>
          {pageTitle}
        </h1>
        {cta}
      </div>
      {children}
    </div>
  );
};
