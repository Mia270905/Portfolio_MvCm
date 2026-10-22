import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, SendHorizonal, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HeroHeader } from "./header";
import { AnimatedFadeIn } from "./animations/animated-fadein";

export default function HeroSection() {
  return (
    <>
      <HeroHeader />

      <main className="relative pt-20 bg-[#B48993]">
        <section className="relative overflow-hidden">
          <div className="block lg:hidden">
            <div className="relative mx-auto max-w-6xl px-4 py-6">
              <div className="mb-10 relative">
                <div className="absolute inset-0 bg-radial-[at_65%_25%] from-transparent to-[#B48993] z-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-radial-[at_35%_35%] from-transparent to-[#B48993] z-10 pointer-events-none"></div>
                <AnimatedFadeIn blurOnEnter={true}>
                  <Image
                    className="w-full object-cover relative z-0"
                    src="/assets/landing/banner.png"
                    alt="mobile"
                    width={2796}
                    height={2008}
                  />
                </AnimatedFadeIn>
              </div>

              <div className="relative z-10 text-center">
                <AnimatedFadeIn blurOnEnter={true}>
                  <h1 className="text-4xl font-bold text-white">
                    AC Corporativa
                  </h1>
                </AnimatedFadeIn>

                <AnimatedFadeIn delay={0.3} blurOnEnter={true}>
                  <p className="mt-7 text-xl pb-5 text-white">
                    Soluciones de capacitación y consultoría que transforman tu
                    empresa.
                  </p>
                </AnimatedFadeIn>

                <AnimatedFadeIn delay={0.6} blurOnEnter={true}>
                  <Button
                    asChild
                    className="bg-[#40222D] px-8 py-6 text-xl rounded-full text-white hover:bg-[#5a3346] transition-colors"
                  >
                    <Link href="https://wa.link/ru37s4" target="_blank">
                      <span>Contáctenos</span>
                    </Link>
                  </Button>
                </AnimatedFadeIn>
              </div>
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-2 lg:h-[85vh]">
            {/* Left Column - Text Content */}
            <div className="bg-[#B48993] flex items-center justify-center p-12">
              <div className="max-w-lg">
                <AnimatedFadeIn blurOnEnter={true}>
                  <h1 className="text-6xl font-bold text-white leading-tight"
                    style={{
                      textShadow: '4px 4px 12px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    AC Corporativa
                  </h1>
                </AnimatedFadeIn>

                <AnimatedFadeIn delay={0.3} blurOnEnter={true}>
                  <p className="mt-8 text-xl text-white leading-relaxed"
                    style={{
                      textShadow: '4px 4px 12px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    Soluciones de capacitación y consultoría que transforman tu
                    empresa.
                  </p>
                </AnimatedFadeIn>

                <AnimatedFadeIn delay={0.6} blurOnEnter={true}>
                  <div className="mt-10">
                    <Button
                      asChild
                      className="bg-[#40222D] px-8 py-6 text-xl rounded-full text-white hover:bg-[#5a3346] transition-colors"
                    >
                      <Link href="https://wa.link/ru37s4" target="_blank">
                        <span>Contáctenos</span>
                      </Link>
                    </Button>
                  </div>
                </AnimatedFadeIn>
              </div>
            </div>

            <div className="relative overflow-hidden">
              <AnimatedFadeIn blurOnEnter={true}>
                <div className="h-[85vh] w-full">
                  <Image
                    src="/assets/landing/banner.png"
                    alt="banner web"
                    width={2796}
                    height={2008}
                    className="w-full h-full object-cover"
                    priority
                  />
                </div>
              </AnimatedFadeIn>

              <div className="absolute inset-0 bg-gradient-to-r from-[#B48993] via-[#B48993]/30 to-transparent z-10"></div>
              <div className="absolute inset-0 bg-radial-[at_20%_25%] from-transparent to-[#B48993]/40 z-10 pointer-events-none"></div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
