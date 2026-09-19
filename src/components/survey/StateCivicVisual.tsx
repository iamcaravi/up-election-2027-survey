"use client";

import { memo, useId } from "react";
import { displayStateName } from "@/lib/utils";
import { getStateAssemblyConfig } from "@/lib/state-assembly-config";

export interface StateCivicVisualProps {
  stateName?: string;
  stateSlug?: string;
  locale?: "hi" | "en";
  variant?: "desktop" | "mobile" | "auto";
}

export const StateCivicVisual = memo(function StateCivicVisual({
  stateName = "Uttar Pradesh",
  stateSlug = "uttar-pradesh",
  locale = "hi",
  variant = "auto",
}: StateCivicVisualProps) {
  const uniqueId = useId().replace(/:/g, "");
  const isHindi = locale === "hi";

  const config = getStateAssemblyConfig(stateSlug);
  const localizedState = config
    ? (isHindi ? config.nameHindi : config.nameEnglish)
    : displayStateName(stateName, stateSlug ?? "", locale);

  const assemblyName = config
    ? (isHindi ? config.assemblyNameHindi : config.assemblyNameEnglish)
    : (isHindi ? "विधान सभा" : "Legislative Assembly");

  const voiceOfText = isHindi ? "की आवाज़" : `Voice of ${localizedState}`;
  const placardLine1 = isHindi ? "मेरी राय" : "My Voice";
  const placardLine2 = isHindi ? "मेरा क्षेत्र" : "My Area";
  const placardLine3 = isHindi ? `मेरा ${localizedState}` : `My ${localizedState}`;

  const hasAssemblyImage = Boolean(config?.assemblyImage);

  // Mobile dedicated composition (compact card tightly wrapping content, wider prominent hero image, NO MAP)
  if (variant === "mobile") {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl border border-blue-100/90 bg-gradient-to-b from-sky-50/80 via-blue-50/40 to-sky-50/80 px-3 pt-2.5 pb-2.5 sm:px-4 sm:pt-3 sm:pb-3 shadow-xs select-none">
        {/* Top: Dynamic State Typography */}
        <div className="flex flex-col items-center text-center relative z-20">
          <span className="font-display text-base sm:text-lg font-black text-slate-800 tracking-tight leading-none">
            {localizedState}
          </span>
          {/* Delicate curved orange swoosh underline */}
          <svg
            className="w-16 sm:w-20 h-1 text-orange-500 mt-0.5 overflow-visible"
            viewBox="0 0 120 8"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M2 5 C 30 1.5, 88 1.5, 118 6"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-[10px] sm:text-[11px] font-bold text-slate-600 tracking-wider mt-0.5">
            {voiceOfText}
          </span>
        </div>

        {/* Center: Legislative Assembly Visual (NO MAP, wider image ~86% of card width, centered, uncropped) */}
        <div className="relative w-full mt-1.5 flex items-center justify-center">
          {hasAssemblyImage && config?.assemblyImage ? (
            <div className="relative w-[86%] max-w-[275px] sm:max-w-[310px] aspect-[280/294] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={config.assemblyImage}
                alt={assemblyName}
                className="w-full h-full object-contain object-bottom select-none pointer-events-none drop-shadow-xs"
              />
              {/* Dynamic Placard Text overlay */}
              <div
                className="absolute right-[1%] bottom-[3%] pointer-events-none z-30 text-center select-none"
                style={{ transform: "rotate(3deg)", width: "34%" }}
              >
                <p className="text-[7.5px] sm:text-[8px] font-extrabold text-slate-800 leading-[1.15]">{placardLine1}</p>
                <p className="text-[7.5px] sm:text-[8px] font-extrabold text-slate-800 leading-[1.15]">{placardLine2}</p>
                <p className="text-[8px] sm:text-[8.5px] font-black text-[#c2410c] leading-[1.2] mt-0.5 whitespace-nowrap">{placardLine3}</p>
                <div className="w-8/12 mx-auto h-[1.3px] bg-[#fb923c] rounded-full mt-0.5" />
              </div>
            </div>
          ) : (
            <div className="relative w-[86%] max-w-[275px] sm:max-w-[310px] aspect-[260/180] flex items-end justify-center">
              <StateIllustratedLandmark stateSlug={stateSlug} />
              <CitizenPlacardGroup
                uniqueId={`${uniqueId}-mob`}
                line1={placardLine1}
                line2={placardLine2}
                line3={placardLine3}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop Composition (strict 20% column, vertically centered hero stage, compact height, NO MAP)
  return (
    <div className="relative w-full flex flex-col items-center justify-center select-none py-1">
      {/* Ambient background soft light */}
      <div
        className="absolute inset-0 bg-gradient-to-l from-sky-100/30 via-blue-50/15 to-transparent pointer-events-none rounded-2xl"
        aria-hidden="true"
      />

      {/* 1. Top Portion: Dynamic State Typography (State Name + "की आवाज़") */}
      <div className="relative z-20 text-center flex flex-col items-center mb-1">
        <span className="font-display text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none text-center">
          {localizedState}
        </span>
        {/* Delicate curved orange swoosh underline */}
        <svg
          className="w-20 sm:w-24 h-2 text-orange-500 mt-1 overflow-visible"
          viewBox="0 0 120 8"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M2 5 C 30 1.5, 88 1.5, 118 6"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="font-display text-xs sm:text-[13px] font-bold text-slate-600 tracking-wider mt-0.5">
          {voiceOfText}
        </span>
      </div>

      {/* 2. Center Stage: Large Vidhan Sabha Building Visual */}
      <div className="relative w-full max-w-[280px] flex flex-col items-center justify-center overflow-hidden">
        {hasAssemblyImage && config?.assemblyImage ? (
          // Authentic state Vidhan Sabha photo with left-edge feathering
          <div className="relative w-full aspect-[280/230] flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={config.assemblyImage}
              alt={assemblyName}
              className="w-full h-full object-contain object-center select-none pointer-events-none drop-shadow-xs"
              style={LANDMARK_MASK_STYLE}
            />
            {/* Dynamic Placard Text overlay */}
            <div
              className="absolute right-1.5 sm:right-2 bottom-3 sm:bottom-4 pointer-events-none z-30 text-center select-none"
              style={{ transform: "rotate(3deg)", width: "74px" }}
            >
              <p className="text-[7.2px] font-extrabold text-slate-800 leading-[1.15]">{placardLine1}</p>
              <p className="text-[7.2px] font-extrabold text-slate-800 leading-[1.15]">{placardLine2}</p>
              <p className="text-[7.8px] font-black text-[#c2410c] leading-[1.2] mt-0.5 whitespace-nowrap">{placardLine3}</p>
              <div className="w-10/12 mx-auto h-[1.5px] bg-[#fb923c] rounded-full mt-0.5" />
            </div>
          </div>
        ) : (
          // Authentic dedicated architectural visual for states without a photo asset
          <div className="relative w-full aspect-[260/170] flex flex-col items-center justify-center">
            <StateIllustratedLandmark stateSlug={stateSlug} />
            <CitizenPlacardGroup
              uniqueId={uniqueId}
              line1={placardLine1}
              line2={placardLine2}
              line3={placardLine3}
            />
          </div>
        )}
      </div>
    </div>
  );
});

const LANDMARK_MASK_STYLE = {
  maskImage:
    "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 8%, rgba(0,0,0,0.9) 24%, #000 35%, #000 100%)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 8%, rgba(0,0,0,0.9) 24%, #000 35%, #000 100%)",
};

function StateIllustratedLandmark({ stateSlug }: { stateSlug?: string }) {
  switch (stateSlug) {
    case "punjab":
      return (
        <svg
          viewBox="0 0 260 180"
          className="w-full h-full text-amber-500 overflow-visible"
          style={LANDMARK_MASK_STYLE}
        >
          {/* Punjab Vidhan Sabha & Golden Dome Motif */}
          <defs>
            <linearGradient id="punjabGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path d="M90 95 Q130 35 170 95 Z" fill="url(#punjabGold)" stroke="#d97706" strokeWidth="1.2" />
          <path d="M128 35 L132 35 L130 18 Z" fill="#b45309" />
          <circle cx="130" cy="15" r="2.5" fill="#f59e0b" />
          <rect x="80" y="95" width="100" height="12" rx="1.5" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
          <rect x="50" y="107" width="160" height="8" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
          {[60, 74, 88, 102, 116, 130, 144, 158, 172, 186, 200].map((x) => (
            <rect key={x} x={x} y="115" width="4.5" height="38" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="0.6" />
          ))}
          <rect x="40" y="153" width="180" height="15" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
        </svg>
      );

    case "gujarat":
      return (
        <svg
          viewBox="0 0 260 180"
          className="w-full h-full text-amber-600 overflow-visible"
          style={LANDMARK_MASK_STYLE}
        >
          {/* Gujarat Vithalbhai Patel Bhavan / Vidhan Sabha Colonnade */}
          <rect x="60" y="65" width="150" height="14" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
          <polygon points="135,35 185,65 85,65" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
          <rect x="50" y="79" width="170" height="10" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
          {[58, 72, 86, 100, 114, 128, 142, 156, 170, 184, 198, 212].map((x) => (
            <rect key={x} x={x} y="89" width="5" height="50" rx="1" fill="#fef3c7" stroke="#d97706" strokeWidth="0.7" />
          ))}
          <rect x="40" y="139" width="190" height="18" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
        </svg>
      );

    case "maharashtra":
      return (
        <svg
          viewBox="0 0 260 180"
          className="w-full h-full text-amber-600 overflow-visible"
          style={LANDMARK_MASK_STYLE}
        >
          {/* Maharashtra Vidhan Bhavan / Civic Arch motif */}
          <rect x="60" y="80" width="150" height="12" rx="1.5" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
          {/* Grand Archways */}
          <path d="M75 140 L75 105 Q90 92 105 105 L105 140 Z" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
          <path d="M115 140 L115 100 Q135 84 155 100 L155 140 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
          <path d="M165 140 L165 105 Q180 92 195 105 L195 140 Z" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
          <rect x="45" y="140" width="180" height="18" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
        </svg>
      );

    case "uttarakhand":
    case "himachal-pradesh":
      return (
        <svg
          viewBox="0 0 260 180"
          className="w-full h-full text-amber-600 overflow-visible"
          style={LANDMARK_MASK_STYLE}
        >
          {/* Mountain ridge backdrop */}
          <polygon points="30,120 80,60 140,110 190,50 240,120" fill="#e0f2fe" opacity="0.5" />
          {/* Civic Assembly Facade */}
          <polygon points="135,65 175,90 95,90" fill="#fde68a" stroke="#d97706" strokeWidth="1" />
          <rect x="85" y="90" width="100" height="8" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
          {[92, 106, 120, 134, 148, 162, 176].map((x) => (
            <rect key={x} x={x} y="98" width="5" height="42" rx="1" fill="#fef3c7" stroke="#d97706" strokeWidth="0.7" />
          ))}
          <rect x="75" y="140" width="120" height="16" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 260 180"
          className="w-full h-full text-amber-600 overflow-visible"
          style={LANDMARK_MASK_STYLE}
        >
          {/* Classical State Legislative Assembly Civic Facade with Dome */}
          <path d="M105 85 Q135 35 165 85 Z" fill="#fde68a" stroke="#d97706" strokeWidth="1.2" />
          <path d="M133 35 L137 35 L135 20 Z" fill="#b45309" />
          <circle cx="135" cy="18" r="2.5" fill="#f59e0b" />
          <rect x="95" y="85" width="80" height="12" rx="1" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
          <rect x="60" y="97" width="150" height="8" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
          {[70, 84, 98, 112, 126, 140, 154, 168, 182, 196].map((x) => (
            <rect key={x} x={x} y="105" width="4.5" height="38" rx="1" fill="#fde68a" stroke="#d97706" strokeWidth="0.6" />
          ))}
          <rect x="50" y="143" width="170" height="15" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="0.8" />
        </svg>
      );
  }
}

function CitizenPlacardGroup({
  uniqueId,
  line1,
  line2,
  line3,
}: {
  uniqueId: string;
  line1: string;
  line2: string;
  line3: string;
}) {
  return (
    <div className="relative z-20 w-full flex justify-end items-end pr-0.5 sm:pr-1 pb-1 pointer-events-none">
      <svg
        viewBox="0 0 180 85"
        className="w-32 sm:w-36 h-14 sm:h-16 overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <filter id={`placardShadow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* Restrained Group of Citizen Silhouettes (Bottom-right cluster only) */}
        <g fill="#1e293b" opacity="0.82">
          {/* Person 1 (left of group) */}
          <circle cx="28" cy="56" r="6.5" />
          <path d="M26 59 L21 42 L25 40 L29 58 Z" />
          <path d="M14 85 L14 73 Q28 66 42 73 L42 85 Z" />

          {/* Person 2 (center, cheering with arms raised) */}
          <circle cx="56" cy="52" r="7" />
          <path d="M58 55 L65 37 L69 39 L62 57 Z" />
          <path d="M42 85 L42 70 Q56 64 70 70 L70 85 Z" />

          {/* Person 3 (holding placard pole) */}
          <circle cx="86" cy="55" r="6.5" />
          <path d="M88 64 L95 43 L99 44 L92 65 Z" />
          <path d="M72 85 L72 72 Q86 67 100 72 L100 85 Z" />

          {/* Person 4 (right of group) */}
          <circle cx="120" cy="54" r="6.5" />
          <path d="M123 57 L132 38 L136 40 L127 59 Z" />
          <path d="M104 85 L104 71 Q120 65 136 71 L136 85 Z" />

          {/* Person 5 (edge) */}
          <circle cx="152" cy="57" r="6" />
          <path d="M138 85 L138 74 Q152 69 166 74 L166 85 Z" />
        </g>

        {/* Small, Tasteful Neutral Civic Placard Sign */}
        <g transform="translate(68, 6) rotate(3)" filter={`url(#placardShadow-${uniqueId})`}>
          {/* Wooden Stick */}
          <rect x="36" y="44" width="3.5" height="30" fill="#78350f" rx="1" />

          {/* Placard Cardboard */}
          <rect
            x="0"
            y="0"
            width="78"
            height="45"
            rx="4"
            fill="#fffdfc"
            stroke="#fb923c"
            strokeWidth="1.6"
          />

          {/* Delicate Inner Border */}
          <rect
            x="2"
            y="2"
            width="74"
            height="41"
            rx="3"
            fill="none"
            stroke="#fed7aa"
            strokeWidth="0.6"
          />

          {/* Dynamic Placard Text */}
          <text
            x="39"
            y="13"
            textAnchor="middle"
            fill="#1e293b"
            fontSize="7.5"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            {line1}
          </text>
          <text
            x="39"
            y="23"
            textAnchor="middle"
            fill="#1e293b"
            fontSize="7.5"
            fontWeight="800"
            fontFamily="sans-serif"
          >
            {line2}
          </text>
          <text
            x="39"
            y="35"
            textAnchor="middle"
            fill="#c2410c"
            fontSize="8"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            {line3}
          </text>
        </g>
      </svg>
    </div>
  );
}
