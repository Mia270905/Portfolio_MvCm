"use client";

import { useState, useEffect, useMemo } from "react";
import { Package, KanbanSquare, Search, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import {
  getInventoryLocations,
  getInventoryByLocation,
  InventoryLocation,
  InventoryProduct,
} from "@/lib/actions/inventory_reports.actions";

import { ProductTable } from "@/components/dashboard/inventarios/reportes_inventario/product-table";
import { ProductCard } from "@/components/dashboard/inventarios/reportes_inventario/product-card";
import { getUserWithPermissions } from "@/lib/actions/user.actions";

const Inventory = () => {
  const router = useRouter();
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    async function loadUser() {
      const user = await getUserWithPermissions();

      setPermissions(
        Array.isArray(user?.permissions)
          ? user.permissions.map((p: any) => p.code)
          : [],
      );
    }
    loadUser();
  }, []);

  const canReadInventoriesReports = permissions.includes(
    "read:inventory_reports",
  );

  // Load all locations and set default to "Inventario Online"
  useEffect(() => {
    async function loadLocations() {
      const data = await getInventoryLocations();
      setLocations(data);

      // Find "Inventario Online" and set it as default
      const defaultLocation = data.find((l) => l.name === "Inventario Online");
      if (defaultLocation) {
        setSelectedLocation(defaultLocation.id);
      }
      setIsLoading(false);
    }
    loadLocations();
  }, []);

  // Load products when location changes
  useEffect(() => {
    if (!selectedLocation) return;

    async function loadProducts() {
      const data = await getInventoryByLocation(selectedLocation);
      setProducts(data);
    }
    loadProducts();
  }, [selectedLocation]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase().trim();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query) ||
        (product.bar_code ?? "").toLowerCase().includes(query),
    );
  }, [products, searchQuery]);

  const selectedLocationData = locations.find((l) => l.id === selectedLocation);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-custom-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Package className="h-12 w-12 text-custom-accent-primary animate-pulse" />
          <p className="text-custom-text-secondary">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  if (!canReadInventoriesReports) {
    return (
      <div className="min-h-screen bg-custom-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 text-center max-w-md">
          <Package className="h-16 w-16 text-custom-text-secondary opacity-50" />
          <div>
            <h2 className="text-xl font-semibold text-custom-text-primary mb-2">
              Acceso denegado
            </h2>
            <p className="text-custom-text-secondary">
              No tienes permisos para ver los reportes de inventario.
            </p>
            <p className="text-sm text-custom-text-secondary mt-2">
              Contacta al administrador si necesitas acceso.
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="mt-4 border-custom-border hover:bg-custom-accent-hover hover:text-custom-accent-primary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-custom-bg-primary">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGoBack}
              className="shrink-0 text-custom-text-primary hover:text-custom-accent-primary hover:bg-custom-accent-hover"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <KanbanSquare className="h-5 w-5 text-custom-accent-primary" />
              <h1 className="text-xl font-semibold text-custom-text-primary">
                Reportes de Inventario
              </h1>
            </div>
          </div>

          {/* Select y Search en la misma línea cuando hay almacén seleccionado */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={selectedLocation}
              onValueChange={setSelectedLocation}
            >
              <SelectTrigger className="w-full sm:w-[280px] bg-custom-bg-primary border-custom-border text-custom-text-primary hover:border-custom-accent-primary/50">
                <SelectValue placeholder="Seleccionar almacén" />
              </SelectTrigger>
              <SelectContent className="bg-custom-bg-secondary border-custom-border">
                {locations.map((location) => (
                  <SelectItem 
                    key={location.id} 
                    value={location.id}
                    className="text-custom-text-primary hover:bg-custom-accent-hover focus:bg-custom-accent-hover focus:text-custom-accent-primary"
                  >
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search bar en la misma línea */}
            {selectedLocation && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-custom-text-secondary" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, código o código de barras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-custom-bg-primary border-custom-border text-custom-text-primary placeholder:text-custom-text-secondary focus:border-custom-accent-primary"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-6">
        {selectedLocation ? (
          <Card className="bg-custom-bg-secondary border-custom-border shadow-sm">
            <CardHeader className="pb-4 border-b border-custom-border">
              <CardTitle className="flex items-center gap-2 text-base md:text-xl text-custom-text-primary">
                <Package className="h-5 w-5 text-custom-accent-primary shrink-0" />
                <span className="truncate">{selectedLocationData?.name}</span>
                {searchQuery && (
                  <span className="text-sm font-normal text-custom-text-secondary ml-2">
                    ({filteredProducts.length} resultados)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {filteredProducts.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <ProductTable
                      products={filteredProducts}
                      formatCurrency={formatCurrency}
                    />
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-custom-text-secondary py-12">
                  <Package className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-center">
                    {searchQuery
                      ? "No se encontraron productos con esa búsqueda"
                      : "No hay productos en esta ubicación"}
                  </p>
                  {searchQuery && (
                    <Button
                      variant="link"
                      onClick={() => setSearchQuery("")}
                      className="mt-2 text-custom-accent-primary hover:text-custom-accent-primary/80"
                    >
                      Limpiar búsqueda
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-custom-text-secondary">
            <Package className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg text-center px-4">
              Selecciona un almacén para ver su inventario
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Inventory;
