// @/components/historial/appointments/histirial_cotizacion.tsx
import { FileText, Download, ExternalLink, CalendarDays, Box, CheckCircle2, Clock, Send, XCircle, AlertTriangle, ShoppingCart } from "lucide-react";
import Link from "next/link";

// Definimos el tipo de status de forma estricta
type QuotationStatus = 'pending' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted_to_order' | 'cancelled';

interface QuotationProps {
  id: string;
  folio: string;
  status: QuotationStatus; // Usamos el tipo estricto
  total: number;
  date?: string;
  itemsCount?: number;
}

export default function QuotationCard({ id, folio, status, total, date, itemsCount = 0 }: QuotationProps) {

  // Configuración de estilos y etiquetas por estado
  const statusConfig = {
    pending: { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock },
    sent: { label: 'Enviada', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Send },
    accepted: { label: 'Aceptada', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
    rejected: { label: 'Rechazada', color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
    expired: { label: 'Vencida', color: 'text-slate-400', bg: 'bg-slate-400/10', icon: AlertTriangle },
    converted_to_order: { label: 'Convertida a Orden', color: 'text-purple-400', bg: 'bg-purple-400/10', icon: ShoppingCart },
    cancelled: { label: 'Cancelada', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: XCircle },
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;
  const StatusIcon = currentStatus.icon;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Reciente";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="group relative bg-[#111622] border border-slate-800 rounded-[1.5rem] p-5 md:p-6 hover:border-amber-500/40 transition-all duration-300 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
        
        {/* SECCIÓN IZQUIERDA: Identidad */}
        <div className="flex items-center gap-5">
          <div className="hidden sm:flex p-3.5 bg-[#0B0F1A] border border-slate-800 rounded-2xl text-slate-500 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all shadow-inner">
            <FileText className="h-7 w-7" />
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-black text-white tracking-tight leading-none">
                <span className="text-amber-500/60 font-mono text-xl mr-1 italic">#</span>
                {folio}
              </h2>
              
              {/* BADGE DE ESTADO DINÁMICO */}
              <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${currentStatus.bg} ${currentStatus.color} border border-current/10`}>
                <StatusIcon className="h-3 w-3" />
                {currentStatus.label}
              </span>
            </div>

            <div className="flex items-center gap-4 mt-3 ml-0.5">
              <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(date)}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-amber-500/80 font-bold uppercase tracking-tighter">
                <Box className="h-3.5 w-3.5" />
                {itemsCount} {itemsCount === 1 ? 'Concepto' : 'Conceptos'}
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN DERECHA: Financiero */}
        <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 border-slate-800/50 pt-5 md:pt-0">
          <div className="text-left md:text-right">
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Importe Total</p>
            <p className="text-2xl font-black text-white flex items-baseline md:justify-end gap-1">
              <span className="text-amber-500 text-lg">$</span>
              {total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              <span className="text-[10px] text-slate-500 ml-1">MXN</span>
            </p>
          </div>
          
          <div className="flex gap-2.5">
            <Link 
              href={`/historial_cotizaciones/detalles?id=${id}`} 
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-amber-500 text-black hover:bg-amber-400 hover:scale-105 transition-all shadow-lg active:scale-95 shadow-amber-500/10"
              title="Ver detalle"
            >
              <ExternalLink className="h-5.5 w-5.5 stroke-[2.5px]" />
            </Link>
            
            <button 
              className="h-11 w-11 flex items-center justify-center rounded-xl bg-[#0B0F1A] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all active:scale-95"
              title="Descargar PDF"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}