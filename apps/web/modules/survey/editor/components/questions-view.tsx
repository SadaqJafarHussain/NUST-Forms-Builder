"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { createId } from "@paralleldrive/cuid2";
import { Project } from "@prisma/client";
import { useTranslate } from "@tolgee/react";
import React, { SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TOrganizationBillingPlan } from "@formbricks/types/organizations";
import { TSurveyQuota } from "@formbricks/types/quota";
import {
  TConditionGroup,
  TSingleCondition,
  TSurveyLogic,
  TSurveyLogicAction,
  TSurveyQuestionId,
} from "@formbricks/types/surveys/types";
import { TSurvey, TSurveyQuestion } from "@formbricks/types/surveys/types";
import { findQuestionsWithCyclicLogic } from "@formbricks/types/surveys/validation";
import { TUserLocale } from "@formbricks/types/user";
import { addMultiLanguageLabels, extractLanguageCodes, getLocalizedValue } from "@/lib/i18n/utils";
import { getQuestionsAction, getSurveysForImportAction } from "@/lib/question-bank/actions";
import { isConditionGroup } from "@/lib/surveyLogic/utils";
import { checkForEmptyFallBackValue, extractRecallInfo } from "@/lib/utils/recall";
import { AddQuestionButton } from "@/modules/survey/editor/components/add-question-button";
import { ImportFromFormsDialog } from "@/modules/survey/editor/components/import-from-forms-dialog";
import {
  SuggestionQuestion,
  getQuestionMeta,
} from "@/modules/survey/editor/components/question-suggestion-strip";
import { QuestionsDroppable } from "@/modules/survey/editor/components/questions-droppable";
import { findQuestionUsedInLogic, isUsedInQuota } from "@/modules/survey/editor/lib/utils";
import { validateQuestion, validateSurveyQuestionsInBatch } from "../lib/validation";

interface QuestionsViewProps {
  localSurvey: TSurvey;
  setLocalSurvey: React.Dispatch<SetStateAction<TSurvey>>;
  activeQuestionId: TSurveyQuestionId | null;
  setActiveQuestionId: (questionId: TSurveyQuestionId | null) => void;
  project: Project;
  invalidQuestions: string[] | null;
  setInvalidQuestions: React.Dispatch<SetStateAction<string[] | null>>;
  selectedLanguageCode: string;
  setSelectedLanguageCode: (languageCode: string) => void;
  isFormbricksCloud: boolean;
  plan: TOrganizationBillingPlan;
  isCxMode: boolean;
  locale: TUserLocale;
  responseCount: number;
  setIsCautionDialogOpen: (open: boolean) => void;
  isStorageConfigured: boolean;
  quotas: TSurveyQuota[];
}

