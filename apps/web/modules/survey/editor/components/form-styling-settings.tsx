"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useTranslate } from "@tolgee/react";
import { CheckIcon, SparklesIcon } from "lucide-react";
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { TProjectStyling } from "@formbricks/types/project";
import { TSurveyStyling } from "@formbricks/types/surveys/types";
import { cn } from "@/lib/cn";
import { COLOR_DEFAULTS } from "@/lib/styling/constants";
import { mixColor } from "@/lib/utils/colors";
import { Button } from "@/modules/ui/components/button";
import { ColorPicker } from "@/modules/ui/components/color-picker";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/modules/ui/components/form";

type FormStylingSettingsProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isSettingsPage?: boolean;
  disabled?: boolean;
  form: UseFormReturn<TProjectStyling | TSurveyStyling>;
};

export const FormStylingSettings = ({
  open,
  isSettingsPage = false,
  disabled = false,
  setOpen,
  form,
}: FormStylingSettingsProps) => {
  const { t } = useTranslate();
  const brandColor = form.watch("brandColor.light") || COLOR_DEFAULTS.brandColor;
  const background = form.watch("background");
  const highlightBorderColor = form.watch("highlightBorderColor");

  const setQuestionColor = (color: string) => form.setValue("questionColor.light", color);
  const setInputColor = (color: string) => form.setValue("inputColor.light", color);
  const setInputBorderColor = (color: string) => form.setValue("inputBorderColor.light", color);
  const setCardBackgroundColor = (color: string) => form.setValue("cardBackgroundColor.light", color);
  const setCardBorderColor = (color: string) => form.setValue("cardBorderColor.light", color);

  const setBackgroundColor = (color: string) => {
    form.setValue("background", {
      bg: color,
      bgType: "color",
    });
  };
  const setHighlightBorderColor = (color: string) => {
    form.setValue("highlightBorderColor", { light: mixColor(color, "#ffffff", 0.25) });
  };

  const suggestColors = () => {
    // mix the brand color with different weights of white and set the result as the other colors
    setQuestionColor(mixColor(brandColor, "#000000", 0.35));
    setInputColor(mixColor(brandColor, "#ffffff", 0.92));
    setInputBorderColor(mixColor(brandColor, "#ffffff", 0.6));

    setCardBackgroundColor(mixColor(brandColor, "#ffffff", 0.97));
    setCardBorderColor(mixColor(brandColor, "#ffffff", 0.8));

    if (!background || background?.bgType === "color") {
      setBackgroundColor(mixColor(brandColor, "#ffffff", 0.855));
    }

    if (highlightBorderColor) {
      setHighlightBorderColor(brandColor);
    }
  };

  const [parent] = useAutoAnimate();

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={(openState) => {
        if (disabled) return;
        setOpen(openState);
      }}
      className="w-full rounded-lg border border-slate-300 bg-white">
      <Collapsible.CollapsibleTrigger
        asChild
        disabled={disabled}
        className={cn(
          "w-full cursor-pointer rounded-lg hover:bg-slate-50",
          disabled && "cursor-not-allowed opacity-60 hover:bg-white"
        )}>
        <div className="inline-flex px-4 py-4">
          {!isSettingsPage && (
            <div className="flex items-center pl-2 pr-5">
              <CheckIcon
                strokeWidth={3}
                className="h-7 w-7 rounded-full border border-green-300 bg-green-100 p-1.5 text-green-600"
              />
            </div>
          )}

          <div>
            <p className={cn("font-semibold text-slate-800", isSettingsPage ? "text-sm" : "text-base")}>
              {t("environments.surveys.edit.form_styling")}
            </p>
            <p className={cn("mt-1 text-slate-500", isSettingsPage ? "text-xs" : "text-sm")}>
              {t("environments.surveys.edit.style_the_question_texts_descriptions_and_input_fields")}
            </p>
          </div>
        </div>
      </Collapsible.CollapsibleTrigger>

      <Collapsible.CollapsibleContent className="flex flex-col" ref={parent}>
        <hr className="py-1 text-slate-600" />

        <div className="flex flex-col gap-6 p-6 pt-2">
          <div className="flex flex-col gap-2">
            <FormField
              control={form.control}
              name="brandColor.light"
              render={({ field }) => (
                <FormItem className="space-y-4">
                  <div>
                    <FormLabel>{t("environments.surveys.edit.brand_color")}</FormLabel>
                    <FormDescription>
                      {t("environments.surveys.edit.change_the_brand_color_of_the_survey")}
                    </FormDescription>
                  </div>

                  <FormControl>
                    <ColorPicker
                      color={field.value || COLOR_DEFAULTS.brandColor}
                      onChange={(color) => field.onChange(color)}
                      containerClass="max-w-xs"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-fit"
              onClick={() => suggestColors()}>
              {t("environments.surveys.edit.suggest_colors")}
              <SparklesIcon />
            </Button>
          </div>

          <FormField
            control={form.control}
            name="questionColor.light"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div>
                  <FormLabel>{t("environments.surveys.edit.question_color")}</FormLabel>
                  <FormDescription>
                    {t("environments.surveys.edit.change_the_question_color_of_the_survey")}
                  </FormDescription>
                </div>

                <FormControl>
                  <ColorPicker
                    color={field.value || COLOR_DEFAULTS.questionColor}
                    onChange={(color) => field.onChange(color)}
                    containerClass="max-w-xs"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inputColor.light"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div>
                  <FormLabel>{t("environments.surveys.edit.input_color")}</FormLabel>
                  <FormDescription>
                    {t("environments.surveys.edit.change_the_background_color_of_the_input_fields")}
                  </FormDescription>
                </div>

                <FormControl>
                  <ColorPicker
                    color={field.value || COLOR_DEFAULTS.inputColor}
                    onChange={(color: string) => field.onChange(color)}
                    containerClass="max-w-xs"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inputBorderColor.light"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div>
                  <FormLabel>{t("environments.surveys.edit.input_border_color")}</FormLabel>
                  <FormDescription>
                    {t("environments.surveys.edit.change_the_border_color_of_the_input_fields")}
                  </FormDescription>
                </div>

                <FormControl>
                  <ColorPicker
                    color={field.value || COLOR_DEFAULTS.inputBorderColor}
                    onChange={(color: string) => field.onChange(color)}
                    containerClass="max-w-xs"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cardBackgroundColor.light"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div>
                  <FormLabel>لون خلفية بطاقة السؤال</FormLabel>
                  <FormDescription>لون خلفية كل بطاقة سؤال في النموذج</FormDescription>
                </div>
                <FormControl>
                  <ColorPicker
                    color={field.value || "#ffffff"}
                    onChange={(color: string) => field.onChange(color)}
                    containerClass="max-w-xs"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roundness"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div>
                  <FormLabel>استدارة الحواف</FormLabel>
                  <FormDescription>تحكم في درجة استدارة حواف بطاقات الأسئلة وحقول الإدخال</FormDescription>
                </div>
                <FormControl>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={24}
                      step={1}
                      value={field.value ?? 12}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-40"
                    />
                    <span className="w-10 text-sm font-medium text-slate-700">{field.value ?? 12}px</span>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={"questionFontSize" as keyof (TProjectStyling | TSurveyStyling)}
            render={({ field }) => (
              <FormItem className="space-y-3">
                <div>
                  <FormLabel>حجم خط الأسئلة</FormLabel>
                  <FormDescription>حجم نص السؤال في النموذج (من 10 إلى 32)</FormDescription>
                </div>
                <FormControl>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={10}
                      max={32}
                      step={1}
                      value={(field.value as number) ?? 15}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className="w-40"
                    />
                    <span className="w-10 text-sm font-medium text-slate-700">
                      {(field.value as number) ?? 15}px
                    </span>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Banner title bar colors */}
          <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-600">شريط عنوان البانر</p>

            <FormField
              control={form.control}
              name={"bannerTitleBg" as keyof (TProjectStyling | TSurveyStyling)}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs">لون خلفية الشريط</FormLabel>
                  <FormControl>
                    <ColorPicker
                      color={(field.value as string) || "#1b335f"}
                      onChange={(color: string) => field.onChange(color)}
                      containerClass="max-w-xs"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={"bannerTitleTextColor" as keyof (TProjectStyling | TSurveyStyling)}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs">لون عنوان النموذج</FormLabel>
                  <FormControl>
                    <ColorPicker
                      color={(field.value as string) || "#ffffff"}
                      onChange={(color: string) => field.onChange(color)}
                      containerClass="max-w-xs"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={"bannerSubtitleColor" as keyof (TProjectStyling | TSurveyStyling)}
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-xs">لون اسم القسم / المنظمة</FormLabel>
                  <FormControl>
                    <ColorPicker
                      color={(field.value as string) || "#f4bf00"}
                      onChange={(color: string) => field.onChange(color)}
                      containerClass="max-w-xs"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </Collapsible.CollapsibleContent>
    </Collapsible.Root>
  );
};
