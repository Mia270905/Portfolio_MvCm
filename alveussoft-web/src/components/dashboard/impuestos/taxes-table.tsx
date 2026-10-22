"use client";

import { useState } from "react";
import {
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  MoreVertical,
} from "lucide-react";
import { Tax } from "@/lib/actions/tax.actions";
import { toggleTaxStatus } from "@/lib/actions/tax.actions";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeleteTaxDialog } from "./delete-tax-dialog";

interface TaxesTableProps {
  taxes: Tax[];
  onTaxDeleted?: (taxId: string) => void;
}

export function TaxesTable({ taxes, onTaxDeleted }: TaxesTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);
  const [mobilePopoverOpen, setMobilePopoverOpen] = useState<string | null>(
    null,
  );

  // Estado para el diálogo de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taxToDelete, setTaxToDelete] = useState<Tax | null>(null);

  const toggleRow = (taxId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(taxId)) {
      newExpandedRows.delete(taxId);
    } else {
      newExpandedRows.add(taxId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Función para abrir el diálogo de eliminación
  const handleOpenDeleteDialog = (tax: Tax) => {
    setTaxToDelete(tax);
    setDeleteDialogOpen(true);
    // Cerrar popovers
    setPopoverOpen(null);
    setMobilePopoverOpen(null);
  };

  // Función callback después de eliminar exitosamente
  const handleDeleteSuccess = (deletedTaxId: string) => {
    // Eliminar localmente primero
    if (onTaxDeleted) {
      onTaxDeleted(deletedTaxId);
    }

    // Opcional: refresh de la página para sincronizar con servidor
    // router.refresh();
  };

  const handleToggleStatus = async (
    taxId: string,
    taxName: string,
    currentStatus: boolean,
  ) => {
    setLoading(taxId);
    const result = await toggleTaxStatus(taxId, !currentStatus);

    if (result.success) {
      toast.success(
        `Impuesto "${taxName}" ${!currentStatus ? "activado" : "desactivado"} exitosamente`,
      );
      router.refresh();
    } else {
      toast.error(result.message || "Error al cambiar el estado");
    }
    setLoading(null);
  };

  const formatRate = (tax: Tax) => {
    if (tax.tax_type === "percentage") {
      return `${tax.rate.toFixed(2)}%`;
    } else {
      return `$${tax.rate.toFixed(2)}`;
    }
  };

  // Función para formatear tipo SAT
  const formatSATType = (satType: string) => {
    const types: Record<string, string> = {
      iva: "IVA",
      isr: "ISR",
      ieps: "IEPS",
      local: "Local",
    };
    return types[satType] || satType;
  };

  // Función para formatear aplicación del impuesto
  const formatGeneralType = (generalType: string) => {
    const types: Record<string, string> = {
      venta: "Venta",
      compras: "Compras",
      ninguno: "Ninguno",
    };
    return types[generalType] || generalType;
  };

  // Versión móvil - Tarjetas
  const MobileCard = ({ tax }: { tax: Tax }) => {
    const isExpanded = expandedRows.has(tax.id);

    return (
      <div className="bg-[#0A0F17] rounded-lg border border-gray-800 mb-4 overflow-hidden">
        {/* Encabezado de la tarjeta */}
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">
                  {tax.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Popover
                    open={mobilePopoverOpen === tax.id}
                    onOpenChange={(open) =>
                      setMobilePopoverOpen(open ? tax.id : null)
                    }
                  >
                    <PopoverTrigger asChild>
                      <button className="flex items-center justify-center w-8 h-8 hover:bg-yellow-400/10 rounded-md transition-colors">
                        <MoreVertical size={18} className="text-gray-400 hover:text-yellow-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-48 p-0 bg-[#070B14] border border-gray-800 rounded-lg shadow-lg"
                      align="end"
                    >
                      <div className="py-1">
                        <Link
                          href={`/dashboard/impuestos/gestion/editar/${tax.id}`}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-blue-900/30 hover:text-blue-300 transition-colors block"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleOpenDeleteDialog(tax)}
                          disabled={loading === tax.id}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <button
                    onClick={() => toggleRow(tax.id)}
                    className="text-gray-500 hover:text-yellow-400"
                  >
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div className="mb-2">
                <div className="text-xs text-gray-500">Descripción</div>
                <div className="text-sm text-gray-300 truncate">
                  {tax.description || "-"}
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <button
                  onClick={() =>
                    handleToggleStatus(tax.id, tax.name, tax.is_active)
                  }
                  disabled={loading === tax.id}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    tax.is_active
                      ? "bg-green-900/40 text-green-300 hover:bg-green-800/40"
                      : "bg-red-900/40 text-red-300 hover:bg-red-800/40"
                  } transition-colors disabled:opacity-50`}
                >
                  {tax.is_active ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Activo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Inactivo
                    </>
                  )}
                </button>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    tax.tax_type === "percentage"
                      ? "bg-blue-900/40 text-blue-300"
                      : "bg-green-900/40 text-green-300"
                  }`}
                >
                  {tax.tax_type === "percentage" ? "Porcentaje" : "Monto fijo"}
                </span>
              </div>
            </div>
          </div>

          {/* Información expandida */}
          {isExpanded && (
            <div className="pt-3 border-t border-gray-800 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Tipo SAT</div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      tax.sat_tax_type === "iva"
                        ? "bg-purple-900/40 text-purple-300"
                        : tax.sat_tax_type === "isr"
                          ? "bg-orange-900/40 text-orange-300"
                          : tax.sat_tax_type === "ieps"
                            ? "bg-pink-900/40 text-pink-300"
                            : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    {formatSATType(tax.sat_tax_type)}
                  </span>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Aplicación</div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 bg-gray-800 text-gray-300">
                    {formatGeneralType(tax.general_type)}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">Tasa</div>
                <div className="text-sm font-semibold text-white">
                  {formatRate(tax)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con tasa y acciones básicas */}
        {!isExpanded && (
          <div className="px-4 py-3 bg-[#070B14] border-t border-gray-800 flex justify-between items-center">
            <div className="text-sm font-semibold text-white">
              {formatRate(tax)}
            </div>
            <button
              onClick={() => toggleRow(tax.id)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver detalles
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Versión móvil */}
      <div className="md:hidden space-y-4">
        {taxes.map((tax) => (
          <MobileCard key={tax.id} tax={tax} />
        ))}

        {taxes.length === 0 && (
          <div className="text-center py-8 text-gray-400 bg-[#0A0F17] rounded-lg border border-gray-800 p-6">
            No hay impuestos registrados
          </div>
        )}
      </div>

      {/* Versión escritorio */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tipo de Cálculo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tipo SAT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Aplicación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Tasa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-20">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#0A0F17] divide-y divide-gray-800">
            {taxes.map((tax) => (
              <tr key={tax.id} className="hover:bg-gray-900 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-white">
                    {tax.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-300 max-w-xs truncate">
                    {tax.description || "-"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tax.tax_type === "percentage"
                        ? "bg-blue-900/40 text-blue-300"
                        : "bg-green-900/40 text-green-300"
                    }`}
                  >
                    {tax.tax_type === "percentage"
                      ? "Porcentaje"
                      : "Monto fijo"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tax.sat_tax_type === "iva"
                        ? "bg-purple-900/40 text-purple-300"
                        : tax.sat_tax_type === "isr"
                          ? "bg-orange-900/40 text-orange-300"
                          : tax.sat_tax_type === "ieps"
                            ? "bg-pink-900/40 text-pink-300"
                            : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    {formatSATType(tax.sat_tax_type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
                    {formatGeneralType(tax.general_type)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-white">
                    {formatRate(tax)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() =>
                      handleToggleStatus(tax.id, tax.name, tax.is_active)
                    }
                    disabled={loading === tax.id}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      tax.is_active
                        ? "bg-green-900/40 text-green-300 hover:bg-green-800/40"
                        : "bg-red-900/40 text-red-300 hover:bg-red-800/40"
                    } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {tax.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 mr-1" />
                        Inactivo
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex justify-end">
                    <Popover
                      open={popoverOpen === tax.id}
                      onOpenChange={(open) =>
                        setPopoverOpen(open ? tax.id : null)
                      }
                    >
                      <PopoverTrigger asChild>
                        <button className="flex items-center justify-center w-8 h-8 hover:bg-yellow-400/10 rounded-md transition-colors">
                          <MoreVertical size={18} className="text-gray-400 hover:text-yellow-400" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-48 p-0 bg-[#070B14] border border-gray-800 rounded-lg shadow-lg"
                        align="end"
                      >
                        <div className="py-1">
                          <Link
                            href={`/dashboard/impuestos/gestion/editar/${tax.id}`}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-blue-900/30 hover:text-blue-300 transition-colors block"
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => handleOpenDeleteDialog(tax)}
                            disabled={loading === tax.id}
                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Eliminar
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {taxes.length === 0 && (
          <div className="text-center py-8 text-gray-400 bg-[#0A0F17] rounded-lg border border-gray-800">
            No hay impuestos registrados
          </div>
        )}
      </div>

      {/* Diálogo de eliminación */}
      {taxToDelete && (
        <DeleteTaxDialog
          tax={taxToDelete}
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onSuccess={() => handleDeleteSuccess(taxToDelete.id)}
        />
      )}
    </>
  );
}
