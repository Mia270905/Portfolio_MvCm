"use client";

import React from "react";
import Image from "next/image";
import { Shield, Eye, Scale, Target, Headphones, Heart, Clock, Wrench, Lock, Award } from "lucide-react";

import valuesImg from "@/assets/values.png";

/* Colores base */
const GOLD = "#c6a365";
const BG_SOFT = "#faf8f3";

const values = [
  { text: "Defensa real, sin rodeos.", icon: Shield },
  { text: "Claridad desde el primer día.", icon: Eye },
  { text: "Estrategia antes que conflicto.", icon: Scale },
  { text: "Compromiso con el resultado.", icon: Target },
  { text: "Atención directa.", icon: Headphones },
  { text: "Honestidad sobre escenarios reales.", icon: Heart },
  { text: "Respuesta y seguimiento constante.", icon: Clock },
  { text: "Soluciones prácticas, no complicaciones legales.", icon: Wrench },
  { text: "Trato humano y confidencial.", icon: Lock },
  { text: "Experiencia en juicio.", icon: Award },
];

export default function AboutUsSection() {
  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: BG_SOFT }}>
      <div className="mx-auto max-w-6xl px-6">

        {/* Header */}
        <header className="max-w-3xl mx-auto text-center mb-20">
          <h2
            className="font-serif text-4xl md:text-5xl font-semibold mb-6"
            style={{ color: GOLD }}
          >
            Generando soluciones legales desde el 2019
          </h2>

          <div
            className="w-20 h-1 mx-auto mb-6"
            style={{ backgroundColor: GOLD }}
          />

          <p className="text-neutral-700 text-lg leading-relaxed">
            Somos un equipo dedicado a proporcionar soluciones legales efectivas y
            personalizadas para nuestros clientes.
          </p>
        </header>

        {/* Misión y Visión */}
        <div className="grid gap-10 md:grid-cols-2 mb-28">
          <div className="bg-white rounded-2xl border shadow-sm p-8">
            <h3
              className="text-2xl font-serif font-semibold mb-4"
              style={{ color: GOLD }}
            >
              Misión
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              <span className="font-semibold" style={{ color: GOLD }}>
                Parley
              </span>{" "}
              ofrece sus servicios a personas, empresas y profesionistas en todas las áreas del derecho,
              buscando soluciones inmediatas a toda clase de problemas.
            </p>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-8">
            <h3
              className="text-2xl font-serif font-semibold mb-4"
              style={{ color: GOLD }}
            >
              Visión
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              <span className="font-semibold" style={{ color: GOLD }}>
                Parley
              </span>{" "}
              busca consolidarse como un referente nacional en la solución de
              problemas legales, impulsado por la innovación y la mejora
              continua.
            </p>
          </div>
        </div>

        {/* Valores - CON ICONOS */}
        <div className="bg-white rounded-2xl border shadow-sm mb-28 overflow-hidden">
          {/* Contenedor principal sin padding */}
          <div className="grid lg:grid-cols-5">
            {/* Sección de texto con padding */}
            <div className="lg:col-span-3 p-10">
              <h3
                className="text-center text-3xl md:text-4xl font-serif font-semibold mb-12"
                style={{ color: GOLD }}
              >
                Valores
              </h3>
            
              <div className="grid gap-3 sm:grid-cols-2">
                {values.map((value, index) => {
                  const IconComponent = value.icon;
                  return (
                    <div
                      key={index}
                      className="group flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-300"
                      style={{ color: GOLD }}
                    >
                      <div 
                        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                        style={{ backgroundColor: `${GOLD}15` }}
                      >
                        <IconComponent className="w-4 h-4" style={{ color: GOLD }} />
                      </div>
                      <p className="font-medium text-sm leading-tight">
                        {value.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sección de imagen SIN PADDING */}
            <div className="lg:col-span-2 relative overflow-hidden">
              <div className="h-full w-full">
                <Image
                  src={valuesImg}
                  alt="Valores Parley"
                  className="object-cover w-full h-full"
                  width={800}
                  height={900}
                  style={{
                    objectPosition: "center"
                  }}
                />
                {/* Overlay dorado sutil en bordes */}
                <div 
                  className="absolute inset-0"
                  style={{
                    boxShadow: "inset 0 0 0 1px rgba(198, 163, 101, 0.1)"
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* EQUIPO NO SE TOCA */}
        {/* <TeamMemberCard /> */}

      </div>
    </section>
  );
}