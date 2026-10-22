"use client";

import { useEffect, useState } from "react";
import { getWhatsAppConfig } from "@/lib/actions/configuration.actions"

export function useWhatsAppConfig() {
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const local = localStorage.getItem("whatsappConfig");
        if (local) {
          setConfig(JSON.parse(local));
          return;
        }
        const res = await getWhatsAppConfig();
        if (!res.success) throw new Error("Error al obtener configuración");

        const data = res.data;

        localStorage.setItem("whatsappConfig", JSON.stringify(data));
        setConfig(data);
      } catch (error) {
        console.error("❌ Error al cargar configuración de WhatsApp:", error);
      }
    };

    fetchConfig();
  }, []);

  return config;
}
