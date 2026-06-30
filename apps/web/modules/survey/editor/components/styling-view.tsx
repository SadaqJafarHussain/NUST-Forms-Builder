"use client";

import { Project } from "@prisma/client";
import { useTranslate } from "@tolgee/react";
import { LayoutTemplateIcon, PencilIcon, RotateCcwIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { UseFormReturn, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { TProjectStyling } from "@formbricks/types/project";
import { TSurvey, TSurveyStyling } from "@formbricks/types/surveys/types";
import { defaultStyling } from "@/lib/styling/constants";
import { BannerDesigner } from "@/modules/survey/editor/components/banner-designer";
import { FormStylingSettings } from "@/modules/survey/editor/components/form-styling-settings";
import { AlertDialog } from "@/modules/ui/components/alert-dialog";
import { BackgroundStylingCard } from "@/modules/ui/components/background-styling-card";
import { Button } from "@/modules/ui/components/button";
import { CardStylingSettings } from "@/modules/ui/components/card-styling-settings";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormProvider,
} from "@/modules/ui/components/form";
import { Switch } from "@/modules/ui/components/switch";

interface StylingViewProps {
  environmentId: string;
  project: Project;
  localSurvey: TSurvey;
  setLocalSurvey: React.Dispatch<React.SetStateAction<TSurvey>>;
  colors: string[];
  styling: TSurveyStyling | null;
  setStyling: React.Dispatch<React.SetStateAction<TSurveyStyling | null>>;
  localStylingChanges: TSurveyStyling | null;
  setLocalStylingChanges: React.Dispatch<React.SetStateAction<TSurveyStyling | null>>;
  isUnsplashConfigured: boolean;
  isCxMode: boolean;
  isStorageConfigured: boolean;
}

export const StylingView = ({
  colors,
  environmentId,
  project,
  localSurvey,
  setLocalSurvey,
  setStyling,
  styling,
  localStylingChanges,
  setLocalStylingChanges,
  isUnsplashConfigured,
  isCxMode,
  isStorageConfigured = true,
}: StylingViewProps) => {
  const { t } = useTranslate();

  const form = useForm<TSurveyStyling>({
    defaultValues: { ...defaultStyling, ...project.styling, ...localSurvey.styling },
  });

  const overwriteThemeStyling = form.watch("overwriteThemeStyling");
  const setOverwriteThemeStyling = (value: boolean) => form.setValue("overwriteThemeStyling", value);

  const [formStylingOpen, setFormStylingOpen] = useState(false);
  const [cardStylingOpen, setCardStylingOpen] = useState(false);
  const [stylingOpen, setStylingOpen] = useState(false);
  const [confirmResetStylingModalOpen, setConfirmResetStylingModalOpen] = useState(false);

  const onResetThemeStyling = () => {
    const { allowStyleOverwrite, ...baseStyling } = project.styling ?? {};

    setStyling({
      ...baseStyling,
      overwriteThemeStyling: true,
    });

    form.reset({
      ...baseStyling,
      overwriteThemeStyling: true,
    });

    setConfirmResetStylingModalOpen(false);
    toast.success(t("environments.surveys.edit.styling_set_to_theme_styles"));
  };

  useEffect(() => {
    if (!overwriteThemeStyling) {
      setFormStylingOpen(false);
      setCardStylingOpen(false);
      setStylingOpen(false);
    }
  }, [overwriteThemeStyling]);

  useEffect(() => {
    const subscription = form.watch((data: TSurveyStyling) => {
      setLocalSurvey((prev) => ({
        ...prev,
        styling: {
          ...prev.styling,
          ...data,
        },
      }));
    });

    return () => subscription.unsubscribe();
  }, [form, setLocalSurvey]);

  const defaultProjectStyling = useMemo(() => {
    const { styling: projectStyling } = project;
    const { allowStyleOverwrite, ...baseStyling } = projectStyling ?? {};

    return baseStyling;
  }, [project]);

  const handleOverwriteToggle = (value: boolean) => {
    // survey styling from the server is surveyStyling, it could either be set or not
    // if its set and the toggle is turned off, we set the local styling to the server styling

    setOverwriteThemeStyling(value);

    // if the toggle is turned on, we set the local styling to the project styling
    if (value) {
      if (!styling) {
        // copy the project styling to the survey styling
        setStyling({
          ...defaultProjectStyling,
          overwriteThemeStyling: true,
        });
        return;
      }

      // if there are local styling changes, we set the styling to the local styling changes that were previously stored
      if (localStylingChanges) {
        setStyling(localStylingChanges);
      }
      // if there are no local styling changes, we set the styling to the project styling
      else {
        setStyling({
          ...defaultProjectStyling,
          overwriteThemeStyling: true,
        });
      }
    }

    // if the toggle is turned off, we store the local styling changes and set the styling to the project styling
    else {
      // copy the styling to localStylingChanges
      setLocalStylingChanges(styling);

      // copy the project styling to the survey styling
      setStyling({
        ...defaultProjectStyling,
        overwriteThemeStyling: false,
      });
    }
  };

  const isOnePage = localSurvey.isOnePage ?? true;
  const hasBanner = !!localSurvey.bannerConfig;

  return (
    <FormProvider {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-3 p-4" dir="rtl">
          {/* ── Banner Designer Card ── */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {/* Label row */}
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <p className="text-sm font-semibold text-slate-800">بانر النموذج</p>
              {hasBanner ? (
                <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  مصمم
                </span>
              ) : (
                <span className="text-xs text-slate-400">غير مصمم</span>
              )}
            </div>

            {/* Clickable preview area */}
            <div className="px-4 pb-4">
              <BannerDesigner
                config={localSurvey.bannerConfig ?? null}
                onChange={(bannerConfig) => setLocalSurvey((prev) => ({ ...prev, bannerConfig }))}
                environmentId={environmentId}
                trigger={
                  <div
                    className="group relative w-full cursor-pointer overflow-hidden rounded-xl"
                    style={{ height: 88 }}>
                    {hasBanner ? (
                      <>
                        {/* Color strip from banner background */}
                        <div
                          className="absolute inset-0"
                          style={{
                            background:
                              localSurvey.bannerConfig?.backgroundGradient ??
                              localSurvey.bannerConfig?.backgroundColor ??
                              "#1b335f",
                          }}
                        />
                        {/* Abstract element dots representing content */}
                        <div className="absolute inset-0 flex flex-col items-end justify-center gap-2 px-5 opacity-60">
                          {localSurvey.bannerConfig!.elements.slice(0, 3).map((el) => (
                            <div
                              key={el.id}
                              className="h-2 rounded-full bg-white/50"
                              style={{ width: el.type === "text" ? 80 : el.type === "image" ? 32 : 60 }}
                            />
                          ))}
                          {localSurvey.bannerConfig!.elements.length === 0 && (
                            <p className="text-xs text-white/50">بانر فارغ</p>
                          )}
                        </div>
                        {/* Element count badge */}
                        <div className="absolute bottom-2 left-2 rounded-md bg-black/30 px-1.5 py-0.5 text-xs text-white/80 backdrop-blur-sm">
                          {localSurvey.bannerConfig!.elements.length} عنصر
                        </div>
                      </>
                    ) : (
                      /* Empty state */
                      <div
                        className="flex h-full flex-col items-center justify-center gap-1.5 transition-colors group-hover:bg-slate-100"
                        style={{
                          background:
                            "repeating-linear-gradient(135deg, #f1f5f9 0px, #f1f5f9 10px, #e8edf5 10px, #e8edf5 20px)",
                          border: "2px dashed #cbd5e1",
                          borderRadius: 12,
                        }}>
                        <LayoutTemplateIcon className="h-5 w-5 text-slate-400" />
                        <p className="text-xs font-medium text-slate-500">انقر لتصميم البانر</p>
                      </div>
                    )}

                    {/* Hover edit overlay (only when banner exists) */}
                    {hasBanner && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-all group-hover:bg-black/30">
                        <div className="flex items-center gap-1.5 rounded-lg bg-white/0 px-3 py-1.5 text-sm font-semibold text-white opacity-0 transition-all group-hover:bg-white/20 group-hover:opacity-100">
                          <PencilIcon className="h-3.5 w-3.5" />
                          تعديل البانر
                        </div>
                      </div>
                    )}
                  </div>
                }
              />

              {/* Delete link */}
              {hasBanner && (
                <button
                  type="button"
                  onClick={() => setLocalSurvey((prev) => ({ ...prev, bannerConfig: null }))}
                  className="mt-2 flex items-center gap-1 text-xs text-red-400 transition-colors hover:text-red-600">
                  <Trash2Icon className="h-3 w-3" />
                  حذف البانر
                </button>
              )}
            </div>
          </div>

          {/* Mode indicator banner */}
          <div className="overflow-hidden rounded-xl" style={{ border: "1px solid #dbe4f0" }}>
            <div className="h-1 w-full" style={{ backgroundColor: "#1b335f" }} />
            <div className="px-4 py-3" style={{ background: "linear-gradient(135deg, #eef2f9, #f8fafc)" }}>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#1b335f" }} />
                <p className="text-sm font-semibold" style={{ color: "#1b335f" }}>
                  {isOnePage ? "تصميم: صفحة واحدة" : "تصميم: استبيان تدريجي"}
                </p>
              </div>
              <p className="mt-1 pr-5 text-xs text-slate-500">
                {isOnePage
                  ? "خيارات التصميم المتاحة لنموذج الصفحة الواحدة — الألوان وتنسيق الحقول"
                  : "خيارات التصميم الكاملة — الألوان والبطاقات والخلفية"}
              </p>
            </div>
          </div>

          {/* Custom styles toggle */}
          {!isCxMode && (
            <div className="rounded-xl bg-white px-4 py-4" style={{ border: "1px solid #dbe4f0" }}>
              <FormField
                control={form.control}
                name="overwriteThemeStyling"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Switch checked={!!field.value} onCheckedChange={handleOverwriteToggle} />
                    </FormControl>
                    <div>
                      <FormLabel className="text-sm font-semibold text-slate-800">
                        {t("environments.surveys.edit.add_custom_styles")}
                      </FormLabel>
                      <FormDescription className="text-xs text-slate-500">
                        {t("environments.surveys.edit.override_theme_with_individual_styles_for_this_survey")}
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Form styling — both modes */}
          <div>
            <p className="mb-1.5 pr-1 text-xs font-medium text-slate-400">يُطبَّق على كلا الوضعين</p>
            <FormStylingSettings
              open={formStylingOpen}
              setOpen={setFormStylingOpen}
              disabled={!overwriteThemeStyling}
              form={form as UseFormReturn<TProjectStyling | TSurveyStyling>}
            />
          </div>

          {/* Card styling + Background — multi-page only */}
          {!isOnePage && (
            <div className="space-y-3">
              <p className="pr-1 text-xs font-medium text-slate-400">خاص بالاستبيان التدريجي فقط</p>
              <CardStylingSettings
                open={cardStylingOpen}
                setOpen={setCardStylingOpen}
                surveyType={localSurvey.type}
                disabled={!overwriteThemeStyling}
                project={project}
                form={form as UseFormReturn<TProjectStyling | TSurveyStyling>}
              />
              {localSurvey.type === "link" && (
                <BackgroundStylingCard
                  open={stylingOpen}
                  setOpen={setStylingOpen}
                  environmentId={environmentId}
                  colors={colors}
                  disabled={!overwriteThemeStyling}
                  isUnsplashConfigured={isUnsplashConfigured}
                  form={form as UseFormReturn<TProjectStyling | TSurveyStyling>}
                  isStorageConfigured={isStorageConfigured}
                />
              )}
            </div>
          )}

          {/* One-page notice */}
          {isOnePage && (
            <div
              className="flex items-start gap-3 rounded-xl px-4 py-3"
              style={{ backgroundColor: "#f0f4fa", border: "1px solid #c7d4e8" }}>
              <div className="mt-0.5 shrink-0 text-base">ℹ️</div>
              <div>
                <p className="text-xs font-semibold" style={{ color: "#1b335f" }}>
                  تصميم البطاقة والخلفية غير متاح
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  خيارات ترتيب البطاقة وخلفية الصفحة تُطبَّق فقط على وضع الاستبيان التدريجي. غيّر وضع الفورم
                  من تبويب الإعدادات لتفعيلها.
                </p>
              </div>
            </div>
          )}

          {/* Footer actions */}
          {!isCxMode && (
            <div className="flex items-center justify-between pt-2">
              {overwriteThemeStyling && (
                <Button
                  type="button"
                  variant="ghost"
                  className="flex items-center gap-2 text-xs"
                  onClick={() => setConfirmResetStylingModalOpen(true)}>
                  <RotateCcwIcon className="h-3.5 w-3.5" />
                  {t("environments.surveys.edit.reset_to_theme_styles")}
                </Button>
              )}
              <p className="mr-auto text-xs text-slate-400">
                <Link
                  href={`/environments/${environmentId}/project/look`}
                  target="_blank"
                  className="underline hover:text-slate-600">
                  {t("common.look_and_feel")}
                </Link>
              </p>
            </div>
          )}

          <AlertDialog
            open={confirmResetStylingModalOpen}
            setOpen={setConfirmResetStylingModalOpen}
            headerText={t("environments.surveys.edit.reset_to_theme_styles")}
            mainText={t("environments.surveys.edit.reset_to_theme_styles_main_text")}
            confirmBtnLabel={t("common.confirm")}
            onDecline={() => setConfirmResetStylingModalOpen(false)}
            onConfirm={onResetThemeStyling}
          />
        </div>
      </form>
    </FormProvider>
  );
};
