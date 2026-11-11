import React from 'react';

export function WaveDivider() {
  return (
    <div className="relative w-full overflow-hidden leading-none z-10 -mt-1 bg-[#F7F1E7]">
      <svg
        className="w-full h-16 sm:h-24 lg:h-32 block"
        viewBox="0 0 1440 180"
        fill="none"
        preserveAspectRatio="none"
      >
        {/* Soft background curve layer */}
        <path
          d="M0,90 C320,160 540,40 880,100 C1180,150 1340,90 1440,70 L1440,180 L0,180 Z"
          fill="#FAF6EE"
        />
        {/* Dark Navy Ribbon Sweep (As in reference image) */}
        <path
          d="M0,140 C280,120 460,165 720,140 C1040,110 1280,170 1440,135 L1440,165 C1280,195 1040,140 720,165 C460,190 280,150 0,165 Z"
          fill="#102D50"
        />
        {/* Foreground transition into Features ivory background */}
        <path
          d="M0,165 C360,150 720,175 1080,160 C1240,152 1360,165 1440,162 L1440,180 L0,180 Z"
          fill="#FCF9F3"
        />
      </svg>
    </div>
  );
}

