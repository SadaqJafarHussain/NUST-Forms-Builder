import { TIntegration } from "@formbricks/types/integration";
import { TSurvey } from "@formbricks/types/surveys/types";
import { TPipelineInput } from "@/app/api/(internal)/pipeline/types/pipelines";

// Integrations have been removed from this deployment
// This is a stub function that does nothing
export const handleIntegrations = async (
  _integrations: TIntegration[],
  _data: TPipelineInput,
  _survey: TSurvey
) => {
  // No-op: integrations are disabled
  return;
};
