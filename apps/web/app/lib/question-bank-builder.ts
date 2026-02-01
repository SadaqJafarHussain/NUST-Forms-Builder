// Create this file: apps/web/app/lib/question-bank-builder.ts
import { createId } from "@paralleldrive/cuid2";
import {
  TSurveyOpenTextQuestionInputType,
  TSurveyQuestion,
  TSurveyQuestionTypeEnum,
  TSurveyRatingQuestion,
} from "@formbricks/types/surveys/types";
import { createI18nString } from "@/lib/i18n/utils";

const TYPE_MAP: Record<string, string> = {
  "نص حر": "openText",
  "اختيار واحد": "multipleChoiceSingle",
  "اختيار متعدد": "multipleChoiceMulti",
  "اختيار الصور": "pictureSelection",
  التقييم: "rating",
  NPS: "nps",
  الترتيب: "ranking",
  المصفوفة: "matrix",
  بيان: "cta",
  الموافقة: "consent",
  "رفع الملفات": "fileUpload",
  التاريخ: "date",
  "جدولة اجتماع": "cal",
  العنوان: "address",
  "معلومات الاتصال": "contactInfo",
};

const INPUT_TYPE_MAP: Record<string, TSurveyOpenTextQuestionInputType> = {
  نص: "text",
  "بريد إلكتروني": "email",
  رابط: "url",
  رقم: "number",
  هاتف: "phone",
  text: "text",
  email: "email",
  url: "url",
  number: "number",
  phone: "phone",
};

const SCALE_MAP: Record<string, TSurveyRatingQuestion["scale"]> = {
  نجمة: "star",
  نجوم: "star",
  رقم: "number",
  أرقام: "number",
  وجه: "smiley",
  وجوه: "smiley",
  star: "star",
  number: "number",
  smiley: "smiley",
};

const getString = (obj: any, ...keys: string[]): string => {
  for (const key of keys) {
    if (obj[key]) return String(obj[key]);
  }
  return "";
};

const getBoolean = (obj: any, ...keys: string[]): boolean => {
  for (const key of keys) {
    if (obj[key] !== undefined) {
      const val = obj[key];
      if (typeof val === "boolean") return val;
      if (typeof val === "string") {
        return val === "true" || val === "نعم" || val === "yes";
      }
    }
  }
  return false;
};

const getNumber = (obj: any, ...keys: string[]): number | undefined => {
  for (const key of keys) {
    if (obj[key] !== undefined) {
      const num = Number(obj[key]);
      if (!isNaN(num)) return num;
    }
  }
  return undefined;
};

