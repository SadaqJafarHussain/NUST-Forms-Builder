import { TSurvey, TSurveyQuestion } from "@formbricks/types/surveys/types";
import { ConditionalLogic } from "@/modules/survey/editor/components/conditional-logic";

interface AdvancedSettingsProps {
  question: TSurveyQuestion;
  questionIdx: number;
  localSurvey: TSurvey;
  updateQuestion: (questionIdx: number, updatedAttributes: any) => void;
  selectedLanguageCode: string;
}

export const AdvancedSettings = ({
  question,
  questionIdx,
  localSurvey,
  updateQuestion,
}: AdvancedSettingsProps) => {
  return (
    <ConditionalLogic
      question={question}
      updateQuestion={updateQuestion}
      localSurvey={localSurvey}
      questionIdx={questionIdx}
    />
  );
};
