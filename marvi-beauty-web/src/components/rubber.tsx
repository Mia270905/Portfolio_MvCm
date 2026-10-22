import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Shield, Layers, Heart, RefreshCw } from "lucide-react";

export default function RubberSection() {
  return (
    <section className="bg-[#F5F4F1] w-full py-10 px-6">
      <div className="max-w-[1400px] mx-auto">
        <h2 className="text-4xl pb-8 font-serif text-[#987E71] text-center">
          <span className="text-[#987E71] font-bold ">Rubber Gel:</span> uñas
          fuertes sin complicaciones
        </h2>

        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-center gap-12 px-6">
          <div className="relative w-full max-w-md animate-fade-in-up">
            <div className="grid grid-cols-2 gap-2 rounded-[40px] overflow-hidden border-4 border-dotted border-[#B49464]">
              <div className="bg-[#FFF0F5] aspect-square w-full" />
              <div className="bg-[#F7C6D0] aspect-square w-full" />
              <div className="bg-[#EFA8B8] aspect-square w-full" />
              <div className="bg-[#D97B93] aspect-square w-full" />
            </div>

            <div className="absolute inset-0 flex items-center left-[20px] justify-center pointer-events-none">
              <Image
                src="/assets/rubber.png"
                alt="Healy"
                width={350}
                height={350}
                className="object-contain"
              />
            </div>
          </div>

          <div className="w-full max-w-xl space-y-6 animate-fade-in-up delay-200">
            <ul className="space-y-4">
              <li className="flex gap-4 items-start">
                <Shield className="text-[#987E71]" size={24} />
                <div>
                  <h4 className="font-bold font-serif text-[#987E71]">
                    Fuerza y naturalidad
                  </h4>
                  <p className="text-sm font-serif text-[#987E71]">
                    Mas fuerte que un gel normal, con un acabado sutil y
                    elegante.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <Layers className="text-[#987E71]" size={24} />
                <div>
                  <h4 className="font-bold font-serif text-[#987E71]">
                    Volumen y resistencia
                  </h4>
                  <p className="text-sm font-serif text-[#987E71]">
                    Mas fuerte que un gel normal de acabado natural.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <Heart className="text-[#987E71]" size={24} />
                <div>
                  <h4 className="font-bold font-serif text-[#987E71]">
                    Cuidado natural
                  </h4>
                  <p className="text-sm font-serif text-[#987E71]">
                    Protege y fortalece sin dañar tu uña.
                  </p>
                </div>
              </li>
              <li className="flex gap-4 items-start">
                <RefreshCw className="text-[#987E71]" size={24} />
                <div>
                  <h4 className="font-bold font-serif text-[#987E71]">
                    Fácil de mantener
                  </h4>
                  <p className="text-sm font-serif text-[#987E71]">
                    Es posible retocarlo sin retirar todo el producto.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
