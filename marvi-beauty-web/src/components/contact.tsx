"use client";

import { useState, useEffect } from "react";
import { AnimatedCardX2 } from "./animations/animated-cardX2";
import { AnimatedCardX } from "./animations/animated-cardX";
import { AnimatedText } from "./animations/animated-text";
import { Phone, Facebook, Instagram, Globe, MessageCircle, Mail, Clock, MapPin,
} from "lucide-react";
import {
  getSocialMediaConfigs,
  type SocialMediaData,
} from "@/lib/actions/configuration.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { toast } from "sonner";

export default function ContactSection() {
  const [socialData, setSocialData] = useState<SocialMediaData>({});
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const data = await getSocialMediaConfigs();

      if (data.success) {
        setSocialData(data.data || {});
      } else {
        setSocialData({});
        toast.warning(data.message);
      }

      const userWithPermissions = await getUserWithPermissions();
      const userPermissions =
        userWithPermissions?.permissions?.map(
          (p: { code: string }) => p.code
        ) || [];

    } catch (error) {
      toast.warning("Error al cargar datos: " + error);
    } finally {
      setLoading(false);
    }
  };

    const formatToPhoneNumber = (phoneNumber: string) => {

    // Formatear número de teléfono
      const cleaned = phoneNumber.replace(/\D/g, "");
      if (cleaned.length === 10) {
        return `+52 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
      }
    };

  return (
    <section id="contacto" className="relative w-full py-20 px-6 bg-[#F5F4F1]">
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundColor: "#F5F4F1",
          opacity: 0.3,
          backgroundImage:
            "linear-gradient(#987E71 1.7px, transparent 1.7px), linear-gradient(to right, #987E71 1.7px, #F5F4F1 1.7px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div className="relative z-10 container mx-auto px-4 lg:px-8 max-w-6xl">
        {/* Título */}
        <AnimatedText>
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl lg:text-6xl font-bold text-[#8b7163] mb-4 text-balance">
            Visítanos
          </h2>
          <p className="text-lg text-black/60 max-w-2xl mx-auto leading-relaxed">
            Estamos aquí para atenderte. Agenda tu cita y déjanos consentirte
          </p>
        </div>
        </AnimatedText>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-6">
            {/* Dirección */}
            <AnimatedCardX>
            <div className="border border-[#b9b9b9] bg-white rounded-2xl p-4 min-h-[120px] shadow-md hover:shadow-lg flex items-center gap-4 hover:shadow-[#987E71]/20 hover:scale-105 hover:border-[#987E71]/60 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-full bg-[#E6E6E6] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#987E71]/20 group-hover:scale-110 group-hover:rotate-6">
                <MapPin className="w-6 h-6 text-black transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">Dirección</h3>
                <p className="text-black/60">
                  Calle 21 de Marzo, Esquina calle 18 de Marzo
                  <br />
                  Colonia Menchaca
                </p>
              </div>
            </div>
            </AnimatedCardX>

            {/* Teléfono */}
            <AnimatedCardX>
            <a href="tel:+5231113754899" className="block">
            <div className="border border-[#b9b9b9] bg-white rounded-2xl p-4 min-h-[120px] shadow-md hover:shadow-lg flex items-center gap-4 hover:shadow-[#987E71]/20 hover:scale-105 hover:border-[#987E71]/60 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-[#E6E6E6] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#987E71]/20 group-hover:scale-110 group-hover:rotate-6">
                <Phone className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">Teléfono</h3>
                <p className="text-black/60">{formatToPhoneNumber(socialData.phone_number??'3113754899')}</p>
              </div>
            </div>
            </a>
            </AnimatedCardX>

            {/* Email */}
            <AnimatedCardX>
            <a href="mailto:Marjovizjz@gmail.com" className="block">
            <div className="border border-[#b9b9b9] bg-white rounded-2xl p-4 min-h-[120px] shadow-md hover:shadow-lg flex items-center gap-4 hover:shadow-[#987E71]/20 hover:scale-105 hover:border-[#987E71]/60 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-[#E6E6E6] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#987E71]/20 group-hover:scale-110 group-hover:rotate-6">
                <Mail className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">Email</h3>
                <p className="text-black/60">{socialData.email??"marjovizjz@gmail.com"}</p>
              </div>
            </div>
            </a>
            </AnimatedCardX>

            {/* Horario 
            <AnimatedCardX>
            <div className="border border-[#b9b9b9] bg-white rounded-2xl p-4 min-h-[120px] shadow-md hover:shadow-lg flex items-center gap-4 hover:shadow-[#987E71]/20 hover:scale-105 hover:border-[#987E71]/60 transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-full bg-[#E6E6E6] flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:bg-[#987E71]/20 group-hover:scale-110 group-hover:rotate-6">
                <Clock className="w-6 h-6 text-black" />
              </div>
              <div>
                <h3 className="font-semibold text-black mb-1">Horario (temporal)</h3>
                <p className="text-black/60">
                  Lunes - Viernes: 9:00 AM - 7:00 PM
                  <br />
                  Sábado: 10:00 AM - 6:00 PM
                  <br />
                  Domingo: Cerrado
                </p>
              </div>
            </div>
            </AnimatedCardX>
            */}
          </div>

          <AnimatedCardX2>
          <div className="w-full md:h-full h-96">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d464.02728571280534!2d-104.89008361031911!3d21.499168238415617!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8427371db74b76d7%3A0xbffa351d47d302b8!2s21%20de%20Marzo%2C%20Menchaca%2C%2063150%20Tepic%2C%20Nay.!5e0!3m2!1ses-419!2smx!4v1759522829764!5m2!1ses-419!2smx"
              className="w-full h-full border-0 rounded-xl shadow-2xl"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          </AnimatedCardX2>
        </div>
      </div>
    </section>
  );
}
