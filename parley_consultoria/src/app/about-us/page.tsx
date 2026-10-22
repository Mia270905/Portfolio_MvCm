"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Target, Users, Zap, Heart, Rocket } from "lucide-react";
import { useEffect, useState } from "react";

import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import { AnimatedText } from "@/components/animated-text";
import { AnimatedBlock } from "@/components/animated-block";
import { WhatsAppFloat } from "@/components/landing/whatsapp-float";

import TeamSection from "@/components/team-section";
import AboutUsSection from "@/components/about-us-section";

interface WhatsAppContact {
  name: string;
  subtitle: string;
  phone: string;
}

export default function AboutUsPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  
    useEffect(() => {
      const loadContacts = async () => {
        try {
          const whatsappModule = await import("@/lib/utils/whatsapp_contacts");
          const contactsData = await whatsappModule.getWhatsAppContacts();
          setContacts(contactsData);
        } catch (error) {
          console.error("Error loading contacts:", error);
        }
      };
  
      loadContacts();
    }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <HeroHeader />
      <AboutUsSection />
      <TeamSection />
      <FooterSection />
      <WhatsAppFloat
        contacts={contacts}
        headerText="Iniciar conversación"
        subtitleText=""
        responseTimeText="El equipo suele responder en unos minutos."
      />
    </>
  );
}
