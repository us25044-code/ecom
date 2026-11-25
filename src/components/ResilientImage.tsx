import React, { useState } from 'react';
import { Footprints } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#FBF5EA] text-[#132238]/60 p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Footprints className="w-8 h-8 mb-2 text-[#1E5AA8]" strokeWidth={1.5} />
        <span className="text-xs font-medium text-[#5A5D65]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
