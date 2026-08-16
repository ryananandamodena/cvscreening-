import React from 'react';

// The Humaniq brand mark (two linked pillars + a hug-arc + a head accent). Kept as one
// component so every place the app shows the logo — sidebar, login, favicon-adjacent UI —
// stays pixel-identical instead of each screen hand-rolling its own icon-in-a-box.
const HumaniqMark: React.FC<{ size?: number; className?: string }> = ({ size = 24, className }) => {
  // Unique per instance so two marks on the same page (e.g. a future style-guide view) never
  // share/collide on gradient ids.
  const uid = React.useId();
  const leftId = `humaniq-mark-l-${uid}`;
  const rightId = `humaniq-mark-r-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" className={className} role="img" aria-label="Humaniq">
      <defs>
        <linearGradient id={leftId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B82F6" /><stop offset="1" stopColor="#0B4DDB" />
        </linearGradient>
        <linearGradient id={rightId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2DD4BF" /><stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect x="14" y="10" width="24" height="100" rx="12" fill={`url(#${leftId})`} />
      <rect x="82" y="10" width="24" height="100" rx="12" fill={`url(#${rightId})`} />
      <path d="M20 58 Q60 84 100 58 L100 70 Q60 96 20 70 Z" fill="#60A5FA" opacity="0.95" />
      <circle cx="60" cy="44" r="16" fill="#0B4DDB" />
    </svg>
  );
};

export default HumaniqMark;
