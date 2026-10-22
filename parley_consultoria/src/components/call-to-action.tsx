"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

/* =========================
   DATA
========================= */

const benefits = [
  "Prevenga riesgos legales.",
  "Evite conflictos laborales.",
  "Asegure sus contratos.",
];

const problems = [
  "Contratos con proveedores.",
  "Conflictos laborales.",
  "Disputas de arrendamiento.",
  "Uso indebido de marca.",
];

/* =========================
   COMPONENTE
========================= */

export default function CallToAction() {
  return (
    <section className="py-16 md:py-24 bg-[#faf8f3]">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-6 md:grid-cols-2">

          {/* Beneficios */}
          <Card className="bg-white border border-neutral-200 rounded-2xl shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                Proteja sus Intereses Legales
              </h3>

              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-start gap-3 text-neutral-700"
                  >
                    <CheckCircle
                      className="h-5 w-5 shrink-0"
                      style={{ color: "#c6a365" }}
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              <button className="mt-8 px-6 py-2.5 bg-[#c6a365] text-neutral-900 rounded-full text-sm font-medium hover:bg-[#b59555] transition">
                Proteja su empresa →
              </button>
            </CardContent>
          </Card>

          {/* Problemas */}
          <Card className="bg-white border border-neutral-200 rounded-2xl shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-neutral-900 mb-6">
                Problemas que Resolvemos
              </h3>

              <ul className="space-y-4">
                {problems.map((problem) => (
                  <li
                    key={problem}
                    className="flex items-start gap-3 text-neutral-700"
                  >
                    <CheckCircle
                      className="h-5 w-5 shrink-0"
                      style={{ color: "#c6a365" }}
                    />
                    <span>{problem}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>
  );
}
