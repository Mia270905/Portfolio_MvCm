"use client";

import { useState } from "react";
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
  const [isSending, setIsSending] = useState(false);

  const canUpdate = userPermissions.includes("update:contacts");
  const canDelete = userPermissions.includes("delete:contacts");
  const canRemove = userPermissions.includes("delete:group_contacts");
  
  const phoneNumber = contact.mobile || contact.phone;
  const hasPhoneNumber = !!phoneNumber;

  const handleCardClick = () => {
    // router.push(`/contacts/${contact.id}`);
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
      className="bg-card border border-input rounded-lg hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 transition-all cursor-pointer overflow-hidden relative"
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Header con nombre y acciones */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-card-foreground line-clamp-1">
              {contact.full_name}
            </h3>

            {contact.job_position && (
              <p className="text-sm text-muted-foreground mt-1">
                {contact.job_position}
              </p>
            )}

            {contact.title && (
              <p className="text-xs text-muted-foreground mt-1">{contact.title}</p>
            )}
          </div>

          {/* Actions Popover */}
          {((canUpdate || canDelete) && (!canRemove || !groupContactId)) && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 hover:bg-primary/10 rounded-lg transition-colors border border-input flex-shrink-0 ml-2"
                  onClick={handlePopoverTriggerClick}
                >
                  <MoreVertical size={18} className="text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-48 p-3 bg-background border border-input rounded-lg shadow-lg"
                align="end"
              >
                <div className="space-y-1">
                  {/* Opción de WhatsApp en el menú */}
                  {hasPhoneNumber && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-green-500 hover:bg-green-500/10 hover:text-green-600 rounded-md transition-colors"
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
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded-md transition-colors"
                      onClick={handleEdit}
                    >
                      Editar
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors"
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
              className="ml-3 p-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
            onClick={() => !isSending && setShowMessageModal(false)}
          >
            <div 
              className="bg-background border border-input rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    Enviar WhatsApp
                  </h3>
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="text-muted-foreground hover:text-foreground"
                    disabled={isSending}
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Información del contacto */}
                  <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                    <p><span className="text-foreground">Para:</span> <span className="text-primary">{contact.full_name}</span></p>
                    <p><span className="text-foreground">Número:</span> <span className="text-primary">{formatPhone(phoneNumber)}</span></p>
                  </div>

                  {/* Textarea para mensaje */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Tu mensaje:
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Escribe tu mensaje aquí..."
                      className="w-full h-32 bg-background border border-input rounded-lg p-3 text-foreground resize-none focus:outline-none focus:border-primary"
                      disabled={isSending}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      El mensaje se enviará directamente desde la aplicación.
                    </p>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setShowMessageModal(false)}
                      className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isSending}
                    >
                      Cancelar
                    </button>
                    <button
                      // onClick={handleSendWhatsApp}
                      disabled={isSending || !message.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSending ? (
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
              <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span
                className="text-muted-foreground truncate"
                title={`Usuario: ${contact.related_user.full_name}`}
              >
                {contact.related_user.full_name}
              </span>
              {!contact.related_user.active && (
                <span className="text-xs text-destructive">(Inactivo)</span>
              )}
            </div>
          )}

          {/* Email */}
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <a
                href={`mailto:${contact.email}`}
                className="text-primary hover:text-primary/80 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {contact.email}
              </a>
            </div>
          )}

          {/* Teléfono */}
          {contact.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <a
                href={`tel:${contact.phone}`}
                className="text-muted-foreground hover:text-primary truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {formatPhone(contact.phone)}
              </a>
            </div>
          )}

          {/* Celular */}
          {contact.mobile && (
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <a
                href={`tel:${contact.mobile}`}
                className="text-muted-foreground hover:text-primary truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {formatPhone(contact.mobile)}
              </a>
            </div>
          )}

          {/* Sitio web */}
          {contact.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <a
                href={
                  contact.website.startsWith("http")
                    ? contact.website
                    : `https://${contact.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {contact.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        {/* Información adicional (RFC y CURP) */}
        {(contact.rfc || contact.curp) && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {contact.rfc && (
                <div>
                  <span className="text-muted-foreground">RFC:</span>
                  <p className="text-foreground font-mono">{contact.rfc}</p>
                </div>
              )}
              {contact.curp && (
                <div>
                  <span className="text-muted-foreground">CURP:</span>
                  <p className="text-foreground font-mono">{contact.curp}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer con fecha de creación */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Creado: {new Date(contact.created_at).toLocaleDateString("es-MX")}
          </p>
          {contact.updated_at !== contact.created_at && (
            <p className="text-xs text-muted-foreground">
              Actualizado:{" "}
              {new Date(contact.updated_at).toLocaleDateString("es-MX")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}