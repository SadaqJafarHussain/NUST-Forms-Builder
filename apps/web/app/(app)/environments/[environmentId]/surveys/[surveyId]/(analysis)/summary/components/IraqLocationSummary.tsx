"use client";

import { useTranslate } from "@tolgee/react";
import Link from "next/link";
import { TSurvey, TSurveyQuestionSummaryIraqLocation } from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";
import { timeSince } from "@/lib/time";
import { getContactIdentifier } from "@/lib/utils/contact";
import { PersonAvatar } from "@/modules/ui/components/avatars";
import { QuestionSummaryHeader } from "./QuestionSummaryHeader";

interface IraqLocationSummaryProps {
  questionSummary: TSurveyQuestionSummaryIraqLocation;
  environmentId: string;
  survey: TSurvey;
  locale: TUserLocale;
}

export const IraqLocationSummary = ({
  questionSummary,
  environmentId,
  survey,
  locale,
}: IraqLocationSummaryProps) => {
  const { t } = useTranslate();

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <QuestionSummaryHeader questionSummary={questionSummary} survey={survey} />

      {/* Distribution Statistics */}
      <div className="grid grid-cols-3 gap-4 border-b border-slate-200 p-4">
        {/* Province Distribution */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">
            {t("environments.surveys.summary.province_distribution")}
          </h4>
          <div className="space-y-1">
            {questionSummary.provinceDistribution.slice(0, 5).map((item) => (
              <div key={item.province} className="flex justify-between text-sm">
                <span className="truncate text-slate-600">{item.province}</span>
                <span className="font-medium text-slate-800">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
            {questionSummary.provinceDistribution.length > 5 && (
              <p className="text-xs text-slate-500">
                +{questionSummary.provinceDistribution.length - 5} {t("common.more")}
              </p>
            )}
          </div>
        </div>

        {/* Judiciary Distribution */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">
            {t("environments.surveys.summary.district_distribution")}
          </h4>
          <div className="space-y-1">
            {questionSummary.judiciaryDistribution.slice(0, 5).map((item) => (
              <div key={item.judiciary} className="flex justify-between text-sm">
                <span className="truncate text-slate-600">{item.judiciary}</span>
                <span className="font-medium text-slate-800">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
            {questionSummary.judiciaryDistribution.length > 5 && (
              <p className="text-xs text-slate-500">
                +{questionSummary.judiciaryDistribution.length - 5} {t("common.more")}
              </p>
            )}
          </div>
        </div>

        {/* Area Distribution */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">
            {t("environments.surveys.summary.area_distribution")}
          </h4>
          <div className="space-y-1">
            {questionSummary.areaDistribution.slice(0, 5).map((item) => (
              <div key={item.area} className="flex justify-between text-sm">
                <span className="truncate text-slate-600">{item.area}</span>
                <span className="font-medium text-slate-800">
                  {item.count} ({item.percentage}%)
                </span>
              </div>
            ))}
            {questionSummary.areaDistribution.length > 5 && (
              <p className="text-xs text-slate-500">
                +{questionSummary.areaDistribution.length - 5} {t("common.more")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Individual Responses */}
      <div>
        <div className="grid h-10 grid-cols-4 items-center border-y border-slate-200 bg-slate-100 text-sm font-bold text-slate-600">
          <div className="pl-4 md:pl-6">{t("common.user")}</div>
          <div className="col-span-2 pl-4 md:pl-6">{t("common.response")}</div>
          <div className="px-4 md:px-6">{t("common.time")}</div>
        </div>
        <div className="max-h-[62vh] w-full overflow-y-auto">
          {questionSummary.samples.map((response) => {
            return (
              <div
                key={response.id}
                className="grid grid-cols-4 items-center border-b border-slate-100 py-2 text-sm text-slate-800 last:border-transparent md:text-base">
                <div className="pl-4 md:pl-6">
                  {response.contact ? (
                    <Link
                      className="ph-no-capture group flex items-center"
                      href={`/environments/${environmentId}/contacts/${response.contact.id}`}>
                      <div className="hidden md:flex">
                        <PersonAvatar personId={response.contact.id} />
                      </div>
                      <p className="ph-no-capture break-all text-slate-600 group-hover:underline md:ml-2">
                        {getContactIdentifier(response.contact, response.contactAttributes)}
                      </p>
                    </Link>
                  ) : (
                    <div className="group flex items-center">
                      <div className="hidden md:flex">
                        <PersonAvatar personId="anonymous" />
                      </div>
                      <p className="break-all text-slate-600 md:ml-2">{t("common.anonymous")}</p>
                    </div>
                  )}
                </div>
                <div className="ph-no-capture col-span-2 pl-6">
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="font-medium text-slate-500">
                        {t("environments.surveys.summary.province")}:
                      </span>
                      <span className="font-semibold">{response.value.province.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium text-slate-500">
                        {t("environments.surveys.summary.district")}:
                      </span>
                      <span className="font-semibold">{response.value.judiciary.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="font-medium text-slate-500">
                        {t("environments.surveys.summary.area")}:
                      </span>
                      <span className="font-semibold">{response.value.area.name}</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 text-slate-500 md:px-6">
                  {timeSince(new Date(response.updatedAt).toISOString(), locale)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
