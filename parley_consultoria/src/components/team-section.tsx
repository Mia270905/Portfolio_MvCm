"use client";

import React from "react";
import TeamMemberCard from "./team-member-card";
import { StaticImageData } from "next/image";

// Importaciones de imágenes
import attorney1 from "@/assets/team-section/LicJordanDelToro.jpg";
import attorney2 from "@/assets/team-section/LicAlbertoBautista.jpg";
import attorney3 from "@/assets/team-section/LicNadineArias.jpg";
import attorney4 from "@/assets/team-section/LicClaudiaBautista.jpg";
import attorney5 from "@/assets/team-section/IngEstefaniaDelToro.jpg";

interface TeamMember {
  name: string;
  title: string;
  specialty: string;
  image: StaticImageData;
  email: string;
  phone: string;
  linkedin: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Maestro Enrique Jordan Del Toro Medina",
    title: "Lic. en Derecho",
    specialty: "Director General. Especialista en Penal Acusatorio, Derecho Laboral y Propiedad Intelectual.",
    image: attorney1,
    email: "contacto@parleyconsultoria.com",
    phone: "311 132 6691",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Licenciada Claudia Fernanda Bautista García",
    title: "Lic. en Derecho",
    specialty: "Especialista encargada en recuperación de créditos y préstamos.",
    image: attorney4,
    email: "contacto@parleyconsultoria.com",
    phone: "311 132 6691",
    linkedin: "https://linkedin.com",
  },
];

export default function TeamSection() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de la Sección */}
        <header className="max-w-3xl mx-auto text-center mb-16 lg:mb-20">
          <div className="inline-block mb-4">
            <span className="text-custom-tertiary text-accent font-medium text-sm uppercase tracking-[0.2em]">
              Conoce a nuestros abogados
            </span>
          </div>
          <h2 className="text-custom-primary font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground mb-6 animate-fade-in">
            Nuestros directores
          </h2>
          <div 
            className="w-20 h-1 bg-accent mx-auto mb-6 animate-fade-in" 
            style={{ animationDelay: "100ms", animationFillMode: 'forwards' }} 
          />
          <p className="text-muted-foreground text-lg leading-relaxed animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: 'forwards' }}>
            Tenemos un grupo de especialistas enfocados en solucionar tus problemas en cualquier área del derecho.
          </p>
        </header>

        {/* Cuadrícula de Miembros */}
        <div className="flex flex-wrap justify-center gap-8 lg:gap-10">
          {TEAM_MEMBERS.map((member, index) => (
            <div key={member.email} className="w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.25rem)] max-w-sm">
              <TeamMemberCard
                {...member}
                delay={300 + index * 100}
              />
            </div>
          ))}
        </div>

        {/* CTA Final */}
        <footer className="mt-16 lg:mt-20 text-center animate-fade-in" style={{ animationDelay: "800ms", animationFillMode: 'forwards' }}>
          <p className="text-muted-foreground mb-6">
            ¿Listo para discutir sus necesidades legales?
          </p>
          <a
            href="/cliente-cita"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary text-primary-foreground font-medium rounded transition-all duration-300 hover:bg-accent hover:text-accent-foreground shadow-lg hover:shadow-xl"
          >
            Agendar una consulta
          </a>
        </footer>
      </div>
    </section>
  );
}