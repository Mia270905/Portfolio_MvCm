"use client";

import { useState, useEffect } from "react";
import PlatformCard from "./platform-card";
import {
  Plus,
  List,
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import { PlatformPagination } from "./platform-pagination";
import {
  getPlatforms,
  type Platform,
  type PlatformsResponse,
} from "@/lib/actions/platform.actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeletePlatformDialog } from "./delete-platform-dialog";
import { Button } from "@/components/ui/button";

interface PlatformListProps {
  userPermissions?: string[];
}

export function PlatformList({ userPermissions = [] }: PlatformListProps) {
  const [allPlatforms, setAllPlatforms] = useState<Platform[]>([]); // Todas las plataformas
  const [filteredPlatforms, setFilteredPlatforms] = useState<Platform[]>([]); // Plataformas filtradas
  const [platformsData, setPlatformsData] = useState<PlatformsResponse>({
    platforms: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [domainFilter, setDomainFilter] = useState<string>("");
  const [platformToDelete, setPlatformToDelete] = useState<Platform | null>(null);
  
  const [showFilters, setShowFilters] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const canCreatePlatforms = userPermissions.includes("create:platforms");
  const canUpdatePlatforms = userPermissions.includes("update:platforms");
  const canDeletePlatforms = userPermissions.includes("delete:platforms");
  const canReadPlatforms = userPermissions.includes("read:platforms");

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      if (!canReadPlatforms) {
        setInitialLoading(false);
        return;
      }

      try {
        setLoading(true);
        const platformsData = await getPlatforms(1, 1000, ""); // Traer muchas plataformas de una vez
        
        setAllPlatforms(platformsData.platforms);
        setFilteredPlatforms(platformsData.platforms);
        
        // Configurar paginación inicial
        setPlatformsData(prev => ({
          ...prev,
          platforms: platformsData.platforms.slice(0, 10),
          total: platformsData.platforms.length,
          totalPages: Math.ceil(platformsData.platforms.length / 10)
        }));
      } catch (error) {
        console.error("Error al cargar datos iniciales:", error);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };

    loadInitialData();
  }, [canReadPlatforms]);

  // Aplicar filtros cuando cambien los criterios
  useEffect(() => {
    if (allPlatforms.length === 0) return;

    setIsSearching(true);
    
    const timer = setTimeout(() => {
      let filtered = [...allPlatforms];

      // Filtro de búsqueda general
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(platform => 
          platform.code.toLowerCase().includes(query) ||
          platform.name.toLowerCase().includes(query) ||
          platform.domain.toLowerCase().includes(query) ||
          (platform.description && platform.description.toLowerCase().includes(query))
        );
      }

      // Filtro por dominio
      if (domainFilter) {
        filtered = filtered.filter(platform => 
          platform.domain.toLowerCase().includes(domainFilter.toLowerCase())
        );
      }

      setFilteredPlatforms(filtered);
      
      // Actualizar paginación
      const currentPageSize = 10;
      const startIndex = (platformsData.page - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;
      
      setPlatformsData(prev => ({
        ...prev,
        platforms: filtered.slice(startIndex, endIndex),
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / currentPageSize),
        pageSize: currentPageSize
      }));

      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [
    allPlatforms,
    searchQuery,
    domainFilter,
    platformsData.page
  ]);

  // Efecto para el debounce de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPlatformsData(prev => ({ ...prev, page: 1 }));
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const clearFilters = () => {
    setDomainFilter("");
    setSearchInput("");
    setSearchQuery("");
  };

  const hasActiveFilters =
    domainFilter ||
    searchQuery;

  const handleEdit = (platform: Platform) => {
    if (canUpdatePlatforms) {
      setSelectedPlatform(platform);
      setIsDialogOpen(true);
    }
  };

  const handleCreate = () => {
    if (canCreatePlatforms) {
      setSelectedPlatform(null);
      setIsDialogOpen(true);
    }
  };

  const handleSave = async () => {
    try {
      // Recargar todas las plataformas después de guardar
      setLoading(true);
      const data = await getPlatforms(1, 1000, "");
      setAllPlatforms(data.platforms);
      setFilteredPlatforms(data.platforms);
    } catch (error) {
      console.error("Error al recargar plataformas:", error);
    } finally {
      setLoading(false);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteClick = (platform: Platform) => {
    if (canDeletePlatforms) {
      setPlatformToDelete(platform);
      setDeleteDialogOpen(true);
    }
  };

  const handleDelete = async (platformId: string) => {
    try {
      const newAllPlatforms = allPlatforms.filter(platform => platform.id !== platformId);
      setAllPlatforms(newAllPlatforms);
      
      const newFilteredPlatforms = filteredPlatforms.filter(platform => platform.id !== platformId);
      setFilteredPlatforms(newFilteredPlatforms);
      
      const currentPageSize = 10;
      const startIndex = (platformsData.page - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;
      
      setPlatformsData(prev => ({
        ...prev,
        platforms: newFilteredPlatforms.slice(startIndex, endIndex),
        total: newFilteredPlatforms.length,
        totalPages: Math.ceil(newFilteredPlatforms.length / currentPageSize)
      }));

    } catch (error) {
      console.error("Error al eliminar plataforma visualmente:", error);
    }
  };

  const handlePageChange = (page: number) => {
    setPlatformsData((prev) => ({
      ...prev,
      page,
    }));
  };

  // Mostrar skeleton solo para las plataformas cuando está cargando
  const renderPlatformList = () => {
    if (loading && initialLoading) {
      return (
        <div className="space-y-3">
          {[...Array(platformsData.pageSize)].map((_, idx) => (
            <div
              key={idx}
              className="animate-pulse bg-[#0A0F17] rounded-lg border border-gray-800 p-4 flex gap-3"
            >
              <div className="flex gap-3 w-full">
                <div className="h-16 w-16 bg-gray-800 rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-3 bg-gray-800 rounded w-1/2" />
                  <div className="h-3 bg-gray-800 rounded w-2/3" />
                  <div className="h-3 bg-gray-800 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (platformsData.platforms.length === 0 && searchQuery) {
      return (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-gray-500 mb-2 text-sm sm:text-base">
            No se encontraron plataformas que coincidan con `&quot;`{searchQuery}`&quot;`
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            Intenta con otros términos de búsqueda
          </p>
        </div>
      );
    }

    if (platformsData.platforms.length === 0 && !searchQuery && !loading) {
      return (
        <div className="text-center py-8 sm:py-12 px-4">
          <p className="text-gray-500 mb-4 text-sm sm:text-base">
            No hay plataformas registradas
          </p>
          {canCreatePlatforms && (
            <Button
              onClick={handleCreate}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <Plus size={16} className="mr-2" />
              Crear Primera Plataforma
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3 mb-6">
        {platformsData.platforms.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            userPermissions={userPermissions}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Controles de búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Buscar plataformas por código, nombre, dominio o descripción..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />
        </div>
      </div>


      {/* Indicador de búsqueda */}
      {isSearching && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm">Aplicando filtros...</span>
          </div>
        </div>
      )}

      {/* Lista de plataformas */}
      {renderPlatformList()}

      {/* Paginación */}
      {!loading && platformsData.totalPages > 1 && (
        <PlatformPagination
          currentPage={platformsData.page}
          totalPages={platformsData.totalPages}
          totalItems={platformsData.total}
          pageSize={platformsData.pageSize}
          onPageChange={handlePageChange}
        />
      )}

      {/* Diálogo de eliminación */}
      <DeletePlatformDialog
        platformId={platformToDelete?.id || ""}
        platformName={platformToDelete?.name || ""}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setPlatformToDelete(null);
          }
        }}
        onDelete={handleDelete}
      />
    </>
  );
}

export type { Platform };