"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Scale } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";

const GOLD = "#c4a87c";
const WINE = "#932d1a";

const faqs = [
  {
    question: "¿Qué tipo de asesoría ofrece Parley?",
    answer:
      "Ofrecemos toda clase de asesoría legal para todo tipo de necesidades.",
  },

  {
    question: "¿Atienden a empresas fuera de Tepic?",
    answer:
      "Sí. Atendemos en toda la república a través de procesos electrónicos o de forma presencial.",
  },

  {
    question: "¿Cómo puedo agendar una cita?",
    answer:(
      <span className="flex flex-wrap items-center gap-1">
        Mándanos un mensaje por WhatsApp, una llamada o 
        <Link
          href="/cliente-cita"
          className="flex items-center gap-1 text-[#c6a365] hover:underline"
        >
          agenda en esta web.
        </Link>
      </span>
    ),
  },

  {
    question: "¿En qué horarios atienden?",
    answer:
      "Nuestro horario es de lunes a viernes de 9:00 a.m. a 3:00 p.m. y 4:00 p.m. a 6:00 p.m.",
  },
];

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="bg-[#E6DDCF] py-20 scroll-mt-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Divider */}
        {/* <div className="mb-16 flex justify-center">
          <div
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, #c6a365, transparent)",
            }}
          />
        </div> */}

        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
        
          </div>

          <h2 className="text-center text-4xl sm:text-5xl font-bold leading-[1.15] tracking-tight text-gray-600 mb-4">
            Preguntas{" "}
            <span className="text-[#c4a87c]">Frecuentes</span>
          </h2>

          <p className="text-gray-700 max-w-2xl mx-auto">
            Aquí respondemos algunas de las dudas más comunes de nuestros clientes.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = open === index;

            return (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-gray-900">
                    {faq.question}
                  </span>

                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                  >
                    <ChevronDown className="w-5 h-5 text-[#700505]" />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-6 pb-6 text-gray-600"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}