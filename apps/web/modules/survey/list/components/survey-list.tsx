"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  CheckCircle2Icon,
  ClockIcon,
  LayoutGridIcon,
  ListIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from "lucide-react";
// Need to import timeSince and useSingleUseId and Link in this file too
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { wrapThrows } from "@formbricks/types/error-handlers";
import { TProjectConfigChannel } from "@formbricks/types/project";
import { TSurveyFilters } from "@formbricks/types/surveys/types";
import { TUserLocale } from "@formbricks/types/user";
import { FORMBRICKS_SURVEYS_FILTERS_KEY_LS } from "@/lib/localStorage";
import { timeSince } from "@/lib/time";
import { useSingleUseId } from "@/modules/survey/hooks/useSingleUseId";
import { getSurveysAction } from "@/modules/survey/list/actions";
import { getFormattedFilters } from "@/modules/survey/list/lib/utils";
import { TSurvey } from "@/modules/survey/list/types/surveys";
import { Button } from "@/modules/ui/components/button";
import { SurveyCard } from "./survey-card";
import { SurveyDropDownMenu } from "./survey-dropdown-menu";
import { SurveyLoading } from "./survey-loading";

interface SurveysListProps {
  environmentId: string;
  isReadOnly: boolean;
  publicDomain: string;
  userId: string;
  surveysPerPage: number;
  currentProjectChannel: TProjectConfigChannel;
  locale: TUserLocale;
}

type TabKey = "recent" | "active" | "paused" | "completed";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "recent", label: "الأحدث", icon: <ClockIcon className="h-4 w-4" /> },
  { key: "active", label: "النشطة", icon: <PlayCircleIcon className="h-4 w-4" /> },
  { key: "paused", label: "الموقوفة", icon: <PauseCircleIcon className="h-4 w-4" /> },
  { key: "completed", label: "المكتملة", icon: <CheckCircle2Icon className="h-4 w-4" /> },
];

export const initialFilters: TSurveyFilters = {
  name: "",
  createdBy: [],
  status: [],
  type: [],
  sortBy: "relevance",
};

