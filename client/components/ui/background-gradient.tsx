'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export function BackgroundGradient({
  children,
  className = '',
  containerClassName = '',
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };

    const draw = () => {
      time += 0.005;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;

      ctx.clearRect(0, 0, w, h);

      // Create gradient orbs
      const orbs = [
        { x: w * 0.2, y: h * 0.3, r: w * 0.4, color: 'rgba(99, 102, 241, 0.15)' },
        { x: w * 0.8, y: h * 0.7, r: w * 0.35, color: 'rgba(168, 85, 247, 0.12)' },
        { x: w * 0.5, y: h * 0.1, r: w * 0.3, color: 'rgba(236, 72, 153, 0.08)' },
      ];

      orbs.forEach((orb, i) => {
        const offsetX = Math.sin(time + i * 1.5) * 20;
        const offsetY = Math.cos(time + i * 1.2) * 15;

        const gradient = ctx.createRadialGradient(
          orb.x + offsetX, orb.y + offsetY, 0,
          orb.x + offsetX, orb.y + offsetY, orb.r
        );
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className={`relative ${containerClassName}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.8 }}
      />
      <div className={`relative z-10 ${className}`}>
        {children}
      </div>
    </div>
  );
}