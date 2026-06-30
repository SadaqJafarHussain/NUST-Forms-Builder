"use client";

import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  CircleIcon,
  ImageIcon,
  MinusIcon,
  SquareIcon,
  Trash2Icon,
  TypeIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  TBannerConfig,
  TBannerElement,
  TBannerImageElement,
  TBannerShapeElement,
  TBannerTextElement,
} from "@formbricks/types/surveys/types";
import { handleFileUpload } from "@/modules/storage/file-upload";

// ─── Constants ───────────────────────────────────────────────────────────────

const DESIGN_WIDTH = 1200;
const GRID = 20;
const MIN_SIZE = 20;

const snap = (v: number) => Math.round(v / GRID) * GRID;
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Types ───────────────────────────────────────────────────────────────────

type ResizeDir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const HANDLES: { dir: ResizeDir; style: CSSProperties }[] = [
  { dir: "nw", style: { top: -5, left: -5, cursor: "nw-resize" } },
  { dir: "n", style: { top: -5, left: "50%", transform: "translateX(-50%)", cursor: "n-resize" } },
  { dir: "ne", style: { top: -5, right: -5, cursor: "ne-resize" } },
  { dir: "e", style: { top: "50%", right: -5, transform: "translateY(-50%)", cursor: "e-resize" } },
  { dir: "se", style: { bottom: -5, right: -5, cursor: "se-resize" } },
  { dir: "s", style: { bottom: -5, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" } },
  { dir: "sw", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
  { dir: "w", style: { top: "50%", left: -5, transform: "translateY(-50%)", cursor: "w-resize" } },
];

// ─── Element Defaults ─────────────────────────────────────────────────────────

const makeText = (cx: number, cy: number): TBannerTextElement => ({
  id: uid(),
  type: "text",
  x: snap(cx - 150),
  y: snap(cy - 30),
  width: 300,
  height: 60,
  content: "اكتب هنا",
  fontSize: 28,
  fontWeight: "normal",
  fontStyle: "normal",
  color: "#ffffff",
  textAlign: "right",
  opacity: 1,
});

const makeImage = (cx: number, cy: number): TBannerImageElement => ({
  id: uid(),
  type: "image",
  x: snap(cx - 80),
  y: snap(cy - 80),
  width: 160,
  height: 160,
  src: "",
  objectFit: "contain",
  borderRadius: 0,
  opacity: 1,
});

const makeShape = (cx: number, cy: number, shape: TBannerShapeElement["shape"]): TBannerShapeElement => ({
  id: uid(),
  type: "shape",
  x: snap(cx - 100),
  y: snap(cy - 20),
  width: shape === "line" ? 400 : 200,
  height: shape === "line" ? 8 : 80,
  shape,
  fill: "#f4bf00",
  borderColor: "transparent",
  borderWidth: 0,
  opacity: 1,
});

// ─── Canvas Element Renderer ──────────────────────────────────────────────────

function CanvasElement({
  el,
  scale,
  selected,
  onSelect,
  onDragStart,
  onResizeStart,
}: {
  el: TBannerElement;
  scale: number;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.PointerEvent) => void;
  onResizeStart: (e: React.PointerEvent, dir: ResizeDir) => void;
}) {
  const base: CSSProperties = {
    position: "absolute",
    left: el.x * scale,
    top: el.y * scale,
    width: el.width * scale,
    height:
      el.type === "shape" && el.shape === "line" ? Math.max(el.borderWidth * scale, 2) : el.height * scale,
    opacity: el.opacity,
    outline: selected ? "2px solid #3b82f6" : "none",
    outlineOffset: 1,
    cursor: selected ? "move" : "pointer",
    userSelect: "none",
    boxSizing: "border-box" as const,
  };

  const content = (() => {
    if (el.type === "text") {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            fontSize: el.fontSize * scale,
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            color: el.color,
            textAlign: el.textAlign as CSSProperties["textAlign"],
            display: "flex",
            alignItems: "center",
            padding: `0 ${4 * scale}px`,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            overflow: "hidden",
            lineHeight: 1.3,
          }}>
          {el.content}
        </div>
      );
    }
    if (el.type === "image") {
      return el.src ? (
        <Image
          src={el.src}
          alt=""
          fill
          style={{ objectFit: el.objectFit, borderRadius: el.borderRadius }}
          unoptimized
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed rgba(255,255,255,0.4)",
          }}>
          <ImageIcon style={{ width: 32 * scale, height: 32 * scale, color: "rgba(255,255,255,0.5)" }} />
        </div>
      );
    }
    if (el.type === "shape") {
      return (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: el.fill,
            border: el.borderWidth > 0 ? `${el.borderWidth * scale}px solid ${el.borderColor}` : "none",
            borderRadius: el.shape === "circle" ? "50%" : 0,
          }}
        />
      );
    }
    return null;
  })();

  return (
    <div
      style={{ ...base, position: "absolute", overflow: el.type === "image" ? "hidden" : "visible" }}
      onPointerDown={(e) => {
        onSelect();
        onDragStart(e);
      }}>
      {content}
      {selected &&
        HANDLES.map(({ dir, style }) => (
          <div
            key={dir}
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              background: "white",
              border: "2px solid #3b82f6",
              borderRadius: 2,
              zIndex: 10,
              ...style,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizeStart(e, dir);
            }}
          />
        ))}
    </div>
  );
}

