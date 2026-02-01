"use client";

import { TSurveyQuota } from "@formbricks/types/quota";
import { TSurvey, TSurveyQuestionId } from "@formbricks/types/surveys/types";

interface SurveyVariablesCardProps {
  localSurvey: TSurvey;
  setLocalSurvey: (survey: TSurvey) => void;
  activeQuestionId: TSurveyQuestionId | null;
  setActiveQuestionId: (id: TSurveyQuestionId | null) => void;
  quotas: TSurveyQuota[];
}

export const SurveyVariablesCard = ({}: SurveyVariablesCardProps) => {
  return <div></div>;
};
