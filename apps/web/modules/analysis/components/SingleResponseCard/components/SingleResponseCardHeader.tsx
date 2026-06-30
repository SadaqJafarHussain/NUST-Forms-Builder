"use client";

import { useTranslate } from "@tolgee/react";
import { LanguagesIcon, TrashIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { getLanguageLabel } from "@formbricks/i18n-utils/src/utils";
import { TEnvironment } from "@formbricks/types/environment";
import { TResponse } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys/types";
import { TUser, TUserLocale } from "@formbricks/types/user";
import { timeSince } from "@/lib/time";
import { getContactIdentifier } from "@/lib/utils/contact";
import { PersonAvatar } from "@/modules/ui/components/avatars";
import { IdBadge } from "@/modules/ui/components/id-badge";
import { SurveyStatusIndicator } from "@/modules/ui/components/survey-status-indicator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/modules/ui/components/tooltip";
import { isSubmissionTimeMoreThan5Minutes } from "../util";

interface TooltipRendererProps {
  shouldRender: boolean;
  tooltipContent: ReactNode;
  children: ReactNode;
}

interface SingleResponseCardHeaderProps {
  pageType: "people" | "response";
  response: TResponse;
  survey: TSurvey;
  environment: TEnvironment;
  user?: TUser;
  isReadOnly: boolean;
  setDeleteDialogOpen: (deleteDialogOpen: boolean) => void;
  locale: TUserLocale;
}

export const SingleResponseCardHeader = ({
  pageType,
  response,
  survey,
  environment,
  user,
  isReadOnly,
  setDeleteDialogOpen,
  locale,
}: SingleResponseCardHeaderProps) => {
  const displayIdentifier = response.contact
    ? getContactIdentifier(response.contact, response.contactAttributes)
    : null;

  const { t } = useTranslate();
  const environmentId = survey.environmentId;
  const canResponseBeDeleted = response.finished
    ? true
    : isSubmissionTimeMoreThan5Minutes(response.updatedAt);

  const TooltipRenderer = ({ children, shouldRender, tooltipContent }: TooltipRendererProps) => {
    return shouldRender ? (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
          <TooltipContent avoidCollisions align="start" side="bottom" className="max-w-[75vw]">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      <>{children}</>
    );
  };

  const renderTooltip = Boolean(
    (response.contactAttributes && Object.keys(response.contactAttributes).length > 0) ||
      (response.meta.userAgent && Object.keys(response.meta.userAgent).length > 0)
  );

  const tooltipContent = (
    <>
      {response.singleUseId && (
        <div>
          <p className="py-1 font-bold text-slate-700">
            {t("environments.surveys.responses.single_use_id")}:
          </p>
          <span>{response.singleUseId}</span>
        </div>
      )}
      {response.contactAttributes && Object.keys(response.contactAttributes).length > 0 && (
        <div>
          <p className="py-1 font-bold text-slate-700">
            {t("environments.surveys.responses.person_attributes")}:
          </p>
          {Object.keys(response.contactAttributes).map((key) => (
            <p
              key={key}
              className="truncate"
              title={`${key}: ${response.contactAttributes && response.contactAttributes[key]}`}>
              {key}:{" "}
              <span className="font-bold">
                {response.contactAttributes && response.contactAttributes[key]}
              </span>
            </p>
          ))}
        </div>
      )}

      {response.meta.userAgent && Object.keys(response.meta.userAgent).length > 0 && (
        <div className="text-slate-600">
          {response.contactAttributes && Object.keys(response.contactAttributes).length > 0 && (
            <hr className="my-2 border-slate-200" />
          )}
          <p className="py-1 font-bold text-slate-700">{t("environments.surveys.responses.device_info")}:</p>
          {response.meta.userAgent?.browser && (
            <p className="truncate" title={`Browser: ${response.meta.userAgent.browser}`}>
              {t("environments.surveys.responses.browser")}: {response.meta.userAgent.browser}
            </p>
          )}
          {response.meta.userAgent?.os && (
            <p className="truncate" title={`OS: ${response.meta.userAgent.os}`}>
              {t("environments.surveys.responses.os")}: {response.meta.userAgent.os}
            </p>
          )}
          {response.meta.userAgent && (
            <p
              className="truncate"
              title={`Device: ${response.meta.userAgent.device ? response.meta.userAgent.device : "PC / Generic device"}`}>
              {t("environments.surveys.responses.device")}:{" "}
              {response.meta.userAgent.device ? response.meta.userAgent.device : "PC / Generic device"}
            </p>
          )}
          {response.meta.url && (
            <p className="truncate" title={`URL: ${response.meta.url}`}>
              {t("common.url")}: {response.meta.url}
            </p>
          )}
          {/* Action display removed - not needed */}
          {response.meta.source && (
            <p className="truncate" title={`Source: ${response.meta.source}`}>
              {t("environments.surveys.responses.source")}: {response.meta.source}
            </p>
          )}
          {response.meta.country && (
            <p className="truncate" title={`Country: ${response.meta.country}`}>
              {t("environments.surveys.responses.country")}: {response.meta.country}
            </p>
          )}
        </div>
      )}
    </>
  );
  const deleteSubmissionToolTip = <>{t("environments.surveys.responses.this_response_is_in_progress")}</>;

  return (
    <div
      dir="rtl"
      className="border-b border-slate-200 px-6 pb-4 pt-0"
      style={{ borderTop: "4px solid #1b335f", borderRadius: "0.75rem 0.75rem 0 0" }}>
      {/* Status strip */}
      <div className="flex items-center justify-between py-3">
        {/* Right side: person info */}
        <div className="flex items-center gap-3">
          {pageType === "response" && (
            <TooltipRenderer shouldRender={renderTooltip} tooltipContent={tooltipContent}>
              <div className="group flex items-center gap-3">
                {response.contact?.id ? (
                  user ? (
                    <Link
                      className="flex items-center gap-2"
                      href={`/environments/${environmentId}/contacts/${response.contact.id}`}>
                      <PersonAvatar personId={response.contact.id} />
                      <h3 className="ph-no-capture font-semibold text-slate-700 hover:underline">
                        {displayIdentifier}
                      </h3>
                      {response.contact.userId && <IdBadge id={response.contact.userId} />}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <PersonAvatar personId={response.contact.id} />
                      <h3 className="ph-no-capture font-semibold text-slate-700">{displayIdentifier}</h3>
                      {response.contact.userId && <IdBadge id={response.contact.userId} />}
                    </div>
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    <PersonAvatar personId="anonymous" />
                    <h3 className="font-semibold text-slate-500">مجهول</h3>
                  </div>
                )}
              </div>
            </TooltipRenderer>
          )}

          {pageType === "people" && (
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
              {(survey.type === "link" || environment.appSetupCompleted) && (
                <SurveyStatusIndicator status={survey.status} />
              )}
              <Link
                className="hover:underline"
                href={`/environments/${environmentId}/surveys/${survey.id}/summary`}>
                {survey.name}
              </Link>
            </div>
          )}

          {/* Status badge */}
          {response.finished ? (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: "#16a34a18", color: "#16a34a" }}>
              مكتمل
            </span>
          ) : (
            <span
              className="rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: "#f59e0b18", color: "#d97706" }}>
              غير مكتمل
            </span>
          )}

          {response.language && response.language !== "default" && (
            <div className="flex items-center gap-1 rounded-full bg-slate-700 px-2 py-1 text-xs text-white">
              <LanguagesIcon className="h-3 w-3" />
              <span>{getLanguageLabel(response.language, locale)}</span>
            </div>
          )}
        </div>

        {/* Left side: time + delete */}
        <div className="flex items-center gap-4 text-sm">
          <time
            className="text-xs text-slate-400"
            dateTime={timeSince(response.createdAt.toISOString(), locale)}>
            {timeSince(response.createdAt.toISOString(), locale)}
          </time>
          {user &&
            !isReadOnly &&
            (canResponseBeDeleted ? (
              <TrashIcon
                onClick={() => setDeleteDialogOpen(true)}
                className="h-4 w-4 cursor-pointer text-slate-400 hover:text-red-600"
                aria-label="حذف الرد"
              />
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <TrashIcon
                      className="h-4 w-4 cursor-not-allowed text-slate-300"
                      aria-label="لا يمكن حذف رد قيد التنفيذ"
                    />
                  </TooltipTrigger>
                  <TooltipContent side="right">{deleteSubmissionToolTip}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
        </div>
      </div>
    </div>
  );
};
