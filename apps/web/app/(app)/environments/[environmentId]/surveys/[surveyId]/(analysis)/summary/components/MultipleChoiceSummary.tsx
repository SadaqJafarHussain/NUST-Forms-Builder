"use client";

import { useTranslate } from "@tolgee/react";
import { InboxIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, useState } from "react";
import {
  TI18nString,
  TSurvey,
  TSurveyQuestionId,
  TSurveyQuestionSummaryMultipleChoice,
  TSurveyQuestionTypeEnum,
  TSurveyType,
} from "@formbricks/types/surveys/types";
import { getContactIdentifier } from "@/lib/utils/contact";
import { PersonAvatar } from "@/modules/ui/components/avatars";
import { Button } from "@/modules/ui/components/button";
import { convertFloatToNDecimal } from "../lib/utils";
import { QuestionSummaryHeader } from "./QuestionSummaryHeader";

interface MultipleChoiceSummaryProps {
  questionSummary: TSurveyQuestionSummaryMultipleChoice;
  environmentId: string;
  surveyType: TSurveyType;
  survey: TSurvey;
  setFilter: (
    questionId: TSurveyQuestionId,
    label: TI18nString,
    questionType: TSurveyQuestionTypeEnum,
    filterValue: string,
    filterComboBoxValue?: string | string[]
  ) => void;
}

export const MultipleChoiceSummary = ({
  questionSummary,
  environmentId,
  surveyType,
  survey,
  setFilter,
}: MultipleChoiceSummaryProps) => {
  const { t } = useTranslate();
  const [visibleOtherResponses, setVisibleOtherResponses] = useState(10);
  const otherValue = questionSummary.question.choices.find((choice) => choice.id === "other")?.label.default;
  // sort by count and transform to array
  const results = Object.values(questionSummary.choices).sort((a, b) => {
    const aHasOthers = (a.others?.length ?? 0) > 0;
    const bHasOthers = (b.others?.length ?? 0) > 0;

    // if one has “others” and the other doesn’t, push the one with others to the end
    if (aHasOthers && !bHasOthers) return 1;
    if (!aHasOthers && bHasOthers) return -1;

    // if they’re “tied” on having others, fall back to count
    return b.count - a.count;
  });

  const handleLoadMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lastChoice = results[results.length - 1];
    const hasOthers = lastChoice.others && lastChoice.others.length > 0;

    if (!hasOthers) return; // If there are no 'others' to show, don't increase the visible options

    // Increase the number of visible responses by 10, not exceeding the total number of responses
    setVisibleOtherResponses((prevVisibleOptions) =>
      Math.min(prevVisibleOptions + 10, lastChoice.others?.length || 0)
    );
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <QuestionSummaryHeader
        questionSummary={questionSummary}
        survey={survey}
        additionalInfo={
          questionSummary.type === "multipleChoiceMulti" ? (
            <div className="flex items-center rounded-lg bg-slate-100 p-2">
              <InboxIcon className="mr-2 h-4 w-4" />
              {`${questionSummary.selectionCount} ${t("common.selections")}`}
            </div>
          ) : undefined
        }
      />
      <div className="space-y-4 px-4 pb-6 pt-4 md:px-6" dir="rtl">
        {results.map((result, resultsIdx) => {
          const palette = ["#1b335f", "#2563eb", "#16a34a", "#f4bf00", "#7c3aed", "#ea580c", "#0891b2"];
          const color = palette[resultsIdx % palette.length];
          const pct = convertFloatToNDecimal(result.percentage, 1);
          return (
            <Fragment key={result.value}>
              <button
                type="button"
                className="group w-full cursor-pointer rounded-xl border border-slate-100 bg-slate-50 p-4 text-right transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
                onClick={() =>
                  setFilter(
                    questionSummary.question.id,
                    questionSummary.question.headline,
                    questionSummary.question.type,
                    questionSummary.type === "multipleChoiceSingle" || otherValue === result.value
                      ? t("environments.surveys.summary.includes_either")
                      : t("environments.surveys.summary.includes_all"),
                    [result.value]
                  )
                }>
                {/* Choice label + stats */}
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: color }}>
                      {resultsIdx + 1}
                    </span>
                    <p className="font-semibold text-slate-800 underline-offset-4 group-hover:underline">
                      {result.value}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span className="text-sm text-slate-500">{result.count} رد</span>
                    <span
                      className="min-w-[3.5rem] rounded-lg px-2 py-0.5 text-center text-base font-bold text-white"
                      style={{ backgroundColor: color }}>
                      {pct}%
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${result.percentage}%`, backgroundColor: color }}
                  />
                </div>
              </button>
              {result.others && result.others.length > 0 && (
                <div className="mt-4 rounded-lg border border-slate-200">
                  <div className="grid h-12 grid-cols-2 content-center rounded-t-lg bg-slate-100 text-left text-sm font-semibold text-slate-900">
                    <div className="col-span-1 pl-6">
                      {t("environments.surveys.summary.other_values_found")}
                    </div>
                    <div className="col-span-1 pl-6">{surveyType === "app" && t("common.user")}</div>
                  </div>
                  {result.others
                    .filter((otherValue) => otherValue.value !== "")
                    .slice(0, visibleOtherResponses)
                    .map((otherValue, idx) => (
                      <div key={`${idx}-${otherValue}`} dir="auto">
                        {surveyType === "link" && (
                          <div className="ph-no-capture col-span-1 m-2 flex h-10 items-center rounded-lg pl-4 text-sm font-medium text-slate-900">
                            <span>{otherValue.value}</span>
                          </div>
                        )}
                        {surveyType === "app" && otherValue.contact && (
                          <Link
                            href={
                              otherValue.contact.id
                                ? `/environments/${environmentId}/contacts/${otherValue.contact.id}`
                                : { pathname: null }
                            }
                            className="m-2 grid h-16 grid-cols-2 items-center rounded-lg text-sm hover:bg-slate-100">
                            <div className="ph-no-capture col-span-1 pl-4 font-medium text-slate-900">
                              <span>{otherValue.value}</span>
                            </div>
                            <div className="ph-no-capture col-span-1 flex items-center space-x-4 pl-6 font-medium text-slate-900">
                              {otherValue.contact.id && <PersonAvatar personId={otherValue.contact.id} />}
                              <span>
                                {getContactIdentifier(otherValue.contact, otherValue.contactAttributes)}
                              </span>
                            </div>
                          </Link>
                        )}
                      </div>
                    ))}
                  {visibleOtherResponses < result.others.length && (
                    <div className="flex justify-center py-4">
                      <Button onClick={handleLoadMore} variant="secondary" size="sm">
                        {t("common.load_more")}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};
