'use client';

import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}

export const TextGenerateEffect = ({
  words,
  className = '',
  filter = true,
  duration = 0.5,
}: TextGenerateEffectProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const wordsArray = words.split(' ');

  return (
    <div ref={ref} className={className}>
      <span className="sr-only">{words}</span>
      <motion.span
        className="inline"
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
      >
        {wordsArray.map((word, idx) => (
          <motion.span
            key={idx}
            className="inline-block"
            variants={{
              hidden: {
                opacity: 0,
                filter: filter ? 'blur(8px)' : 'blur(0px)',
              },
              visible: {
                opacity: 1,
                filter: filter ? 'blur(0px)' : 'blur(0px)',
              },
            }}
            transition={{
              duration,
              delay: idx * 0.08,
              ease: 'easeOut',
            }}
          >
            {word}{' '}
          </motion.span>
        ))}
      </motion.span>
    </div>
  );
};