export const QuestionsView = ({
  activeQuestionId,
  setActiveQuestionId,
  localSurvey,
  setLocalSurvey,
  project,
  invalidQuestions,
  setInvalidQuestions,
  setSelectedLanguageCode,
  selectedLanguageCode,
  isFormbricksCloud,
  isCxMode,
  locale,
  responseCount,
  setIsCautionDialogOpen,
  isStorageConfigured = true,
  quotas,
}: QuestionsViewProps) => {
  const { t } = useTranslate();

  // ── Suggestion engine ────────────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState<SuggestionQuestion[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const loadSuggestions = useCallback(async () => {
    try {
      const envId = localSurvey.environmentId;
      const [bankResult, surveysResult] = await Promise.all([
        getQuestionsAction({ environmentId: envId }),
        getSurveysForImportAction({ environmentId: envId }),
      ]);

      const all: SuggestionQuestion[] = [];

      // From question bank
      if (bankResult?.data) {
        for (const item of bankResult.data) {
          const headline = getLocalizedValue(item.questionData.headline, "default") || "";
          if (headline) {
            all.push({
              questionData: item.questionData,
              headline,
              type: item.type,
              sourceName: "بنك الأسئلة",
              isFromBank: true,
              metadata: getQuestionMeta(item.questionData),
            });
          }
        }
      }

      // From other surveys (exclude current survey)
      if (surveysResult?.data) {
        for (const survey of surveysResult.data) {
          if (survey.id === localSurvey.id) continue;
          for (const q of survey.questions) {
            const headline = getLocalizedValue(q.headline, "default") || "";
            if (headline) {
              all.push({
                questionData: q,
                headline,
                type: q.type,
                sourceName: survey.name,
                isFromBank: false,
                metadata: getQuestionMeta(q),
              });
            }
          }
        }
      }

      // Deduplicate by headline+type
      const seen = new Set<string>();
      const deduped = all.filter((s) => {
        const key = `${s.type}::${s.headline.trim().toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setSuggestions(deduped);
    } catch {
      // Suggestions are non-critical — silently fail
    }
  }, [localSurvey.environmentId, localSurvey.id]);

  useEffect(() => {
    loadSuggestions();
    // Re-run whenever survey ID changes (new form opened)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSurvey.id]);
  // ────────────────────────────────────────────────────────────────────────────

  const internalQuestionIdMap = useMemo(() => {
    return localSurvey.questions.reduce((acc, question) => {
      acc[question.id] = createId();
      return acc;
    }, {});
  }, [localSurvey.questions]);

  const surveyLanguages = localSurvey.languages;

  const handleQuestionLogicChange = (survey: TSurvey, compareId: string, updatedId: string): TSurvey => {
    const updateConditions = (conditions: TConditionGroup): TConditionGroup => {
      return {
        ...conditions,
        conditions: conditions?.conditions.map((condition) => {
          if (isConditionGroup(condition)) {
            return updateConditions(condition);
          } else {
            return updateSingleCondition(condition);
          }
        }),
      };
    };

    const updateSingleCondition = (condition: TSingleCondition): TSingleCondition => {
      let updatedCondition = { ...condition };

      if (condition.leftOperand.value === compareId) {
        updatedCondition.leftOperand = { ...condition.leftOperand, value: updatedId };
      }

      if (condition.rightOperand?.type === "question" && condition.rightOperand?.value === compareId) {
        updatedCondition.rightOperand = { ...condition.rightOperand, value: updatedId };
      }

      return updatedCondition;
    };

    const updateActions = (actions: TSurveyLogicAction[]): TSurveyLogicAction[] => {
      return actions.map((action) => {
        let updatedAction = { ...action };

        if (updatedAction.objective === "jumpToQuestion" && updatedAction.target === compareId) {
          updatedAction.target = updatedId;
        }

        if (updatedAction.objective === "requireAnswer" && updatedAction.target === compareId) {
          updatedAction.target = updatedId;
        }

        return updatedAction;
      });
    };

    return {
      ...survey,
      questions: survey.questions.map((question) => {
        let updatedQuestion = { ...question };

        if (question.headline[selectedLanguageCode].includes(`recall:${compareId}`)) {
          question.headline[selectedLanguageCode] = question.headline[selectedLanguageCode].replaceAll(
            `recall:${compareId}`,
            `recall:${updatedId}`
          );
        }

        // Update advanced logic
        if (question.logic) {
          updatedQuestion.logic = question.logic.map((logicRule: TSurveyLogic) => ({
            ...logicRule,
            conditions: updateConditions(logicRule.conditions),
            actions: updateActions(logicRule.actions),
          }));
        }

        return updatedQuestion;
      }),
    };
  };

  // function to validate individual questions
  const validateSurveyQuestion = (question: TSurveyQuestion) => {
    // prevent this function to execute further if user hasnt still tried to save the survey
    if (invalidQuestions === null) {
      return;
    }

    const isFirstQuestion = question.id === localSurvey.questions[0].id;

    if (validateQuestion(question, surveyLanguages, isFirstQuestion)) {
      // If question is valid, we now check for cyclic logic
      const questionsWithCyclicLogic = findQuestionsWithCyclicLogic(localSurvey.questions);

      if (questionsWithCyclicLogic.includes(question.id) && !invalidQuestions.includes(question.id)) {
        setInvalidQuestions([...invalidQuestions, question.id]);
        return;
      }

      setInvalidQuestions(invalidQuestions.filter((id) => id !== question.id));
      return;
    }

    setInvalidQuestions([...invalidQuestions, question.id]);
    return;
  };

  const updateQuestion = (questionIdx: number, updatedAttributes: any) => {
    let updatedSurvey = { ...localSurvey };
    if ("id" in updatedAttributes) {
      // if the survey question whose id is to be changed is linked to logic of any other survey then changing it
      const initialQuestionId = updatedSurvey.questions[questionIdx].id;
      updatedSurvey = handleQuestionLogicChange(updatedSurvey, initialQuestionId, updatedAttributes.id);
      if (invalidQuestions?.includes(initialQuestionId)) {
        setInvalidQuestions(
          invalidQuestions.map((id) => (id === initialQuestionId ? updatedAttributes.id : id))
        );
      }

      // relink the question to internal Id
      internalQuestionIdMap[updatedAttributes.id] =
        internalQuestionIdMap[localSurvey.questions[questionIdx].id];
      delete internalQuestionIdMap[localSurvey.questions[questionIdx].id];
      setActiveQuestionId(updatedAttributes.id);
    }

    updatedSurvey.questions[questionIdx] = {
      ...updatedSurvey.questions[questionIdx],
      ...updatedAttributes,
    };

    const attributesToCheck = ["buttonLabel", "upperLabel", "lowerLabel"];

    // If the value of buttonLabel, lowerLabel or upperLabel is equal to {default:""}, then delete buttonLabel key
    attributesToCheck.forEach((attribute) => {
      if (Object.keys(updatedAttributes).includes(attribute)) {
        const currentLabel = updatedSurvey.questions[questionIdx][attribute];
        if (currentLabel && Object.keys(currentLabel).length === 1 && currentLabel["default"].trim() === "") {
          delete updatedSurvey.questions[questionIdx][attribute];
        }
      }
    });
    setLocalSurvey(updatedSurvey);
    validateSurveyQuestion(updatedSurvey.questions[questionIdx]);
  };

  const deleteQuestion = (questionIdx: number) => {
    const questionId = localSurvey.questions[questionIdx].id;
    const activeQuestionIdTemp = activeQuestionId ?? localSurvey.questions[0].id;
    let updatedSurvey: TSurvey = { ...localSurvey };

    // checking if this question is used in logic of any other question
    const quesIdx = findQuestionUsedInLogic(localSurvey, questionId);
    if (quesIdx !== -1) {
      toast.error(t("environments.surveys.edit.question_used_in_logic", { questionIndex: quesIdx + 1 }));
      return;
    }

    const quotaIdx = quotas.findIndex((quota) => isUsedInQuota(quota, { questionId }));
    if (quotaIdx !== -1) {
      toast.error(
        t("environments.surveys.edit.question_used_in_quota", {
          questionIndex: questionIdx + 1,
          quotaName: quotas[quotaIdx].name,
        })
      );
      return;
    }

    // check if we are recalling from this question for every language
    updatedSurvey.questions.forEach((question) => {
      for (const [languageCode, headline] of Object.entries(question.headline)) {
        if (headline.includes(`recall:${questionId}`)) {
          const recallInfo = extractRecallInfo(headline);
          if (recallInfo) {
            question.headline[languageCode] = headline.replace(recallInfo, "");
          }
        }
      }
    });

    updatedSurvey.questions.splice(questionIdx, 1);

    const firstEndingCard = localSurvey.endings[0];
    setLocalSurvey(updatedSurvey);
    delete internalQuestionIdMap[questionId];

    if (questionId === activeQuestionIdTemp) {
      if (questionIdx <= localSurvey.questions.length && localSurvey.questions.length > 0) {
        setActiveQuestionId(localSurvey.questions[questionIdx % localSurvey.questions.length].id);
      } else if (firstEndingCard) {
        setActiveQuestionId(firstEndingCard.id);
      }
    }

    toast.success(t("environments.surveys.edit.question_deleted"));
  };

  const addQuestion = (question: TSurveyQuestion, index?: number) => {
    const updatedSurvey = { ...localSurvey };
    const newQuestions = [...localSurvey.questions];

    const languageSymbols = extractLanguageCodes(localSurvey.languages);
    const updatedQuestion = addMultiLanguageLabels(question, languageSymbols);

    if (index !== undefined) {
      newQuestions.splice(index, 0, { ...updatedQuestion, isDraft: true });
    } else {
      newQuestions.push({ ...updatedQuestion, isDraft: true });
    }
    updatedSurvey.questions = newQuestions;

    setLocalSurvey(updatedSurvey);
    setActiveQuestionId(question.id);
    internalQuestionIdMap[question.id] = createId();
  };

  const moveQuestion = (questionIndex: number, up: boolean) => {
    const newQuestions = Array.from(localSurvey.questions);
    const [reorderedQuestion] = newQuestions.splice(questionIndex, 1);
    const destinationIndex = up ? questionIndex - 1 : questionIndex + 1;
    newQuestions.splice(destinationIndex, 0, reorderedQuestion);
    const updatedSurvey = { ...localSurvey, questions: newQuestions };
    setLocalSurvey(updatedSurvey);
  };

  //useEffect to validate survey when changes are made to languages
  useEffect(() => {
    if (!invalidQuestions) return;
    let updatedInvalidQuestions: string[] = invalidQuestions;
    // Validate each question
    localSurvey.questions.forEach((question, index) => {
      updatedInvalidQuestions = validateSurveyQuestionsInBatch(
        question,
        updatedInvalidQuestions,
        surveyLanguages,
        index === 0
      );
    });

    if (JSON.stringify(updatedInvalidQuestions) !== JSON.stringify(invalidQuestions)) {
      setInvalidQuestions(updatedInvalidQuestions);
    }
  }, [localSurvey.questions, surveyLanguages, invalidQuestions, setInvalidQuestions]);

  useEffect(() => {
    const questionWithEmptyFallback = checkForEmptyFallBackValue(localSurvey, selectedLanguageCode);
    if (questionWithEmptyFallback) {
      setActiveQuestionId(questionWithEmptyFallback.id);
      if (activeQuestionId === questionWithEmptyFallback.id) {
        toast.error(t("environments.surveys.edit.fallback_missing"));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestionId, setActiveQuestionId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const onQuestionCardDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    const newQuestions = Array.from(localSurvey.questions);
    const sourceIndex = newQuestions.findIndex((question) => question.id === active.id);
    const destinationIndex = newQuestions.findIndex((question) => question.id === over?.id);
    const [reorderedQuestion] = newQuestions.splice(sourceIndex, 1);
    newQuestions.splice(destinationIndex, 0, reorderedQuestion);
    const updatedSurvey = { ...localSurvey, questions: newQuestions };
    setLocalSurvey(updatedSurvey);
  };

  return (
    <div className="w-full py-6" dir="rtl">
      <div className="mx-auto max-w-3xl px-5">
        {/* MS Forms-style form title header */}
        <div className="mb-6 overflow-hidden rounded-xl shadow-md" style={{ borderTop: "8px solid #f4bf00" }}>
          <div className="bg-white px-6 py-5">
            <input
              type="text"
              value={localSurvey.name}
              onChange={(e) => setLocalSurvey({ ...localSurvey, name: e.target.value })}
              placeholder="عنوان الفورم"
              className="w-full bg-transparent text-2xl font-bold text-slate-800 placeholder-slate-300 focus:outline-none"
              dir="rtl"
            />
            <p className="mt-1 text-xs text-slate-400">انقر لتعديل عنوان الفورم</p>
          </div>
        </div>

        <DndContext
          id="questions"
          sensors={sensors}
          onDragEnd={onQuestionCardDragEnd}
          collisionDetection={closestCorners}>
          <QuestionsDroppable
            localSurvey={localSurvey}
            project={project}
            moveQuestion={moveQuestion}
            updateQuestion={updateQuestion}
            selectedLanguageCode={selectedLanguageCode}
            setSelectedLanguageCode={setSelectedLanguageCode}
            deleteQuestion={deleteQuestion}
            activeQuestionId={activeQuestionId}
            setActiveQuestionId={setActiveQuestionId}
            invalidQuestions={invalidQuestions}
            addQuestion={addQuestion}
            isFormbricksCloud={isFormbricksCloud}
            isCxMode={isCxMode}
            locale={locale}
            responseCount={responseCount}
            onAlertTrigger={() => setIsCautionDialogOpen(true)}
            isStorageConfigured={isStorageConfigured}
            environmentId={localSurvey.environmentId}
            suggestions={suggestions}
          />
        </DndContext>

        {localSurvey.questions.length === 0 && (
          <div className="mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-7 w-7 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <p className="text-base font-medium text-slate-600">ابدأ بإضافة سؤال</p>
            <p className="mt-1 text-sm text-slate-400">اختر نوع السؤال من الأزرار أدناه</p>
          </div>
        )}

        <AddQuestionButton
          addQuestion={addQuestion}
          project={project}
          isCxMode={isCxMode}
          environmentId={localSurvey.environmentId}
          onImportFromForms={() => setImportDialogOpen(true)}
        />
      </div>

      <ImportFromFormsDialog
        open={importDialogOpen}
        setOpen={setImportDialogOpen}
        environmentId={localSurvey.environmentId}
        currentSurveyId={localSurvey.id}
        onAddQuestion={(q) => {
          addQuestion(q);
          setImportDialogOpen(false);
        }}
      />
    </div>
  );
};
