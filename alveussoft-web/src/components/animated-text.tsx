'use client';
import { motion } from 'framer-motion';

export function AnimatedText({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={{
        hidden: {
          opacity: 0,
          y: 30,
          filter: 'blur(8px)',
        },
        visible: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: {
            duration: 0.6,
            ease: 'easeOut',
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

