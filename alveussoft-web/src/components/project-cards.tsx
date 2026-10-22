import Image from "next/image";
import { AnimatedCard } from "@/components/animated-card";

interface Technology {
  name: string;
  image: string;
  alt: string;
}

interface Project {
  title: string;
  description: string;
  technologies: Technology[];
  link: string;
  end?: boolean; // opcional: para marcar el que tiene el punto extra
}

const projects: Project[] = [
  {
    title: "Viri Carrillo el poder de ser tú",
    description: "Este proyecto consistió en el desarrollo de una plataforma web para Viridiana Carrillo, diseñada para centralizar la gestión de citas y programas de bienestar holístico. La plataforma permite a los usuarios agendar sesiones fácilmente y acceder a herramientas para equilibrar cuerpo, mente y espíritu, mejorando la experiencia y el soporte integral ofrecido.",
    link: "https://viricarrilloelpoderdesertu.com",
    technologies: [
      { name: "NextJS", image: "/assets/logos/nextjs.png", alt: "NextJS" },
      { name: "Supabase", image: "/assets/logos/supabase.png", alt: "Supabase" },
      { name: "Google Calendar", image: "/assets/logos/googlecalendar.png", alt: "Google Calendar" },
    ],
  },
  {
    title: "AC corporativa",
    description: "Este proyecto consistió en el desarrollo de una plataforma web para AC Corporativa, enfocada en centralizar información sobre sus soluciones de capacitación, consultoría y diplomados ejecutivos. La web permite a las empresas conocer y contactar los programas especializados que impulsan talento, productividad y cultura organizacional, facilitando la conexión entre clientes y los servicios de la compañía.",
    link: "https://ac-corporativa.com/",
    technologies: [
      { name: "NextJS", image: "/assets/logos/nextjs.png", alt: "NextJS" },
    ],
  },
  {
    title: "Pollería Gris",
    description: "Este proyecto consistió en el desarrollo de un sistema ERP (Enterprise Resource Planning) integral, diseñado para optimizar las operaciones diarias y la gestión de un negocio de alimentos. El sistema ofrece una solución completa que abarca desde la administración interna hasta la interacción con el cliente, mejorando la eficiencia y reduciendo los errores operativos.",
    link: "https://polleriagris.alveussoft.com",
    technologies: [
      { name: "Express", image: "/assets/logos/express.webp", alt: "Express" },
      { name: "Angular", image: "/assets/logos/angular.png", alt: "Angular" },
      { name: "Ionic", image: "/assets/logos/ionic.png", alt: "Ionic" },
      { name: "MongoDB", image: "/assets/logos/mongodb.png", alt: "MongoDB" },
    ],
  },
  {
    title: "Mariposa Papelerías",
    description: "Este proyecto de consultoría se centró en una transformación operativa integral para Mariposa Papelerías, implementando la plataforma Odoo ERP como la columna vertebral de su gestión. El objetivo principal fue migrar los procesos fragmentados de la empresa a un sistema unificado y moderno, potenciando su eficiencia y capacidad de toma de decisiones.",
    link: "https://www.mariposapapelerias.com.mx/",
    technologies: [
      { name: "Odoo", image: "/assets/logos/odoo_logo.png", alt: "Odoo" },
    ],
  },
  {
    title: "Jardínes de San Juan",
    description: "Este proyecto se enfocó en el desarrollo de un sistema de gestión de cobranza a domicilio, una solución integral diseñada para optimizar y automatizar el proceso de recolección de pagos. El sistema fue creado para centralizar el control de las operaciones de cobranza, mejorando la eficiencia, la transparencia y la organización para la empresa.",
    link: "https://jardines.alveussoft.com/login",
    technologies: [
      { name: "Angular", image: "/assets/logos/angular.png", alt: "Angular" },
      { name: "NestJS", image: "/assets/logos/nestjs.png", alt: "NestJS" },
      { name: "MySQL", image: "/assets/logos/mysql.png", alt: "MySQL" },
    ],
  },
  {
    title: "Uniformes de León",
    description: "Este proyecto consistió en el desarrollo de un sistema integral de gestión de pedidos, diseñado para optimizar el flujo de trabajo de una empresa de uniformes. La plataforma fue creada para centralizar la administración de clientes, pedidos y recursos, permitiendo a la empresa mejorar su eficiencia operativa, agilizar la producción y garantizar una entrega puntual y organizada.",
    link: "https://uniformesleon.alveussoft.com./login",
    technologies: [
      { name: "Angular", image: "/assets/logos/angular.png", alt: "Angular" },
      { name: "NestJS", image: "/assets/logos/nestjs.png", alt: "NestJS" },
      { name: "MongoDB", image: "/assets/logos/mongodb.png", alt: "MongoDB" },
    ],
  },
  {
    title: "Jasú",
    description: "Este proyecto se enfocó en la creación de una plataforma centralizada para la gestión de pedidos, diseñada para optimizar las operaciones de un negocio que maneja una alta carga de solicitudes. La solución digital permite un control total sobre clientes, el seguimiento de pedidos de principio a fin y una administración eficiente de los recursos de la empresa.",
    link: "https://jasu.alveussoft.com/inicio",
    technologies: [
      { name: "Angular", image: "/assets/logos/angular.png", alt: "Angular" },
      { name: "NestJS", image: "/assets/logos/nestjs.png", alt: "NestJS" },
      { name: "MongoDB", image: "/assets/logos/mongodb.png", alt: "MongoDB" },
    ],
    end: true, // este será el que tenga el punto al final de su linea
  },
];

