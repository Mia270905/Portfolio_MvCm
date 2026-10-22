"use client";

import {
  X,
  Phone,
  Mail,
  Clock,
  Calendar as CalendarIcon,
  MessageSquare,
  FileText,
  ShieldCheck
} from "lucide-react";

interface Appointment {
  id: string;
  appointment_datetime: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  client_notes?: string;
  admin_notes?: string;

  status?: {
    name?: string;
    description?: string;
  };

  space_owner?: {
    full_name?: string;
  };
}

interface Props {
  selectedAppointment: Appointment | null;
  setSelectedAppointment: (appointment: Appointment | null) => void;
}

export default function AppointmentModal({
  selectedAppointment,
  setSelectedAppointment,
}: Props) {

  function getStatusConfig(status?: string) {

    const configs: Record<string, any> = {

      CONFIRMED: {
        text: "text-green-400",
        border: "border-green-500/30",
        icon: "✔"
      },

      BOOKED: {
        text: "text-yellow-400",
        border: "border-yellow-500/30",
        icon: "⏳"
      },

      RESERVED: {
        text: "text-blue-400",
        border: "border-blue-500/30",
        icon: "📌"
      },

      CANCELLED: {
        text: "text-red-400",
        border: "border-red-500/30",
        icon: "✖"
      },

      DEFAULT: {
        text: "text-gray-400",
        border: "border-gray-500/30",
        icon: "•"
      }

    };

    return configs[status || "DEFAULT"] || configs.DEFAULT;
  }

  if (!selectedAppointment) return null;

  const status = selectedAppointment.status?.name?.toUpperCase();
  const isReserved = ["RESERVED", "CONFIRMED", "BOOKED"].includes(status || "");
  const statusConfig = getStatusConfig(status);

  return (

    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={() => setSelectedAppointment(null)}
    >

      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-custom-bg-secondary border border-custom-border-secondary rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200"
      >

        {/* HEADER */}
        <div className="p-6 border-b border-custom-border-secondary flex justify-between items-start bg-custom-bg-tertiary/30">

          <div className="space-y-2">

            <h3 className="text-xl font-black text-white uppercase tracking-tight">
              Detalles de la Cita
            </h3>

            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[10px] font-bold border ${statusConfig.border} ${statusConfig.text}`}>
              {statusConfig.icon}
              {selectedAppointment.status?.description || selectedAppointment.status?.name}
            </div>

          </div>

          <button
            onClick={() => setSelectedAppointment(null)}
            className="p-2 hover:bg-custom-bg-tertiary rounded-full text-custom-text-tertiary transition-colors"
          >
            <X size={20}/>
          </button>

        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

          {isReserved && (
            <div className="space-y-4">

              <div className="flex items-center gap-4 bg-custom-bg-tertiary/40 p-4 rounded-xl border border-custom-border-secondary">

                <div className="w-12 h-12 rounded-full bg-custom-accent-primary/20 flex items-center justify-center text-custom-accent-primary font-black text-xl">
                  {selectedAppointment.client_name?.charAt(0) || "C"}
                </div>

                <div className="flex-1">
                  <p className="text-xs text-custom-text-tertiary font-bold uppercase tracking-widest">
                    Cliente
                  </p>

                  <p className="text-lg font-bold text-white uppercase leading-tight">
                    {selectedAppointment.client_name || "No especificado"}
                  </p>
                </div>

              </div>

              <div className="grid gap-3 px-1">

                <div className="flex items-center gap-3 text-custom-text-tertiary">
                  <Phone size={14} className="text-custom-accent-primary"/>
                  <span className="text-sm">
                    {selectedAppointment.client_phone || "Sin teléfono"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-custom-text-tertiary">
                  <Mail size={14} className="text-custom-accent-primary"/>
                  <span className="text-sm break-all">
                    {selectedAppointment.client_email || "Sin correo"}
                  </span>
                </div>

              </div>

            </div>
          )}

          {/* FECHA Y HORA */}
          <div className="grid grid-cols-2 gap-4">

            <div className="p-3 rounded-lg bg-custom-bg-tertiary/20 border border-custom-border-secondary/50">
              <div className="flex items-center gap-2 text-custom-accent-primary mb-1">
                <Clock size={14}/>
                <span className="text-[10px] font-bold uppercase">
                  Hora
                </span>
              </div>

              <p className="text-sm text-white font-medium">
                {new Date(selectedAppointment.appointment_datetime)
                  .toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-custom-bg-tertiary/20 border border-custom-border-secondary/50">
              <div className="flex items-center gap-2 text-custom-accent-primary mb-1">
                <CalendarIcon size={14}/>
                <span className="text-[10px] font-bold uppercase">
                  Fecha
                </span>
              </div>

              <p className="text-sm text-white font-medium">
                {new Date(selectedAppointment.appointment_datetime)
                  .toLocaleDateString('es-ES',{
                    day:'2-digit',
                    month:'short',
                    year:'numeric'
                  })}
              </p>
            </div>

          </div>

          {/* NOTAS */}
          {isReserved && selectedAppointment.client_notes && (
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">

              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <MessageSquare size={14}/>
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Nota del Cliente
                </span>
              </div>

              <p className="text-sm italic text-custom-text-secondary">
                "{selectedAppointment.client_notes}"
              </p>

            </div>
          )}

          {/* ADMIN NOTES */}
          <div className="p-4 rounded-xl bg-custom-bg-tertiary/20 border border-custom-border-secondary/50">

            <div className="flex items-center gap-2 mb-2 text-custom-text-tertiary">
              <FileText size={14}/>
              <span className="text-[10px] font-black uppercase tracking-wider">
                Notas del Administrador
              </span>
            </div>

            {selectedAppointment.admin_notes ? (
              <p className="text-sm text-white">
                {selectedAppointment.admin_notes}
              </p>
            ) : (
              <p className="text-sm text-custom-text-tertiary/50 italic">
                Sin notas administrativas internas.
              </p>
            )}

          </div>

          {/* CREADOR */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-custom-bg-tertiary/20 border border-custom-border-secondary/50">

            <ShieldCheck size={16} className="text-custom-accent-primary"/>

            <div>
              <p className="text-[10px] text-custom-text-tertiary font-bold uppercase">
                Espacio creado por
              </p>

              <p className="text-sm text-white font-medium">
                {selectedAppointment.space_owner?.full_name || "Sistema"}
              </p>
            </div>

          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-custom-bg-tertiary/20 border-t border-custom-border-secondary flex gap-3">

          {status === "BOOKED" && (
            <button className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase">
              Confirmar
            </button>
          )}

          {isReserved && (
            <button className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase">
              Cancelar
            </button>
          )}

          <button
            onClick={() => setSelectedAppointment(null)}
            className="flex-1 py-2.5 rounded-lg border border-custom-border-secondary text-white font-bold text-sm hover:bg-custom-bg-tertiary uppercase"
          >
            Cerrar
          </button>

        </div>

      </div>

    </div>

  );
}