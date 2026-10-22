"use client"

import { motion, easeOut } from "framer-motion"
import { ReactNode } from "react"

type Props = {
  children: ReactNode
  delay?: number
}

export const AnimatedFadeScale = ({ children, delay = 0 }: Props) => {
  const variants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
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
