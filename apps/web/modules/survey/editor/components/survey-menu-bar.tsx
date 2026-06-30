"use client";

import { Project } from "@prisma/client";
import { useTranslate } from "@tolgee/react";
import { isEqual } from "lodash";
import { ArrowLeftIcon, BookmarkIcon, PaintbrushIcon, SettingsIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getLanguageLabel } from "@formbricks/i18n-utils/src/utils";
import { TSegment } from "@formbricks/types/segment";
import {
  TSurvey,
  TSurveyQuestion,
  ZSurvey,
  ZSurveyEndScreenCard,
  ZSurveyRedirectUrlCard,
} from "@formbricks/types/surveys/types";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { createSegmentAction } from "@/modules/ee/contacts/segments/actions";
import { deleteSurveyAction } from "@/modules/survey/list/actions";
import { Alert, AlertButton, AlertTitle } from "@/modules/ui/components/alert";
import { AlertDialog } from "@/modules/ui/components/alert-dialog";
import { updateSurveyAction } from "../actions";
import { isSurveyValid } from "../lib/validation";

interface SurveyMenuBarProps {
  localSurvey: TSurvey;
  survey: TSurvey;
  setLocalSurvey: (survey: TSurvey) => void;
  environmentId: string;
  setInvalidQuestions: React.Dispatch<React.SetStateAction<string[]>>;
  project: Project;
  responseCount: number;
  selectedLanguageCode: string;
  setSelectedLanguageCode: (selectedLanguage: string) => void;
  isCxMode: boolean;
  locale: string;
  setIsCautionDialogOpen: (open: boolean) => void;
  isStorageConfigured: boolean;
  showSettingsPanel: boolean;
  onToggleSettings: () => void;
  showDesignPanel: boolean;
  onToggleDesign: () => void;
  isStylingTabVisible: boolean;
  orgHasDefaultBanner: boolean;
}

