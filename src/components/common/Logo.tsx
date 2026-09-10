import { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { INSTITUTION_NAME } from '@/data/mockData';

interface LogoProps {
  className?: string;
}

/**
 * CAIAS brand mark.
 * Drop the official logo at /public/logo.png and it will be picked up
 * automatically — until then a clean monogram fallback is shown.
 */
export default function Logo({ className = 'h-10 w-10' }: LogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!imgFailed) {
    return (
      <img
        src="/logo.png"
        alt={`${INSTITUTION_NAME} logo`}
        onError={() => setImgFailed(true)}
        className={`${className} rounded-xl object-contain`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${className} flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-sky-600 shadow-[0_6px_16px_-6px_rgba(37,99,235,0.6)] ring-1 ring-white/20`}
    >
      <GraduationCap className="h-[55%] w-[55%] text-white" />
    </span>
  );
}
