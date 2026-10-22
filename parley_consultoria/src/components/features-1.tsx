"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ChevronDown } from "lucide-react";
import Image from "next/image";

/* Colores base */
const GOLD = "#c6a365";
const GOLD_SOFT = "#f5efe6";

/* Servicios principales */
const mainServices = [
  {
    image: "/assets/landing/mazo_servicios.png",
    title: "Asesorías y Juicios personales",
    details: [
      { text: "Trámites legales de toda clase." },
      { text: "Elaboración de contratos de toda clase." },
      {
        text: "Tramitación de juicios:",
        subDetails: [
          "Familiares.",
          "Penales.",
          "Civiles.",
          "Mercantiles.",
          "Laborales.",
          "Apelaciones.",
          "Amparos.",
        ],
      },
    ],
  },
  {
    image: "/assets/landing/documento_servicios.png",
    title: "Consultoría Empresarial",
    details: [
      "Asesoría y consultoría para profesionistas y empresas.",
      "Registros de marcas.",
      "Regulación normativa.",
      "Gestión derecho laboral.",
      "Protección contractual.",
      "Blindaje jurídico en todas las áreas.",
    ],
  },
  {
    image: "/assets/landing/carpeta_512.png",
    title: "Recuperación de Créditos y Préstamos",
    details: [
      "Cobranza extrajudicial.",
      "Cobranza judicial.",
      "Gestión de carteras vencidas.",
    ],
  },
];

/* Contadores */
const counters = [
  { target: 500, suffix: "+", label: "Juicios en favor\nde nuestros clientes." },
  { target: 100, suffix: "+", label: "Profesionistas,\nempresas locales y\nnacionales." },
  { target: 600, suffix: "+", label: "Marcas supervisadas\na nivel nacional." },
  { prefix: "$", target: 5, suffix: " MM", label: "Recuperados en 2025\npor créditos y\npréstamos vencidos." },
];

function useCountUp(target: number, duration = 2000, shouldStart: boolean) {
  const [count, setCount] = React.useState(0);
  const hasStarted = React.useRef(false);

  React.useEffect(() => {
    if (!shouldStart || hasStarted.current) return;
    hasStarted.current = true;

    const startTime = performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, shouldStart]);

  return count;
}

function CounterItem({ prefix, target, suffix, label }: { prefix?: string; target: number; suffix: string; label: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const count = useCountUp(target, 2000, isVisible);

  return (
    <div ref={ref} className="flex flex-col items-center text-center px-4">
      <span className="text-4xl md:text-5xl font-bold" style={{ color: "#4a1518" }}>
        {prefix ?? ""}{count}{suffix}
      </span>
      <span className="mt-2 text-sm md:text-base whitespace-pre-line" style={{ color: "#4a1518" }}>
        {label}
      </span>
    </div>
  );
}

/* Card controlada */
type CardProps = {
  icon?: React.ElementType;
  image?: string;
  title: string;
  description?: string;
  details: (string | { text: string; subDetails?: string[] })[];
  isOpen: boolean;
  onToggle: () => void;
};

const AnimatedExpandableCard = ({
  icon: Icon,
  image,
  title,
  description,
  details,
  isOpen,
  onToggle,
}: CardProps) => {
  return (
    <Card
      onClick={onToggle}
      className={`cursor-pointer rounded-2xl border transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-xl ${isOpen ? "h-auto" : "h-[260px]"}`}
      style={{ borderColor: GOLD, background: "white" }}
    >
      <CardContent className="p-6 text-center relative overflow-hidden h-full flex flex-col">
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle at top, rgba(198,163,101,0.15), transparent 70%)",
          }}
        />

        <div className="relative">
          {image ? (
            <div className="relative -mt-10 mb-2 flex justify-center">
              <Image
                src={image || "/placeholder.svg"}
                alt={title}
                width={140}
                height={140}
                className="object-contain"
              />
            </div>
          ) : Icon ? (
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform duration-500"
              style={{
                background: GOLD_SOFT,
                transform: isOpen ? "scale(1.1)" : "scale(1)",
              }}
            >
              <Icon className="h-9 w-9" style={{ color: GOLD }} />
            </div>
          ) : null}

          <h3 className="font-semibold text-lg text-neutral-900">{title}</h3>

          {description && (
            <p className="mt-2 text-sm text-neutral-600">{description}</p>
          )}
        </div>

        <div className="flex-1" />

        <div
          className={`overflow-hidden transition-all duration-500 ${
            isOpen ? "max-h-72 opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <ul className="space-y-2 text-sm text-left">
            {details.map((item, i) => {
              const isObject = typeof item === "object";

              return (
                <li key={i} className="text-neutral-700">
                  <div className="flex items-start gap-3">
                    <CheckCircle
                      className="h-4 w-4 shrink-0 mt-0.5"
                      style={{
                        color: GOLD,
                        minWidth: "16px",
                        minHeight: "16px",
                      }}
                    />
                    <span>{isObject ? item.text : item}</span>
                  </div>

                  {isObject && item.subDetails && (
                    <ul className="mt-2 ml-7 list-disc space-y-1 text-neutral-600">
                      {item.subDetails.map((sub, j) => (
                        <li key={j}>{sub}</li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4 flex justify-center relative">
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-500 ${
              isOpen ? "rotate-180" : ""
            }`}
            style={{ color: GOLD }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default function FeaturesCards() {
  const [openService, setOpenService] = React.useState<string | null>(null);
  const [openSpecialization, setOpenSpecialization] =
    React.useState<string | null>(null);

  return (
    <section className="py-20 bg-[#faf8f3]">
      {/* 
        CLAVE: Usamos exactamente el mismo contenedor que la FAQ:
        max-w-6xl + px-4 sm:px-6 lg:px-8
        Esto garantiza que los márgenes laterales sean idénticos.
      */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Nuestros Servicios */}
        <div className="mt-20">
          <h2 className="text-center text-4xl sm:text-5xl font-bold leading-[1.15] tracking-tight text-gray-600 mb-12">
            Nuestros{" "}
            <span className="text-[#c4a87c]">Servicios</span>
          </h2>

          <div className="grid gap-6 md:grid-cols-3 items-start">
            {mainServices.map((s) => (
              <AnimatedExpandableCard
                key={s.title}
                {...s}
                isOpen={openService === s.title}
                onToggle={() =>
                  setOpenService(prev =>
                    prev === s.title ? null : s.title
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* Áreas de Especialización */}
        <div id="areas" className="mt-28 scroll-mt-20">
          <h2 className="text-center text-4xl sm:text-5xl font-bold leading-[1.15] tracking-tight text-gray-600 mb-12">
            Áreas de{" "}
            <span className="text-[#c4a87c]">Especialización</span>
          </h2>
          <div
            className="rounded-2xl py-12 px-6"
            style={{ backgroundColor: "#e8e0d4" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 max-w-5xl mx-auto">
              {counters.map((c) => (
                <CounterItem key={c.label} {...c} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
