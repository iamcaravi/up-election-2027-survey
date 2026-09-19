"use client";

import { memo } from "react";

export const BallotBoxVisual = memo(function BallotBoxVisual({
  sloganLine1 = "आपकी राय",
  sloganLine2 = "देश की ताकत है",
}: {
  sloganLine1?: string;
  sloganLine2?: string;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center p-2 text-center select-none">
      {/* 3D Ballot Box with Aura & Confetti */}
      <div className="relative w-40 h-36 sm:w-44 sm:h-40 lg:w-48 lg:h-44 flex items-center justify-center">
        <svg
          viewBox="0 0 240 220"
          className="w-full h-full drop-shadow-sm overflow-visible"
          aria-hidden="true"
        >
          <defs>
            {/* Radial soft cyan/sky glow */}
            <radialGradient id="ballotAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#e0f2fe" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#f0f9ff" stopOpacity="0" />
            </radialGradient>

            {/* Gradients for 3D box faces */}
            <linearGradient id="topFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bfdbfe" />
              <stop offset="100%" stopColor="#93c5fd" />
            </linearGradient>

            <linearGradient id="frontFaceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#eff6ff" />
              <stop offset="100%" stopColor="#dbeafe" />
            </linearGradient>

            <linearGradient id="rightFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Ballot paper gradient */}
            <linearGradient id="paperGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>

            {/* Drop shadow for ballot paper */}
            <filter id="boxShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0284c7" floodOpacity="0.2" />
            </filter>
            <filter id="paperShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Background Aura */}
          <circle cx="120" cy="115" r="95" fill="url(#ballotAura)" />

          {/* Floating festive confetti */}
          {/* Confetti: Orange bars & dots */}
          <rect x="36" y="55" width="4.5" height="12" rx="2" fill="#f97316" transform="rotate(-32 36 55)" />
          <rect x="195" y="65" width="4.5" height="12" rx="2" fill="#f97316" transform="rotate(38 195 65)" />
          <circle cx="34" cy="98" r="3.5" fill="#f97316" />
          <rect x="202" y="125" width="4" height="10" rx="2" fill="#ea580c" transform="rotate(-25 202 125)" />

          {/* Confetti: Green bars & dots */}
          <rect x="145" y="24" width="4.5" height="11" rx="2" fill="#10b981" transform="rotate(22 145 24)" />
          <rect x="42" y="132" width="4.5" height="11" rx="2" fill="#10b981" transform="rotate(40 42 132)" />
          <circle cx="192" cy="160" r="3.5" fill="#10b981" />

          {/* Confetti: Royal Blue bars & dots */}
          <rect x="85" y="32" width="4" height="10" rx="2" fill="#2563eb" transform="rotate(-20 85 32)" />
          <rect x="178" y="42" width="4" height="11" rx="2" fill="#3b82f6" transform="rotate(-45 178 42)" />
          <circle cx="68" cy="48" r="3" fill="#60a5fa" />
          <circle cx="168" cy="178" r="3.5" fill="#38bdf8" />

          {/* 3D Isometric Ballot Box Container */}
          <g filter="url(#boxShadow)">
            {/* Paper Ballot entering the slot */}
            <g filter="url(#paperShadow)">
              {/* White ballot card */}
              <polygon
                points="88,68 152,44 152,104 88,128"
                fill="url(#paperGrad)"
                stroke="#e2e8f0"
                strokeWidth="1.2"
              />
              {/* Green checkmark badge on ballot paper */}
              <g transform="translate(120, 84)">
                <circle cx="0" cy="0" r="14" fill="#22c55e" />
                <path
                  d="M-5 -0.5 L-1.5 3.5 L5.5 -3.5"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            </g>

            {/* Box Top Face */}
            <polygon
              points="120,95 185,124 120,152 55,124"
              fill="url(#topFaceGrad)"
              stroke="#93c5fd"
              strokeWidth="0.8"
            />

            {/* Box Slot on Top Face */}
            <polygon
              points="94,124 146,124 144,128 92,128"
              fill="#1e3a8a"
              opacity="0.85"
            />

            {/* Box Front Face (Left Perspective) */}
            <polygon
              points="55,124 120,152 120,202 55,174"
              fill="url(#frontFaceGrad)"
              stroke="#bfdbfe"
              strokeWidth="0.8"
            />

            {/* "VOTER SURVEY" text on the front face */}
            <g transform="translate(87, 168) skewY(23.5) scale(0.9, 0.9)">
              <text
                x="0"
                y="-5"
                textAnchor="middle"
                fill="#1e3a8a"
                fontSize="12.5"
                fontWeight="900"
                letterSpacing="0.8"
                fontFamily="sans-serif"
              >
                VOTER
              </text>
              <text
                x="0"
                y="9"
                textAnchor="middle"
                fill="#1e3a8a"
                fontSize="11.5"
                fontWeight="900"
                letterSpacing="0.8"
                fontFamily="sans-serif"
              >
                SURVEY
              </text>
            </g>

            {/* Box Right Face (Side Perspective) */}
            <polygon
              points="120,152 185,124 185,174 120,202"
              fill="url(#rightFaceGrad)"
              stroke="#60a5fa"
              strokeWidth="0.8"
            />
          </g>
        </svg>
      </div>

      {/* Slogan with Orange Swoosh Underline */}
      <div className="mt-1.5 text-center">
        <p className="font-display text-sm sm:text-base font-bold text-slate-800 leading-snug">
          {sloganLine1}
        </p>
        <div className="relative inline-block mt-0.5">
          <p className="font-display text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
            {sloganLine2}
          </p>
          <svg
            className="w-full h-2 text-orange-500 mt-0.5 overflow-visible"
            viewBox="0 0 160 12"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M3 7 C 42 1.5, 118 1.5, 157 8"
              stroke="currentColor"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
});
