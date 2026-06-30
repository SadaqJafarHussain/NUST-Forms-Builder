"use client";

import { EyeIcon, EyeOffIcon } from "lucide-react";

interface SurveyEditorTabsProps {
  showPreview: boolean;
  onTogglePreview: () => void;
  // kept for prop compatibility but unused
  activeId?: string;
  setActiveId?: (id: any) => void;
  isStylingTabVisible?: boolean;
  isCxMode?: boolean;
  isSurveyFollowUpsAllowed?: boolean;
}

export const SurveyEditorTabs = ({ showPreview, onTogglePreview }: SurveyEditorTabsProps) => {
  return (
    <div className="sticky top-0 z-30 flex h-12 w-full items-center border-b border-slate-200 bg-white px-4">
      {/* Left: preview toggle */}
      <button
        type="button"
        onClick={onTogglePreview}
        className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors"
        style={
          showPreview
            ? { backgroundColor: "#1b335f", color: "#fff", borderColor: "#1b335f" }
            : { backgroundColor: "#fff", color: "#1b335f", borderColor: "#1b335f" }
        }>
        {showPreview ? <EyeOffIcon className="h-3.5 w-3.5" /> : <EyeIcon className="h-3.5 w-3.5" />}
        {showPreview ? "إخفاء المعاينة" : "معاينة"}
      </button>
    </div>
  );
};
