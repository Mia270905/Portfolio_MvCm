import { benedict } from "@/fonts/benedict";
import { Sparkles } from "lucide-react";

export default function SeasonSection() {
  return (
    <section className="py-16 relative">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl">
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage:
                  "url(/assets/landing/fondo_ano_nuevo.webp)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
            
            {/* Fuegos artificiales superiores */}
            <div className="absolute top-10 left-1/4 transform -translate-x-1/2">
              <div className="relative">
                <div className="w-1 h-8 bg-gradient-to-b from-amber-300 to-transparent mx-auto"></div>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-400/40 to-yellow-500/40 rounded-full blur-md"></div>
                    <div className="absolute flex space-x-1 mt-1">
                      <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                      <Sparkles className="w-2 h-2 text-yellow-400 animate-pulse delay-100" />
                      <Sparkles className="w-3 h-3 text-amber-300 animate-pulse delay-200" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute top-16 right-1/3 transform translate-x-1/2">
              <div className="relative">
                <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-transparent mx-auto"></div>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-gradient-to-r from-yellow-400/30 to-amber-400/30 rounded-full blur-md"></div>
                </div>
              </div>
            </div>

            <div className="absolute top-20 left-1/3 transform -translate-x-1/2">
              <div className="relative">
                <div className="w-1 h-5 bg-gradient-to-b from-orange-400 to-transparent mx-auto"></div>
                <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                  <div className="w-6 h-6 bg-gradient-to-r from-orange-400/40 to-amber-500/40 rounded-full blur-md"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 min-h-[400px] md:min-h-[450px] flex flex-col justify-end p-8 md:p-12">
            <div className="text-center space-y-6 md:space-y-8 w-full max-w-4xl mx-auto pb-8 md:pb-12">
              <div className="space-y-2">
                <h2
                  className={`text-4xl md:text-6xl lg:text-7xl font-bold 
                            text-amber-300 leading-tight ${benedict.className}
                            drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]`}
                >
                  Bienvenido 2026
                </h2>
              </div>

              <p className="text-xl md:text-2xl lg:text-3xl text-white font-light leading-relaxed max-w-3xl mx-auto">
                Un nuevo año para crear, mejorar y hacer crecer tu negocio con tecnología
              </p>
            </div>
          </div>
          
          {/* Bordes decorativos */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent"></div>
          
          {/* Esquinas decorativas */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-400/30 rounded-tl-lg"></div>
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-400/30 rounded-tr-lg"></div>
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-yellow-400/30 rounded-bl-lg"></div>
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-yellow-400/30 rounded-br-lg"></div>
        </div>
      </div>
    </section>
  );
}