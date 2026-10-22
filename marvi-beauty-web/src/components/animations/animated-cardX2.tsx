'use client';
import { motion } from 'framer-motion';

export function AnimatedCardX2({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: { opacity: 0, x: 50 },
        visible: {
          opacity: 1,
          x: 0,
          transition: {
            duration: 0.6,
            ease: 'easeOut',
            delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