export const convertExcelQuestionToFormbricks = (excelQuestion: any): TSurveyQuestion => {
  const questionId = createId();
  const typeArabic = getString(excelQuestion, "type", "النوع");
  const type = TYPE_MAP[typeArabic] || typeArabic;
  const headline = getString(excelQuestion, "headline", "السؤال", "العنوان");
  const subheader = getString(excelQuestion, "subheader", "وصف");
  const required = getBoolean(excelQuestion, "required", "إجباري");

  switch (type) {
    case "openText": {
      const inputTypeStr = getString(excelQuestion, "inputType", "نوع الإدخال") || "text";
      const inputType = INPUT_TYPE_MAP[inputTypeStr] || "text";
      const placeholderText = getString(excelQuestion, "placeholder", "النص التوضيحي");

      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.OpenText,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        placeholder: placeholderText ? createI18nString(placeholderText, []) : undefined,
        required,
        inputType,
        longAnswer: getBoolean(excelQuestion, "longAnswer", "إجابة طويلة"),
        charLimit: { enabled: false },
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "rating": {
      const scaleStr = getString(excelQuestion, "scale", "المقياس") || "star";
      const scale = SCALE_MAP[scaleStr] || "star";
      const rangeNum = getNumber(excelQuestion, "range", "النطاق") || 5;
      const range = rangeNum as 3 | 4 | 5 | 7 | 10;
      const lowerText = getString(excelQuestion, "lowerLabel", "التسمية السفلى");
      const upperText = getString(excelQuestion, "upperLabel", "التسمية العليا");

      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.Rating,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        scale,
        range,
        lowerLabel: lowerText ? createI18nString(lowerText, []) : createI18nString("ليس جيداً", []),
        upperLabel: upperText ? createI18nString(upperText, []) : createI18nString("جيد جداً", []),
        isColorCodingEnabled: false,
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "nps": {
      const lowerText = getString(excelQuestion, "lowerLabel", "التسمية السفلى");
      const upperText = getString(excelQuestion, "upperLabel", "التسمية العليا");

      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.NPS,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        lowerLabel: lowerText ? createI18nString(lowerText, []) : createI18nString("غير محتمل", []),
        upperLabel: upperText ? createI18nString(upperText, []) : createI18nString("محتمل جداً", []),
        isColorCodingEnabled: true,
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "multipleChoiceSingle":
    case "multipleChoiceMulti": {
      const choicesStr = getString(excelQuestion, "choices", "الخيارات");
      const choices = choicesStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      return {
        id: questionId,
        type:
          type === "multipleChoiceSingle"
            ? TSurveyQuestionTypeEnum.MultipleChoiceSingle
            : TSurveyQuestionTypeEnum.MultipleChoiceMulti,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        choices: choices.map((choice) => ({
          id: createId(),
          label: createI18nString(choice, []),
        })),
        shuffleOption: "none",
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "pictureSelection": {
      const choicesStr = getString(excelQuestion, "choices", "الخيارات");
      const imageUrls = choicesStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.PictureSelection,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        allowMulti: getBoolean(excelQuestion, "allowMultiple", "اختيار متعدد"),
        choices: imageUrls.map((url) => ({
          id: createId(),
          imageUrl: url,
        })),
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "matrix": {
      const rowsStr = getString(excelQuestion, "rows", "الصفوف");
      const columnsStr = getString(excelQuestion, "columns", "الأعمدة");
      const rows = rowsStr
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      const columns = columnsStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.Matrix,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        rows: rows.map((row) => ({
          id: createId(),
          label: createI18nString(row, []),
        })),
        columns: columns.map((col) => ({
          id: createId(),
          label: createI18nString(col, []),
        })),
        shuffleOption: "none",
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "cta": {
      const htmlText = getString(excelQuestion, "html", "محتوى HTML");
      const btnUrl = getString(excelQuestion, "buttonUrl", "رابط الزر");
      const btnLabel = getString(excelQuestion, "buttonLabel", "نص الزر") || "اضغط هنا";
      const dismissLabel = getString(excelQuestion, "dismissButtonLabel");

      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.CTA,
        headline: createI18nString(headline, []),
        html: htmlText ? createI18nString(htmlText, []) : undefined,
        required,
        buttonUrl: btnUrl || undefined,
        buttonLabel: createI18nString(btnLabel, []),
        buttonExternal: true,
        dismissButtonLabel: dismissLabel ? createI18nString(dismissLabel, []) : undefined,
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "consent": {
      const labelText = getString(excelQuestion, "label", "التسمية") || "أوافق";

      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.Consent,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        label: createI18nString(labelText, []),
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "fileUpload": {
      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.FileUpload,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        allowMultipleFiles: getBoolean(excelQuestion, "allowMultipleFiles", "ملفات متعددة"),
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "cal": {
      const calUser = getString(excelQuestion, "calUserName", "اسم المستخدم Cal");

      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.Cal,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        calUserName: calUser,
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "contactInfo": {
      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.ContactInfo,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        firstName: { show: true, required: false, placeholder: createI18nString("الاسم الأول", []) },
        lastName: { show: true, required: false, placeholder: createI18nString("الاسم الأخير", []) },
        email: { show: true, required: true, placeholder: createI18nString("البريد الإلكتروني", []) },
        phone: { show: false, required: false, placeholder: createI18nString("رقم الهاتف", []) },
        company: { show: false, required: false, placeholder: createI18nString("الشركة", []) },
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "address": {
      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.Address,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        addressLine1: { show: true, required: true, placeholder: createI18nString("العنوان 1", []) },
        addressLine2: { show: true, required: false, placeholder: createI18nString("العنوان 2", []) },
        city: { show: true, required: true, placeholder: createI18nString("المدينة", []) },
        state: { show: true, required: false, placeholder: createI18nString("المحافظة", []) },
        zip: { show: true, required: false, placeholder: createI18nString("الرمز البريدي", []) },
        country: { show: true, required: true, placeholder: createI18nString("البلد", []) },
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "ranking": {
      const choicesStr = getString(excelQuestion, "choices", "الخيارات");
      const choices = choicesStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.Ranking,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        choices: choices.map((choice) => ({
          id: createId(),
          label: createI18nString(choice, []),
        })),
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    case "date": {
      return {
        id: questionId,
        type: TSurveyQuestionTypeEnum.Date,
        headline: createI18nString(headline, []),
        subheader: subheader ? createI18nString(subheader, []) : undefined,
        required,
        format: "M-d-y",
        buttonLabel: createI18nString("التالي", []),
        backButtonLabel: createI18nString("رجوع", []),
      };
    }

    default:
      throw new Error(`نوع السؤال غير مدعوم: ${type}`);
  }
};
