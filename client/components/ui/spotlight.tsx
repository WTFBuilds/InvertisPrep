'use client';

import { useRef, useEffect } from 'react';

interface SpotlightProps {
  className?: string;
  spotlightClassName?: string;
  gradientFirst?: string;
  gradientSecond?: string;
  gradientThird?: string;
  translateX?: number;
  translateY?: number;
  spread?: number;
}

export const Spotlight = ({
  className = '',
  spotlightClassName = '',
  gradientFirst = 'radial-gradient(68.54% 68.72% at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50.11%)',
  gradientSecond = 'radial-gradient(50% 50% at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50.11%)',
  gradientThird = 'radial-gradient(80% 60% at 50% 0%, rgba(139, 92, 246, 0.12) 0%, transparent 50%)',
  translateX = 50,
  translateY = 50,
  spread = 80,
}: SpotlightProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const spotlight = spotlightRef.current;
    if (!container || !spotlight) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      spotlight.style.opacity = '1';
      spotlight.style.background = `
        radial-gradient(
          ${spread}% ${spread}% at ${x}px ${y}px,
          rgba(99, 102, 241, 0.08),
          transparent 70%
        )
      `;
    };

    const handleMouseLeave = () => {
      spotlight.style.opacity = '0';
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [spread]);

  return (
    <div className={className}>
      {/* Static gradient overlays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: gradientFirst,
          transform: `translate(${translateX}%, ${translateY}%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: gradientSecond,
          transform: `translate(${translateX}%, ${translateY}%)`,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: gradientThird,
          transform: `translate(${translateX}%, ${translateY}%)`,
        }}
      />
      {/* Mouse-following spotlight */}
      <div
        ref={spotlightRef}
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${spotlightClassName}`}
        style={{ opacity: 0 }}
      />
    </div>
  );
};
