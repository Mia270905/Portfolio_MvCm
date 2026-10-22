"use client";
import { motion, useAnimation } from "framer-motion";
import { Phone, Mail, MapPin, Scale, Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
  getSocialMediaConfigs,
  type SocialMediaData,
} from "@/lib/actions/configuration.actions";
import { getUserWithPermissions } from "@/lib/actions/user.actions";
import { toast } from "sonner";

const ContactSection = () => {
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

  const contactInfo = [
    { icon: Phone, title: "Teléfono", content: `${ socialData.phone_number_social_media_tab ? formatToPhoneNumber(socialData.phone_number_social_media_tab) : '---'}`, subtitle: "Lun - Vie: 9:00 - 14:30, 16:00-18:30" },
    { icon: Mail, title: "Email", content: "contacto@parleyconsultoria.com", subtitle: "Respuesta en 24 horas" },
    { icon: MapPin, title: "Oficina", content: "Calle Querétaro 71 sur, Tepic, Nayarit", subtitle: "Centro, CP 63000" },
    { icon: Facebook, title: "Facebook", content: "@ParleyJurídico", subtitle: "Síguenos", link: "https://facebook.com/parleyconsultoria" },
  ];

  return (
    <section 
      id="contacto" 
      className="relative bg-[#faf8f3] py-20 overflow-hidden scroll-mt-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Divider */}
        {/* <div className="mb-16 flex justify-center">
          <div
            className="h-[2px] w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, #c6a365, transparent)",
            }}
          />
        </div> */}
  
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scale className="w-8 h-8" style={{ color: "#932d1a" }} />
            <span className="font-semibold tracking-widest uppercase text-sm" style={{ color: "#932d1a" }}>
              ¡Estamos aquí para ayudarte!
            </span>
          </div>
          <h2 className="text-center text-4xl sm:text-5xl font-bold leading-[1.15] tracking-tight text-gray-600 mb-4">
            Contáctanos{" "}
            <span className="text-[#c4a87c]">ahora</span>
          </h2>
          <p className="text-zinc-700 max-w-2xl mx-auto text-lg">
            Te invitamos a conocer nuestra oficina o comunícate con nosotros para agendar tu consulta legal.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-200 h-full min-h-[400px]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d927.9965632804384!2d-104.8970024!3d21.5082584!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x842737358c68faaf%3A0x1d12df43f2242209!2sParley%20-%20Abogado%20en%20Tepic!5e0!3m2!1ses-419!2smx!4v1770223682551!5m2!1ses-419!2smx" 
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "400px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de la oficina"
                className="w-full h-full"
              />
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {contactInfo.map((item, index) => (
              <motion.a
                key={item.title}
                href={item.link}
                target={item.link ? "_blank" : undefined}
                rel={item.link ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
                className={`group block rounded-xl border border-gray-200 shadow-md overflow-hidden transition-all duration-300 ${
                  item.link ? "cursor-pointer" : ""
                }`}
                style={{
                  backgroundColor: "white",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.06)",
                }}
              >
                <div className="flex items-start gap-4 p-5 relative z-10">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-[#70050514]">
                    <item.icon
                      className="w-5 h-5 text-[#a7872a] transition-all duration-300 group-hover:text-[#c2a76d]"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-zinc-900 mb-0.5">{item.title}</h4>
                    <p className="font-medium text-sm text-zinc-700">{item.content}</p>
                    <p className="text-gray-400 text-xs">{item.subtitle}</p>
                  </div>
                </div>
              </motion.a>
            ))}

            {/* CTA Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl p-6 text-white shadow-lg"
              style={{ backgroundColor: "#E6DDCF", boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
            >
              <Scale className="w-9 h-9 mb-3" style={{ color: "#932d1a" }} />
              <h4 className="font-serif text-zinc-900 text-lg font-semibold mb-2">Agenda tu consulta</h4>
              <p className="text-zinc-700 text-sm mb-4">
                Escríbenos a nuestro correo para agendar tu consulta sin costo y conocer como podemos ayudarte. 
              </p>
              <Button
                asChild
                variant="outline"
                className="bg-transparent border-2 font-semibold transition-all"
                style={{ borderColor: "#932d1a", color: "#932d1a" }}
              >
                <a
                  href="/cliente-cita"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Agendar Ahora
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;