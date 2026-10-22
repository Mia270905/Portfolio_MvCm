"use client";

import { useEffect, useState } from "react";

import { HeroHeader } from "@/components/header";
import { AnimatedText } from "@/components/animated-text";
import ProjectCard from "@/components/project-cards";
import ExperienceCard from "@/components/experience";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";

interface WhatsAppContact {
  name: string;
  subtitle: string;
  phone: string;
}

export default function PortafolioPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const whatsappModule = await import("@/lib/utils/whatsapp_contacts");
        const contactsData = await whatsappModule.getWhatsAppContacts();
        setContacts(contactsData);
      } catch (error) {
        console.error("Error loading contacts:", error);
      }
    };

    loadContacts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <HeroHeader />
      <div className="min-h-screen">
        {/* Dos Columnas */}
        <div className="lg:flex">
          {/* Parte de la izquierda fija */}
          <div className="lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-1/3 lg:overflow-y-auto">
            <div className="flex flex-col justify-between px-10 pt-35 lg:px-30 lg:py-35">
              {/* Info de la Empresa */}
              <div className="space-y-8">
                {/* Titulo y Eslogan de la Empresa */}
                <div className="space-y-4">
                  <AnimatedText>
                    <h1 className="text-4xl font-bold tracking-tight text-[#F1C928] sm:text-5xl">
                      Alveus Soft
                    </h1>
                    <h2 className="text-xl font-medium text-white sm:text-2xl">
                      Tu mejor aliado tecnológico
                    </h2>
                  </AnimatedText>
                </div>

                {/* Descripción de lo que se hace en la empresa */}
                <div className="max-w-xs space-y-4">
                  <AnimatedText>
                    <p className="text-white leading-relaxed">
                      Creamos experiencias digitales inolvidables y precisas al
                      píxel para la web
                    </p>
                  </AnimatedText>
                </div>

                {/* Navegación */}
                <nav
                  className="hidden lg:block"
                  aria-label="In-page jump links"
                >
                  <ul className="mt-16 w-max space-y-3">
                    <li>
                      <AnimatedText>
                        <a
                          className="group flex items-center py-3 text-white 
                                                hover:text-[#F1C928] transition-colors"
                          href="#proyectos"
                        >
                          <span className="mr-4 h-px w-8 bg-white transition-all group-hover:w-16 group-hover:bg-[#F1C928]"></span>
                          <span className="text-xs font-bold uppercase tracking-widest">
                            Proyectos
                          </span>
                        </a>
                      </AnimatedText>
                    </li>
                    <li>
                      <AnimatedText>
                        <a
                          className="group flex items-center py-3 text-white 
                                                hover:text-[#F1C928] transition-colors"
                          href="#experiencia"
                        >
                          <span className="mr-4 h-px w-8 bg-white transition-all group-hover:w-16 group-hover:bg-[#F1C928]"></span>
                          <span className="text-xs font-bold uppercase tracking-widest">
                            Experiencia
                          </span>
                        </a>
                      </AnimatedText>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>

          {/* Parte del lado Derecho */}
          <div className="lg:pl-[40%]">
            <main className="px-10 pb-16 lg:px-10 lg:pt-35" id="proyectos">
              <div className="space-y-24">
                {/* Sección Proyectos */}
                <section aria-label="Proyectos seleccionados">
                  <div className="sticky top-0 -mx-6 mb-4  bg-slate-900/20 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200 lg:sr-only">
                      Proyectos
                    </h2>
                  </div>
                  <ProjectCard />
                </section>

                <section
                  id="experiencia"
                  className="scroll-m-30"
                  aria-label="Proyectos seleccionados"
                >
                  <div className="sticky top-0 -mx-6 mb-4  bg-slate-900/20 px-6 py-5 backdrop-blur md:-mx-12 md:px-12 lg:sr-only lg:relative lg:top-auto lg:mx-auto lg:w-full lg:px-0 lg:py-0 lg:opacity-0">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-slate-200 lg:sr-only">
                      Experiencia
                    </h2>
                  </div>
                  <ExperienceCard />
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>
      <WhatsAppFloat
        contacts={contacts}
        headerText="Iniciar conversación"
        subtitleText=""
        responseTimeText="El equipo suele responder en unos minutos."
      />
    </>
  );
}