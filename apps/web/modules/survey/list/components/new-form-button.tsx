"use client";

import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { createSurveyAction } from "@/modules/survey/components/template-list/actions";
import { getBlankSurveyBody } from "@/modules/survey/list/lib/blank-survey";

interface NewFormButtonProps {
  environmentId: string;
  userId: string;
  className?: string;
  children?: React.ReactNode;
}

export const NewFormButton = ({ environmentId, userId, className, children }: NewFormButtonProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const result = await createSurveyAction({
      environmentId,
      surveyBody: getBlankSurveyBody(userId),
    });
    if (result?.data) {
      router.push(`/environments/${environmentId}/surveys/${result.data.id}/edit`);
    } else {
      setLoading(false);
      toast.error(getFormattedErrorMessage(result));
    }
  };

  if (children) {
    return (
      <button onClick={handleClick} disabled={loading} className={className}>
        {loading ? <span className="opacity-60">جارٍ الإنشاء...</span> : children}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-90 disabled:opacity-60"
      }
      style={className ? undefined : { backgroundColor: "#1b335f" }}>
      {loading ? (
        <span>جارٍ الإنشاء...</span>
      ) : (
        <>
          <PlusIcon className="h-4 w-4" />
          فورم جديد
        </>
      )}
    </button>
  );
};
