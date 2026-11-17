'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export interface AnimatedTooltipItem {
  id: number;
  name: string;
  designation: string;
  image: string;
}

export const AnimatedTooltip = ({
  items,
}: {
  items: AnimatedTooltipItem[];
}) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <div className="relative flex flex-row items-center justify-center pb-2">
      {items.map((item, idx) => (
        <div
          className="group relative -mr-2.5 sm:-mr-3.5 cursor-pointer"
          key={item.name}
          style={{ zIndex: hoveredId === item.id ? 60 : items.length - idx }}
          onMouseEnter={() => setHoveredId(item.id)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <AnimatePresence>
            {hoveredId === item.id && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: 'spring',
                    stiffness: 350,
                    damping: 22,
                  },
                }}
                exit={{
                  opacity: 0,
                  y: -6,
                  scale: 0.95,
                  transition: { duration: 0.15 },
                }}
                className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 flex -translate-x-1/2 flex-col items-center justify-center whitespace-nowrap rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs shadow-2xl"
              >
                {/* Arrow pointing up */}
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 rounded-sm bg-slate-900 border-l border-t border-slate-800" />

                <div className="relative z-30 font-bold text-white">
                  {item.name}
                </div>
                <div className="relative z-30 text-[11px] font-medium text-indigo-400">
                  {item.designation}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            whileHover={{ scale: 1.15, y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="relative h-11 w-11 sm:h-12 sm:w-12 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-md transition-shadow group-hover:shadow-lg group-hover:ring-2 group-hover:ring-indigo-500/50"
          >
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="48px"
              className="object-cover object-top"
            />
          </motion.div>
        </div>
      ))}
    </div>
  );
};
