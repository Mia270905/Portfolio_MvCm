"use client";

import { useState, useTransition } from "react";
import type { Contact } from "@/lib/actions/contact.actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MoreVertical,
  MessageCircle,
  Loader2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { sendWhatsAppMessage } from "@/lib/actions/server.actions";
import { toast } from "sonner";

interface ContactTableProps {
  contacts: Contact[];
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  userPermissions?: string[];
}

export function ContactTable({
  contacts,
  onEdit,
  onDelete,
  userPermissions = [],
}: ContactTableProps) {
  return (
    <div className="bg-[#0A0F17] border border-gray-800 rounded-lg overflow-hidden shrink-0 w-full relative h-[400px]">
      <div className="h-full overflow-auto custom-scrollbar">
        <Table>
          <TableHeader className="bg-gray-900/50 sticky top-0 z-10">
            <TableRow className="border-gray-800 hover:bg-transparent">
              <TableHead className="text-gray-400 font-semibold w-[200px] md:w-[250px]">Nombre</TableHead>
              <TableHead className="text-gray-400 font-semibold w-[200px] hidden sm:table-cell">Email</TableHead>
              <TableHead className="text-gray-400 font-semibold w-[150px] hidden md:table-cell">Teléfono/Móvil</TableHead>
              <TableHead className="text-gray-400 font-semibold w-[150px] hidden lg:table-cell">Posición</TableHead>
              <TableHead className="text-gray-400 font-semibold w-[150px] hidden xl:table-cell">Creado</TableHead>
              <TableHead className="text-right text-gray-400 font-semibold w-[80px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <ContactTableRow
                key={contact.id}
                contact={contact}
                onEdit={onEdit}
                onDelete={onDelete}
                userPermissions={userPermissions}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ContactTableRow({
  contact,
  onEdit,
  onDelete,
  userPermissions = [],
}: {
  contact: Contact;
  onEdit?: (contact: Contact) => void;
  onDelete?: (contact: Contact) => void;
  userPermissions?: string[];
}) {
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const canUpdate = userPermissions.includes("update:contacts");
  const canDelete = userPermissions.includes("delete:contacts");
  
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

  const handleRowClick = () => {
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

  const formatPhone = (phone: string | null) => {
    if (!phone) return "-";
    if (phone.includes("-")) return phone;

    const numbers = phone.replace(/\D/g, "");
    if (numbers.length === 10) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    }
    return phone;
  };

  return (
    <>
      <TableRow 
        className="border-gray-800 hover:bg-gray-800/40 cursor-pointer transition-colors group"
        onClick={handleRowClick}
      >
        <TableCell className="font-medium text-gray-200">
          <div className="flex flex-col">
            <span className="truncate max-w-[150px] sm:max-w-[200px]">{contact.full_name}</span>
            {contact.title && (
              <span className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[200px]">{contact.title}</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-gray-300 hidden sm:table-cell">
          {contact.email ? (
            <a
              href={`mailto:${contact.email}`}
              className="hover:text-amber-400 hover:underline truncate max-w-[180px] block"
              onClick={(e) => e.stopPropagation()}
            >
              {contact.email}
            </a>
          ) : (
             <span className="text-gray-600">-</span>
          )}
        </TableCell>
        <TableCell className="text-gray-300 hidden md:table-cell">
          <div className="flex flex-col text-sm">
            {contact.mobile && (
               <a
                 href={`tel:${contact.mobile}`}
                 className="hover:text-amber-400"
                 onClick={(e) => e.stopPropagation()}
                 title="Móvil"
               >
                 {formatPhone(contact.mobile)}
               </a>
            )}
            {contact.phone && !contact.mobile && (
              <a
                href={`tel:${contact.phone}`}
                className="hover:text-amber-400"
                onClick={(e) => e.stopPropagation()}
                title="Teléfono"
              >
                {formatPhone(contact.phone)}
              </a>
            )}
            {!contact.mobile && !contact.phone && <span className="text-gray-600">-</span>}
          </div>
        </TableCell>
        <TableCell className="text-gray-300 hidden lg:table-cell">
          {contact.job_position ? (
            <span className="truncate max-w-[130px] inline-block">{contact.job_position}</span>
          ) : (
            <span className="text-gray-600">-</span>
          )}
        </TableCell>
        <TableCell className="text-gray-400 text-sm hidden xl:table-cell">
          {new Date(contact.created_at).toLocaleDateString("es-MX")}
        </TableCell>
        <TableCell className="text-right">
          {(canUpdate || canDelete) && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <button
                  className="p-2 hover:bg-amber-400/10 rounded-lg transition-colors border border-transparent hover:border-amber-400/20 group-hover:bg-gray-700/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical size={16} className="text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-48 p-2 bg-[#0A0F17] border border-gray-700 rounded-lg shadow-xl"
                align="end"
              >
                <div className="space-y-1">
                  {hasPhoneNumber && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-400 hover:bg-green-400/10 hover:text-green-300 rounded-md transition-colors"
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
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-amber-400/10 hover:text-amber-400 rounded-md transition-colors"
                      onClick={handleEdit}
                    >
                      Editar
                    </button>
                  )}

                  {canDelete && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 hover:text-red-300 rounded-md transition-colors"
                      onClick={handleDeleteClick}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </TableCell>
      </TableRow>

      {/* Modal para enviar mensaje (duplicado pero necesario para no extraerlo o refactorizar) */}
      {showMessageModal && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 relative"
          onClick={(e) => {
             e.stopPropagation();
             if (!isPending) setShowMessageModal(false);
          }}
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
                  onClick={(e) => {
                      e.stopPropagation();
                      setShowMessageModal(false);
                  }}
                  className="text-gray-400 hover:text-white"
                  disabled={isPending}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-300 bg-gray-900/50 p-3 rounded-lg">
                  <p><span className="text-gray-500">Para:</span> <span className="text-amber-400">{contact.full_name}</span></p>
                  <p><span className="text-gray-500">Número:</span> <span className="text-amber-400">{formatPhone(phoneNumber)}</span></p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Tu mensaje:
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    className="w-full h-32 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-amber-500"
                    disabled={isPending}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    El mensaje se enviará directamente desde la aplicación.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMessageModal(false);
                    }}
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                    disabled={isPending}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSendWhatsApp();
                    }}
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
    </>
  );
}
