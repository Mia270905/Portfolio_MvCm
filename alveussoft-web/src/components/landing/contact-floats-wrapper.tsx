"use client";

import { useState } from "react";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";
import { PhoneFloat } from "@/components/landing/phone-float";
import { getWhatsAppContacts } from "@/lib/utils/whatsapp_contacts";
import { getPhoneContacts } from "@/lib/utils/phone_contacts";

interface ContactFloatsWrapperProps {
  whatsappContacts: Awaited<ReturnType<typeof getWhatsAppContacts>>;
  phoneContacts: Awaited<ReturnType<typeof getPhoneContacts>>;
}

export function ContactFloatsWrapper({ whatsappContacts, phoneContacts }: ContactFloatsWrapperProps) {
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);

  const isWhatsAppActive = whatsappContacts.length > 0;
  const isPhoneActive = phoneContacts.length > 0;
  const phonePosition = isWhatsAppActive ? "top" : "bottom";

  const handleWhatsAppToggle = () => {
    setIsWhatsAppOpen((prev) => !prev);
    if (!isWhatsAppOpen) setIsPhoneOpen(false);
  };

  const handlePhoneToggle = () => {
    setIsPhoneOpen((prev) => !prev);
    if (!isPhoneOpen) setIsWhatsAppOpen(false);
  };

  return (
    <>
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
