import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { AnimatedFadeIn } from "./animations/animated-fadein";
import { AnimatedCard } from "./animations/animated-card";
import { AnimatedText } from "./animations/animated-text";

export default function Features() {
  return (
    <section className="bg-[#F2F2F2] py-16 md:py-32 dark:bg-transparent">
      <div className="@container mx-auto max-w-6xl px-6">
        <div className="text-center">
          <AnimatedText>
            <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
              Nuestra oferta
            </h2>
          </AnimatedText>
          {/* <p className="mt-4">Libero sapiente aliquam quibusdam aspernatur, praesentium iusto repellendus.</p> */}
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
          <AnimatedCard>
            <Card className="row d-flex align-items-stretch overflow-hidden shadow-zinc-950/5 *:text-center">
              <AnimatedFadeIn>
                <div className="group shadow-zinc-950/5 rounded-lg overflow-hidden">
                  <CardHeader className="pb-3 h-[280px]">
                    <Image
                      className="h-50 w-full object-cover rounded-lg"
                      src="/assets/images/capacitacion.jpeg"
                      alt="app illustration"
                      width={2796}
                      height={2008}
                    />
                    <h3 className="mt-6 font-medium text-2xl">
                      Capacitación Especializada
                    </h3>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <p className="mt-3 text-lg">
                      Programas prácticos en ventas, liderazgo y servicio al
                      cliente, diseñados para fortalecer habilidades clave en
                      equipos y profesionales.
                    </p>
                  </CardContent>
                </div>
              </AnimatedFadeIn>
            </Card>
          </AnimatedCard>

          <AnimatedCard>
            <Card className="row d-flex align-items-stretch overflow-hidden shadow-zinc-950/5 *:text-center">
              <AnimatedFadeIn>
                <div className="group shadow-zinc-950/5 rounded-lg overflow-hidden">
                  <CardHeader className="pb-3 h-[280px]">
                    <Image
                      className="h-48 w-full object-cover rounded-lg"
                      src="/assets/images/consultoria.jpeg"
                      alt="app illustration"
                      width={2796}
                      height={2008}
                    />
                    <h3 className="mt-6 font-medium text-2xl">
                      Consultoría Empresarial
                    </h3>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <p className="mt-3 text-lg">
                      Soluciones personalizadas que impulsan la productividad,
                      optimizan procesos y alinean a las personas con los
                      objetivos del negocio.
                    </p>
                  </CardContent>
                </div>
              </AnimatedFadeIn>
            </Card>
          </AnimatedCard>

          <AnimatedCard>
            <Card className="row d-flex align-items-stretch overflow-hidden shadow-zinc-950/5 *:text-center">
              <AnimatedFadeIn>
                <div className="group shadow-zinc-950/5 rounded-lg overflow-hidden">
                  <CardHeader className="pb-3 h-[280px]">
                    <Image
                      className="h-48 w-full object-cover rounded-lg"
                      src="/assets/landing/card3.webp"
                      alt="app illustration"
                      width={2796}
                      height={2008}
                    />
                    <h3 className="mt-6 font-medium text-2xl">
                      Diplomados Ejecutivos
                    </h3>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <p className="mt-3 text-lg">
                      Formaciones integrales con enfoque estratégico, orientadas
                      al desarrollo del talento y la toma de decisiones
                      efectivas en las organizaciones.
                    </p>
                  </CardContent>
                </div>
              </AnimatedFadeIn>
            </Card>
          </AnimatedCard>
        </div>
      </div>
    </section>
  );
}
