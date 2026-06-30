import { createId } from "@paralleldrive/cuid2";
import { TSurveyCreateInput } from "@formbricks/types/surveys/types";

export const getBlankSurveyBody = (userId: string): TSurveyCreateInput => ({
  name: "",
  type: "link",
  createdBy: userId,
  isOnePage: true,
  welcomeCard: { enabled: false, timeToFinish: false, showResponseCount: false },
  endings: [
    {
      id: createId(),
      type: "endScreen",
      headline: { default: "شكراً لك!" },
      subheader: { default: "تم استلام ردك بنجاح." },
    } as any,
  ],
  hiddenFields: { enabled: false, fieldIds: [] },
  variables: [],
  followUps: [],
  questions: [],
});
