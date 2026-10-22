import Image from "next/image";
import { AnimatedCard } from "@/components/animated-card";

interface Experience {
  title: string;
  description: string;
  end?: boolean;
}

const experiences: Experience[] = [
  {
    title: "Trayectoria y Fundación",
    description:
      "ALVEUS SOFT fue fundada el 27 de mayo de 2021 por el Ing. Manuel Vizcaino, un empresario con una visión clara: sistematizar y automatizar los procesos y controles de sus clientes para mejorar su eficiencia, productividad y rentabilidad. Desde su fundación, la empresa ha trabajado de manera incansable para hacer realidad su visión, posicionándose rápidamente como un referente en su campo.",
  },
  {
    title: "Áreas de Especialización y Metodologías",
    description:
      "ALVEUS SOFT se especializa en la sistematización y automatización de procesos y controles, ofreciendo soluciones tecnológicas a medida. Nuestras áreas de especialización incluyen: \n \n •	Desarrollo de Páginas Web: Creación de sitios web responsivos y optimizados para la experiencia del usuario. \n •	Desarrollo de Software Personalizado: Soluciones únicas que se adaptan a las necesidades específicas de cada cliente.\n •	Automatización de Procesos: Implementación de tecnologías para simplificar y acelerar tareas repetitivas.\n •	Consultoría en Tecnología: Asesoramiento experto en la selección e implementación de tecnologías. \n •	Integración de Sistemas: Conexión y unificación de diferentes sistemas para una comunicación fluida.\n •	Soporte y Mantenimiento: Servicio continuo para garantizar el funcionamiento óptimo de las soluciones.\n •	Venta de Equipo de Cómputo: Suministro de hardware, software y consumibles de alta calidad.\n \n Utilizamos metodologías ágiles para la gestión de proyectos, asegurando el cumplimiento de plazos, la eficiencia en el uso de recursos y la colaboración cercana con nuestros clientes.",
  },
  {
    title: "Compromiso y Valores",
    description:
      "La esencia de ALVEUS SOFT se basa en valores que guían cada acción y decisión:\n \n •	<strong>Innovación</strong>: La búsqueda constante de nuevas ideas y tecnologías para estar a la vanguardia.\n •	<strong>Disciplina</strong>: Compromiso con la excelencia y la calidad en cada proyecto.\n •	<strong>Responsabilidad</strong>: Un enfoque ético y responsable en todas las decisiones.\n •	<strong>Proactividad</strong>: Anticiparse a las necesidades de los clientes y ofrecer soluciones de manera oportuna.\n •	<strong>Creatividad</strong>: Fomentar un ambiente en el que las ideas frescas son la norma.\n •	<strong>Trabajo en Equipo</strong>: La colaboración y el apoyo mutuo como pilares para construir relaciones sólidas.",
  },
  {
    title: "Visión y Enfoque Geográfico",
    description:
      "Nuestra visión es ser la empresa líder en la zona occidente de México, ayudando y acompañando a nuestros clientes en su crecimiento y evolución constante con soluciones tecnológicas adaptadas a sus necesidades. Estamos comprometidos con la excelencia, ayudando a nuestros clientes a crecer y evolucionar en un paisaje tecnológico en constante cambio.",
    end: true,
  },
];

export default function ExperienceCard() {
  return (
    <ol className="relative border-s border-white dark:border-[#f1c928]">
      {experiences.map((exp, index) => (
        <AnimatedCard key={index}>
          <li className="mb-10 ms-3">
            <div className="group mb-8 rounded-lg border border-slate-700/50 bg-slate-900/10">
              <div className="flex gap-4 p-6">
                {/* Icono */}
                <div className="flex-shrink-0">
                  <div className="absolute flex items-center justify-center w-10 h-10 -start-5">
                    <span className="w-10 h-10 rounded-full -start-3 ring-8 ring-white dark:ring-[#0c0a09] dark:bg-[#0c0a09]">
                      <Image
                        src="/assets/logos/alveus.png"
                        alt="alveus"
                        className="absolute object-cover transition-opacity duration-300 group-hover:opacity-0"
                        fill
                      />
                      <Image
                        src="/assets/logos/alveus-hover.png"
                        alt="alveus hover"
                        className="absolute object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                        fill
                      />
                    </span>
                  </div>

                  {/* Punto del final */}
                    {exp.end && (
                      <div className="absolute flex items-center justify-center w-10 h-10 -bottom-5">
                        <span className="absolute w-5 h-5 bg-[#f1c928] rounded-full -start-12"></span>
                      </div>
                    )}

                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-semibold text-slate-200 group-hover:text-[#f1c928]">
                      {exp.title}
                    </h3>
                  </div>

                  <p 
                    className="text-sm text-slate-400 leading-relaxed mb-4 text-pretty [white-space:pre-wrap] font-normal"
                    dangerouslySetInnerHTML={{ __html: exp.description }}
                  />
                </div>
              </div>
            </div>
          </li>
        </AnimatedCard>
      ))}
    </ol>
  );
}
