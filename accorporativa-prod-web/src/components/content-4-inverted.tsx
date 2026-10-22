import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Users,
  Target,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";

export default function ContentSectionInverted() {
  return (
    <section className="py-20 bg-[#B48993] text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl lg:text-4xl font-bold mb-6">
            Capacitación empresarial que transforma
          </h3>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Únete y conviértete en una de las empresas que han potenciado su talento con
            nuestros programas especializados.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-sm opacity-80">Motiva tu equipo</div>
            </div>
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-sm opacity-80">Alcanza las metas</div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-sm opacity-80">Mejora el clima laboral</div>
            </div>
            <div className="text-center">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-80" />
              <div className="text-sm opacity-80">Soluciona problemas</div>
            </div>
          </div>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="gap-1 pr-1.5 bg-[#40222D] text-white hover:bg-[#202332]"
          >
            <Link href="https://wa.link/ru37s4" target="_blank">
              <span>Más detalles</span>
              <ChevronRight className="size-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
