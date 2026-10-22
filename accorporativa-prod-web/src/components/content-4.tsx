import { Button } from "@/components/ui/button";
import { ChevronRight, CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { AnimatedFadeScale } from "./animations/animated-fadescale";

export default function ContentSection() {
  return (
    <section id="cursos" className="py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h3 className="text-3xl font-bold mb-4 text-foreground">
              Servicio 5 estrellas
            </h3>
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-7 w-7 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>
            <p className="text-lg text-foreground/70 mb-6">
              Aprende a brindar un servicio excepcional que genere lealtad y
              diferenciación competitiva en tu organización.
            </p>
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-3 text-[#B48993]" />
                <span className="text-foreground">
                  Atender con calidez y empatía
                </span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#B48993] mr-3" />
                <span className="text-foreground">
                  Resolver situaciones difíciles con profesionalismo
                </span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#B48993] mr-3" />
                <span className="text-foreground">
                  Dejar una impresión memorable
                </span>
              </div>
            </div>
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="gap-1 pr-1.5 bg-[#A65B6F] hover:bg-[#A65B6F]/50 text-white"
            >
              <Link href="https://wa.link/ru37s4" target="_blank">
                <span>Más detalles</span>
                <ChevronRight className="size-2" />
              </Link>
            </Button>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-accent/20 to-secondary/20 p-8 flex items-center justify-center">
              <AnimatedFadeScale>
                <img
                  className="rounded-(--radius) "
                  src="/assets/landing/Curso.jpg"
                  alt="team image"
                  height=""
                  width=""
                  loading="lazy"
                />
              </AnimatedFadeScale>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
