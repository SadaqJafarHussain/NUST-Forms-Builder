"use client";

import Link from "next/link";
import { useState } from "react";
import { TSurvey, TSurveyQuestionSummaryOpenText } from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";
import { timeSince } from "@/lib/time";
import { getContactIdentifier } from "@/lib/utils/contact";
import { renderHyperlinkedContent } from "@/modules/analysis/utils";
import { PersonAvatar } from "@/modules/ui/components/avatars";
import { Button } from "@/modules/ui/components/button";
import { QuestionSummaryHeader } from "./QuestionSummaryHeader";

interface OpenTextSummaryProps {
  questionSummary: TSurveyQuestionSummaryOpenText;
  environmentId: string;
  survey: TSurvey;
  locale: TUserLocale;
}

export const OpenTextSummary = ({ questionSummary, environmentId, survey, locale }: OpenTextSummaryProps) => {
  const [visibleResponses, setVisibleResponses] = useState(10);

  const handleLoadMore = () => {
    // Increase the number of visible responses by 10, not exceeding the total number of responses
    setVisibleResponses((prevVisibleResponses) =>
      Math.min(prevVisibleResponses + 10, questionSummary.samples.length)
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <QuestionSummaryHeader questionSummary={questionSummary} survey={survey} />
      <div className="border-t border-slate-100" />
      <div className="max-h-[50vh] overflow-y-auto" dir="rtl">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_2fr_auto] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-500">
          <span>المشارك</span>
          <span>الإجابة</span>
          <span>الوقت</span>
        </div>
        <div className="divide-y divide-slate-100">
          {questionSummary.samples.slice(0, visibleResponses).map((response) => (
            <div
              key={response.id}
              className="grid grid-cols-[1fr_2fr_auto] items-start gap-4 px-5 py-3 hover:bg-slate-50">
              {/* Participant */}
              <div>
                {response.contact ? (
                  <Link
                    className="ph-no-capture flex items-center gap-2 text-sm font-medium text-slate-700 hover:underline"
                    href={`/environments/${environmentId}/contacts/${response.contact.id}`}>
                    <PersonAvatar personId={response.contact.id} />
                    <span className="ph-no-capture">
                      {getContactIdentifier(response.contact, response.contactAttributes)}
                    </span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <PersonAvatar personId="anonymous" />
                    <span>مجهول</span>
                  </div>
                )}
              </div>
              {/* Response */}
              <div className="text-sm font-medium text-slate-800" dir="auto">
                {typeof response.value === "string"
                  ? renderHyperlinkedContent(response.value)
                  : response.value}
              </div>
              {/* Time */}
              <div className="whitespace-nowrap text-xs text-slate-400">
                {timeSince(new Date(response.updatedAt).toISOString(), locale)}
              </div>
            </div>
          ))}
        </div>
        {visibleResponses < questionSummary.samples.length && (
          <div className="flex justify-center py-4">
            <Button onClick={handleLoadMore} variant="secondary" size="sm">
              عرض المزيد
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
