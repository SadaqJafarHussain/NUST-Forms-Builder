"use client";

import { useTranslate } from "@tolgee/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { TEnvironment } from "@formbricks/types/environment";
import { TResponse, TResponseWithQuotas } from "@formbricks/types/responses";
import { TSurvey } from "@formbricks/types/surveys/types";
import { TTag } from "@formbricks/types/tags";
import { TUser, TUserLocale } from "@formbricks/types/user";
import { DecrementQuotasCheckbox } from "@/modules/ui/components/decrement-quotas-checkbox";
import { DeleteDialog } from "@/modules/ui/components/delete-dialog";
import { deleteResponseAction } from "./actions";
// Tags functionality removed - ResponseTagsWrapper and getResponseAction no longer needed
import { SingleResponseCardBody } from "./components/SingleResponseCardBody";
import { SingleResponseCardHeader } from "./components/SingleResponseCardHeader";
import { isValidValue } from "./util";

interface SingleResponseCardProps {
  survey: TSurvey;
  response: TResponseWithQuotas;
  user?: TUser;
  environmentTags?: TTag[]; // Optional - Tags functionality removed
  environment: TEnvironment;
  updateResponse?: (responseId: string, responses: TResponse) => void; // Kept for interface compatibility
  updateResponseList?: (responseIds: string[]) => void;
  isReadOnly: boolean;
  setSelectedResponseId?: (responseId: string | null) => void;
  locale: TUserLocale;
}

export const SingleResponseCard = ({
  survey,
  response,
  user,
  // environmentTags and updateResponse removed - Tags functionality not needed
  environment,
  updateResponseList,
  isReadOnly,
  setSelectedResponseId,
  locale,
}: SingleResponseCardProps) => {
  const hasQuotas = (response.quotas && response.quotas.length > 0) ?? false;
  const [decrementQuotas, setDecrementQuotas] = useState(hasQuotas);
  const { t } = useTranslate();
  // environmentId removed - was only used for tags
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  let skippedQuestions: string[][] = [];
  let temp: string[] = [];

  if (response.finished) {
    survey.questions.forEach((question) => {
      if (!isValidValue(response.data[question.id])) {
        temp.push(question.id);
      } else if (temp.length > 0) {
        skippedQuestions.push([...temp]);
        temp = [];
      }
    });
  } else {
    for (let index = survey.questions.length - 1; index >= 0; index--) {
      const question = survey.questions[index];
      if (
        !response.data[question.id] &&
        (skippedQuestions.length === 0 ||
          (skippedQuestions.length > 0 && !isValidValue(response.data[question.id])))
      ) {
        temp.push(question.id);
      } else if (temp.length > 0) {
        temp.reverse();
        skippedQuestions.push([...temp]);
        temp = [];
      }
    }
  }
  // Handle the case where the last entries are empty
  if (temp.length > 0) {
    skippedQuestions.push(temp);
  }

  const handleDeleteResponse = async () => {
    setIsDeleting(true);
    try {
      if (isReadOnly) {
        throw new Error(t("common.not_authorized"));
      }
      await deleteResponseAction({ responseId: response.id, decrementQuotas });
      updateResponseList?.([response.id]);
      router.refresh();
      if (setSelectedResponseId) setSelectedResponseId(null);
      toast.success(t("environments.surveys.responses.response_deleted_successfully"));
      setDeleteDialogOpen(false);
    } catch (error) {
      if (error instanceof Error) toast.error(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // updateFetchedResponses removed - was only used for tags

  return (
    <div className="group relative">
      <div className="relative z-20 my-6 rounded-xl border border-slate-200 bg-white shadow-sm transition-all">
        <SingleResponseCardHeader
          pageType="response"
          response={response}
          survey={survey}
          environment={environment}
          user={user}
          isReadOnly={isReadOnly}
          setDeleteDialogOpen={setDeleteDialogOpen}
          locale={locale}
        />

        <SingleResponseCardBody survey={survey} response={response} skippedQuestions={skippedQuestions} />

        {/* ResponseTagsWrapper removed - Tags functionality not needed */}

        <DeleteDialog
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          deleteWhat={t("common.response")}
          onDelete={handleDeleteResponse}
          isDeleting={isDeleting}
          text={t("environments.surveys.responses.delete_response_confirmation")}>
          {hasQuotas && (
            <DecrementQuotasCheckbox
              title={t("environments.surveys.responses.delete_response_quotas")}
              checked={decrementQuotas}
              onCheckedChange={setDecrementQuotas}
            />
          )}
        </DeleteDialog>
      </div>
    </div>
  );
};
