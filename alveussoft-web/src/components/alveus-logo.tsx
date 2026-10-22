"use client"

import { motion } from "framer-motion"

interface HexagonLogoProps {
  size?: number
  className?: string
}

export default function HexagonLogo({ size = 120, className = "" }: HexagonLogoProps) {
  // Hexagon path for SVG
  const hexagonPath = "M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z"

  // Animation variants for each hexagon
  const hexagonVariants = {
    hidden: {
      scale: 0,
      rotate: -180,
      opacity: 0,
    },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
      },
    },
  }

  // Container animation
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const hexSize = size * 0.3
  const triangleHeight = size * 0.24
  const triangleWidth = size * 0.3

  return (
    <motion.div
      className={`inline-flex items-center justify-center ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="relative" style={{ width: size, height: size }}>
        <motion.div
          className="absolute"
          style={{
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: hexSize,
            height: hexSize,
          }}
          variants={hexagonVariants}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="hexGradient1" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F1C928" />
                <stop offset="100%" stopColor="#FF6B35" />
              </linearGradient>
            </defs>
            <path d={hexagonPath} fill="url(#hexGradient1)" className="drop-shadow-xl" />
            {/* <path d={hexagonPath} fill="none" stroke="#E6B800" strokeWidth="2" className="lg:block hidden" /> */}
          </svg>
        </motion.div>

        <motion.div
          className="absolute"
          style={{
            top: triangleHeight,
            left: `calc(50% - ${triangleWidth / 2}px)`,
            transform: "translateX(-50%)",
            width: hexSize,
            height: hexSize,
          }}
          variants={hexagonVariants}
        >
          <svg viewBox="-4 1 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="hexGradient2" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F1C928" />
                <stop offset="100%" stopColor="#FF6B35" />
              </linearGradient>
            </defs>
            <path d={hexagonPath} fill="url(#hexGradient2)" className="drop-shadow-xl" />
            {/* <path d={hexagonPath} fill="none" stroke="#E6B800" strokeWidth="2" className="lg:block hidden" /> */}
          </svg>
        </motion.div>

        <motion.div
          className="absolute"
          style={{
            top: triangleHeight,
            left: `calc(50% + ${triangleWidth / 2}px)`,
            transform: "translateX(-50%)",
            width: hexSize,
            height: hexSize,
          }}
          variants={hexagonVariants}
        >
          <svg viewBox="4 1 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="hexGradient3" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F1C928" />
                <stop offset="100%" stopColor="#FF6B35" />
              </linearGradient>
            </defs>
            <path d={hexagonPath} fill="url(#hexGradient3)" className="drop-shadow-xl" />
            {/* <path d={hexagonPath} fill="none" stroke="#E6B800" strokeWidth="2"  className="lg:block hidden"/> */}
          </svg>
        </motion.div>
      </div>
    </motion.div>
  )
}
