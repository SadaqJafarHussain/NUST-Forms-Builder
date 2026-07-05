"use client";

import { useTranslate } from "@tolgee/react";
import { ChevronDown } from "lucide-react";
import {
  TShuffleOption,
  TSurveyMatrixQuestion,
  TSurveyMultipleChoiceQuestion,
  TSurveyRankingQuestion,
} from "@formbricks/types/surveys/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";

interface ShuffleOptionType {
  id: string;
  label: string;
  show: boolean;
}

interface ShuffleOptionsTypes {
  none?: ShuffleOptionType;
  all?: ShuffleOptionType;
  exceptLast?: ShuffleOptionType;
}

interface ShuffleOptionSelectProps {
  shuffleOption: TShuffleOption | undefined;
  updateQuestion: (
    questionIdx: number,
    updatedAttributes: Partial<TSurveyMatrixQuestion | TSurveyMultipleChoiceQuestion | TSurveyRankingQuestion>
  ) => void;
  questionIdx: number;
  shuffleOptionsTypes: ShuffleOptionsTypes;
}

export const ShuffleOptionSelect: React.FC<ShuffleOptionSelectProps> = ({
  questionIdx,
  shuffleOption,
  updateQuestion,
  shuffleOptionsTypes,
}) => {
  const { t } = useTranslate();
  return (
    <Select
      defaultValue={shuffleOption}
      value={shuffleOption}
      onValueChange={(e: TShuffleOption) => {
        updateQuestion(questionIdx, { shuffleOption: e });
      }}>
      <SelectTrigger className="w-fit gap-2 border-0 font-medium text-slate-600" hideArrow>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        <SelectValue placeholder={t("environments.surveys.edit.select_ordering")} />
      </SelectTrigger>
      <SelectContent>
        {Object.values(shuffleOptionsTypes).map(
          (shuffleOptionsType) =>
            shuffleOptionsType.show && (
              <SelectItem
                key={shuffleOptionsType.id}
                value={shuffleOptionsType.id}
                title={shuffleOptionsType.label}>
                {shuffleOptionsType.label}
              </SelectItem>
            )
        )}
      </SelectContent>
    </Select>
  );
};