export const SurveyMenuBar = ({
  localSurvey,
  survey,
  environmentId,
  setLocalSurvey,
  setInvalidQuestions,
  responseCount,
  selectedLanguageCode,
  isCxMode,
  locale,
  setIsCautionDialogOpen,
  isStorageConfigured = true,
  showSettingsPanel,
  onToggleSettings,
  showDesignPanel,
  onToggleDesign,
  isStylingTabVisible,
  orgHasDefaultBanner,
}: SurveyMenuBarProps) => {
  const { t } = useTranslate();
  const router = useRouter();
  const [audiencePrompt, setAudiencePrompt] = useState(true);
  const [isLinkSurvey, setIsLinkSurvey] = useState(true);
  const [isConfirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isSurveyPublishing, setIsSurveyPublishing] = useState(false);
  const [isSurveySaving, setIsSurveySaving] = useState(false);
  const [showSaveAsTemplateDialog, setShowSaveAsTemplateDialog] = useState(false);
  const [templateFormName, setTemplateFormName] = useState("");
  const [templateFormDesc, setTemplateFormDesc] = useState("");
  const [templateFormCategory, setTemplateFormCategory] = useState("استبيانات الرضا والجودة");

  useEffect(() => {
    if (audiencePrompt && showSettingsPanel) {
      setAudiencePrompt(false);
    }
  }, [showSettingsPanel, audiencePrompt]);

  useEffect(() => {
    setIsLinkSurvey(localSurvey.type === "link");
  }, [localSurvey.type]);

  useEffect(() => {
    const warningText = t("environments.surveys.edit.unsaved_changes_warning");
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (!isEqual(localSurvey, survey)) {
        e.preventDefault();
        return (e.returnValue = warningText);
      }
    };

    window.addEventListener("beforeunload", handleWindowClose);
    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
    };
  }, [localSurvey, survey, t]);

  const clearSurveyLocalStorage = () => {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(`${localSurvey.id}-columnOrder`);
      localStorage.removeItem(`${localSurvey.id}-columnVisibility`);
    }
  };

  const containsEmptyTriggers = useMemo(() => {
    if (localSurvey.type === "link") return false;

    const noTriggers = !localSurvey.triggers || localSurvey.triggers.length === 0 || !localSurvey.triggers[0];

    if (noTriggers) return true;

    return false;
  }, [localSurvey]);

  const disableSave = useMemo(() => {
    if (isSurveySaving) return true;

    if (localSurvey.status !== "draft" && containsEmptyTriggers) return true;
  }, [containsEmptyTriggers, isSurveySaving, localSurvey.status]);

  // True when this is a brand-new form that was never explicitly saved (no questions in DB yet)
  const isNewEmptyForm = survey.questions.length === 0;

  const handleDeleteAndGoBack = async () => {
    try {
      await deleteSurveyAction({ surveyId: localSurvey.id });
    } catch (_) {
      // ignore — just navigate away
    }
    router.push(`/environments/${environmentId}/surveys`);
  };

  const handleBack = () => {
    const { updatedAt, ...localSurveyRest } = localSurvey;
    const { updatedAt: _, ...surveyRest } = survey;

    if (isEqual(localSurveyRest, surveyRest) && isNewEmptyForm) {
      // New form, nothing changed — delete silently and go back
      handleDeleteAndGoBack();
    } else if (!isEqual(localSurveyRest, surveyRest)) {
      setConfirmDialogOpen(true);
    } else {
      router.back();
    }
  };

  const handleTemporarySegment = async () => {
    if (localSurvey.segment && localSurvey.type === "app" && localSurvey.segment?.id === "temp") {
      const { filters } = localSurvey.segment;

      // create a new private segment
      const newSegment = await createSegmentAction({
        environmentId: localSurvey.environmentId,
        filters,
        isPrivate: true,
        surveyId: localSurvey.id,
        title: localSurvey.id,
      });

      return newSegment?.data;
    }
  };

  const handleSegmentUpdate = async (): Promise<TSegment | null> => {
    if (localSurvey.segment && localSurvey.segment.id === "temp") {
      const segment = await handleTemporarySegment();
      return segment ?? null;
    }

    return localSurvey.segment;
  };

  const translateZodError = (msg: string): string => {
    const map: Record<string, string> = {
      "String must contain at least 1 character(s)": "هذا الحقل مطلوب",
      Required: "هذا الحقل مطلوب",
      "Invalid url": "رابط غير صالح",
      "Invalid email": "بريد إلكتروني غير صالح",
      "Survey must have at least one question": "يجب أن يحتوي الفورم على سؤال واحد على الأقل",
      "At least one question is required": "يجب إضافة سؤال واحد على الأقل",
    };
    return map[msg] ?? msg;
  };

  const validateSurveyWithZod = (): boolean => {
    // Check title first
    if (!localSurvey.name.trim()) {
      toast.error("يرجى إدخال عنوان للفورم قبل الحفظ أو النشر");
      return false;
    }

    const localSurveyValidation = ZSurvey.safeParse(localSurvey);
    if (!localSurveyValidation.success) {
      const currentError = localSurveyValidation.error.errors[0];

      if (currentError.path[0] === "questions") {
        const questionIdx = currentError.path[1];
        const question: TSurveyQuestion = localSurvey.questions[questionIdx];
        if (question) {
          setInvalidQuestions((prevInvalidQuestions) =>
            prevInvalidQuestions ? [...prevInvalidQuestions, question.id] : [question.id]
          );
        }
      } else if (currentError.path[0] === "welcomeCard") {
        setInvalidQuestions((prevInvalidQuestions) =>
          prevInvalidQuestions ? [...prevInvalidQuestions, "start"] : ["start"]
        );
      } else if (currentError.path[0] === "endings") {
        const endingIdx = typeof currentError.path[1] === "number" ? currentError.path[1] : -1;
        const ending = endingIdx >= 0 ? localSurvey.endings[endingIdx] : undefined;
        if (ending) {
          setInvalidQuestions((prevInvalidQuestions) =>
            prevInvalidQuestions ? [...prevInvalidQuestions, ending.id] : [ending.id]
          );
        }
      }

      if (currentError.code === "custom") {
        const params = currentError.params ?? ({} as { invalidLanguageCodes: string[] });
        if (params.invalidLanguageCodes && params.invalidLanguageCodes.length) {
          const invalidLanguageLabels = params.invalidLanguageCodes.map(
            (invalidLanguage: string) => getLanguageLabel(invalidLanguage, locale) ?? invalidLanguage
          );

          const messageSplit = currentError.message.split("-fLang-")[0];

          toast.error(`${translateZodError(messageSplit)} ${invalidLanguageLabels.join(", ")}`);
        } else {
          toast.error(translateZodError(currentError.message), {
            className: "w-fit !max-w-md",
          });
        }

        return false;
      }

      toast.error(translateZodError(currentError.message));
      return false;
    }

    return true;
  };

  const handleSurveySave = async (): Promise<boolean> => {
    setIsSurveySaving(true);

    const isSurveyValidatedWithZod = validateSurveyWithZod();

    if (!isSurveyValidatedWithZod) {
      setIsSurveySaving(false);
      return false;
    }

    try {
      const isSurveyValidResult = isSurveyValid(localSurvey, selectedLanguageCode, t, responseCount);
      if (!isSurveyValidResult) {
        setIsSurveySaving(false);
        return false;
      }

      localSurvey.questions = localSurvey.questions.map((question) => {
        const { isDraft, ...rest } = question;
        return rest;
      });

      localSurvey.endings = localSurvey.endings.map((ending) => {
        if (ending.type === "redirectToUrl") {
          return ZSurveyRedirectUrlCard.parse(ending);
        } else {
          return ZSurveyEndScreenCard.parse(ending);
        }
      });

      if (localSurvey.type !== "link" && !localSurvey.triggers?.length) {
        toast.error(t("environments.surveys.edit.please_set_a_survey_trigger"));
        setIsSurveySaving(false);
        return false;
      }

      const segment = await handleSegmentUpdate();
      clearSurveyLocalStorage();
      const updatedSurveyResponse = await updateSurveyAction({ ...localSurvey, segment });

      setIsSurveySaving(false);
      if (updatedSurveyResponse?.data) {
        setLocalSurvey(updatedSurveyResponse.data);
        toast.success(t("environments.surveys.edit.changes_saved"));
        router.refresh();
      } else {
        const errorMessage = getFormattedErrorMessage(updatedSurveyResponse);
        toast.error(errorMessage);
        return false;
      }

      return true;
    } catch (e) {
      console.error(e);
      setIsSurveySaving(false);
      toast.error(t("environments.surveys.edit.error_saving_changes"));
      return false;
    }
  };

  const handleSaveAndGoBack = async () => {
    const isSurveySaved = await handleSurveySave();
    if (isSurveySaved) {
      router.back();
    }
  };

  const handleSurveyPublish = async () => {
    setIsSurveyPublishing(true);

    try {
      const isSurveyValidatedWithZod = validateSurveyWithZod();
      if (!isSurveyValidatedWithZod) {
        setIsSurveyPublishing(false);
        return;
      }

      // Banner gate: must have a custom banner OR org default banner
      if (!localSurvey.bannerConfig && !orgHasDefaultBanner) {
        toast.error(
          "لا يمكن نشر النموذج بدون بانر. صمّم بانراً مخصصاً من الإعدادات، أو اطلب من المسؤول تعيين بانر افتراضي للجامعة.",
          { duration: 5000 }
        );
        setIsSurveyPublishing(false);
        return;
      }

      const isSurveyValidResult = isSurveyValid(localSurvey, selectedLanguageCode, t, responseCount);
      if (!isSurveyValidResult) {
        setIsSurveyPublishing(false);
        return;
      }

      // Strip isDraft from questions (same as handleSurveySave)
      const cleanQuestions = localSurvey.questions.map((question) => {
        const { isDraft, ...rest } = question;
        return rest;
      });

      const status = "inProgress";
      const segment = await handleSegmentUpdate();
      clearSurveyLocalStorage();

      const updatedSurveyResponse = await updateSurveyAction({
        ...localSurvey,
        questions: cleanQuestions,
        status,
        segment,
      });

      setIsSurveyPublishing(false);

      if (updatedSurveyResponse?.data) {
        toast.success("تم نشر الفورم بنجاح!");
        window.location.href = `/environments/${environmentId}/surveys/${localSurvey.id}/summary?success=true`;
      } else {
        const errorMessage = getFormattedErrorMessage(updatedSurveyResponse);
        toast.error(errorMessage || t("environments.surveys.edit.error_publishing_survey"));
      }
    } catch (error) {
      console.error("Publish error:", error);
      toast.error(t("environments.surveys.edit.error_publishing_survey"));
      setIsSurveyPublishing(false);
    }
  };

  const handleOpenSaveAsTemplate = () => {
    setTemplateFormName(localSurvey.name || "");
    setTemplateFormDesc("");
    setTemplateFormCategory("استبيانات الرضا والجودة");
    setShowSaveAsTemplateDialog(true);
  };

  const handleSaveAsTemplate = () => {
    if (!templateFormName.trim()) {
      toast.error("يرجى إدخال اسم للقالب");
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem("nust_custom_templates") ?? "[]");
      const newTemplate = {
        id: `ct_${Date.now()}`,
        name: templateFormName.trim(),
        description: templateFormDesc.trim(),
        category: templateFormCategory,
        savedAt: new Date().toISOString(),
        preset: {
          name: templateFormName.trim(),
          welcomeCard: localSurvey.welcomeCard,
          questions: localSurvey.questions,
          endings: localSurvey.endings,
          hiddenFields: localSurvey.hiddenFields,
        },
      };
      localStorage.setItem("nust_custom_templates", JSON.stringify([...existing, newTemplate]));
      setShowSaveAsTemplateDialog(false);
      toast.success("تم حفظ الفورم كقالب بنجاح");
    } catch (_) {
      toast.error("حدث خطأ أثناء حفظ القالب");
    }
  };

  return (
    <div
      className="relative flex items-center justify-between px-5 py-2.5"
      style={{ backgroundColor: "#1b335f", borderBottom: "1px solid #0f314c" }}
      dir="rtl">
      {/* Right side: back button */}
      <div className="flex h-full items-center gap-3">
        {!isCxMode && (
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
            <ArrowLeftIcon className="h-4 w-4 rotate-180" />
            رجوع
          </button>
        )}
      </div>

      {/* Center: form name + saved status */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2">
        <span className="max-w-sm truncate text-sm font-semibold text-white">
          {localSurvey.name || "فورم بدون عنوان"}
        </span>
        {!isEqual(localSurvey, survey) ? (
          <span className="text-xs text-white/50">· غير محفوظ</span>
        ) : (
          <span className="text-xs text-white/50">· محفوظ</span>
        )}
      </div>

      {/* Left side: settings toggle + alerts + action buttons */}
      <div className="flex items-center gap-2">
        {isStylingTabVisible && (
          <button
            type="button"
            onClick={onToggleDesign}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
            style={
              showDesignPanel
                ? { backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }
                : { color: "rgba(255,255,255,0.75)" }
            }>
            {showDesignPanel ? <XIcon className="h-4 w-4" /> : <PaintbrushIcon className="h-4 w-4" />}
            التصميم
          </button>
        )}
        <button
          type="button"
          onClick={onToggleSettings}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
          style={
            showSettingsPanel
              ? { backgroundColor: "rgba(255,255,255,0.2)", color: "#fff" }
              : { color: "rgba(255,255,255,0.75)" }
          }>
          {showSettingsPanel ? <XIcon className="h-4 w-4" /> : <SettingsIcon className="h-4 w-4" />}
          الإعدادات
        </button>
        {!isStorageConfigured && (
          <Alert variant="warning" size="small">
            <AlertTitle>{t("common.storage_not_configured")}</AlertTitle>
            <AlertButton className="flex items-center justify-center">
              <a
                className="flex h-full w-full items-center justify-center !bg-white"
                href="https://formbricks.com/docs/self-hosting/configuration/file-uploads"
                target="_blank"
                rel="noopener noreferrer">
                <span>{t("common.learn_more")}</span>
              </a>
            </AlertButton>
          </Alert>
        )}
        {responseCount > 0 && (
          <Alert variant="warning" size="small">
            <AlertTitle>{t("environments.surveys.edit.caution_text")}</AlertTitle>
            <AlertButton onClick={() => setIsCautionDialogOpen(true)}>{t("common.learn_more")}</AlertButton>
          </Alert>
        )}
        {!isCxMode && (
          <button
            type="button"
            onClick={handleOpenSaveAsTemplate}
            className="flex items-center gap-1.5 rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            title="حفظ كقالب">
            <BookmarkIcon className="h-4 w-4" />
            قالب
          </button>
        )}
        {!isCxMode && (
          <button
            type="button"
            disabled={!!disableSave}
            onClick={() => handleSurveySave()}
            className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50">
            {isSurveySaving ? "..." : "حفظ"}
          </button>
        )}
        {localSurvey.status !== "draft" && (
          <button
            type="button"
            disabled={!!disableSave}
            onClick={() => handleSaveAndGoBack()}
            className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50">
            {isSurveySaving ? "..." : "حفظ وإغلاق"}
          </button>
        )}
        {localSurvey.status === "draft" && audiencePrompt && !isLinkSurvey && (
          <button
            type="button"
            onClick={() => {
              setAudiencePrompt(false);
              onToggleSettings();
            }}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#1b335f] transition-colors hover:opacity-90"
            style={{ backgroundColor: "#f4bf00" }}>
            متابعة للإعدادات
          </button>
        )}
        {localSurvey.status === "draft" && (!audiencePrompt || isLinkSurvey) && (
          <button
            type="button"
            disabled={isSurveySaving || containsEmptyTriggers}
            onClick={handleSurveyPublish}
            className="rounded-md px-3 py-1.5 text-sm font-semibold text-[#1b335f] transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#f4bf00" }}>
            {isSurveyPublishing ? "..." : isCxMode ? "حفظ وإغلاق" : "نشر"}
          </button>
        )}
      </div>
      <AlertDialog
        headerText={t("environments.surveys.edit.confirm_survey_changes")}
        open={isConfirmDialogOpen}
        setOpen={setConfirmDialogOpen}
        mainText={t("environments.surveys.edit.unsaved_changes_warning")}
        confirmBtnLabel={t("common.save")}
        declineBtnLabel={t("common.discard")}
        declineBtnVariant="destructive"
        onDecline={() => {
          setConfirmDialogOpen(false);
          if (isNewEmptyForm) {
            handleDeleteAndGoBack();
          } else {
            router.back();
          }
        }}
        onConfirm={handleSaveAndGoBack}
      />

      {/* Save as Template dialog */}
      {showSaveAsTemplateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" dir="rtl">
          <div
            className="w-full max-w-sm rounded-2xl bg-white shadow-xl"
            style={{ border: "1px solid #e2e8f0" }}>
            <div
              className="flex items-center justify-between rounded-t-2xl px-5 py-4"
              style={{ backgroundColor: "#1b335f" }}>
              <h2 className="text-base font-bold text-white">حفظ كقالب</h2>
              <button
                onClick={() => setShowSaveAsTemplateDialog(false)}
                className="text-white/70 hover:text-white">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  اسم القالب <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={templateFormName}
                  onChange={(e) => setTemplateFormName(e.target.value)}
                  placeholder="مثال: استبيان رضا الطلاب"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1b335f]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">وصف مختصر</label>
                <textarea
                  value={templateFormDesc}
                  onChange={(e) => setTemplateFormDesc(e.target.value)}
                  placeholder="اشرح الغرض من هذا القالب..."
                  rows={2}
                  className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1b335f]"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">التصنيف</label>
                <select
                  value={templateFormCategory}
                  onChange={(e) => setTemplateFormCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1b335f]">
                  <option>استبيانات الرضا والجودة</option>
                  <option>استبيانات الموظفين</option>
                  <option>ملاحظات ومقترحات</option>
                  <option>تطوير وتخطيط</option>
                  <option>أخرى</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveAsTemplate}
                  className="flex-1 rounded-lg py-2 text-sm font-semibold text-[#1b335f] transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#f4bf00" }}>
                  حفظ كقالب
                </button>
                <button
                  onClick={() => setShowSaveAsTemplateDialog(false)}
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
