"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, Users, Zap, Heart, Rocket } from "lucide-react";
import { useEffect, useState } from "react";

import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { AnimatedText } from "@/components/animated-text";
import { AnimatedBlock } from "@/components/animated-block";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";

interface WhatsAppContact {
  name: string;
  subtitle: string;
  phone: string;
}

export default function AboutUsPage() {
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
      <div className="min-h-screen bg-background text-foreground overflow-hidden">
        <section className="py-45 sm:py-56 md:py-72 lg:py-80 px-4 sm:px-6 md:px-8 lg:px-12 relative min-h-screen flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-gray-900/30 to-black"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/5 to-gray-800/20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-400/8 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-gray-700/20 via-transparent to-transparent"></div>

          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)",
              backgroundSize: "50px 50px",
            }}
          ></div>

          <div className="max-w-4xl md:max-w-5xl mx-auto text-center relative z-10">
            <AnimatedText>
              <h1
                className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-10 md:mb-12 ${
                  isVisible ? "animate-fade-in-up" : "opacity-0"
                }`}
              >
                Quiénes{" "}
                <span className="text-yellow-400 animate-glow">Somos</span>
              </h1>
            </AnimatedText>

            <AnimatedText>
              <p
                className={`text-lg sm:text-xl md:text-2xl lg:text-2xl text-gray-300 max-w-3xl md:max-w-4xl mx-auto leading-relaxed mb-16 md:mb-20 px-2 ${
                  isVisible
                    ? "animate-fade-in-up animation-delay-400"
                    : "opacity-0"
                }`}
              >
                ALVEUS SOFT fue fundada el 27 de mayo de 2021 por el Ing. Manuel Vizcaíno, un empresario con más de 10 años de 
                experiencia y una visión clara y estratégica: sistematizar y automatizar los procesos y controles de sus clientes 
                para impulsar su eficiencia, productividad y rentabilidad.
              </p>
            </AnimatedText>

            <AnimatedText>
              <a
                href="#mision-vision"
                className="inline-flex items-center px-5 py-2 text-sm font-medium text-white border border-white rounded-full bg-transparent hover:bg-white/10 transition-colors duration-300 group"
              >
                Conoce más{" "}
                <span className="ml-2 animate-float text-base">↓</span>
              </a>
            </AnimatedText>

            {/* Línea decorativa */}
            <div
              className={`flex justify-center mt-6 ${
                isVisible
                  ? "animate-fade-in-up animation-delay-800"
                  : "opacity-0"
              }`}
            >
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-glow"></div>
            </div>
          </div>
        </section>

        {/* Misión y Visión */}
        <section
          className="pt-32 sm:pt-40 md:pt-48 lg:pt-36 px-4 sm:px-6 scroll-mt-32 md:scroll-mt-36 lg:scroll-mt-40"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <AnimatedBlock>
                <Card
                  className={`bg-popover border-gray-800 shadow-2xl hover:shadow-yellow-400/20 transition-all duration-500 hover:scale-105 hover:border-chart-3 ${
                    isVisible
                      ? "animate-fade-in-left animation-delay-600"
                      : "opacity-0"
                  }`}
                >
                  <CardContent className="p-6 sm:p-8 scroll-mt-[170px]" id="mision-vision">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <Target className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 animate-rotate-in animation-delay-800" />
                      <h2 className="text-xl sm:text-2xl font-bold text-white">
                        Nuestra Misión
                      </h2>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-lg">
                      Sistematizar y automatizar los procesos y controles de
                      nuestros clientes, mejorando su eficiencia, productividad
                      y rentabilidad con soluciones tecnológicas adaptadas a sus
                      necesidades.
                    </p>
                  </CardContent>
                </Card>
              </AnimatedBlock>

              <AnimatedBlock>
                <Card
                  className={`bg-popover border-gray-800 shadow-2xl hover:shadow-yellow-400/20 transition-all duration-500 hover:scale-105 hover:border-chart-3 ${
                    isVisible
                      ? "animate-fade-in-right animation-delay-600"
                      : "opacity-0"
                  }`}
                >
                  <CardContent className="p-6 sm:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <Lightbulb className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 animate-rotate-in animation-delay-1000" />
                      <h2 className="text-xl sm:text-2xl font-bold text-white">
                        Nuestra Visión
                      </h2>
                    </div>
                    <p className="text-gray-300 leading-relaxed text-sm sm:text-lg">
                      Ser líder en la zona occidente de México, ayudando y
                      acompañando a nuestros clientes en su crecimiento y
                      evolución constante con soluciones tecnológicas de
                      vanguardia.
                    </p>
                  </CardContent>
                </Card>
              </AnimatedBlock>
            </div>
          </div>
        </section>

        {/* Valores */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div
              className={`text-center mb-16 ${
                isVisible
                  ? "animate-fade-in-up animation-delay-800"
                  : "opacity-0"
              }`}
            >
              <AnimatedText>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
                  Nuestros Valores
                </h2>
                <p className="text-gray-300 text-base sm:text-lg max-w-3xl mx-auto">
                  La esencia de ALVEUS SOFT se basa en valores que no solo
                  definen nuestra cultura sino también nuestra forma de hacer
                  negocios
                </p>
              </AnimatedText>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  icon: Lightbulb,
                  title: "Innovación",
                  description:
                    "La búsqueda constante de ideas y tecnologías para estar a la vanguardia del sector.",
                  delay: "animation-delay-200",
                },
                {
                  icon: Target,
                  title: "Disciplina",
                  description:
                    "Un compromiso inquebrantable con la excelencia y la calidad en cada proyecto.",
                  delay: "animation-delay-400",
                },
                {
                  icon: Heart,
                  title: "Responsabilidad",
                  description:
                    "Un enfoque ético y responsable en todas las decisiones y relaciones comerciales.",
                  delay: "animation-delay-600",
                },
                {
                  icon: Zap,
                  title: "Proactividad",
                  description:
                    "Anticiparse a las necesidades de los clientes y ofrecer soluciones antes de que surjan los problemas.",
                  delay: "animation-delay-800",
                },
                {
                  icon: Rocket,
                  title: "Creatividad",
                  description:
                    "Fomentar un ambiente en el que las ideas frescas y las soluciones fuera de lo convencional son la norma.",
                  delay: "animation-delay-1000",
                },
                {
                  icon: Users,
                  title: "Trabajo en Equipo",
                  description:
                    "La colaboración y el apoyo mutuo como pilares en la construcción de relaciones sólidas y exitosas.",
                  delay: "animation-delay-1200",
                },
              ].map((value, index) => (
                <AnimatedBlock key={index}>
                  <Card
                    className={`bg-popover border-gray-800 hover:border-chart-3 transition-all duration-500 hover:shadow-2xl hover:shadow-chart-3 hover:scale-105 group min-h-[300px] sm:min-h-[350px] flex flex-col ${
                      isVisible
                        ? `animate-scale-in ${value.delay}`
                        : "opacity-0"
                    }`}
                  >
                    <CardContent className="p-6 sm:p-8 text-center flex flex-col justify-between flex-1">
                      <div>
                        <value.icon className="h-12 sm:h-16 w-12 sm:w-16 text-yellow-400 mx-auto mb-4 sm:mb-6 group-hover:animate-float transition-all duration-300" />
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                          {value.title}
                        </h3>
                        <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                          {value.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </AnimatedBlock>
              ))}
            </div>
          </div>
        </section>

        {/* Historia */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <AnimatedText>
                <h2 className="text-4xl font-bold text-foreground mb-4">
                  Nuestra Historia
                </h2>
              </AnimatedText>
            </div>

            <Card className="p-8 lg:p-12">
              <CardContent className="p-0">
                <div className="prose prose-lg max-w-none">
                  <AnimatedText>
                    <p className="text-lg text-muted-white leading-relaxed mb-6 text-pretty">
                      ALVEUS SOFT fue fundada el 27 de mayo de 2021, por el Ing.
                      Manuel Vizcaino, un empresario con una visión clara:
                      Sistematizar y automatizar los procesos y controles de sus
                      clientes, mejorando su eficiencia, productividad y
                      rentabilidad.
                    </p>
                  </AnimatedText>

                  <AnimatedText>
                    <p className="text-lg text-muted-white leading-relaxed mb-6 text-pretty">
                      La empresa tiene como objetivo ser líder en la zona occidente
                       y sur de México, con presencia en su segunda sucursal en Chiapas, 
                       ayudando y acompañando a sus clientes en su crecimiento y evolución 
                       constante mediante soluciones tecnológicas adaptadas a sus necesidades. 
                    </p>
                  </AnimatedText>

                  <AnimatedText>
                    <p className="text-lg text-muted-white leading-relaxed mb-6 text-pretty">
                      Los valores que llevamos son la columna vertebral de
                      ALVEUS SOFT, guiando cada acción y cada decisión. Desde
                      sus primeros días, la empresa ha trabajado incansablemente
                      para hacer realidad su visión.
                    </p>
                  </AnimatedText>

                  <AnimatedText>
                    <p className="text-lg text-muted-white leading-relaxed mb-6 text-pretty">
                      La combinación de estosvalores con una misión clara ha
                      permitido a ALVEUS SOFT posicionarse rápidamente como un
                      referente en su campo.
                    </p>
                  </AnimatedText>

                  <AnimatedText>
                    <p className="text-lg text-muted-white leading-relaxed mb-6 text-pretty">
                      Bajo el liderazgo del Ing. Manuel Vizcaino, la empresa
                      sigue avanzando, forjando su camino hacia el futuro con
                      innovación, creatividad y una profunda comprensión de las
                      necesidades de sus clientes.
                    </p>
                  </AnimatedText>

                  <AnimatedText>
                    <p className="text-lg text-muted-white leading-relaxed text-pretty">
                      Nuestra historia es una historia de ambición, creatividad,
                      integridad y éxito, con muchos cápitulos
                    </p>
                  </AnimatedText>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
      <FooterSection />
      <WhatsAppFloat
        contacts={contacts}
        headerText="Iniciar conversación"
        subtitleText=""
        responseTimeText="El equipo suele responder en unos minutos."
      />
    </>
  );
}
