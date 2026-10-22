import CallToAction from "@/components/call-to-action";
import FeaturesCards from "@/components/features-1";
import FeaturesButtons from "@/components/features-12";
import FooterSection from "@/components/footer";
import HeroSection from "@/components/hero-section";
import { ContactFloatsWrapper } from "@/components/landing/contact-floats-wrapper";
import { getWhatsAppContacts } from "@/lib/utils/whatsapp_contacts";
import { getPhoneContacts } from "@/lib/utils/phone_contacts";

export default async function Home() {
  // 🔹 Cargar contactos del lado del servidor (SSR)
  const whatsappContacts = await getWhatsAppContacts();
  const phoneContacts = await getPhoneContacts();

  return (
    <>
      <HeroSection />
      {/* <SeasonSection /> */}
      <section id="services">
        <FeaturesCards />
      </section>
      <section id="benefits">
        <FeaturesButtons />
      </section>
      <CallToAction />
      <FooterSection />

      <ContactFloatsWrapper 
        whatsappContacts={whatsappContacts} 
        phoneContacts={phoneContacts} 
      />
    </>
  );
}
