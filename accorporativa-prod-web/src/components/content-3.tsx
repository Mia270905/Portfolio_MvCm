import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { AnimatedFadeScale } from "./animations/animated-fadescale";

export default function ImageContentSection() {
  return (
    <section id="cursos" className="py-20">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-cover rounded-2xl bg-gradient-to-br from-accent/20 to-secondary/20 overflow-hidden">
              <AnimatedFadeScale>
                <img
                  className="w-full h-full object-cover"
                  src="/assets/images/curso.jpeg"
                  alt="team image"
                  loading="lazy"
                />
              </AnimatedFadeScale>
            </div>
          </div>

          <div>
            <h3 className="text-3xl font-bold mb-4 text-foreground">
              El ecosistema de AC Corporativa conecta soluciones de
              capacitación, consultoría y desarrollo empresarial.
            </h3>
            <p className="text-lg text-foreground/70 mb-6">
              AC Corporativa no es solo una empresa de formación. Es un
              ecosistema diseñado para transformar organizaciones mediante
              diplomados ejecutivos, asesoría estratégica y programas
              personalizados que fortalecen el talento y la cultura empresarial.
            </p>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="gap-1 pr-1.5"
            >
              <Link href="https://wa.link/ru37s4" target="_blank">
                <span>Saber más</span>
                <ChevronRight className="size-2" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
