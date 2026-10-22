import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/footer";
import {
  ArrowLeft,
  CalendarDays, 
  User,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { getQuotationById, updateQuotationStatus } from "@/lib/actions/quotations.actions";
import { revalidatePath } from "next/cache";
import AceptarCotizacionModal from "@/components/dashboard/quotation/AceptarCotizacionModal";

async function aprobarCotizacion(formData: FormData) {
  "use server";
  
  const id = formData.get("id") as string;
  const contactId = formData.get("contact_id") as string;
    

  if (!id || !contactId) return;

  await updateQuotationStatus(id, "accepted", undefined, contactId);

  revalidatePath("/historial_cotizaciones/detalles");
}

interface PageProps {
  searchParams: Promise<{
    id?: string;
    email?: string;
    phone?: string;
  }>;
}

export default async function DetalleCotizacion({ searchParams }: PageProps) {
  // 1. Resolvemos la promesa de searchParams (Obligatorio en Next 15)
  const resolvedParams = await searchParams;
  const id = resolvedParams.id;

  if (!id) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">
        <h2 className="text-xl font-bold">ID inválido</h2>
      </main>
    );
  }

  // 2. Única declaración de 'quote'
  const quote = await getQuotationById(id);

  if (!quote) {
    return (
      <main className="min-h-screen bg-[#0B0F1A] flex items-center justify-center text-white">
        <h2 className="text-2xl font-bold">Cotización no encontrada</h2>
      </main>
    );
  }

  const items = quote.items || [];
  return (
    <div className="bg-[#0B0F1A] min-h-screen text-slate-300">
      <HeroHeader />

      <main className="max-w-5xl mx-auto px-4 pt-32 pb-20">
        <Link
          href={`/historial_cotizaciones?id=${quote.contact_id}`}
          className="flex items-center gap-2 text-slate-500 hover:text-white mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        {/* HEADER */}
        <div className="bg-[#111622] border border-slate-800 rounded-xl p-6 mb-6 flex justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase mb-2">Cotización</p>
            <h1 className="text-3xl font-bold text-white">#{quote.quotation_number}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
              <CalendarDays className="w-4 h-4" />
              Vence: {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString("es-MX") : "N/A"}
            </div>
          </div>
          <div className="bg-[#0B0F1A] border border-slate-800 rounded-lg px-6 py-4 text-right">
            <p className="text-xs text-slate-500 uppercase">Total</p>
            <p className="text-2xl font-bold text-white">${Number(quote.total).toLocaleString()}</p>
          </div>
        </div>

        {/* CLIENTE + EMPRESA */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-[#111622] border border-slate-800 rounded-xl p-5">
            <h3 className="flex items-center gap-2 text-white mb-4">
              <User className="w-4 h-4 text-yellow-500" /> Cliente
            </h3>
            <p className="text-white font-medium">{quote.contact?.full_name || quote.contact?.name}</p>
            <p className="text-sm text-slate-400">{quote.contact?.email}</p>
            <p className="text-sm text-slate-400">{quote.contact?.phone}</p>
          </div>

          <div className="bg-[#111622] border border-slate-800 rounded-xl p-5">
            <h3 className="flex items-center gap-2 text-white mb-4">
              <Building2 className="w-4 h-4 text-yellow-500" /> Empresa
            </h3>
            <p className="text-white font-medium">{quote.company?.name}</p>
            <p className="text-sm text-slate-400">{quote.company?.street} {quote.company?.address_number}</p>
            <p className="text-xs text-slate-500 mb-4">{quote.company?.city}, {quote.company?.state}</p>
            <div className="border-t border-slate-800 pt-4 mt-4">
              <p className="text-xs text-slate-500 uppercase mb-2">Vendedor</p>
              <p className="text-white text-sm font-medium">{quote.created_by_user?.full_name || "Sin asignar"}</p>
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="bg-[#111622] border border-slate-800 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-[#0B0F1A] text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 text-left">Producto</th>
                <th className="px-6 py-4 text-center">Cantidad</th>
                <th className="px-6 py-4 text-right">Precio Unitario</th>
                <th className="px-6 py-4 text-right">Descuento</th>
                <th className="px-6 py-4 text-right">Impuesto</th> 
                <th className="px-6 py-4 text-right">Subtotal</th>
              </tr>
            </thead>
         <tbody>
  {items.map((item: any) => {
    // ✅ SOLO usar el campo real de la BD
    const itemDiscount = item.discount_amount ? Number(item.discount_amount) : 0;

    // Impuestos
    const taxes = item.product_taxes || [];
    const taxesCount = taxes.length || 1;

    const totalItemTax = item.tax_amount ? Number(item.tax_amount) : 0;

    return (
      <tr
        key={item.id}
        className="border-t border-slate-800 hover:bg-white/[0.01] transition-colors"
      >
        {/* PRODUCTO */}
        <td className="px-6 py-4 text-white">
          <div className="font-medium">{item.product?.name}</div>
          <div className="text-[10px] text-slate-500 uppercase">
            {item.product?.name}
          </div>
        </td>

        {/* CANTIDAD */}
        <td className="px-6 py-4 text-center text-slate-300">
          {item.quantity}
        </td>

        {/* PRECIO UNITARIO */}
        <td className="px-6 py-4 text-right text-slate-400">
          ${Number(item.unit_price).toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}
        </td>

        {/* ✅ DESCUENTO REAL (NO INVENTADO) */}
        <td className="px-6 py-4 text-right text-slate-500">
          {itemDiscount > 0 ? (
            <span>
              -$
              {itemDiscount.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </span>
          ) : (
            <span className="text-slate-700">—</span>
          )}
        </td>

        {/* IMPUESTOS */}
        <td className="px-6 py-4 text-right">
        {totalItemTax > 0 ? (
          <>
            <div className="text-amber-500 font-bold">
              {taxesCount > 0 ? taxesCount : 1}{" "}
              {taxesCount === 1 ? "impuesto" : "impuestos"} (+$
              {totalItemTax.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })})
            </div>
            <div className="text-[10px] text-slate-500 italic">
              Click para detalles
            </div>
          </>
        ) : (
          <span className="text-slate-700">—</span>
        )}
      </td>

        {/* SUBTOTAL */}
        <td className="px-6 py-4 text-right text-white font-black text-base">
          $
          {Number(item.item_total).toLocaleString("es-MX", {
            minimumFractionDigits: 2,
          })}
        </td>
      </tr>
    );
  })}
</tbody>
          </table>
        </div>
              {/* RESUMEN DE TOTALES */}
        <div className="bg-[#111622] border border-slate-800 rounded-xl p-8">
          <div className="max-w-md ml-auto space-y-4">
            
            <div className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">Subtotal</span>
              <span className="text-white font-medium">
                ${Number(quote.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>

          {/* Impuestos en el resumen */}
            <div className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-xs">
                Impuestos Totales
              </span>
              <span className="text-amber-500 font-bold">
                {(() => {
                  const totalTaxes = items.reduce((acc: number, item: any) => {
                    return acc + Number(item.tax_amount ?? 0);
                  }, 0);

                  return totalTaxes > 0
                    ? `+$${totalTaxes.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
                    : '—';
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-2xl font-black text-white italic uppercase">Total</span>
              <div className="text-right">
                <span className="text-4xl font-black text-white">
                  ${Number(quote.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-500 block font-bold mt-1 tracking-widest">MXN</span>
              </div>
            </div>

            {/* Botones de acción (Aceptar Cotización) */}
            <div className="pt-6">
              
            {/* Botones de acción (Aceptar Cotización) */}
            <div className="pt-6">
              {quote.status !== "accepted" ? (
                <>
               <AceptarCotizacionModal
                id={quote.id}
                contactId={quote.contact?.id ?? ""}
                folio={quote.quotation_number ?? ""} // 👈 FIX
                aprobarAction={aprobarCotizacion}
              />
                </>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black py-4 rounded-xl text-center flex items-center justify-center gap-3 uppercase tracking-widest">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  Cotización aprobada
                </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}