import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Home } from "lucide-react";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { TextEffect } from "@/components/ui/text-effect";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-[#0c0a09]">
      {/* Fondos decorativos similares al hero */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0c0a09]"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-gray-900/10 to-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-yellow-400/2 to-gray-800/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-yellow-400/3 via-transparent to-transparent"></div>
        
        {/* Efecto de luz de faro */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-100"
          style={{
            background: `conic-gradient(from 315deg at 100% 0%, 
              transparent 0deg, 
              rgba(200, 200, 210, 0.1) 30deg,
              rgba(220, 220, 230, 0.15) 45deg,
              rgba(200, 200, 210, 0.1) 60deg,
              transparent 90deg)`,
          }}
        />

        {/* Partículas de luz */}
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gray-300 rounded-full animate-pulse opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Resplandor central */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-25 scale-100"
          style={{
            background: "radial-gradient(circle, rgba(220, 220, 230, 0.2) 0%, transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10">
        <AnimatedGroup
          variants={{
            container: {
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.2,
                },
              },
            },
            item: {
              hidden: { opacity: 0, filter: "blur(12px)", y: 20 },
              visible: {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                transition: { type: "spring", bounce: 0.3, duration: 1.2 },
              },
            },
          }}
        >
          <Card className="relative bg-[#1a1a1a] text-white rounded-3xl shadow-2xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
            {/* Efecto de borde luminoso */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-gray-700/5 rounded-3xl"></div>
            
            <CardHeader className="text-center relative z-10">
              <CardTitle className="text-2xl font-medium text-amber-400">
                <TextEffect preset="fade-in-blur" speedSegment={0.3} as="span">
                  Lo sentimos, algo salió mal
                </TextEffect>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex flex-col gap-6 relative z-10">
              {params?.error ? (
                <div className="text-center">
                  <TextEffect 
                    preset="fade-in-blur" 
                    speedSegment={0.3} 
                    delay={0.3}
                    as="p"
                    className="text-sm text-gray-300 mb-2"
                  >
                    Código de error:
                  </TextEffect>
                  <div className="bg-red-500/10 border border-red-500/30 py-2 px-3 rounded-lg">
                    <TextEffect 
                      preset="fade-in-blur" 
                      speedSegment={0.3} 
                      delay={0.4}
                      as="p"
                      className="text-sm font-medium text-red-400"
                    >
                      {params.error}
                    </TextEffect>
                  </div>
                </div>
              ) : (
                <TextEffect 
                  preset="fade-in-blur" 
                  speedSegment={0.3} 
                  delay={0.3}
                  as="p"
                  className="text-sm text-gray-300 text-center"
                >
                  Ocurrió un error no especificado.
                </TextEffect>
              )}
              
              <Button
                asChild
                className="w-full bg-amber-500 hover:bg-amber-600 text-white transition-all duration-300 ease-in-out transform hover:scale-105 rounded-xl border border-amber-400/30 shadow-lg"
              >
                <Link href="/" className="flex items-center justify-center gap-2">
                  <Home size={18} />
                  Volver al inicio
                </Link>
              </Button>
            </CardContent>
          </Card>
        </AnimatedGroup>
      </div>
    </div>
  );
}