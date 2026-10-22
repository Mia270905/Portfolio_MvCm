"use client";

import { useState, useEffect, useMemo } from "react";
import ZoneItem from "./zone-item";
import { ZoneDialog } from "./zone-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ZonePagination } from "./zone-pagination";
import type { Zone } from "@/lib/actions/zone.actions";
import { getZones_WithPostalCodes } from "@/lib/actions/zone.actions";

interface PostalCode {
  id: string;
  code: string;
  zone_id: string;
}

interface ZoneWithPostalCodes extends Zone {
  postal_codes?: PostalCode[];
}

interface ZonesResponse {
  zones: ZoneWithPostalCodes[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ZoneListProps {
  userPermissions?: string[];
}

export function ZoneList({ userPermissions = [] }: ZoneListProps) {
  const [allZones, setAllZones] = useState<ZoneWithPostalCodes[]>([]);
  const [zonesData, setZonesData] = useState<ZonesResponse>({
    zones: [],
    total: 0,
    page: 1,
    pageSize: 3,
    totalPages: 0,
  });
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedPostalCode, setHighlightedPostalCode] =
    useState<string>("");

  const canCreateZones = userPermissions.includes("create:zones");
  const canUpdateZones = userPermissions.includes("update:zones");
  const canDeleteZones = userPermissions.includes("delete:zones");
  const canReadZones = userPermissions.includes("read:zones");

  // 🔹 Cargar TODAS las zonas una sola vez
  useEffect(() => {
    const fetchZones = async () => {
      if (!canReadZones) {
        setInitialLoading(false);
        return;
      }
      try {
        const all = await getZones_WithPostalCodes();
        setAllZones(all);
      } catch (error) {
        console.error("Error al obtener zonas:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchZones();
  }, [canReadZones]);

  // 🔹 Actualizar búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const query = searchInput.trim().toLowerCase();
      setSearchQuery(query);

      // Extraer código postal si es un número
      const postalCodeMatch = query.match(/\d+/);
      setHighlightedPostalCode(postalCodeMatch ? postalCodeMatch[0] : "");

      setZonesData((prev) => ({ ...prev, page: 1 })); // Reiniciar a página 1
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 🔹 Calcular zonas filtradas y ordenadas
  const filteredAndSortedZones = useMemo(() => {
    if (!searchQuery) return allZones;

    return allZones
      .filter((zone) => {
        // Buscar en nombre de zona
        const nameMatch = zone.name.toLowerCase().includes(searchQuery);

        // Buscar en códigos postales
        const postalCodeMatch = zone.postal_codes?.some((pc) =>
          pc.code.toLowerCase().includes(searchQuery)
        );

        return nameMatch || postalCodeMatch;
      })
      .sort((a, b) => {
        // Si hay un código postal específico, priorizar zonas que lo contengan
        if (highlightedPostalCode) {
          const aHasExactPostalCode = a.postal_codes?.some(
            (pc) => pc.code === highlightedPostalCode
          );
          const bHasExactPostalCode = b.postal_codes?.some(
            (pc) => pc.code === highlightedPostalCode
          );

          if (aHasExactPostalCode && !bHasExactPostalCode) return -1;
          if (!aHasExactPostalCode && bHasExactPostalCode) return 1;
        }

        // Luego priorizar coincidencias exactas en nombre
        const aNameExact = a.name.toLowerCase() === searchQuery;
        const bNameExact = b.name.toLowerCase() === searchQuery;

        if (aNameExact && !bNameExact) return -1;
        if (!aNameExact && bNameExact) return 1;

        return 0;
      });
  }, [allZones, searchQuery, highlightedPostalCode]);

  const paginatedZones = useMemo(() => {
    const from = (zonesData.page - 1) * zonesData.pageSize;
    const to = from + zonesData.pageSize;
    return filteredAndSortedZones.slice(from, to);
  }, [filteredAndSortedZones, zonesData.page, zonesData.pageSize]);

  useEffect(() => {
    setZonesData((prev) => ({
      ...prev,
      zones: paginatedZones,
      total: filteredAndSortedZones.length,
      totalPages: Math.ceil(filteredAndSortedZones.length / prev.pageSize),
    }));
  }, [filteredAndSortedZones, paginatedZones]);

  // 🔹 Acciones CRUD locales (sin recargar datos)
  const handleEdit = (zone: Zone) => {
    if (canUpdateZones) {
      setSelectedZone(zone);
      setIsDialogOpen(true);
    }
  };

  const handleSave = (zone: Partial<Zone>) => {
    if (!canCreateZones && !canUpdateZones) return;

    if (selectedZone && selectedZone.id) {
      setAllZones((prev) =>
        prev.map((z) => (z.id === selectedZone.id ? { ...z, ...zone } : z))
      );
    } else {
      setAllZones((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: zone.name || "Nueva zona",
          shipping_price: zone.shipping_price || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (zoneId: string) => {
    if (!canDeleteZones) return;
    setAllZones((prev) => prev.filter((z) => z.id !== zoneId));
    setZonesData((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setZonesData((prev) => ({ ...prev, page }));
  };

  if (!canReadZones && !initialLoading) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center text-red-600">
          No tienes permisos para ver las zonas de envío.
        </div>
      </div>
    );
  }

  if (initialLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="h-10 bg-gray-300 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {[...Array(3)].map((_, idx) => (
          <div
            key={idx}
            className="animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-lg shadow-xs border border-gray-200 p-4"
          >
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-300 rounded-full" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-300 rounded-sm w-3/4" />
                <div className="h-3 bg-gray-300 rounded-sm w-1/2" />
              </div>
            </div>
            <div className="flex justify-end sm:justify-start space-x-2">
              <div className="h-8 w-8 bg-gray-300 rounded" />
              <div className="h-8 w-8 bg-gray-300 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (zonesData.zones.length === 0 && !searchQuery) {
    return (
      <div className="text-center py-8 sm:py-12 px-4">
        <p className="text-gray-500 mb-4 text-sm sm:text-base">
          No hay zonas de envío registradas
        </p>
        {canCreateZones && (
          <Link href="/dashboard/envios/zonas/crear">
            <Button className="inline-flex items-center px-3 md:px-6 py-2 bg-[#4F46E5] hover:bg-[#6366F1] text-white font-medium rounded-lg">
              <Plus className="w-5 h-5 md:mr-2" />
              <span className="hidden md:inline">Crear Primera Zona</span>
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar zonas por nombre o código postal..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 md:py-2 py-2.5 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-base"
          />
        </div>
      </div>

      {isSearching && searchQuery && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Buscando zonas...</span>
          </div>
        </div>
      )}

      {zonesData.zones.length === 0 && searchQuery && !isSearching && (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-gray-500 mb-2 text-sm sm:text-base">
            No se encontraron zonas que coincidan con `&quot;`{searchQuery}`&quot;`
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            Intenta con otros términos de búsqueda
          </p>
        </div>
      )}

      {(!isSearching || !searchQuery) && (
        <div className="space-y-3 sm:space-y-4">
          {zonesData.zones.map((zone) => (
            <ZoneItem
              key={zone.id}
              zone={zone}
              onEdit={handleEdit}
              onDelete={handleDelete}
              userPermissions={userPermissions}
              highlightedPostalCode={highlightedPostalCode}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}

      {zonesData.totalPages > 1 && !isSearching && (
        <ZonePagination
          currentPage={zonesData.page}
          totalPages={zonesData.totalPages}
          totalItems={zonesData.total}
          pageSize={zonesData.pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {(canCreateZones || canUpdateZones) && (
        <ZoneDialog
          zone={selectedZone}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          isLoading={false}
        />
      )}
    </>
  );
}
