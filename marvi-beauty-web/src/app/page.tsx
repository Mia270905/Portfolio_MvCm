
import HeroSection from "@/components/hero";
import FooterSection from "@/components/footer";
import ServicesSection from "@/components/services";
import GallerySection from "@/components/gallery";
import ContactSection from "@/components/contact";
import RubberSection from "@/components/rubber";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";
import { getWhatsAppContacts } from "@/lib/utils/whatsapp_contacts";
import { PhoneFloat } from "@/components/landing/phone-float";
import { getPhoneContacts } from "@/lib/utils/phone_contacts";
;

export default async function Home() {
  const whatsappcontacts = await getWhatsAppContacts();
  const phoneContacts = await getPhoneContacts();

  // Determinar qué botones están activos
  const isPhoneActive = phoneContacts.length > 0;
  const isWhatsAppActive = whatsappcontacts.length > 0;

  // Si WhatsApp está activo, teléfono va arriba ("top")
  // Si WhatsApp no está activo, teléfono va abajo ("bottom")
  const phonePosition= isWhatsAppActive ? "top" : "bottom";
  return (
    <>
      <HeroSection />
      <section id="servicios" className="scroll-mt-16">
      <ServicesSection />
      </section>
      <RubberSection />
      <section id="galeria" className="scroll-mt-16">
      <GallerySection />
      </section>
      <section id="contacto" className="scroll-mt-16">
      <ContactSection />
      </section>
      <FooterSection />
       {isWhatsAppActive && (
      <WhatsAppFloat
        contacts={whatsappcontacts}
        headerText="Iniciar conversación"
        subtitleText=""
        responseTimeText="El equipo suele responder en unos minutos."
      />
      )}
      {isPhoneActive && (
        <PhoneFloat
          contacts={phoneContacts}
          headerText="Llamar por Teléfono"
          subtitleText=""
          responseTimeText="Te atenderemos en horario de atención."
          position={phonePosition}
        />
       )}
    </>
  );
}
