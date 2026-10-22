"use client"; // Importante: seguimos en el cliente.

import React, { useEffect, useState } from "react";
import Link from "next/link";
// 1. 🛸 Importamos 'motion' para animaciones avanzadas y de alto rendimiento
import { motion } from "framer-motion"; 
import { Button } from "@/components/ui/button";
import { TextEffect } from "@/components/ui/text-effect";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { HeroHeader } from "./header";
import LogoCloud from "./logo-cloud";

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: "blur(12px)", y: 12 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { type: "spring" as const, bounce: 0.3, duration: 1.5 },
    },
  },
};

// 🛠️ 2. Nueva interfaz para los datos de las Estrellas Fugaces
interface ShootingStar {
  id: number;
  startX: number; // Posición X de inicio (en %)
  startY: number; // Posición Y de inicio (en %)
  duration: number; // Qué tan rápido cruza (en segundos, valor bajo = rápido)
  delay: number; // Cuánto espera antes de salir (en segundos)
}

export default function HeroSection() {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 🎇 3. Estado para nuestras estrellas. ¡Subimos la intensidad a 30!
  const [stars, setStars] = useState<ShootingStar[]>([]);

  useEffect(() => {
    // Evitamos hydration error generando datos aleatorios solo en el cliente
    // ¡Subimos de 20 a 30 estrellas para más intensidad!
    const generatedStars = [...Array(30)].map((_, i) => ({
      id: i,
      // 🎲 Valores aleatorios para que no salgan todas del mismo sitio ni a la vez
      startX: Math.random() * 80 + 10, // Entre 10% y 90% del ancho
      startY: Math.random() * 40 + 5,  // Entre 5% y 45% del alto (mitad superior)
      duration: 0.8 + Math.random() * 1.5, // ¡MUY RÁPIDO! Entre 0.8s y 2.3s
      delay: Math.random() * 10, // Esparcimos los inicios en un ciclo de 10s
    }));
    
    setStars(generatedStars);

    const timer = setTimeout(() => setIsAnimating(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <HeroHeader />
      <main className="relative overflow-hidden bg-[#0c0a09]">
        
        {/* === CAPAS DE FONDO Y DEGRADADOS (SIN CAMBIOS) === */}
        <div className="absolute inset-0 bg-[#0c0a09]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-gray-900/10 to-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/2 to-gray-800/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-400/3 via-transparent to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-gray-700/5 via-transparent to-transparent"></div>

        {/* Patrón de puntos (SIN CAMBIOS) */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)",
            backgroundSize: "50px 50px",
          }}
        ></div>

        {/* === EFECTOS DE LUZ DINÁMICOS === */}
        <div className="absolute inset-0 pointer-events-none">
          
          {/* Luz cónica, Haz principal, Resplandor y Barrido (SIN CAMBIOS) */}
          <div className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${isAnimating ? "opacity-100" : "opacity-0"}`} style={{background: `conic-gradient(from 315deg at 100% 0%, transparent 0deg, rgba(200, 200, 210, 0.1) 30deg, rgba(220, 220, 230, 0.15) 45deg, rgba(200, 200, 210, 0.1) 60deg, transparent 90deg)`}}/>
          <div className={`absolute top-0 left-0 w-full h-full transition-all duration-2000 ${isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"}`} style={{background: `linear-gradient(225deg, rgba(220, 220, 230, 0.15) 0%, rgba(210, 210, 220, 0.1) 25%, rgba(200, 200, 210, 0.05) 50%, transparent 70%)`}}/>
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 transition-all duration-3000 ${isAnimating ? "opacity-25 scale-100" : "opacity-0 scale-50"}`} style={{background: "radial-gradient(circle, rgba(220, 220, 230, 0.2) 0%, transparent 70%)", filter: "blur(20px)"}}/>
          <div className={`absolute top-0 left-0 w-full h-full transition-all duration-1000 ${isAnimating ? "opacity-100" : "opacity-0"}`}><div className="absolute top-0 left-0 w-full h-full animate-spin" style={{background: `conic-gradient(from 315deg at 100% 0%, transparent 0deg, rgba(200, 200, 210, 0.08) 10deg, rgba(220, 220, 230, 0.12) 20deg, rgba(200, 200, 210, 0.08) 30deg, transparent 40deg)`, animationDuration: "8s", transformOrigin: "100% 0%"}}/></div>

          {/* ✨ 4. ✨ NUEVA SECCIÓN DE ESTRELLAS FUGACES ✨ */}
          {/* Mapeamos el estado 'stars' usando 'motion.div' para animación por hardware */}
          {stars.map((star) => (
            <motion.div
              key={star.id}
              // Estilo de la estrella: un trazo largo (w-[120px] h-px) con degradado
              className="absolute h-px w-[120px] bg-gradient-to-r from-white via-white/50 to-transparent rounded-full opacity-0"
              style={{
                // Posición inicial aleatoria
                left: `${star.startX}%`,
                top: `${star.startY}%`,
                // Inclinación diagonal súper importante para que parezca que caen
                rotate: -35, 
              }}
              // 🔄 5. La magia de la animación:
              animate={{
                // Movimiento diagonal rápido (Framer calcula la diagonal por la rotación CSS)
                x: ["0%", "400%"], 
                y: ["0%", "300%"],
                // Ciclo de opacidad: invisible -> brillante -> invisible
                opacity: [0, 1, 1, 0], 
              }}
              transition={{
                duration: star.duration, // Duración aleatoria rápida
                delay: star.delay, // Retraso aleatorio para el primer inicio
                repeat: Infinity, // Bucle infinito
                ease: "linear", // Velocidad constante y directa (estilo meteoro)
                // Espera aleatoria entre 2s y 7s antes de volver a "dispararse"
                repeatDelay: Math.random() * 5 + 2, 
              }}
            />
          ))}

        </div>

        {/* === CONTENIDO PRINCIPAL (SIN CAMBIOS) === */}
        <section className="flex flex-col justify-center items-center lg:pt-32 pt-60 pb-6 z-10">
          <div className="flex w-full max-w-6xl flex-col px-6 lg:flex-row">
            <div className="flex-1 flex flex-col justify-start text-center lg:pt-40">
              <h1 className="text-3xl md:text-5xl xl:text-6xl font-medium text-white">
                <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">Eficiencia y tecnología</TextEffect>
                <br />
                <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">para tu</TextEffect>{" "}
                <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span" className="text-amber-400">éxito</TextEffect>
              </h1>
              <TextEffect per="line" preset="fade-in-blur" speedSegment={0.3} delay={0.5} as="p" className="mt-4 md:mt-6 text-gray-300 text-base md:text-lg max-w-xl mx-auto  italic px-4 md:px-0">
                "El único modo de hacer un gran trabajo es amar lo que haces" - Steve Jobs
              </TextEffect>
              <AnimatedGroup variants={{container: {visible: {transition: {staggerChildren: 0.05, delayChildren: 0.75}}}, ...transitionVariants}} className="mt-6 md:mt-8 flex flex-col items-center lg:pb-8 pb-24 gap-4 w-full">
                <div className="bg-amber-400/20 rounded-xl border border-amber-400/30">
                  <Button asChild size="lg" className="rounded-xl px-6 text-base bg-amber-500 hover:bg-amber-600 text-white">
                    <Link href="https://wa.link/pxcv82" target="_blank">¡Hablemos ya!</Link>
                  </Button>
                </div>
              </AnimatedGroup>
            </div>
          </div>
          <div className="mt-1 mx-auto max-w-[400px] flex justify-center sm:translate-x-2 md:mt-2 md:max-w-[800px] md:scale-x-102 lg:max-w-[1200px]">
            <LogoCloud />
          </div>
        </section>
      </main>
    </>
  );
}