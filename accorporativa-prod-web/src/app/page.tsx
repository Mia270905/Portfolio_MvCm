"use client"; // necesario para usar hooks

import { useState, useEffect } from "react"; 
import FooterSection from "@/components/footer";
import HeroSection from "@/components/hero-section";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";
import { PhoneFloat } from "@/components/landing/phone-float";
import { getWhatsAppContacts } from "@/lib/utils/whatsapp_contacts";
import { getPhoneContacts } from "@/lib/utils/phone_contacts";
import Features from "@/components/features-3";
import { AnimatedFadeIn } from "@/components/animations/animated-fadein";
import AnimatedSection from "@/components/animations/animated-section";
import ContentSection from "@/components/content-4";
import ContentSectionInverted from "@/components/content-4-inverted";
import ImageContentSection from "@/components/content-3";
import CircularGallery from "@/components/ui/circular-gallery";
import WallOfLoveSection from "@/components/testimonials";
import ContactSection from "@/components/call-to-action";
import LogoCompanies from "@/components/logo-companies";


export default function Home() {
  // 🔹 Estados para controlar qué flotante está abierto
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);

  const [whatsappContacts, setWhatsAppContacts] = useState<Awaited<ReturnType<typeof getWhatsAppContacts>>>([]);
  const [phoneContacts, setPhoneContacts] = useState<Awaited<ReturnType<typeof getPhoneContacts>>>([]);

  // 🔹 Cargar contactos (async) - useEffect para Client Component
  useEffect(() => {
    const fetchContacts = async () => {
      const wp = await getWhatsAppContacts();
      const ph = await getPhoneContacts();
      setWhatsAppContacts(wp);
      setPhoneContacts(ph);
    };
    fetchContacts();
  }, []);

  // Determinar qué botones están activos
  const isWhatsAppActive = whatsappContacts.length > 0;
  const isPhoneActive = phoneContacts.length > 0;

  // Si WhatsApp está activo, teléfono va arriba ("top")
  // Si WhatsApp no está activo, teléfono va abajo ("bottom")
  const phonePosition = isWhatsAppActive ? "top" : "bottom";

  // 🔹 Funciones para abrir un flotante y cerrar el otro
  const handleWhatsAppToggle = () => {
    setIsWhatsAppOpen((prev) => !prev);
    if (!isWhatsAppOpen) setIsPhoneOpen(false); // cerrar teléfono si se abre WhatsApp
  };

  const handlePhoneToggle = () => {
    setIsPhoneOpen((prev) => !prev);
    if (!isPhoneOpen) setIsWhatsAppOpen(false); // cerrar WhatsApp si se abre teléfono
  };

  return (
    <>
      <HeroSection />
      <LogoCompanies />
      <section id="oferta">
        <Features />
      </section>
      <section id="servicios" className="relative overflow-hidden">
        <AnimatedSection direction="left">
          <ContentSection />
        </AnimatedSection>
        <AnimatedSection direction="right">
          <ContentSectionInverted />
        </AnimatedSection>
      </section>
      <section id="cursos">
        <AnimatedSection direction="left">
          <ImageContentSection />
        </AnimatedSection>
      </section>
      <section id="galeria" className="h-[650px] relative pt-16 pb-6">
        <div className="text-center pt-12">
            <AnimatedFadeIn>
                <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Galería</h2>
            </AnimatedFadeIn>
        </div>
        <CircularGallery bend={0} textColor="#ffffff" borderRadius={0.05} scrollEase={0.01} scrollSpeed={4}/>
      </section>
      <section id="opiniones">
        <WallOfLoveSection />
      </section>
      <section id="contacto" className="scroll-m-12">
        <ContactSection />
      </section>
      <FooterSection />

      {isWhatsAppActive && (
        <WhatsAppFloat
          contacts={whatsappContacts}
          headerText="Iniciar conversación"
          subtitleText=""
          responseTimeText="El equipo suele responder en unos minutos."
          isOpen={isWhatsAppOpen} // 🔹 Estado desde Home
          onToggle={handleWhatsAppToggle} // 🔹 Función desde Home
        />
      )}

      {isPhoneActive && (
        <PhoneFloat
          contacts={phoneContacts}
          headerText="Llamar por Teléfono"
          subtitleText=""
          responseTimeText="Te atenderemos en horario de atención."
          position={phonePosition}
          isOpen={isPhoneOpen} // 🔹 Estado desde Home
          onToggle={handlePhoneToggle} // 🔹 Función desde Home
        />
      )}
    </>
  );
}
