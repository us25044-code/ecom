import React from 'react';

interface GrowStepLogoProps {
  variant?: 'compact' | 'full' | 'light';
  className?: string;
}

export const GrowStepLogo: React.FC<GrowStepLogoProps> = ({
  variant = 'full',
  className = '',
}) => {
  const isLight = variant === 'light';
  const primaryFill = isLight ? '#FFFFFF' : '#132238';
  const stepAccent = '#1E5AA8';
  const warmAccent = '#C26D3A';

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 ${className}`}>
        <svg
          width="30"
          height="30"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <rect width="40" height="40" rx="8" fill="#132238" />
          <path
            d="M9 28.5C9 23.8056 12.8056 20 17.5 20H30V24.5H17.5C15.2909 24.5 13.5 26.2909 13.5 28.5V30H9V28.5Z"
            fill="#FFFFFF"
          />
          <path
            d="M16 18C16 13.3056 19.8056 9.5 24.5 9.5H30V14H24.5C22.2909 14 20.5 15.7909 20.5 18H16Z"
            fill={stepAccent}
          />
          <circle cx="13" cy="13.5" r="2.5" fill={warmAccent} />
        </svg>
        <span className="font-display text-xl font-bold tracking-tight text-[#132238]">
          GrowStep
        </span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg
        width="36"
        height="36"
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          width="40"
          height="40"
          rx="8"
          fill={isLight ? '#1E3352' : '#132238'}
        />
        <path
          d="M9 28.5C9 23.8056 12.8056 20 17.5 20H30V24.5H17.5C15.2909 24.5 13.5 26.2909 13.5 28.5V30H9V28.5Z"
          fill="#FFFFFF"
        />
        <path
          d="M16 18C16 13.3056 19.8056 9.5 24.5 9.5H30V14H24.5C22.2909 14 20.5 15.7909 20.5 18H16Z"
          fill={stepAccent}
        />
        <circle cx="13" cy="13.5" r="2.5" fill={warmAccent} />
      </svg>
      <div className="flex flex-col leading-none">
        <span
          className="font-display text-xl font-bold tracking-tight"
          style={{ color: primaryFill }}
        >
          GrowStep
        </span>
        <span
          className={`text-[11px] font-medium tracking-wide mt-1 ${
            isLight ? 'text-[#FBF7F0]/75' : 'text-[#5A5D65]'
          }`}
        >
          Grow Confidently
        </span>
      </div>
    </div>
  );
};
