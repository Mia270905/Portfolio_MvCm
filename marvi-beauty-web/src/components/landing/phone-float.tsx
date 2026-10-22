"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PhoneContact {
  name: string;
  subtitle: string;
  phone: string;
  avatar?: string;
}

interface PhoneFloatProps {
  contacts?: PhoneContact[];
  headerText?: string;
  subtitleText?: string;
  responseTimeText?: string;
  position?: "top" | "bottom"; 
}

export function PhoneFloat({
  contacts,
  headerText,
  subtitleText,
  responseTimeText,
  position = "top", 
}: PhoneFloatProps) {
  const [isOpen, setIsOpen] = useState(false);

  const safeContacts =
    contacts && contacts.length > 0
      ? contacts
      : [
          {
            name: "MarVi Beauty Room",
            subtitle: "MarVi Beauty Room",
            phone: "+1234567890",
          },
        ];

  const safeHeader = headerText ?? "Llamar por Teléfono";
  const safeSubtitle = subtitleText ?? "Selecciona a quién deseas llamar";
  const safeResponse = responseTimeText ?? "Te atenderemos en unos momentos.";

  const handleContactClick = (phone: string) => {
    setIsOpen(false);
    
    setTimeout(() => {
      const telUrl = `tel:${phone}`;
      const newWindow = window.open(telUrl, '_blank');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        window.location.href = telUrl;
      }
    }, 200);
  };

  const formatPhoneForDisplay = (phone: string) => {
    const cleanPhone = phone.replace(/[^\d+]/g, "");
    
    if (cleanPhone.startsWith('+')) {
      if (cleanPhone.length === 12) {
        return `${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 6)} ${cleanPhone.substring(6, 9)} ${cleanPhone.substring(9)}`;
      }
      return cleanPhone.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4');
    } else {
      if (cleanPhone.length === 10) {
        return `${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 6)} ${cleanPhone.substring(6)}`;
      }
      return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
  };

  // Determinar la clase CSS según la posición
  const positionClass = position === "bottom" ? "bottom-6" : "bottom-24";

  return (
    <div className={`fixed ${positionClass} right-6 z-50`}>
      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="phone-widget"
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute bottom-20 right-0 w-[350px] rounded-lg bg-white shadow-2xl overflow-hidden"
            >
              <div className="rounded-t-lg bg-blue-600 p-4 text-white flex flex-row gap-3 items-center">
                <Phone className="w-10 h-10 text-white" />
                <div>
                  <h3 className="text-lg font-semibold">{safeHeader}</h3>
                  <p className="text-sm text-white/90">{safeSubtitle}</p>
                </div>
              </div>

              <div className="p-4">
                <p className="mb-4 text-xs text-gray-700">{safeResponse}</p>
                <div className="space-y-2">
                  {safeContacts.map((contact, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleContactClick(contact.phone)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex w-full items-center bg-gray-200 gap-2 rounded-lg p-3 hover:bg-white hover:shadow-md transition-all cursor-pointer"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-gray-600 font-medium">
                          {contact.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {contact.subtitle}
                        </p>
                        <p className="text-sm font-medium text-blue-600 mt-1">
                          {formatPhoneForDisplay(contact.phone)}
                        </p>
                      </div>
                      <Phone className="w-6 h-6 text-blue-600" />
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="relative flex flex-col items-center pb-3">
                <div className="group relative flex justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="25"
                    className="rotate-180 bg-gray-100 rounded-md fill-none text-blue-600 hover:fill-blue-100 hover:bg-gray-200 transition-colors duration-300 cursor-pointer"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 4l-4 2v5l4 2l4 -2v-5z" />
                    <path d="M12 11l4 2l4 -2v-5l-4 -2l-4 2" />
                    <path d="M8 13v5l4 2l4 -2v-5" />
                  </svg>

                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center">
                    <div className="bg-gray-800 text-white text-sm px-3 py-1 rounded-md shadow-lg whitespace-nowrap">
                      ⚡ Powered by <strong>Alveus Soft</strong>
                    </div>
                    <div className="w-2 h-2 bg-gray-800 rotate-45 -mt-1"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div whileTap={{ scale: 0.9 }}>
          <Button
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="h-14 w-14 rounded-full bg-blue-600 shadow-lg transition-all hover:scale-110 group hover:bg-blue-700"
          >
            <motion.div
              key={isOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? (
                <X className="h-8 w-8 text-white" />
              ) : (
                <Phone className="h-8 w-8 text-white transition-transform group-hover:scale-110" />
              )}
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}