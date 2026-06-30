"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import { createId } from "@paralleldrive/cuid2";
import { useTranslate } from "@tolgee/react";
import { ChevronDownIcon, PlusIcon, SplitIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { TSurvey, TSurveyLogic, TSurveyQuestion } from "@formbricks/types/surveys/types";
import { getLocalizedValue } from "@/lib/i18n/utils";
import { getDefaultOperatorForQuestion } from "@/modules/survey/editor/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/modules/ui/components/dropdown-menu";
import { Label } from "@/modules/ui/components/label";

interface ConditionalLogicProps {
  localSurvey: TSurvey;
  questionIdx: number;
  question: TSurveyQuestion;
  updateQuestion: (questionIdx: number, updatedAttributes: any) => void;
}

// ── Operators ──────────────────────────────────────────────────────────────
const NO_VALUE_OPS = new Set(["isSubmitted", "isSkipped"]);

const SIMPLE_OPERATORS = [
  { value: "equals", label: "تساوي" },
  { value: "doesNotEqual", label: "لا تساوي" },
  { value: "contains", label: "تحتوي على" },
  { value: "doesNotContain", label: "لا تحتوي على" },
  { value: "isSubmitted", label: "تم ملؤه (أي إجابة)" },
  { value: "isSkipped", label: "لم يُملأ" },
];

// ── Extract simple fields from a TSurveyLogic rule ─────────────────────────
const extractSimple = (rule: TSurveyLogic) => {
  const cond = rule.conditions?.conditions?.[0] as any;
  const action = rule.actions?.[0];
  return {
    operator: (cond?.operator as string) ?? "equals",
    value: (cond?.rightOperand?.value as string) ?? "",
    target: ((action as any)?.target as string) ?? "",
  };
};

// ── Reusable custom dropdown (no browser-native select) ────────────────────
interface SimpleDropdownProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

function SimpleDropdown({ value, onChange, options, placeholder = "— اختر —" }: SimpleDropdownProps) {
  const [open, setOpen] = useState(false);
  const label = options.find((o) => o.value === value)?.label ?? placeholder;
  const isPlaceholder = !options.find((o) => o.value === value);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1b335f]/20">
          <span className={`truncate text-right ${isPlaceholder ? "text-slate-400" : "text-slate-800"}`}>
            {label}
          </span>
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 max-h-60 min-w-[180px] overflow-y-auto">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onSelect={() => onChange(opt.value)}
            className={`text-right ${value === opt.value ? "bg-slate-100 font-medium" : ""}`}>
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Single rule row ──────────────────────────────────────────────────────────
interface SimpleRowProps {
  rule: TSurveyLogic;
  question: TSurveyQuestion;
  questionIdx: number;
  localSurvey: TSurvey;
  updateQuestion: (idx: number, attrs: any) => void;
  ruleIdx: number;
  isOnePage: boolean;
}

function SimpleLogicRow({
  rule,
  question,
  questionIdx,
  localSurvey,
  updateQuestion,
  ruleIdx,
  isOnePage,
}: SimpleRowProps) {
  const { operator, value, target } = extractSimple(rule);
  const needsValue = !NO_VALUE_OPS.has(operator);

  // One-page: only questions after current. Multi-page: all other questions.
  const targetQuestions = isOnePage
    ? localSurvey.questions.slice(questionIdx + 1)
    : localSurvey.questions.filter((_, i) => i !== questionIdx);

  const targetOptions = [
    { value: "", label: "— اختر سؤالاً —" },
    ...targetQuestions.map((q) => {
      const globalIdx = isOnePage
        ? questionIdx + 1 + localSurvey.questions.slice(questionIdx + 1).indexOf(q)
        : localSurvey.questions.indexOf(q);
      const headline = getLocalizedValue(q.headline, "default") || `سؤال ${globalIdx + 1}`;
      const lbl = headline.length > 45 ? `${headline.slice(0, 45)}…` : headline;
      return { value: q.id, label: `${globalIdx + 1}. ${lbl}` };
    }),
  ];

  const patch = (changes: { operator?: string; value?: string; target?: string }) => {
    const newOp = changes.operator ?? operator;
    const newVal = changes.value ?? value;
    const newTarget = changes.target ?? target;
    const noVal = NO_VALUE_OPS.has(newOp);

    const logicCopy = structuredClone(question.logic ?? []);
    const item = logicCopy[ruleIdx];
    if (!item) return;

    const condId = (item.conditions.conditions[0] as any)?.id ?? createId();
    item.conditions.conditions[0] = {
      id: condId,
      leftOperand: { value: question.id, type: "question" },
      operator: newOp as any,
      ...(noVal ? {} : { rightOperand: { value: newVal, type: "static" } }),
    };
    item.actions[0] = {
      id: item.actions[0]?.id ?? createId(),
      objective: "jumpToQuestion",
      target: newTarget,
    };

    updateQuestion(questionIdx, { logic: logicCopy });
  };

  const remove = () => {
    const copy = structuredClone(question.logic ?? []);
    copy.splice(ruleIdx, 1);
    updateQuestion(questionIdx, {
      logic: copy,
      logicFallback: copy.length === 0 ? undefined : question.logicFallback,
    });
  };

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3" dir="rtl">
      {/* Condition row */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-medium text-slate-500">إذا كانت الإجابة</span>
        <div className="flex-1">
          <SimpleDropdown
            value={operator}
            onChange={(val) => patch({ operator: val, value: "" })}
            options={SIMPLE_OPERATORS}
          />
        </div>
        {needsValue && (
          <input
            type="text"
            value={value}
            onChange={(e) => patch({ value: e.target.value })}
            placeholder="القيمة"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b335f]/20"
          />
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs font-medium text-slate-500">
          {isOnePage ? "أظهر السؤال" : "انتقل إلى السؤال"}
        </span>
        <div className="flex-1">
          <SimpleDropdown
            value={target}
            onChange={(val) => patch({ target: val })}
            options={targetOptions}
            placeholder="— اختر سؤالاً —"
          />
        </div>
        <button
          type="button"
          onClick={remove}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500">
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main ConditionalLogic ──────────────────────────────────────────────────

export function ConditionalLogic({
  localSurvey,
  question,
  questionIdx,
  updateQuestion,
}: ConditionalLogicProps) {
  const { t } = useTranslate();
  const isOnePage = localSurvey.isOnePage ?? true;
  const [parent] = useAutoAnimate();

  useEffect(() => {
    if (question.logic?.length === 0 && question.logicFallback) {
      updateQuestion(questionIdx, { logicFallback: undefined });
    }
  }, [question.logic, questionIdx, question.logicFallback, updateQuestion]);

  const addLogic = () => {
    const operator = getDefaultOperatorForQuestion(question, t);
    const newRule: TSurveyLogic = {
      id: createId(),
      conditions: {
        id: createId(),
        connector: "and",
        conditions: [
          {
            id: createId(),
            leftOperand: { value: question.id, type: "question" },
            operator,
          },
        ],
      },
      actions: [{ id: createId(), objective: "jumpToQuestion", target: "" }],
    };
    updateQuestion(questionIdx, { logic: [...(question?.logic ?? []), newRule] });
  };

  const hasTargetQuestions = isOnePage
    ? localSurvey.questions.length > questionIdx + 1
    : localSurvey.questions.length > 1;

  return (
    <div className="mt-2" dir="rtl">
      <Label className="mb-1 flex items-center gap-2">
        <SplitIcon className="h-3.5 w-3.5 rotate-90 text-slate-400" />
        {isOnePage ? "إظهار سؤال بشرط" : "منطق الانتقال"}
      </Label>
      <p className="mb-3 text-xs text-slate-400">
        {isOnePage
          ? "يظهر السؤال المحدد فقط عند تحقق الشرط"
          : "ينتقل المستجيب إلى السؤال المحدد عند تحقق الشرط بدلاً من السؤال التالي"}
      </p>

      <div className="space-y-2" ref={parent}>
        {(question.logic ?? []).map((rule, ruleIdx) => (
          <SimpleLogicRow
            key={rule.id}
            rule={rule}
            question={question}
            questionIdx={questionIdx}
            localSurvey={localSurvey}
            updateQuestion={updateQuestion}
            ruleIdx={ruleIdx}
            isOnePage={isOnePage}
          />
        ))}

        {!hasTargetQuestions && (question.logic ?? []).length === 0 ? (
          <p className="text-xs italic text-slate-400">
            {isOnePage ? "لا توجد أسئلة لاحقة لإظهارها بشرط" : "لا توجد أسئلة أخرى للانتقال إليها"}
          </p>
        ) : hasTargetQuestions ? (
          <button
            type="button"
            onClick={addLogic}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-[#1b335f] hover:text-[#1b335f]">
            <PlusIcon className="h-3.5 w-3.5" />
            إضافة شرط
          </button>
        ) : null}
      </div>
    </div>
  );
}
