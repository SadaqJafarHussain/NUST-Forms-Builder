"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TEnvironment } from "@formbricks/types/environment";
import { TSurvey, TSurveySummary } from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";
import { useResponseFilter } from "@/app/(app)/environments/[environmentId]/components/ResponseFilterContext";
import { getSurveySummaryAction } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/actions";
import ScrollToTop from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/ScrollToTop";
import { SummaryDropOffs } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/SummaryDropOffs";
import { CustomFilter } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/CustomFilter";
import { getFormattedFilters } from "@/app/lib/surveys/surveys";
import { replaceHeadlineRecall } from "@/lib/utils/recall";
import { QuotasSummary } from "@/modules/ee/quotas/components/quotas-summary";
import { SummaryList } from "./SummaryList";
import { SummaryMetadata } from "./SummaryMetadata";

const defaultSurveySummary: TSurveySummary = {
  meta: {
    completedPercentage: 0,
    completedResponses: 0,
    displayCount: 0,
    dropOffPercentage: 0,
    dropOffCount: 0,
    startsPercentage: 0,
    totalResponses: 0,
    ttcAverage: 0,
    quotasCompleted: 0,
    quotasCompletedPercentage: 0,
  },
  dropOff: [],
  quotas: [],
  summary: [],
};

interface SummaryPageProps {
  environment: TEnvironment;
  survey: TSurvey;
  surveyId: string;
  locale: TUserLocale;
  initialSurveySummary?: TSurveySummary;
  isQuotasAllowed: boolean;
}

export const SummaryPage = ({
  environment,
  survey,
  surveyId,
  locale,
  initialSurveySummary,
  isQuotasAllowed,
}: SummaryPageProps) => {
  const searchParams = useSearchParams();

  const [surveySummary, setSurveySummary] = useState<TSurveySummary>(
    initialSurveySummary || defaultSurveySummary
  );

  const [tab, setTab] = useState<"dropOffs" | "quotas" | undefined>(undefined);
  const [showIncompleteStats, setShowIncompleteStats] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialSurveySummary);

  const { selectedFilter, dateRange, resetState } = useResponseFilter();

  // Only fetch data when filters change or when there's no initial data
  useEffect(() => {
    // If we have initial data and no filters are applied, don't fetch
    const hasNoFilters =
      (!selectedFilter ||
        Object.keys(selectedFilter).length === 0 ||
        (selectedFilter.filter && selectedFilter.filter.length === 0)) &&
      (!dateRange || (!dateRange.from && !dateRange.to));

    if (initialSurveySummary && hasNoFilters) {
      setIsLoading(false);
      return;
    }

    const fetchSummary = async () => {
      setIsLoading(true);

      try {
        // Recalculate filters inside the effect to ensure we have the latest values
        const currentFilters = getFormattedFilters(survey, selectedFilter, dateRange);
        let updatedSurveySummary;

        updatedSurveySummary = await getSurveySummaryAction({
          surveyId,
          filterCriteria: currentFilters,
        });

        const surveySummary = updatedSurveySummary?.data ?? defaultSurveySummary;
        setSurveySummary(surveySummary);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [selectedFilter, dateRange, survey, surveyId, initialSurveySummary]);

  const surveyMemoized = useMemo(() => {
    return replaceHeadlineRecall(survey, "default");
  }, [survey]);

  useEffect(() => {
    if (!searchParams?.get("referer")) {
      resetState();
    }
  }, [searchParams, resetState]);

  return (
    <>
      <SummaryMetadata
        surveySummary={surveySummary.meta}
        isLoading={isLoading}
        tab={tab}
        setTab={setTab}
        isQuotasAllowed={isQuotasAllowed}
        showIncompleteStats={showIncompleteStats}
        onToggleIncompleteStats={() => {
          setShowIncompleteStats((v) => {
            if (v && tab === "dropOffs") setTab(undefined);
            return !v;
          });
        }}
      />
      {showIncompleteStats && tab === "dropOffs" && (
        <SummaryDropOffs dropOff={surveySummary.dropOff} survey={surveyMemoized} />
      )}
      {isQuotasAllowed && tab === "quotas" && <QuotasSummary quotas={surveySummary.quotas} />}
      <div className="mt-6 flex items-center gap-3" dir="rtl">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-600 shadow-sm">
          <svg
            className="h-4 w-4"
            style={{ color: "#1b335f" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          نتائج الأسئلة
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="mt-4 flex gap-1.5" dir="rtl">
        <CustomFilter survey={surveyMemoized} locale={locale} />
      </div>
      <ScrollToTop containerId="mainContent" />
      <SummaryList
        summary={surveySummary.summary}
        responseCount={surveySummary.meta.totalResponses}
        survey={surveyMemoized}
        environment={environment}
        locale={locale}
      />
    </>
  );
};
