'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  /** Extra classes for the inner content wrapper (default: block). Pass `flex flex-1 flex-col` to let children like `flex-1`/`mt-auto` fill the card height. */
  contentClassName?: string;
}

export const GlowCard = ({
  children,
  className = '',
  glowColor = 'rgba(99, 102, 241, 0.15)',
  contentClassName,
}: GlowCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gray-100 bg-white transition-colors duration-300 hover:border-indigo-200',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${glowColor}, transparent 40%)`,
        }}
      />
      <div className={cn('relative z-10', contentClassName)}>{children}</div>
    </div>
  );
};
