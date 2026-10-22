"use client";

import { useState, useTransition } from "react";
import type { Contact } from "@/lib/actions/contact.actions";
import {
  Mail,
  Phone,
  Smartphone,
  Globe,
  MoreVertical,
  User,
  MessageCircle,
  Loader2,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { sendWhatsAppMessage } from "@/lib/actions/server.actions";
import { toast } from "sonner";

interface ContactCardProps {
  contact: Contact;
  groupContactId?: string;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  onRemoveFromGroup?: (groupContactId: string) => void;
  userPermissions?: string[];
}

export default function ContactCard({
  contact,
  groupContactId,
  onDelete,
  onRemoveFromGroup,
  userPermissions = [],
}: ContactCardProps) {
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const canUpdate = userPermissions.includes("update:contacts");
  const canDelete = userPermissions.includes("delete:contacts");
  const canRemove = userPermissions.includes("delete:group_contacts");
  
  const phoneNumber = contact.mobile || contact.phone;
  const hasPhoneNumber = !!phoneNumber;

  const handleSendWhatsApp = () => {
    if (!message.trim() || !phoneNumber) {
      toast.error("Por favor, ingresa un mensaje");
      return;
    }

    // Actualización optimista: libera la UI de inmediato
    const pendingMessage = message.trim();
    setMessage("");
    setShowMessageModal(false);

    startTransition(async () => {
      try {
        const result = await sendWhatsAppMessage({
          to: phoneNumber,
          message: pendingMessage,
        });

        if (result.success) {
          toast.success("✅ Mensaje enviado correctamente");
        } else {
          toast.error(`❌ ${result.error || "Error al enviar el mensaje"}`);
        }
      } catch {
        toast.error("Error al enviar el mensaje");
      }
    });
  };

  const handleCardClick = () => {
  // Es una buena práctica verificar si el usuario tiene permisos antes de enviarlo
    if (canUpdate) {
      router.push(`/dashboard/contacts-parent/contacts/edit/${contact.id}`);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(false);
    router.push(`/dashboard/contacts-parent/contacts/edit/${contact.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPopoverOpen(false);
    if (onDelete) onDelete(contact);
  };

  const handlePopoverTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "";
    if (phone.includes("-")) return phone;

    const numbers = phone.replace(/\D/g, "");
    if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
    return phone;
  };

  return (
    <div
      className="bg-[#0A0F17] border border-gray-800 rounded-lg hover:shadow-lg hover:shadow-yellow-400/5 hover:border-yellow-400/30 transition-all cursor-pointer overflow-hidden relative"
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Header con nombre y acciones */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white line-clamp-1">
              {contact.full_name}
            </h3>

            {contact.job_position && (
              <p className="text-sm text-gray-300 mt-1">
                {contact.job_position}
              </p>
            )}

            {contact.title && (
              <p className="text-xs text-gray-400 mt-1">{contact.title}</p>
            )}
          </div>

          {/* Actions Popover */}
          {((canUpdate || canDelete) && (!canRemove || !groupContactId)) && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 hover:bg-yellow-400/10 rounded-lg transition-colors border border-gray-700 flex-shrink-0 ml-2"
                  onClick={handlePopoverTriggerClick}
                >
                  <MoreVertical size={18} className="text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-48 p-3 bg-[#0A0F17] border border-gray-700 rounded-lg shadow-lg"
                align="end"
              >
                <div className="space-y-1">
                  {/* Opción de WhatsApp en el menú */}
                  {hasPhoneNumber && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-green-400 hover:bg-green-400/10 hover:text-green-300 rounded-md transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPopoverOpen(false);
                        setShowMessageModal(true);
                      }}
                    >
                      <MessageCircle size={14} />
                      Enviar WhatsApp
                    </button>
                  )}

                  {canUpdate && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:bg-yellow-400/10 hover:text-yellow-400 rounded-md transition-colors"
                      onClick={handleEdit}
                    >
                      Editar
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md transition-colors"
                      onClick={handleDeleteClick}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
          {canRemove && groupContactId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onRemoveFromGroup) onRemoveFromGroup(groupContactId);
                setPopoverOpen(false);
              }}
              className="ml-3 p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Eliminar afiliación"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Modal para enviar mensaje */}
        {showMessageModal && (
          <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={() => !isPending && setShowMessageModal(false)}
          >
            <div 
              className="bg-[#0A0F17] border border-gray-700 rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Enviar WhatsApp
                  </h3>
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="text-gray-400 hover:text-white"
                    disabled={isPending}
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Información del contacto */}
                  <div className="text-sm text-gray-300 bg-gray-900/50 p-3 rounded-lg">
                    <p><span className="text-gray-500">Para:</span> <span className="text-yellow-400">{contact.full_name}</span></p>
                    <p><span className="text-gray-500">Número:</span> <span className="text-yellow-400">{formatPhone(phoneNumber)}</span></p>
                  </div>

                  {/* Textarea para mensaje */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Tu mensaje:
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe tu mensaje aquí..."
                      className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-yellow-500"
                      disabled={isPending}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El mensaje se enviará directamente desde la aplicación.
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowMessageModal(false)}
                      className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                      disabled={isPending}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSendWhatsApp}
                      disabled={isPending || !message.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isPending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <MessageCircle size={16} />
                          Enviar mensaje
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información de contacto */}
        <div className="space-y-2">
          {/* Usuario relacionado */}
          {contact.related_user && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span
                className="text-gray-300 truncate"
                title={`Usuario: ${contact.related_user.full_name}`}
              >
                {contact.related_user.full_name}
              </span>
              {!contact.related_user.active && (
                <span className="text-xs text-red-400">(Inactivo)</span>
              )}
            </div>
          )}

          {/* Email */}
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <a
                href={`mailto:${contact.email}`}
                className="text-yellow-400 hover:text-yellow-300 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {contact.email}
              </a>
            </div>
          )}

          {/* Teléfono */}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <a
                href={`tel:${contact.phone}`}
                className="text-gray-300 hover:text-yellow-400 truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {formatPhone(contact.phone)}
              </a>
            </div>
          )}

          {/* Celular */}
          {contact.mobile && (
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <a
                href={`tel:${contact.mobile}`}
                className="text-gray-300 hover:text-yellow-400 truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {formatPhone(contact.mobile)}
              </a>
            </div>
          )}

          {/* Sitio web */}
          {contact.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <a
                href={
                  contact.website.startsWith("http")
                    ? contact.website
                    : `https://${contact.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {contact.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        {/* Información adicional (RFC y CURP) */}
        {(contact.rfc || contact.curp) && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {contact.rfc && (
                <div>
                  <span className="text-gray-500">RFC:</span>
                  <p className="text-gray-300 font-mono">{contact.rfc}</p>
                </div>
              )}
              {contact.curp && (
                <div>
                  <span className="text-gray-500">CURP:</span>
                  <p className="text-gray-300 font-mono">{contact.curp}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer con fecha de creación */}
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Creado: {new Date(contact.created_at).toLocaleDateString("es-MX")}
          </p>
          {contact.updated_at !== contact.created_at && (
            <p className="text-xs text-gray-500">
              Actualizado:{" "}
              {new Date(contact.updated_at).toLocaleDateString("es-MX")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}