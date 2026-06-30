import Image from "next/image";

export const Testimonial = async () => {
  return (
    <div
      className="relative flex h-full min-h-screen w-full flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1b335f 0%, #0f314c 65%, #162840 100%)" }}>
      <style>{`
        @keyframes nustFadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nustFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nustScaleIn {
          from { opacity: 0; transform: scale(0.78); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes nustPulseRing {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 0.55; transform: scale(1.08); }
        }
        .sp-basmala   { animation: nustFadeDown  0.9s ease-out 0.15s both; }
        .sp-logo      { animation: nustScaleIn   0.8s cubic-bezier(0.34,1.56,0.64,1) 0.45s both; }
        .sp-ring      { animation: nustPulseRing 3.2s ease-in-out 1.4s infinite; }
        .sp-name-ar   { animation: nustFadeUp    0.8s ease-out 0.85s both; }
        .sp-badge     { animation: nustFadeUp    0.8s ease-out 0.95s both; }
        .sp-name-en   { animation: nustFadeUp    0.8s ease-out 1.05s both; }
        .sp-divider   { animation: nustFadeUp    0.7s ease-out 1.25s both; }
        .sp-tagline   { animation: nustFadeUp    0.8s ease-out 1.45s both; }
      `}</style>

      {/* Gold top stripe */}
      <div className="h-2 w-full flex-shrink-0" style={{ backgroundColor: "#f4bf00" }} />

      {/* Decorative background shapes */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(244,191,0,0.13) 0%, transparent 68%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(244,191,0,0.09) 0%, transparent 68%)" }}
      />
      <div
        className="pointer-events-none absolute right-14 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full"
        style={{ border: "1px solid rgba(244,191,0,0.1)" }}
      />
      <div
        className="pointer-events-none absolute right-6 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full"
        style={{ border: "1px solid rgba(244,191,0,0.06)" }}
      />
      {/* Dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(244,191,0,0.13) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Corner ornaments */}
      <div
        className="pointer-events-none absolute right-6 top-10 h-14 w-14"
        style={{ borderTop: "2px solid rgba(244,191,0,0.28)", borderRight: "2px solid rgba(244,191,0,0.28)" }}
      />
      <div
        className="pointer-events-none absolute bottom-10 left-6 h-14 w-14"
        style={{
          borderBottom: "2px solid rgba(244,191,0,0.28)",
          borderLeft: "2px solid rgba(244,191,0,0.28)",
        }}
      />

      {/* Main content */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-12 py-16" dir="rtl">
        {/* Basmala */}
        <p
          className="sp-basmala mb-10 text-center text-base tracking-widest"
          style={{ color: "#f4bf00", fontFamily: "Georgia, 'Times New Roman', serif" }}>
          بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
        </p>

        {/* Logo in gold ring */}
        <div className="sp-logo relative mb-8">
          <div
            className="sp-ring pointer-events-none absolute rounded-full"
            style={{
              inset: "-10px",
              border: "2px solid rgba(244,191,0,0.45)",
              borderRadius: "9999px",
            }}
          />
          <div className="rounded-full p-2" style={{ backgroundColor: "#f4bf00" }}>
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white p-2">
              <Image
                src="/images/logo.png"
                alt="شعار NUST"
                width={90}
                height={90}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* Arabic university name */}
        <h1
          className="sp-name-ar mb-2 text-center text-2xl font-black leading-tight text-white"
          style={{ textShadow: "0 2px 12px rgba(0,0,0,0.35)" }}>
          الجامعة الوطنية للعلوم والتكنولوجيا
        </h1>

        {/* NUST pill badge */}
        <div className="sp-badge mb-2">
          <span
            className="rounded-full px-5 py-1 text-xs font-black tracking-[0.2em]"
            style={{ backgroundColor: "#f4bf00", color: "#1b335f" }}>
            NUST
          </span>
        </div>

        {/* English name */}
        <p
          className="sp-name-en mb-10 text-center text-xs font-medium uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.42)" }}>
          National University of Sciences &amp; Technology
        </p>

        {/* Ornamental divider */}
        <div className="sp-divider mb-8 flex w-full max-w-[200px] items-center gap-3">
          <div className="h-px flex-1" style={{ backgroundColor: "rgba(244,191,0,0.3)" }} />
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5Z" fill="#f4bf00" opacity="0.65" />
          </svg>
          <div className="h-px flex-1" style={{ backgroundColor: "rgba(244,191,0,0.3)" }} />
        </div>

        {/* System tagline */}
        <div className="sp-tagline text-center">
          <p className="mb-1 text-lg font-bold text-white">منصة النماذج الإلكترونية</p>
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
            نظام موحّد لإنشاء الاستبيانات والنماذج المؤسسية
          </p>
        </div>
      </div>

      {/* Gold bottom stripe */}
      <div className="h-2 w-full flex-shrink-0" style={{ backgroundColor: "#f4bf00" }} />
    </div>
  );
};
