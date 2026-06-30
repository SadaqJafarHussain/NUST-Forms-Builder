"use client";

import Image from "next/image";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { TBannerConfig, TBannerElement } from "@formbricks/types/surveys/types";

const DESIGN_WIDTH = 1200;

function renderElement(el: TBannerElement, scale: number) {
  const base: CSSProperties = {
    position: "absolute",
    left: el.x * scale,
    top: el.y * scale,
    width: el.width * scale,
    height: el.height * scale,
    opacity: el.opacity,
    overflow: "hidden",
    userSelect: "none",
  };

  if (el.type === "text") {
    return (
      <div
        key={el.id}
        style={{
          ...base,
          fontSize: el.fontSize * scale,
          fontWeight: el.fontWeight,
          fontStyle: el.fontStyle,
          color: el.color,
          textAlign: el.textAlign as CSSProperties["textAlign"],
          display: "flex",
          alignItems: "center",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          lineHeight: 1.3,
          padding: 2 * scale,
        }}>
        {el.content}
      </div>
    );
  }

  if (el.type === "image") {
    if (!el.src) return null;
    return (
      <div key={el.id} style={{ ...base, borderRadius: el.borderRadius }}>
        <Image
          src={el.src}
          alt=""
          fill
          style={{ objectFit: el.objectFit, borderRadius: el.borderRadius }}
          unoptimized
        />
      </div>
    );
  }

  if (el.type === "shape") {
    const isCircle = el.shape === "circle";
    const isLine = el.shape === "line";
    return (
      <div
        key={el.id}
        style={{
          ...base,
          backgroundColor: el.fill,
          border: el.borderWidth > 0 ? `${el.borderWidth * scale}px solid ${el.borderColor}` : "none",
          borderRadius: isCircle ? "50%" : 0,
          height: isLine ? Math.max(el.borderWidth * scale, 1) : el.height * scale,
        }}
      />
    );
  }

  return null;
}

interface BannerRendererProps {
  config: TBannerConfig;
  surveyTitle?: string;
  projectName?: string;
}

export const BannerRenderer = ({ config, surveyTitle, projectName }: BannerRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.getBoundingClientRect().width;
        setScale(w / DESIGN_WIDTH);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const canvasHeight = config.height * scale;
  const bg = config.backgroundGradient ?? config.backgroundColor;

  return (
    <div className="w-full" dir="rtl">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ height: canvasHeight, background: bg }}>
        {config.elements.map((el) => renderElement(el, scale))}
      </div>

      {/* Form title bar (below canvas) */}
      {surveyTitle && (
        <div style={{ backgroundColor: "#1b335f" }}>
          <div className="mx-auto max-w-2xl px-4 py-3 text-center">
            {projectName && (
              <p className="mb-1 text-xs font-semibold tracking-wide" style={{ color: "#f4bf00" }}>
                {projectName}
              </p>
            )}
            <h1 className="text-lg font-bold text-white sm:text-2xl">{surveyTitle}</h1>
          </div>
        </div>
      )}
    </div>
  );
};
