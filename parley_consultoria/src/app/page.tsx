"use client"

import { useState, useEffect } from "react"; 
import CallToAction from "@/components/call-to-action";
import FeaturesCards from "@/components/features-1";
import FeaturesButtons from "@/components/features-12";
import FooterSection from "@/components/footer";
import HeroSection from "@/components/hero-section";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";
import SeasonSection from "@/components/season-section";
import { getWhatsAppContacts } from "@/lib/utils/whatsapp_contacts";
import Image from "next/image";
import ContactSection from "@/components/contact-section";
import FAQSection from "@/components/faq-section";
import FloatingInfo from "@/components/landing/floating-info";
import { getPhoneContacts } from "@/lib/utils/phone_contacts";
import { PhoneFloat } from "@/components/landing/phone-float";
import InfoSection from "@/components/info-section";


export default function Home() {
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

  // Funciones para abrir un flotante y cerrar el otro
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
      <InfoSection />

      {/* <SeasonSection /> */}
      <section id="services">
        <FeaturesCards />
      </section>

      <section id="areas">
        {/* <FeaturesButtons /> */}
      </section>
      
      <FAQSection />

      <section id="contact-section">
      <ContactSection/>
      </section>
      <FooterSection />
       {isWhatsAppActive && (
        <WhatsAppFloat
          contacts={whatsappContacts}
          headerText="Iniciar conversación"
          subtitleText=""
          responseTimeText="El equipo suele responder en unos minutos."
          isOpen={isWhatsAppOpen} 
          onToggle={handleWhatsAppToggle}
        />
      )}

      {isPhoneActive && (
        <PhoneFloat
          contacts={phoneContacts}
          headerText="Llamar por Teléfono"
          subtitleText=""
          responseTimeText="Te atenderemos en horario de atención."
          position={phonePosition}
          isOpen={isPhoneOpen}
          onToggle={handlePhoneToggle}
        />
      )}
    </>
  );
}
