import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ReactNode } from "react";
import { AnimatedCard } from "./animated-card";

export default function FeaturesCards() {
  return (
    <section className="bg-[#0c0a09] pb-16 md:pb-32 scroll-mt-32 md:scroll-mt-26 lg:scroll-mt-30 pt-12 md:pt-8 relative overflow-hidden">
      {/* Fondo adicional para asegurar cobertura completa */}
      <div className="absolute inset-0 bg-[#0c0a09] -z-10 w-full h-full" />
      
      <div className="@container mx-auto max-w-5xl px-6 relative z-10">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl text-white">
            Potenciamos el éxito de tu{" "}
            <span className="text-amber-400">empresa</span>
          </h2>
          <p className="mt-4 text-gray-300">
            Ofrecemos asesoría especializada, implementación efectiva y soporte
            continuo para optimizar tus procesos y alcanzar tus objetivos de
            negocio.
          </p>
        </div>
        <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16">
          <AnimatedCard>
            <Card className="group shadow-zinc-950/5 h-[350px] bg-[#171717] border-gray-800">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    data-slot="icon"
                    className="h-full w-full text-amber-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97-1.94.284-3.916.455-5.922.505a.39.39 0 0 0-.266.112L8.78 21.53A.75.75 0 0 1 7.5 21v-3.955a48.842 48.842 0 0 1-2.652-.316c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </CardDecorator>

                <h3 className="mt-6 font-medium text-white">Consultoría</h3>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-300">
                  Te ayudamos a identificar oportunidades tecnológicas para
                  optimizar tus procesos de negocio.
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.2}>
            <Card className="group shadow-zinc-950/5 h-[350px] bg-[#171717] border-gray-800">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    data-slot="icon"
                    className="h-full w-full text-amber-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </CardDecorator>

                <h3 className="mt-6 font-medium text-white">Implementación</h3>
              </CardHeader>

              <CardContent>
                <p className="mt-3 text-sm text-gray-300">
                  Implementamos soluciones tecnológicas a medida que se adaptan
                  a las necesidades específicas de tu negocio.
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>

          <AnimatedCard delay={0.4}>
            <Card className="group shadow-zinc-950/5 h-[350px] bg-[#171717] border-gray-800">
              <CardHeader className="pb-3">
                <CardDecorator>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    data-slot="icon"
                    className="w-full h-full text-amber-400"
                  >
                    <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0ZM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003Z"></path>
                  </svg>
                </CardDecorator>

                <h3 className="mt-6 font-medium text-white">Soporte</h3>
              </CardHeader>

              <CardContent>
                <p className="mt-3 text-sm text-gray-300">
                  Brindamos soporte técnico especializado para mantener tus
                  sistemas y aplicaciones funcionando sin interrupciones.
                </p>
              </CardContent>
            </Card>
          </AnimatedCard>
        </div>
      </div>
    </section>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:bg-white/5 dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px]"
    />
    <div
      aria-hidden
      className="bg-radial to-background absolute inset-0 from-transparent to-75%"
    />
    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">
      {children}
    </div>
  </div>
);