"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Copy } from "lucide-react";

interface Props {
  id: string;
  contactId: string;
  folio: string; // 👈 NUEVO
  aprobarAction: (formData: FormData) => Promise<void>;
}

export default function AceptarCotizacionModal({
  id,
  contactId,
  folio,
  aprobarAction,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState(false);

  const isValid = inputValue.trim() === folio;

  const handleConfirm = async () => {
    if (!isValid) return;

    try {
      setIsPending(true);

      const formData = new FormData();
      formData.append("id", id);
      formData.append("contact_id", contactId);

      await aprobarAction(formData);

      setIsOpen(false);
    } catch (error) {
      console.error("Error al aprobar:", error);
      alert("Ocurrió un error al aprobar la cotización");
    } finally {
      setIsPending(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(folio);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      {/* BOTÓN PRINCIPAL */}
      <button
        disabled={isPending}
        onClick={() => setIsOpen(true)}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-emerald-500/20 disabled:opacity-50"
      >
        Aceptar Cotización
      </button>

      {/* MODAL */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => !isPending && setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111622] border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]"
          >
            {/* HEADER */}
            <div className="flex items-center gap-3 text-emerald-400 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-xl font-bold text-white">
                Confirmación requerida
              </h3>
            </div>

            {/* TEXTO */}
            <p className="text-slate-400 mb-6">
              Para confirmar la aceptación, escribe el folio de la cotización:
            </p>

            {/* FOLIO + COPY */}
            <div className="mb-4">
              <label className="text-xs text-slate-500 uppercase block mb-2">
                Folio
              </label>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#0B0F1A] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm">
                  {folio}
                </div>

                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
                >
                  <Copy className="w-4 h-4 text-slate-300" />
                </button>
              </div>

              {copied && (
                <p className="text-emerald-400 text-xs mt-1">
                  Copiado ✔
                </p>
              )}
            </div>

            {/* INPUT */}
            <div className="mb-6">
              <label className="text-xs text-slate-500 uppercase block mb-2">
                Escribe el folio para confirmar
              </label>

              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ej: 000123"
                className="w-full bg-[#0B0F1A] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />

              {!isValid && inputValue.length > 0 && (
                <p className="text-red-400 text-xs mt-1">
                  El folio no coincide
                </p>
              )}
            </div>

            {/* BOTONES */}
            <div className="flex gap-3">
              <button
                disabled={isPending}
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition font-bold uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>

              <button
                disabled={!isValid || isPending}
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}