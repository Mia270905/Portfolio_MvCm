import { Mail, Phone, Linkedin, ArrowRight } from "lucide-react";
import Image, { StaticImageData } from "next/image";

interface TeamMemberCardProps {
  name: string;
  title: string;
  specialty: string;
  image: string | StaticImageData;
  email: string;
  phone: string;
  linkedin?: string;
  delay?: number;
}

/**
 * Componente secundario para los botones de contacto
 */
function ContactIcon({ 
  href, 
  icon, 
  label, 
  external 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  external?: boolean; 
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="p-2 rounded-full bg-secondary/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300 flex items-center justify-center"
    >
      {icon}
    </a>
  );
}

/**
 * Componente principal de la tarjeta de miembro del equipo
 */
export default function TeamMemberCard({
  name,
  title,
  specialty,
  image,
  email,
  phone,
  linkedin,
  delay = 0,
}: TeamMemberCardProps) {
  return (
    <article
      className="group animate-fade-in"
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
        opacity: 1 // Estado inicial antes de que la animación comience
      }}
    >
      <div className="bg-card rounded-lg overflow-hidden shadow-card transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 border border-border/50">
        
        {/* Contenedor de Imagen */}
        <div className="relative overflow-hidden aspect-[4/5] bg-muted">
          <Image
            src={image}
            alt={`Retrato de ${name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
            priority={delay === 0}
          />
          
          {/* Overlay de color sutil */}
          <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Línea dorada de acento */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-custom-accent-hover-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left z-10" />
        </div>

        {/* Contenido de texto */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-custom-secondary font-bold text-xs uppercase tracking-[0.15em] mb-1">
              {title}
            </p>
            <h3 className="font-serif text-2xl font-semibold text-custom-accent-secondary text-foreground group-hover:text-primary transition-colors duration-300">
              {name}
            </h3>
          </div>
          
          <p className="text-muted-foreground text-sm leading-relaxed mb-6 min-h-[40px]">
            {specialty}
          </p>

          <div className="h-px bg-gradient-to-r from-border via-border to-transparent mb-6" />

          {/* Enlaces de Contacto */}
          {/* <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ContactIcon 
                href={`mailto:${email}`} 
                icon={<Mail className="w-4 h-4" />} 
                label={`Enviar correo a ${name}`} 
              />
              <ContactIcon 
                href={`tel:${phone}`} 
                icon={<Phone className="w-4 h-4" />} 
                label={`Llamar a ${name}`} 
              />
              {linkedin && (
                <ContactIcon 
                  href={linkedin} 
                  icon={<Linkedin className="w-4 h-4" />} 
                  label={`LinkedIn de ${name}`}
                  external 
                />
              )}
            </div>
            
            <span className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
              <ArrowRight className="w-5 h-5" />
            </span>
          </div> */}
        </div>
      </div>
    </article>
  );
}