"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, FileText, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { EditContactForm } from "./edit-contact-form";
import { BillingSection } from "./billing-section";
import { ContactGroupsSection } from "./contact-groups-section";

interface ContactTabsProps {
  contactId: string;
}

export function ContactTabs({ contactId }: ContactTabsProps) {
  const [activeTab, setActiveTab] = useState("info");
  const router = useRouter();

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-2 sm:px-4">
      {/* Botón Volver global */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => router.push("/dashboard/contacts-parent/contacts")} // ✅ Ruta actualizada
          className="inline-flex items-center text-gray-400 hover:text-yellow-400 p-2 hover:bg-yellow-400/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
        </button>
      </div>

      {/* Tabs con diseño responsive */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center overflow-x-auto pb-2 scrollbar-hide">
          <TabsList className="inline-flex h-auto sm:h-12 items-center justify-center rounded-lg bg-[#0A0F17] p-1 w-full sm:w-auto min-w-max sm:min-w-0">
            <TabsTrigger 
              value="info" 
              className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2 text-xs sm:text-sm font-medium transition-all rounded-md whitespace-nowrap data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Información del Contacto</span>
              <span className="xs:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger 
              value="billing" 
              className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2 text-xs sm:text-sm font-medium transition-all rounded-md whitespace-nowrap data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50"
            >
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Datos de Facturación</span>
              <span className="xs:hidden">Facturación</span>
            </TabsTrigger>
            <TabsTrigger 
              value="groups" 
              className="inline-flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-2 text-xs sm:text-sm font-medium transition-all rounded-md whitespace-nowrap data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-muted/50"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 sm:h-4 sm:w-4">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span className="hidden xs:inline">Grupos</span>
              <span className="xs:hidden">Grupos</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="info" className="mt-4 sm:mt-6">
          <EditContactForm contactId={contactId} />
        </TabsContent>
        
        <TabsContent value="billing" className="mt-4 sm:mt-6">
          <BillingSection contactId={contactId} />
        </TabsContent>

        <TabsContent value="groups" className="mt-4 sm:mt-6">
          <ContactGroupsSection contactId={contactId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
