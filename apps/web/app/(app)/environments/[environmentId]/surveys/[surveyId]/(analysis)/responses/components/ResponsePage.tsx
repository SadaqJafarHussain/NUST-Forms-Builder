"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TEnvironment } from "@formbricks/types/environment";
import { TSurveyQuota } from "@formbricks/types/quota";
import { TResponseWithQuotas } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys/types";
import { TTag } from "@formbricks/types/tags";
import { TUser, TUserLocale } from "@formbricks/types/user";
import { useResponseFilter } from "@/app/(app)/environments/[environmentId]/components/ResponseFilterContext";
import { getResponsesAction } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/actions";
import { ResponseDataView } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/responses/components/ResponseDataView";
import { CustomFilter } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/CustomFilter";
import { getFormattedFilters } from "@/app/lib/surveys/surveys";
import { replaceHeadlineRecall } from "@/lib/utils/recall";

interface ResponsePageProps {
  environment: TEnvironment;
  survey: TSurvey;
  surveyId: string;
  user?: TUser;
  environmentTags: TTag[];
  responsesPerPage: number;
  locale: TUserLocale;
  isReadOnly: boolean;
  isQuotasAllowed: boolean;
  quotas: TSurveyQuota[];
}

export const ResponsePage = ({
  environment,
  survey,
  surveyId,
  user,
  environmentTags,
  responsesPerPage,
  locale,
  isReadOnly,
  isQuotasAllowed,
  quotas,
}: ResponsePageProps) => {
  const [responses, setResponses] = useState<TResponseWithQuotas[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isFetchingFirstPage, setFetchingFirstPage] = useState<boolean>(true);
  const { selectedFilter, dateRange, resetState } = useResponseFilter();

  const filters = useMemo(
    () => getFormattedFilters(survey, selectedFilter, dateRange),

    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedFilter, dateRange]
  );

  const searchParams = useSearchParams();

  const fetchNextPage = useCallback(async () => {
    const newPage = page + 1;

    let newResponses: TResponseWithQuotas[] = [];

    const getResponsesActionResponse = await getResponsesAction({
      surveyId,
      limit: responsesPerPage,
      offset: (newPage - 1) * responsesPerPage,
      filterCriteria: filters,
    });
    newResponses = getResponsesActionResponse?.data || [];

    if (newResponses.length === 0 || newResponses.length < responsesPerPage) {
      setHasMore(false);
    }
    setResponses([...responses, ...newResponses]);
    setPage(newPage);
  }, [filters, page, responses, responsesPerPage, surveyId]);

  const updateResponseList = (responseIds: string[]) => {
    setResponses((prev) => prev.filter((r) => !responseIds.includes(r.id)));
  };

  const updateResponse = (responseId: string, updatedResponse: TResponseWithQuotas) => {
    setResponses((prev) => prev.map((r) => (r.id === responseId ? updatedResponse : r)));
  };

  const surveyMemoized = useMemo(() => {
    return replaceHeadlineRecall(survey, "default");
  }, [survey]);

  useEffect(() => {
    if (!searchParams?.get("referer")) {
      resetState();
    }
  }, [searchParams, resetState]);

  useEffect(() => {
    const fetchInitialResponses = async () => {
      try {
        setFetchingFirstPage(true);
        let responses: TResponseWithQuotas[] = [];

        const getResponsesActionResponse = await getResponsesAction({
          surveyId,
          limit: responsesPerPage,
          offset: 0,
          filterCriteria: filters,
        });

        responses = getResponsesActionResponse?.data || [];

        if (responses.length < responsesPerPage) {
          setHasMore(false);
        }
        setResponses(responses);
      } finally {
        setFetchingFirstPage(false);
      }
    };
    fetchInitialResponses();
  }, [surveyId, filters, responsesPerPage]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setResponses([]);
  }, [filters]);

  return (
    <div dir="rtl">
      {/* Response count banner */}
      {!isFetchingFirstPage && (
        <div
          className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ borderRight: "4px solid #1b335f" }}>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "#1b335f18" }}>
            <svg
              className="h-5 w-5"
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
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">
              {responses.length} {responses.length === 0 ? "ردود" : "رد"}
            </p>
            <p className="text-xs text-slate-500">إجمالي الردود المسترجعة حتى الآن</p>
          </div>
        </div>
      )}
      <div className="mb-3">
        <CustomFilter survey={surveyMemoized} locale={locale} />
      </div>
      <ResponseDataView
        survey={survey}
        responses={responses}
        user={user}
        environment={environment}
        environmentTags={environmentTags}
        isReadOnly={isReadOnly}
        fetchNextPage={fetchNextPage}
        hasMore={hasMore}
        updateResponseList={updateResponseList}
        updateResponse={updateResponse}
        isFetchingFirstPage={isFetchingFirstPage}
        locale={locale}
        isQuotasAllowed={isQuotasAllowed}
        quotas={quotas}
      />
    </div>
  );
};
