'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { easeOut } from 'framer-motion'

type Props = {
  children: ReactNode
  delay?: number
  blurOnEnter?: boolean
}

export const AnimatedFadeIn = ({
  children,
  delay = 0,
  blurOnEnter = false,
}: Props) => {
  const variants = {
    hidden: {
      opacity: 0,
      y: 20,
      ...(blurOnEnter && { filter: 'blur(8px)' }),
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.6,
        ease: easeOut,
        delay,
      },
    },
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}
