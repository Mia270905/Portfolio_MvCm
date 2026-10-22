import { AnimatedCard } from "./animations/animated-card";
import { AnimatedText } from "./animations/animated-text";
import { Sparkles, Palette, Heart, Star } from "lucide-react";

export default function ServicesSection() {
  return (
    <section className="bg-[#F5F4F1] py-20 lg:py-32">
      <div className="container mx-auto max-w-6xl px-4 lg:px-8">
        <div className="text-center mb-16">
          <div className="justify-center top-0 flex flex-row gap-3 mb-5">
              <Heart className="w-3 h-3 text-[#EFA8B8] fill-[#EFA8B8]" />
              <Heart className="w-4 h-4 text-[#EFA8B8] fill-[#EFA8B8]" />
              <Heart className="w-3 h-3 text-[#EFA8B8] fill-[#EFA8B8]" />
            </div>
          <h2 className="font-serif text-4xl lg:text-6xl font-bold text-[#D97B93] mb-4 text-balance">
            Nuestros Servicios
          </h2>
          <p className="text-lg text-[#987E71] max-w-2xl mx-auto leading-relaxed">
            Ofrecemos una amplia gama de servicios profesionales para el cuidado
            y embellecimiento de tus uñas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          <AnimatedCard>
            <div className="group border border-[#987E71]/40 bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl hover:shadow-[#987E71]/20 hover:scale-105 hover:border-[#987E71]/60 transition-all duration-300 cursor-default">
              <div className="mb-6">
                <div className="w-14 h-14 rounded-full bg-[#987E71]/10 flex items-center justify-center transition-all duration-300 group-hover:bg-[#987E71]/20 group-hover:scale-110 group-hover:rotate-6">
                  <Sparkles className="w-7 h-7 text-[#987E71] transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#987E71] mb-3 transition-colors duration-300 group-hover:text-[#B39487]">
                Manicura Clásica
              </h3>
              <p className="text-[#987E71]  leading-relaxed">
                Cuidado completo de tus uñas con limado, pulido y esmaltado
                perfecto.
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="group border border-[#987E71]/40 bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl hover:shadow-[#987E71]/20 hover:scale-105 hover:border-[#987E71]/60 transition-all duration-300 cursor-default">
              <div className="mb-6">
                <div className="w-14 h-14 rounded-full bg-[#987E71]/10 flex items-center justify-center transition-all duration-300 group-hover:bg-[#987E71]/20 group-hover:scale-110 group-hover:rotate-6">
                  <Palette className="w-7 h-7 text-[#987E71] transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#987E71] mb-3 transition-colors duration-300 group-hover:text-[#B39487]">
                Diseño de Uñas
              </h3>
              <p className="text-[#987E71]  leading-relaxed">
                Diseños personalizados y tendencias actuales para expresar tu
                estilo único.
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="group border border-[#987E71]/40 bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl hover:shadow-[#987E71]/20 hover:scale-105 hover:border-[#987E71]/60 transition-all duration-300 cursor-default">
              <div className="mb-6">
                <div className="w-14 h-14 rounded-full bg-[#987E71]/10 flex items-center justify-center transition-all duration-300 group-hover:bg-[#987E71]/20 group-hover:scale-110 group-hover:rotate-6">
                  <Heart className="w-7 h-7 text-[#987E71] transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#987E71] mb-3 transition-colors duration-300 group-hover:text-[#B39487]">
                Pedicura Spa
              </h3>
              <p className="text-[#987E71]  leading-relaxed">
                Experiencia relajante con tratamiento completo para tus pies.
              </p>
            </div>
          </AnimatedCard>

          <AnimatedCard>
            <div className="group border border-[#987E71]/40 bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl hover:shadow-[#987E71]/20 hover:scale-105 hover:border-[#987E71]/60 transition-all duration-300 cursor-default">
              <div className="mb-6">
                <div className="w-14 h-14 rounded-full bg-[#987E71]/10 flex items-center justify-center transition-all duration-300 group-hover:bg-[#987E71]/20 group-hover:scale-110 group-hover:rotate-6">
                  <Star className="w-7 h-7 text-[#987E71] transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#987E71] mb-3 transition-colors duration-300 group-hover:text-[#B39487]">
                Uñas Acrílicas
              </h3>
              <p className="text-[#987E71]  leading-relaxed">
                Extensiones y refuerzos de uñas con acabado profesional
                duradero.
              </p>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </section>
  );
}
