"use client";

import { CheckCircle2Icon } from "lucide-react";
import { TResponseWithQuotas } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys/types";
import { getLocalizedValue } from "@/lib/i18n/utils";
import { parseRecallInfo } from "@/lib/utils/recall";
import { ResponseCardQuotas } from "@/modules/ee/quotas/components/single-response-card-quotas";
import { isValidValue } from "../util";
import { HiddenFields } from "./HiddenFields";
import { QuestionSkip } from "./QuestionSkip";
import { RenderResponse } from "./RenderResponse";
import { ResponseVariables } from "./ResponseVariables";
import { VerifiedEmail } from "./VerifiedEmail";

interface SingleResponseCardBodyProps {
  survey: TSurvey;
  response: TResponseWithQuotas;
  skippedQuestions: string[][];
}

export const SingleResponseCardBody = ({
  survey,
  response,
  skippedQuestions,
}: SingleResponseCardBodyProps) => {
  const isFirstQuestionAnswered = survey.questions[0]
    ? response.data[survey.questions[0].id]
      ? true
      : false
    : false;
  const formatTextWithSlashes = (text: string) => {
    // Updated regex to match content between #/ and \#
    const regex = /#\/(.*?)\\#/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // Check if the part was inside #/ and \#
      if (index % 2 === 1) {
        return (
          <span
            key={index}
            className="ml-0.5 mr-0.5 rounded-md border border-slate-200 bg-slate-50 px-1 py-0.5 text-sm first:ml-0">
            @{part}
          </span>
        );
      } else {
        return part;
      }
    });
  };

  return (
    <div className="p-6" dir="rtl">
      {survey.welcomeCard.enabled && (
        <QuestionSkip
          skippedQuestions={[]}
          questions={survey.questions}
          status={"welcomeCard"}
          isFirstQuestionAnswered={isFirstQuestionAnswered}
          responseData={response.data}
        />
      )}
      <div className="space-y-4">
        {survey.isVerifyEmailEnabled && response.data["verifiedEmail"] && (
          <VerifiedEmail responseData={response.data} />
        )}
        {survey.questions.map((question, questionIndex) => {
          const skipped = skippedQuestions.find((skippedQuestionElement) =>
            skippedQuestionElement.includes(question.id)
          );

          // If found, remove it from the list
          if (skipped) {
            skippedQuestions = skippedQuestions.filter((item) => item !== skipped);
          }

          return (
            <div key={`${question.id}`}>
              {isValidValue(response.data[question.id]) ? (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
                  {/* Question label row */}
                  <div className="mb-2 flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: "#1b335f" }}>
                      {questionIndex + 1}
                    </span>
                    <p className="text-sm font-medium text-slate-600">
                      {formatTextWithSlashes(
                        parseRecallInfo(
                          getLocalizedValue(question.headline, "default"),
                          response.data,
                          response.variables,
                          true
                        )
                      )}
                    </p>
                  </div>
                  {/* Answer */}
                  <div className="mr-9" dir="auto">
                    <RenderResponse
                      question={question}
                      survey={survey}
                      responseData={response.data[question.id]}
                      language={response.language}
                      showId={true}
                    />
                  </div>
                </div>
              ) : (
                <QuestionSkip
                  skippedQuestions={skipped}
                  questions={survey.questions}
                  responseData={response.data}
                  status={
                    response.finished ||
                    (skippedQuestions.length > 0 &&
                      !skippedQuestions[skippedQuestions.length - 1].includes(question.id))
                      ? "skipped"
                      : "aborted"
                  }
                />
              )}
            </div>
          );
        })}
      </div>
      {survey.variables.length > 0 && (
        <ResponseVariables variables={survey.variables} variablesData={response.variables} />
      )}
      {survey.hiddenFields.enabled && survey.hiddenFields.fieldIds && (
        <HiddenFields hiddenFields={survey.hiddenFields} responseData={response.data} />
      )}

      <ResponseCardQuotas quotas={response.quotas} />

      {response.finished && (
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-green-100 bg-green-50 px-4 py-3">
          <CheckCircle2Icon className="h-5 w-5 text-green-600" />
          <p className="text-sm font-medium text-green-700">اكتمل النموذج</p>
        </div>
      )}
    </div>
  );
};
