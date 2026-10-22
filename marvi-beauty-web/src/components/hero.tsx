import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { HeroHeader } from "./header";
import { AnimatedFadeIn } from "./animations/animated-fadein";

export default function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="pt-20 bg-[#E3E2DD]">
        <section className="overflow-hidden">
          <div className="relative mx-auto max-w-6xl px-6 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12">
              {/* Izquierda */}
              <div className="relative z-10 text-center lg:text-left">
                <AnimatedFadeIn blurOnEnter={true}>
                  <h1 className="text-[#987E71] font-serif text-4xl lg:text-6xl font-bold text-center">
                    MarVi Beauty Room
                  </h1>
                </AnimatedFadeIn>

                <AnimatedFadeIn delay={0.3} blurOnEnter={true}>
                  <p className="mt-6 text-xl text-[#987E71] text-center">
                    Transforma tus manos con nuestros servicios profesionales de
                    manicura y diseño de uñas. Elegancia, calidad y cuidado
                    personalizado.
                  </p>
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="w-36 h-[3px] bg-gradient-to-r from-[#D97B93] to-transparent" />
                    <Star className="w-7 h-7 text-[#D97B93] fill-[#D97B93]" />
                    <div className="w-36 h-[3px] bg-gradient-to-l from-[#D97B93] to-transparent" />
                  </div>
                </AnimatedFadeIn>

                <AnimatedFadeIn delay={0.6} blurOnEnter={true}>
                  <div className="mt-6 flex justify-center">
                    <Button
                      asChild
                      className="bg-[#987E71] hover:bg-[#2B2B2B] px-8 py-6 text-xl text-white rounded-full"
                    >
                      <Link href="/cliente-cita" target="_blank">
                        <span>Reservar cita</span>
                      </Link>
                    </Button>
                  </div>
                </AnimatedFadeIn>
              </div>

              {/* Derecha */}
              <div className="relative flex justify-center lg:justify-end">
                <AnimatedFadeIn delay={0.9} blurOnEnter={true}>
                  <Image
                    className="w-full max-w-md rounded-xl shadow-lg"
                    src="/assets/img1.jpg"
                    alt="app illustration"
                    width={800}
                    height={600}
                  />
                </AnimatedFadeIn>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
