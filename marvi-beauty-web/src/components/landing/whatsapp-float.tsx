"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
// import {
//   getWorkingHours,
//   type WorkingHours,
// } from "@/lib/actions/working_hours.actions";

interface WhatsAppContact {
  name: string;
  subtitle: string;
  phone: string;
  avatar?: string;
}

interface WhatsAppFloatProps {
  contacts?: WhatsAppContact[];
  headerText?: string;
  subtitleText?: string;
  responseTimeText?: string;
}

export function WhatsAppFloat({
  contacts,
  headerText,
  subtitleText,
  responseTimeText,
}: WhatsAppFloatProps) {
  const [isOpen, setIsOpen] = useState(false);
//   const [todayHours, setTodayHours] = useState<WorkingHours[]>([]);

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

  const safeHeader = headerText ?? "Iniciar conversación";
  const safeSubtitle = subtitleText ?? "Selecciona con quién deseas hablar";
  const safeResponse = responseTimeText ?? "Te conectaremos en unos momentos.";

//   useEffect(() => {
//     const fetchTodayHours = async () => {
//       const hours = await getWorkingHours();
//       const today = new Date().getDay();
//       const todayNumber = today === 0 ? 7 : today;

//       const todaySchedules = hours.filter((h: any) => h.days.includes(todayNumber));
//       setTodayHours(todaySchedules);
//     };

//     fetchTodayHours();
//   }, []);

//   const formatTime = (time: string) => {
//     const [hours, minutes] = time.split(":");
//     const hour = Number.parseInt(hours);
//     const ampm = hour >= 12 ? "PM" : "AM";
//     const hour12 = hour % 12 || 12;
//     return `${hour12}:${minutes} ${ampm}`;
//   };

  const handleContactClick = (phone: string) => {
    const whatsappUrl = `https://wa.me/${phone}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="whatsapp-widget"
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 50 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute bottom-20 right-0 w-[350px] rounded-lg bg-white shadow-2xl overflow-hidden"
            >
              <div className="rounded-t-lg bg-[#2db742] p-4 text-white flex flex-row gap-3 items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
                  <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold">{safeHeader}</h3>
                  <p className="text-sm text-white/90">{safeSubtitle}</p>
                </div>
              </div>

              <div className="p-4">
                {/* {todayHours.length > 0 && (
                  <div className="mb-4 rounded-lg bg-blue-50 p-3 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-900">
                        Horarios de atención del día de hoy
                      </p>
                    </div>

                    <div className="flex flex-col gap-1 pl-6">
                      {todayHours.map((h, i) => (
                        <p key={i} className="text-sm text-blue-700">
                          {formatTime(h.start_time)} - {formatTime(h.end_time)}
                        </p>
                      ))}
                    </div>
                  </div>
                )} */}

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
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2db742]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
                          <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
                       </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-gray-600 font-medium">
                          {contact.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {contact.subtitle}
                        </p>
                      </div>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#2db742"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
                        <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
                      </svg>
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
                    className="rotate-180 bg-gray-100 rounded-md fill-none text-[#4cd964] hover:fill-[#f1f0b1] hover:bg-gray-200 transition-colors duration-300 cursor-pointer"
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
                    <div className="bg-black text-white text-sm px-3 py-1 rounded-md shadow-lg whitespace-nowrap">
                      ⚡ Powered by <strong>Alveus Soft</strong>
                    </div>
                    <div className="w-2 h-2 bg-black rotate-45 -mt-1"></div>
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
            className="h-14 w-14 rounded-full bg-[#2db742] shadow-lg transition-all hover:scale-110 group hover:bg-[#2db742]"
          >
            <motion.div
              key={isOpen ? "close" : "open"}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {isOpen ? (
                <X className="h-10 w-10 text-white" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 scale-170 transition-all group-hover:scale-180"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" />
                  <path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" />
                </svg>
              )}
            </motion.div>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
