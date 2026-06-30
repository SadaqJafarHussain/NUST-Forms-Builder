"use client";

import { BuildingIcon, CheckIcon, PencilIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { updateProjectAction } from "@/modules/projects/settings/actions";

interface DepartmentHeaderProps {
  projectId: string;
  projectName: string;
  canEdit: boolean;
}

export const DepartmentHeader = ({ projectId, projectName, canEdit }: DepartmentHeaderProps) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(projectName);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setName(projectName);
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
  };

  const cancel = () => {
    setIsEditing(false);
    setName(projectName);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await updateProjectAction({ projectId, data: { name: trimmed } });
      router.refresh();
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") save();
    if (e.key === "Escape") cancel();
  };

  return (
    <div className="mb-5 overflow-hidden rounded-xl" style={{ border: "1px solid #c7d4e8" }} dir="rtl">
      {/* Header strip */}
      <div className="h-1 w-full" style={{ backgroundColor: "#1b335f" }} />

      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ background: "linear-gradient(135deg, #eef2f9, #f8fafc)" }}>
        {/* Icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: "#1b335f" }}>
          <BuildingIcon className="h-4 w-4 text-white" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs font-semibold text-slate-400">القسم / الكلية الحالية</span>

          {isEditing ? (
            /* ── Edit mode ── */
            <div className="mt-1 flex items-center gap-2">
              <input
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={onKey}
                disabled={isSaving}
                placeholder="أدخل اسم القسم أو الكلية"
                className="min-w-0 flex-1 rounded-lg border-2 border-[#1b335f] bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b335f]/20"
                dir="rtl"
              />
              {/* Save button */}
              <button
                type="button"
                onClick={save}
                disabled={isSaving || !name.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                style={{ backgroundColor: "#1b335f" }}>
                <CheckIcon className="h-3.5 w-3.5" />
                {isSaving ? "جارٍ الحفظ…" : "حفظ"}
              </button>
              {/* Cancel button */}
              <button
                type="button"
                onClick={cancel}
                disabled={isSaving}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50">
                <XIcon className="h-3.5 w-3.5" />
                إلغاء
              </button>
            </div>
          ) : (
            /* ── View mode ── */
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-bold" style={{ color: "#1b335f" }}>
                {projectName}
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={startEdit}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-[#1b335f] hover:text-[#1b335f]">
                  <PencilIcon className="h-3 w-3" />
                  تعديل الاسم
                </button>
              )}
            </div>
          )}
        </div>

        {/* Admin badge — only in view mode */}
        {canEdit && !isEditing && (
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: "#1b335f18", color: "#1b335f", border: "1px solid #1b335f30" }}>
            مسؤول
          </span>
        )}
      </div>
    </div>
  );
};