export default function ProjectCard() {
  return (
    <ol className="relative border-s border-white dark:border-[#f1c928]">
      {projects.map((project, index) => (
        <AnimatedCard key={index}>
          <li className="mb-10 ms-3">
            <div className="group mb-8 border border-transparent rounded-lg hover:border-[#f1c928] transition-all duration-300">
              <a
                href={project.link}
                target="_blank"
                aria-label={`${project.title} (se abre en una nueva pestaña)`}
                rel="noreferrer"
              >
                <div className="flex gap-4 p-6">
                  {/* Icono */}
                  <div className="flex-shrink-0">
                    <div className="absolute flex items-center justify-center w-10 h-10 -start-5">
                      <span className="w-10 h-10 rounded-full -start-3 ring-8 ring-white dark:ring-[#0c0a09] dark:bg-[#0c0a09]">
                        <Image
                          src="/assets/logos/alveus.png"
                          alt="alveus_logo"
                          className="absolute object-cover transition-opacity duration-300 group-hover:opacity-0"
                          fill
                        />
                        <Image
                          src="/assets/logos/alveus-hover.png"
                          alt="alveus_logo"
                          className="absolute object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                          fill
                        />
                      </span>
                    </div>

                    {/* Punto del final */}
                    {project.end && (
                      <div className="absolute flex items-center justify-center w-10 h-10 -bottom-5">
                        <span className="absolute w-5 h-5 bg-[#f1c928] rounded-full -start-12"></span>
                      </div>
                    )}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-semibold text-slate-200 group-hover:text-[#f1c928]">
                        {project.title}
                      </h3>
                      {project.link && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-5 h-5 text-[#f1c928] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed mb-4 text-pretty">
                      {project.description}
                    </p>

                    <div>
                      <p className="text-sm font-medium text-slate-300 mb-3">
                        Tecnologías:
                      </p>
                      <div className="flex gap-3 flex-wrap">
                        {project.technologies.map((tech, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 flex items-center justify-center"
                            title={tech.name}
                          >
                            <Image
                              src={tech.image}
                              alt={tech.alt}
                              className="object-contain"
                              width={32}
                              height={32}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </li>
        </AnimatedCard>
      ))}
    </ol>
  );
}
