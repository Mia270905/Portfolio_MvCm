'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  direction?: 'left' | 'right'
}

export default function AnimatedSection({ children, direction = 'left' }: Props) {
  const xOffset = direction === 'left' ? -120 : 120

  return (
    <motion.section
      initial={{ x: xOffset }}
      whileInView={{ x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      viewport={{ once: false, amount: 0.3 }}
      style={{ willChange: 'transform' }}
    >
      {children}
    </motion.section>
  )
}

