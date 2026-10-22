"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

const InfoSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  const isImageInView = useInView(imageRef, { once: true, amount: 0.3 });
  const isTextInView = useInView(textRef, { once: true, amount: 0.3 });

  return (
    <section
      ref={sectionRef}
      className="bg-[#E6DDCF] py-20 overflow-hidden"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8 md:gap-12 lg:gap-16">
        <motion.div
          ref={imageRef}
          className="w-full md:w-2/5 flex-shrink-0 md:sticky md:top-24 md:self-start"
          initial={{ opacity: 0 }}
          animate={isImageInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="relative md:sticky md:top-24">
            <Image
              src="/assets/landing/infosection.png"
              alt="Equipo de abogados de Parley Despacho Jurídico"
              width={800}
              height={600}
              className="w-full h-64 md:h-80 object-cover rounded-lg shadow-md"
              priority 
            />
          </div>
        </motion.div>

        <motion.div
          ref={textRef}
          className="w-full md:w-3/5 space-y-4 text-gray-700 text-sm md:text-base leading-relaxed"
          initial={{ opacity: 0 }}
          animate={isTextInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p>
            En <strong className="text-[#4a1518] font-semibold">Parley Despacho Jurídico</strong>, somos un equipo de abogados en Tepic, Nayarit, comprometidos con brindar soluciones legales efectivas a personas y empresas en toda la República Mexicana.
          </p>
          <p>
            Nuestro despacho jurídico en Tepic se especializa en asesoría legal estratégica, representación ante tribunales y acompañamiento profesional en cada etapa de tu proceso. Analizamos cada caso con responsabilidad, transparencia y enfoque en resultados.
          </p>
          <p>
            Si buscas <strong className="text-[#4a1518] font-semibold">abogados en Nayarit</strong> que te escuchen, te orienten con honestidad y diseñen una estrategia sólida para tu situación legal, en Parley encontrarás el respaldo que necesitas. Trabajamos con ética, confidencialidad y profesionalismo para proteger tus intereses y brindarte tranquilidad jurídica.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default InfoSection;