export const SurveysList = ({
  environmentId,
  isReadOnly,
  publicDomain,
  userId,
  surveysPerPage: surveysLimit,
  locale,
}: SurveysListProps) => {
  const router = useRouter();
  const [surveys, setSurveys] = useState<TSurvey[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [isFilterInitialized, setIsFilterInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("recent");
  const [keyword, setKeyword] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [parent] = useAutoAnimate();

  // Build filters based on active tab
  const tabFilters = useMemo((): TSurveyFilters => {
    const base = { ...initialFilters, sortBy: "updatedAt" as const, name: keyword };
    switch (activeTab) {
      case "active":
        return { ...base, status: ["inProgress"] };
      case "paused":
        return { ...base, status: ["paused"] };
      case "completed":
        return { ...base, status: ["completed"] };
      default:
        return base;
    }
  }, [activeTab, keyword]);

  const filters = useMemo(() => getFormattedFilters(tabFilters, userId), [tabFilters, userId]);

  // Init
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedFilters = localStorage.getItem(FORMBRICKS_SURVEYS_FILTERS_KEY_LS);
      if (savedFilters) {
        const result = wrapThrows(() => JSON.parse(savedFilters))();
        if (!result.ok) localStorage.removeItem(FORMBRICKS_SURVEYS_FILTERS_KEY_LS);
      }
      setIsFilterInitialized(true);
    }
  }, []);

  // Re-fetch when user returns to this tab (e.g. after editing deadline in editor)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setRefreshTrigger((v) => !v);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Fetch surveys
  useEffect(() => {
    if (!isFilterInitialized) return;
    const fetchSurveys = async () => {
      setIsFetching(true);
      const res = await getSurveysAction({
        environmentId,
        limit: surveysLimit,
        offset: undefined,
        filterCriteria: filters,
      });
      if (res?.data) {
        setHasMore(res.data.length >= surveysLimit);
        setSurveys(res.data);
        setIsFetching(false);
      }
    };
    fetchSurveys();
  }, [environmentId, surveysLimit, filters, isFilterInitialized, refreshTrigger]);

  const fetchNextPage = useCallback(async () => {
    setIsFetching(true);
    const res = await getSurveysAction({
      environmentId,
      limit: surveysLimit,
      offset: surveys.length,
      filterCriteria: filters,
    });
    if (res?.data) {
      setHasMore(res.data.length >= surveysLimit);
      setSurveys((prev) => [...prev, ...res.data!]);
      setIsFetching(false);
    }
  }, [environmentId, surveys.length, surveysLimit, filters]);

  const handleDeleteSurvey = (surveyId: string) => {
    const next = surveys.filter((s) => s.id !== surveyId);
    setSurveys(next);
    if (next.length === 0) {
      setIsFetching(true);
      router.refresh();
    }
  };

  const triggerRefresh = useCallback(() => setRefreshTrigger((p) => !p), []);

  const displayedSurveys = surveys;

  return (
    <div className="space-y-0" dir="rtl">
      {/* Tab bar + search + view toggle */}
      <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-0">
        {/* Tabs */}
        <div className="flex items-center gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors"
              style={
                activeTab === tab.key
                  ? { color: "#1b335f", borderBottom: "2px solid #1b335f" }
                  : { color: "#64748b", borderBottom: "2px solid transparent" }
              }>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + view toggle */}
        <div className="flex items-center gap-2 pb-2">
          <input
            type="text"
            placeholder="بحث بالكلمة..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 shadow-sm focus:border-[#1b335f] focus:outline-none"
          />
          <button
            onClick={() => setViewMode("list")}
            className="rounded-md p-1.5 transition-colors"
            style={
              viewMode === "list" ? { backgroundColor: "#1b335f", color: "#fff" } : { color: "#94a3b8" }
            }>
            <ListIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className="rounded-md p-1.5 transition-colors"
            style={
              viewMode === "grid" ? { backgroundColor: "#1b335f", color: "#fff" } : { color: "#94a3b8" }
            }>
            <LayoutGridIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Survey grid / list */}
      {isFetching && displayedSurveys.length === 0 ? (
        <SurveyLoading />
      ) : displayedSurveys.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
          <span className="text-5xl">📋</span>
          <p className="text-base font-medium text-slate-700">
            {activeTab === "active"
              ? "لا توجد فورمات نشطة"
              : activeTab === "paused"
                ? "لا توجد فورمات موقوفة"
                : activeTab === "completed"
                  ? "لا توجد فورمات مكتملة"
                  : "لا توجد فورمات بعد"}
          </p>
          <p className="text-sm text-slate-400">أنشئ فورمك الأول بالضغط على فورم جديد</p>
        </div>
      ) : viewMode === "grid" ? (
        <div>
          <div
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            ref={parent}>
            {displayedSurveys.map((survey) => (
              <SurveyCard
                key={survey.id}
                survey={survey}
                environmentId={environmentId}
                isReadOnly={isReadOnly}
                publicDomain={publicDomain}
                deleteSurvey={handleDeleteSurvey}
                locale={locale}
                onSurveysCopied={triggerRefresh}
              />
            ))}
          </div>
          {hasMore && !isFetching && (
            <div className="flex justify-center py-6">
              <Button onClick={fetchNextPage} variant="secondary" size="sm" loading={isFetching}>
                تحميل المزيد
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* List view */
        <div className="space-y-1" ref={parent}>
          {displayedSurveys.map((survey) => (
            <ListRow
              key={survey.id}
              survey={survey}
              environmentId={environmentId}
              isReadOnly={isReadOnly}
              publicDomain={publicDomain}
              deleteSurvey={handleDeleteSurvey}
              locale={locale}
              onSurveysCopied={triggerRefresh}
            />
          ))}
          {hasMore && !isFetching && (
            <div className="flex justify-center py-6">
              <Button onClick={fetchNextPage} variant="secondary" size="sm" loading={isFetching}>
                تحميل المزيد
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ── List-view row ── */
const GRADIENTS = [
  ["#1b335f", "#2563eb"],
  ["#7c3aed", "#a855f7"],
  ["#0891b2", "#0e7490"],
  ["#d97706", "#f59e0b"],
  ["#16a34a", "#15803d"],
  ["#e11d48", "#be123c"],
];
const getGradient = (id: string) =>
  GRADIENTS[(id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % GRADIENTS.length];

interface ListRowProps {
  survey: TSurvey;
  environmentId: string;
  isReadOnly: boolean;
  publicDomain: string;
  deleteSurvey: (id: string) => void;
  locale: TUserLocale;
  onSurveysCopied?: () => void;
}

const ListRow = ({
  survey,
  environmentId,
  isReadOnly,
  publicDomain,
  deleteSurvey,
  locale,
  onSurveysCopied,
}: ListRowProps) => {
  const { refreshSingleUseId } = useSingleUseId(survey, isReadOnly);
  const [from, to] = getGradient(survey.id);
  const href =
    survey.status === "draft"
      ? `/environments/${environmentId}/surveys/${survey.id}/edit`
      : `/environments/${environmentId}/surveys/${survey.id}/summary`;
  const isDraftAndReadOnly = survey.status === "draft" && isReadOnly;

  const row = (
    <div
      className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md"
      style={{ border: "1px solid #e8edf2" }}>
      {/* Color chip */}
      <div
        className="h-10 w-10 flex-shrink-0 rounded-lg"
        style={{ background: `linear-gradient(135deg,${from},${to})` }}
      />
      {/* Name */}
      <p className="flex-1 truncate text-sm font-semibold text-slate-800">{survey.name}</p>
      {/* Meta */}
      <p className="hidden flex-shrink-0 text-xs text-slate-400 sm:block">
        {survey.responseCount} استجابة · {timeSince(survey.updatedAt.toString(), locale)}
      </p>
      {/* Menu */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="flex-shrink-0">
        <SurveyDropDownMenu
          survey={survey}
          key={`list-${survey.id}`}
          environmentId={environmentId}
          publicDomain={publicDomain}
          disabled={isDraftAndReadOnly}
          refreshSingleUseId={refreshSingleUseId}
          isSurveyCreationDeletionDisabled={isReadOnly}
          deleteSurvey={deleteSurvey}
          onSurveysCopied={onSurveysCopied}
        />
      </button>
    </div>
  );

  return isDraftAndReadOnly ? <div>{row}</div> : <Link href={href}>{row}</Link>;
};