// ─── Properties Panel ─────────────────────────────────────────────────────────

function PropertiesPanel({
  el,
  onChange,
  onDelete,
  environmentId,
}: {
  el: TBannerElement;
  onChange: (patch: Partial<TBannerElement>) => void;
  onDelete: () => void;
  environmentId: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const field = (label: string, children: React.ReactNode) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );

  const numInput = (val: number, key: string, min?: number, max?: number) => (
    <input
      type="number"
      value={Math.round(val)}
      min={min}
      max={max}
      onChange={(e) => onChange({ [key]: Number(e.target.value) } as any)}
      className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
    />
  );

  const colorInput = (val: string, key: string) => (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={val}
        onChange={(e) => onChange({ [key]: e.target.value } as any)}
        className="h-8 w-8 cursor-pointer rounded border border-slate-200"
      />
      <input
        type="text"
        value={val}
        onChange={(e) => onChange({ [key]: e.target.value } as any)}
        className="flex-1 rounded border border-slate-200 px-2 py-1 font-mono text-xs focus:border-blue-400 focus:outline-none"
      />
    </div>
  );

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const result = await handleFileUpload(file, environmentId, ["png", "jpg", "jpeg", "webp"]);
    setUploading(false);
    if (result.error) {
      toast.error("فشل رفع الصورة: " + result.error);
    } else {
      onChange({ src: result.url } as any);
    }
  };

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-3" dir="rtl">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">
          {el.type === "text" ? "نص" : el.type === "image" ? "صورة" : "شكل"}
        </span>
        <button
          onClick={onDelete}
          className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
          title="حذف">
          <Trash2Icon className="h-4 w-4" />
        </button>
      </div>

      {/* Position & Size */}
      <div className="grid grid-cols-2 gap-2">
        {field("X", numInput(el.x, "x"))}
        {field("Y", numInput(el.y, "y"))}
        {field("العرض", numInput(el.width, "width", MIN_SIZE))}
        {field("الارتفاع", numInput(el.height, "height", MIN_SIZE))}
      </div>
      {field("الشفافية", numInput(el.opacity, "opacity", 0, 1))}

      <hr className="border-slate-100" />

      {/* Text-specific */}
      {el.type === "text" && (
        <>
          {field(
            "النص",
            <textarea
              value={el.content}
              onChange={(e) => onChange({ content: e.target.value } as any)}
              rows={3}
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
            />
          )}
          {field("حجم الخط", numInput(el.fontSize, "fontSize", 8, 200))}
          {field("اللون", colorInput(el.color, "color"))}
          {field(
            "الوزن",
            <select
              value={el.fontWeight}
              onChange={(e) => onChange({ fontWeight: e.target.value as any })}
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none">
              <option value="normal">عادي</option>
              <option value="bold">غامق</option>
            </select>
          )}
          {field(
            "النمط",
            <select
              value={el.fontStyle}
              onChange={(e) => onChange({ fontStyle: e.target.value as any })}
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none">
              <option value="normal">عادي</option>
              <option value="italic">مائل</option>
            </select>
          )}
          {field(
            "المحاذاة",
            <div className="flex gap-1">
              {(["right", "center", "left"] as const).map((a) => {
                const Icon =
                  a === "right" ? AlignRightIcon : a === "center" ? AlignCenterIcon : AlignLeftIcon;
                return (
                  <button
                    key={a}
                    onClick={() => onChange({ textAlign: a } as any)}
                    className={`flex flex-1 items-center justify-center rounded py-1 ${el.textAlign === a ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Image-specific */}
      {el.type === "image" && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-lg border-2 border-dashed border-blue-300 py-2 text-sm text-blue-600 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50">
            {uploading ? "جاري الرفع..." : el.src ? "تغيير الصورة" : "رفع صورة"}
          </button>
          {el.src && (
            <div className="relative h-20 w-full overflow-hidden rounded border border-slate-200">
              <Image src={el.src} alt="" fill style={{ objectFit: "contain" }} unoptimized />
            </div>
          )}
          {field(
            "ملاءمة الصورة",
            <select
              value={el.objectFit}
              onChange={(e) => onChange({ objectFit: e.target.value as any })}
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none">
              <option value="contain">contain</option>
              <option value="cover">cover</option>
              <option value="fill">fill</option>
            </select>
          )}
          {field("تدوير الحواف (%)", numInput(el.borderRadius, "borderRadius", 0, 50))}
        </>
      )}

      {/* Shape-specific */}
      {el.type === "shape" && (
        <>
          {field("اللون", colorInput(el.fill, "fill"))}
          {field(
            "الشكل",
            <div className="flex gap-1">
              {(
                [
                  { v: "rectangle", label: "مستطيل", Icon: SquareIcon },
                  { v: "circle", label: "دائرة", Icon: CircleIcon },
                  { v: "line", label: "خط", Icon: MinusIcon },
                ] as const
              ).map(({ v, label, Icon }) => (
                <button
                  key={v}
                  onClick={() => onChange({ shape: v } as any)}
                  title={label}
                  className={`flex flex-1 items-center justify-center rounded py-1 ${el.shape === v ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
          {field("لون الحدود", colorInput(el.borderColor, "borderColor"))}
          {field("سماكة الحدود", numInput(el.borderWidth, "borderWidth", 0, 20))}
        </>
      )}
    </div>
  );
}

// ─── Background Panel ─────────────────────────────────────────────────────────

function BackgroundPanel({
  config,
  onChange,
}: {
  config: TBannerConfig;
  onChange: (patch: Partial<TBannerConfig>) => void;
}) {
  const [useGradient, setUseGradient] = useState(!!config.backgroundGradient);

  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-3" dir="rtl">
      <span className="text-sm font-semibold text-slate-700">إعدادات البانر</span>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-500">الارتفاع (وحدة تصميم)</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={80}
            max={500}
            step={GRID}
            value={config.height}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
            className="flex-1"
          />
          <span className="w-10 text-center font-mono text-sm text-slate-600">{config.height}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="use-gradient"
          checked={useGradient}
          onChange={(e) => {
            setUseGradient(e.target.checked);
            if (!e.target.checked) onChange({ backgroundGradient: undefined });
          }}
          className="h-4 w-4"
        />
        <label htmlFor="use-gradient" className="text-sm text-slate-600">
          استخدام تدرج لوني
        </label>
      </div>

      {useGradient ? (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">CSS Gradient</label>
          <input
            type="text"
            value={config.backgroundGradient ?? "linear-gradient(135deg, #1b335f 0%, #0f314c 100%)"}
            placeholder="linear-gradient(135deg, #1b335f 0%, #0f314c 100%)"
            onChange={(e) => onChange({ backgroundGradient: e.target.value })}
            className="w-full rounded border border-slate-200 px-2 py-1 font-mono text-xs focus:border-blue-400 focus:outline-none"
          />
          <div
            className="h-8 w-full rounded border border-slate-200"
            style={{
              background: config.backgroundGradient ?? "linear-gradient(135deg, #1b335f 0%, #0f314c 100%)",
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">لون الخلفية</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border border-slate-200"
            />
            <input
              type="text"
              value={config.backgroundColor}
              onChange={(e) => onChange({ backgroundColor: e.target.value })}
              className="flex-1 rounded border border-slate-200 px-2 py-1 font-mono text-xs focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      <hr className="border-slate-100" />
      <p className="text-center text-xs text-slate-400">انقر على عنصر لتعديل خصائصه</p>
    </div>
  );
}

// ─── Main BannerDesigner ──────────────────────────────────────────────────────

interface BannerDesignerProps {
  config: TBannerConfig | null;
  onChange: (config: TBannerConfig) => void;
  environmentId: string;
  trigger: React.ReactNode;
}

const emptyConfig = (): TBannerConfig => ({
  height: 200,
  backgroundColor: "#1b335f",
  elements: [],
});

export const BannerDesigner = ({ config, onChange, environmentId, trigger }: BannerDesignerProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<TBannerConfig>(config ?? emptyConfig());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Re-sync draft when dialog opens
  const handleOpen = () => {
    setDraft(config ?? emptyConfig());
    setSelectedId(null);
    setOpen(true);
  };

  // Measure canvas width and compute scale
  useEffect(() => {
    if (!open) return;
    const measure = () => {
      if (canvasContainerRef.current) {
        const w = canvasContainerRef.current.getBoundingClientRect().width;
        setScale(Math.min(w / DESIGN_WIDTH, 1));
      }
    };
    // slight delay for DOM to settle
    const t = setTimeout(measure, 50);
    const ro = new ResizeObserver(measure);
    if (canvasContainerRef.current) ro.observe(canvasContainerRef.current);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, [open]);

  const updateElement = useCallback((id: string, patch: Partial<TBannerElement>) => {
    setDraft((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === id ? ({ ...el, ...patch } as TBannerElement) : el)),
    }));
  }, []);

  const deleteElement = (id: string) => {
    setDraft((prev) => ({ ...prev, elements: prev.elements.filter((el) => el.id !== id) }));
    setSelectedId(null);
  };

  const addElement = (el: TBannerElement) => {
    setDraft((prev) => ({ ...prev, elements: [...prev.elements, el] }));
    setSelectedId(el.id);
  };

  const center = { x: DESIGN_WIDTH / 2, y: draft.height / 2 };

  // ── Drag logic ─────────────────────────────────────────────────────────────
  const handleDragStart = useCallback(
    (e: React.PointerEvent, id: string) => {
      e.preventDefault();
      const el = draft.elements.find((x) => x.id === id);
      if (!el) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const { x: sx, y: sy } = el;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / scale;
        const dy = (ev.clientY - startY) / scale;
        updateElement(id, {
          x: snap(clamp(sx + dx, 0, DESIGN_WIDTH - el.width)),
          y: snap(clamp(sy + dy, 0, draft.height - el.height)),
        });
      };
      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [draft.elements, draft.height, scale, updateElement]
  );

  // ── Resize logic ───────────────────────────────────────────────────────────
  const handleResizeStart = useCallback(
    (e: React.PointerEvent, id: string, dir: ResizeDir) => {
      e.preventDefault();
      const el = draft.elements.find((x) => x.id === id);
      if (!el) return;
      const startX = e.clientX;
      const startY = e.clientY;
      const { x: sx, y: sy, width: sw, height: sh } = el;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / scale;
        const dy = (ev.clientY - startY) / scale;
        let nx = sx,
          ny = sy,
          nw = sw,
          nh = sh;

        if (dir.includes("e")) nw = Math.max(MIN_SIZE, snap(sw + dx));
        if (dir.includes("s")) nh = Math.max(MIN_SIZE, snap(sh + dy));
        if (dir.includes("w")) {
          nx = snap(sx + dx);
          nw = Math.max(MIN_SIZE, snap(sw - dx));
        }
        if (dir.includes("n")) {
          ny = snap(sy + dy);
          nh = Math.max(MIN_SIZE, snap(sh - dy));
        }

        updateElement(id, { x: nx, y: ny, width: nw, height: nh });
      };
      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [draft.elements, scale, updateElement]
  );

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        deleteElement(selectedId);
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        const el = draft.elements.find((x) => x.id === selectedId);
        if (!el) return;
        const d = e.shiftKey ? GRID * 5 : GRID;
        if (e.key === "ArrowLeft") updateElement(selectedId, { x: Math.max(0, el.x - d) });
        if (e.key === "ArrowRight")
          updateElement(selectedId, { x: Math.min(DESIGN_WIDTH - el.width, el.x + d) });
        if (e.key === "ArrowUp") updateElement(selectedId, { y: Math.max(0, el.y - d) });
        if (e.key === "ArrowDown")
          updateElement(selectedId, { y: Math.min(draft.height - el.height, el.y + d) });
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, selectedId, draft.elements, draft.height, updateElement]);

  const selectedEl = draft.elements.find((el) => el.id === selectedId) ?? null;

  const canvasHeight = draft.height * scale;
  const bg = draft.backgroundGradient ?? draft.backgroundColor;

  if (!open) {
    return <span onClick={handleOpen}>{trigger}</span>;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-white" style={{ fontFamily: "sans-serif" }} dir="rtl">
      {/* Top bar */}
      <div
        className="flex flex-shrink-0 items-center justify-between px-4 py-3"
        style={{ backgroundColor: "#1b335f", borderBottom: "1px solid #0f314c" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(false)}
            className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white">
            <XIcon className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-white">مصمم البانر</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDraft(emptyConfig());
              setSelectedId(null);
            }}
            className="rounded-lg px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white">
            مسح الكل
          </button>
          <button
            onClick={() => {
              onChange(draft);
              setOpen(false);
              toast.success("تم حفظ البانر بنجاح");
            }}
            className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white"
            style={{ backgroundColor: "#f4bf00", color: "#1b335f" }}>
            حفظ البانر
          </button>
        </div>
      </div>

      {/* Body: Toolbar | Canvas | Properties */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <div
          className="flex w-44 flex-shrink-0 flex-col gap-1 overflow-y-auto border-l p-2"
          style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}>
          <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">إضافة عنصر</p>

          <button
            onClick={() => addElement(makeText(center.x, center.y))}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-white hover:shadow-sm">
            <TypeIcon className="h-4 w-4 text-blue-500" />
            نص
          </button>

          <button
            onClick={() => {
              const el = makeImage(center.x, center.y);
              addElement(el);
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-white hover:shadow-sm">
            <ImageIcon className="h-4 w-4 text-green-500" />
            صورة
          </button>

          <button
            onClick={() => addElement(makeShape(center.x, center.y, "rectangle"))}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-white hover:shadow-sm">
            <SquareIcon className="h-4 w-4 text-purple-500" />
            مستطيل
          </button>

          <button
            onClick={() => addElement(makeShape(center.x, center.y, "circle"))}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-white hover:shadow-sm">
            <CircleIcon className="h-4 w-4 text-pink-500" />
            دائرة
          </button>

          <button
            onClick={() => addElement(makeShape(center.x, center.y, "line"))}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-white hover:shadow-sm">
            <MinusIcon className="h-4 w-4 text-amber-500" />
            خط
          </button>

          <hr className="my-2 border-slate-200" />
          <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">الطبقات</p>
          <div className="flex flex-col gap-0.5">
            {draft.elements.length === 0 && <p className="px-1 text-xs text-slate-400">لا توجد عناصر</p>}
            {[...draft.elements].reverse().map((el) => (
              <button
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                className={`flex items-center gap-1.5 truncate rounded px-2 py-1 text-xs ${selectedId === el.id ? "bg-blue-100 font-medium text-blue-700" : "text-slate-600 hover:bg-white"}`}>
                {el.type === "text" ? (
                  <TypeIcon className="h-3 w-3 flex-shrink-0" />
                ) : el.type === "image" ? (
                  <ImageIcon className="h-3 w-3 flex-shrink-0" />
                ) : (
                  <SquareIcon className="h-3 w-3 flex-shrink-0" />
                )}
                <span className="truncate">
                  {el.type === "text" ? el.content.slice(0, 12) : el.type === "image" ? "صورة" : el.shape}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div
          className="flex flex-1 flex-col items-center overflow-auto bg-slate-200 p-4"
          onClick={() => setSelectedId(null)}>
          {/* Grid hint */}
          <p className="mb-2 text-xs text-slate-400">شبكة {GRID}px • اضغط Delete لحذف • أسهم لتحريك</p>

          {/* Canvas container */}
          <div ref={canvasContainerRef} className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <div
              className="relative w-full overflow-hidden shadow-xl"
              style={{ height: canvasHeight, background: bg }}>
              {/* Grid dots overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                  backgroundSize: `${GRID * scale}px ${GRID * scale}px`,
                }}
              />

              {draft.elements.map((el) => (
                <CanvasElement
                  key={el.id}
                  el={el}
                  scale={scale}
                  selected={selectedId === el.id}
                  onSelect={() => setSelectedId(el.id)}
                  onDragStart={(e) => handleDragStart(e, el.id)}
                  onResizeStart={(e, dir) => handleResizeStart(e, el.id, dir)}
                />
              ))}

              {draft.elements.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 * scale }}>
                    اضغط على عنصر من الشريط الجانبي لإضافته
                  </p>
                </div>
              )}
            </div>

            {/* Canvas size label */}
            <p className="mt-1 text-center text-xs text-slate-400">
              {DESIGN_WIDTH} × {draft.height} وحدة تصميم · مقياس: {(scale * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Right Properties Panel */}
        <div
          className="w-56 flex-shrink-0 overflow-y-auto border-r"
          style={{ borderColor: "#e2e8f0", backgroundColor: "#f8fafc" }}>
          {selectedEl ? (
            <PropertiesPanel
              key={selectedEl.id}
              el={selectedEl}
              onChange={(patch) => updateElement(selectedEl.id, patch)}
              onDelete={() => deleteElement(selectedEl.id)}
              environmentId={environmentId}
            />
          ) : (
            <BackgroundPanel
              config={draft}
              onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
