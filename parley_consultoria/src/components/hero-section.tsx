"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2, User, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroHeader } from "./header";
import { AnimatedText } from "./animated-text";
import { AnimatedCard } from "./animated-card";
import { getSocialMediaConfigs } from "@/lib/actions/configuration.actions";
import { useEffect, useState } from "react";

const services = [
  { icon: User, label: "Asesorías y Juicios personales" },
  { icon: Building2, label: "Consultoría Empresarial" },
  { icon: DollarSign, label: "Recuperación de créditos y préstamos" },
];

export default function HeroSection() {

  const [whatsappUrl, setWhatsappUrl] = useState("");

  useEffect(()=>{
    const fetchData = async () => {
      try{
        const data = (await getSocialMediaConfigs()).data;
        if(!!data && !!data.whatsapp_url){
          setWhatsappUrl(data.whatsapp_url)
        }
      }catch(e){
        console.error(e)
      }
    }

    fetchData();
  });

  

  return (
    <>
      {/* NAVBAR */}
      <HeroHeader />

      {/* HERO */}
      <section className="relative bg-[#f5f1eb] overflow-visible min-h-[65vh] md:min-h-[70vh] pb-10">
        {/* Desktop Image - Positioned absolute to extend to edges */}
        <div className="hidden lg:block absolute top-0 right-0 w-[55%] h-full">
          <Image
            src="/assets/landing/herosection.png"
            alt="Profesional de parley"
            fill
            className="object-cover object-top"
            priority
          />
          {/* Difuminado izquierdo */}
          <div className="absolute inset-y-0 -left-px right-0 bg-gradient-to-r from-[#f5f1eb] via-[#f5f1eb]/60 to-transparent pointer-events-none" />
        </div>

        <div className="lg:hidden absolute top-0 right-0 w-[60%] h-full max-w-[400px]">
          <div className="relative w-full h-full">
            <Image
              src="/assets/landing/herosection.png"
              alt="Parley mobile"
              fill
              className="object-cover object-top"
              priority
            />
            {/* Difuminado izquierdo para móvil */}
            <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-[#f5f1eb] via-[#f5f1eb]/70 to-transparent w-2/3 pointer-events-none" />
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative h-full">
          {/* Desktop Layout */}
          <div className="hidden lg:flex min-h-[70vh] items-center py-12">
            {/* Left Content */}
            <div className="relative z-10 max-w-xl">
              <AnimatedText>
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.15] tracking-tight text-gray-600">
                  Soluciones{" "}
                  <span className="text-[#c4a87c]">Legales</span>
                  <br />
                  y{" "}
                  <span className="text-[#c4a87c]">Empresariales</span>{" "}
                  <span className="block italic font-normal text-gray-500">
                    para sus Necesidades
                  </span>
                </h1>
              </AnimatedText>

              <AnimatedText>
                <p className="mt-6 text-lg sm:text-xl text-gray-500 leading-relaxed">
                  Asesoría para personas y empresas en todas las áreas legales.
                </p>
              </AnimatedText>

              <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-4">
                <Button
                  asChild
                  className="!bg-[#9C7649] text-white px-6 py-3 text-base font-semibold rounded-md hover:!bg-[#c49e48] transition-colors duration-300 inline-flex items-center justify-center"
                >
                  <Link href="/cliente-cita">
                    Agendar Consulta
                  </Link>
                </Button>
                {/* Botón WhatsApp */}
                <Button
                  asChild
                  variant="outline"
                  className="!bg-[#3B6564] text-white border  hover:!bg-[#2d4a4a] px-6 py-3 text-base font-semibold rounded-md transition-colors duration-300 bg-transparent"
                >
                  <Link
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Layout - Manteniendo imagen a la derecha */}
          <div className="lg:hidden flex min-h-[60vh] items-center py-8 relative z-10">
            {/* Left Content for mobile - similar to desktop but smaller */}
            <div className="relative z-20 max-w-[60%] sm:max-w-[55%] pr-4">
              <AnimatedText>
                <h1 className="text-2xl sm:text-3xl font-bold leading-[1.15] tracking-tight text-gray-600">
                  Soluciones{" "}
                  <span className="text-[#c4a87c]">Legales</span>
                  <br />
                  y{" "}
                  <span className="text-[#c4a87c]">Empresariales</span>{" "}
                  <span className="block italic font-normal text-gray-500 text-xl sm:text-2xl mt-2">
                    para su Negocio
                  </span>
                </h1>
              </AnimatedText>

              <AnimatedText>
                <p className="mt-4 text-sm sm:text-base text-gray-500 leading-relaxed">
                  Asesoría integral para proteger y hacer crecer su empresa.
                </p>
              </AnimatedText>

              <div className="mt-6 flex flex-col gap-3">
                <Button
                  asChild
                  size="sm"
                  className="!bg-[#9C7649] text-white px-5 py-2.5 text-sm font-semibold rounded-md"
                >
                  <Link href="/cliente-cita">
                    Agendar Consulta
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="!bg-[#3B6564] text-white border px-5 py-2.5 text-sm font-semibold rounded-md "
                >
                  <Link
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </Link>
                </Button>
              </div>
            </div>
            
            {/* Right side - empty space for image overlap */}
            <div className="flex-1"></div>
          </div>
        </div>

        {/* Services Bar - Desktop */}
        <div className="hidden lg:block absolute bottom-0 left-0 right-0 z-10 translate-y-1/2">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-full shadow-lg px-8">
              <div className="flex items-center justify-between gap-4 py-4">
                {services.map((service) => (
                  <div
                    key={service.label}
                    className="flex items-center gap-2 text-base text-gray-800"
                  >
                    <service.icon className="h-6 w-6 text-[#d4af37]" />
                    <span>{service.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Bar - Mobile */}
      <div className="lg:hidden bg-white border-t border-gray-100 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto py-4 gap-4 hide-scrollbar">
            {services.map((service) => (
              <div
                key={service.label}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg min-w-max"
              >
                <service.icon className="h-5 w-5 text-[#d4af37]" />
                <span className="text-sm font-medium text-gray-800 whitespace-nowrap">
                  {service.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}