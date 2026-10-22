"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Search,
  Package,
  AlertCircle,
  MapPin,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getProductsWithStock,
  createInventoryTranfer,
  getExitLocations,
  getProductStockByLocation,
} from "@/lib/actions/inventory.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProductWithStock {
  id: string;
  code: string;
  bar_code: string;
  name: string;
  description: string;
  quantity: number;
  total_quantity?: number;
  location_stock?: number;
  category_name?: string;
}

interface InventoryLocation {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface ProductEntry {
  id: string;
  product_id: string;
  quantity: string;
  product?: ProductWithStock;
  quantityError?: string;
}

export default function CreateTransferPage() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<ProductWithStock[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithStock[]>(
    [],
  );
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Estado para múltiples productos
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([]);

  // Estado del formulario general
  const [formData, setFormData] = useState({
    movement_type: "transfer" as
      | "transfer"
      | "sale"
      | "adjustment"
      | "loss"
      | "return",
    from_location: "",
    to_location: "",
    notes: "",
  });

  const [error, setError] = useState("");
  const [expandedProducts, setExpandedProducts] = useState<boolean[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [selectedProductFromSearch, setSelectedProductFromSearch] =
    useState<ProductWithStock | null>(null);
  const [destinationLocations, setDestinationLocations] = useState<
    InventoryLocation[]
  >([]);

  // Cargar todos los datos al inicio
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadingProducts(true);
      try {
        const [locationsResponse, productsResponse] = await Promise.all([
          getExitLocations(),
          getProductsWithStock(1, 1000, ""),
        ]);

        setLocations(locationsResponse);

        // Establecer ubicación por defecto
        const branch1Location = locationsResponse.find(
          (loc) => loc.code === "BRANCH_1" || loc.code === "SUC-001",
        );

        if (branch1Location) {
          setFormData((prev) => ({
            ...prev,
            from_location: branch1Location.id,
          }));

          const initialDestinations = locationsResponse.filter(
            (loc) => loc.id !== branch1Location.id,
          );
          setDestinationLocations(initialDestinations);

          const locationProductsResponse = await getProductsWithStock(
            1,
            1000,
            "",
            branch1Location.id,
          );
          setAllProducts(locationProductsResponse.products);
          setFilteredProducts(locationProductsResponse.products.slice(0, 100));
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        toast.warning("Error al cargar los datos necesarios");
      } finally {
        setLoading(false);
        setLoadingProducts(false);
      }
    };

    loadData();
  }, []);

  // Filtrar productos en tiempo real
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(
        allProducts
          .filter(
            (product) =>
              !productEntries.some((entry) => entry.product_id === product.id),
          )
          .slice(0, 100),
      );
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      const filtered = allProducts.filter((product) => {
        // Usamos el operador ?. (optional chaining) y || "" (valor por defecto)
        // para evitar el error si el campo es null en la BD
        const nameMatch = (product.name || "").toLowerCase().includes(lowerSearch);
        const codeMatch = (product.code || "").toLowerCase().includes(lowerSearch);
        const barCodeMatch = (product.bar_code || "").toLowerCase().includes(lowerSearch);
        
        const isNotAdded = !productEntries.some((entry) => entry.product_id === product.id);

        return (nameMatch || codeMatch || barCodeMatch) && isNotAdded;
      });
      setFilteredProducts(filtered.slice(0, 100));
    }
  }, [searchTerm, allProducts, productEntries]);

  useEffect(() => {
    const loadProductsForLocation = async () => {
      if (formData.from_location) {
        setLoadingProducts(true);
        try {
          const productsResponse = await getProductsWithStock(
            1,
            1000,
            searchTerm,
            formData.from_location,
          );

          setAllProducts(productsResponse.products);

          // Filtrar productos que ya están en la lista
          const availableProducts = productsResponse.products.filter(
            (product) =>
              !productEntries.some((entry) => entry.product_id === product.id),
          );

          setFilteredProducts(availableProducts.slice(0, 100));
        } catch (err) {
          console.error("Error cargando productos para ubicación:", err);
          toast.warning("Error al cargar productos para esta ubicación");
        } finally {
          setLoadingProducts(false);
        }
      }
    };

    // Solo recargar productos cuando cambia la ubicación de origen
    const debounceTimer = setTimeout(() => {
      loadProductsForLocation();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [formData.from_location, productEntries]);

  // Funciones para manejar múltiples productos
  const updateProductEntry = (
    index: number,
    updates: Partial<ProductEntry>,
  ) => {
    setProductEntries((prevEntries) =>
      prevEntries.map((entry, i) =>
        i === index ? { ...entry, ...updates } : entry,
      ),
    );
  };

  const handleProductSelectFromSearch = (product: ProductWithStock) => {
    setSelectedProductFromSearch(product);
    setSearchTerm(product.name);
    setShowProductList(false);
  };

  const addProductFromSearch = async () => {
    if (!selectedProductFromSearch) {
      toast.warning("Por favor selecciona un producto primero");
      return;
    }

    // Verificar si el producto ya está en la lista
    const isDuplicate = productEntries.some(
      (entry) => entry.product_id === selectedProductFromSearch.id,
    );

    if (isDuplicate) {
      toast.warning("Este producto ya ha sido agregado");
      return;
    }

    // Obtener el stock actualizado de la ubicación de origen
    let updatedProduct = { ...selectedProductFromSearch };

    if (formData.from_location) {
      try {
        const currentStock = await getProductStockByLocation(
          selectedProductFromSearch.id,
          formData.from_location,
        );
        updatedProduct.quantity = currentStock;
      } catch (error) {
        console.error("Error obteniendo stock actualizado:", error);
      }
    }

    const newId = (Date.now() + Math.random()).toString();
    const newEntry: ProductEntry = {
      id: newId,
      product_id: updatedProduct.id,
      product: updatedProduct,
      quantity: "1",
    };

    const newIndex = productEntries.length;
    setProductEntries([...productEntries, newEntry]);
    setExpandedProducts([...expandedProducts, false]);

    setSelectedProductFromSearch(null);
    setSearchTerm("");
    setError("");
  };

  const removeProductEntry = (index: number) => {
    setProductEntries((prev) => prev.filter((_, i) => i !== index));
    setExpandedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // Validar cantidad en tiempo real
  const handleQuantityChange = (value: string, index: number) => {
    const quantity = parseInt(value);
    const product = productEntries[index].product;

    let quantityError = "";
    if (isNaN(quantity) || quantity <= 0) {
      quantityError = "La cantidad debe ser mayor a 0";
    } else if (product && quantity > product.quantity) {
      quantityError = `Stock insuficiente. Disponible: ${product.quantity}`;
    }

    updateProductEntry(index, {
      quantity: value,
      quantityError: quantityError,
    });
  };

  // Determinar el tipo de movimiento sugerido basado en el destino
  const getSuggestedMovementType = (toLocationId: string) => {
    const toLocation = locations.find((loc) => loc.id === toLocationId);
    if (toLocation?.code === "CLIENTS" || toLocation?.name.includes("Cliente"))
      return "sale";
    if (toLocation?.code === "ADJUSTMENTS") return "adjustment";
    if (toLocation?.code === "RETURNS") return "return";
    if (toLocation?.code === "LOSS") return "loss";
    return "transfer";
  };

  const handleToLocationChange = (locationId: string) => {
    const suggestedType = getSuggestedMovementType(locationId);
    setFormData((prev) => ({
      ...prev,
      to_location: locationId,
      movement_type: suggestedType,
    }));
  };

  // Cambia el handler del select de origen:
  const handleFromLocationChange = async (locationId: string) => {
    setFormData((prev) => ({
      ...prev,
      from_location: locationId,
      to_location: prev.to_location === locationId ? "" : prev.to_location,
    }));

    setProductEntries([]);
    setExpandedProducts([]);
    setSelectedProductFromSearch(null);
    setSearchTerm("");

    // Actualizar ubicaciones de destino
    const destinationLocations = locations.filter(
      (location) => location.id !== locationId,
    );
    setDestinationLocations(destinationLocations);
  };

  const toggleProductExpand = (index: number) => {
    setExpandedProducts((prev) =>
      prev.map((expanded, i) => (i === index ? !expanded : expanded)),
    );
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find((loc) => loc.id === locationId);
    return location ? location.name : "No seleccionada";
  };

  const getMovementTypeDescription = () => {
    switch (formData.movement_type) {
      case "transfer":
        return "Transferencia entre ubicaciones";
      case "sale":
        return "Venta a cliente";
      case "adjustment":
        return "Ajuste de inventario";
      case "loss":
        return "Pérdida o daño";
      case "return":
        return "Devolución";
      default:
        return "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Validaciones generales
    if (!formData.from_location) {
      setError("Por favor selecciona una ubicación de origen");
      setSubmitting(false);
      return;
    }

    if (!formData.to_location) {
      setError("Por favor selecciona una ubicación de destino");
      setSubmitting(false);
      return;
    }

    if (formData.from_location === formData.to_location) {
      setError("El origen y el destino no pueden ser la misma ubicación");
      setSubmitting(false);
      return;
    }

    // Preparar los datos para múltiples productos
    const entries = productEntries
      .filter(
        (entry) => entry.product_id && entry.quantity && !entry.quantityError,
      )
      .map((entry) => ({
        product_id: entry.product_id,
        quantity: parseInt(entry.quantity),
      }));

    if (entries.length === 0) {
      setError("Por favor agrega al menos un producto válido");
      setSubmitting(false);
      return;
    }

    // Verificar stock para cada producto
    const stockErrors: string[] = [];
    productEntries.forEach((entry, index) => {
      if (entry.product && entry.quantity && !entry.quantityError) {
        const quantity = parseInt(entry.quantity);
        if (quantity > entry.product.quantity) {
          stockErrors.push(
            `${entry.product.name}: Stock insuficiente (${entry.product.quantity} disponible)`,
          );
        }
      }
    });

    if (stockErrors.length > 0) {
      setError(`Problemas de stock: ${stockErrors.join(", ")}`);
      setSubmitting(false);
      return;
    }

    try {
      // Usar createInventoryExit para múltiples productos
      const result = await createInventoryTranfer({
        entries,
        movement_type: formData.movement_type,
        from_location: formData.from_location,
        to_location: formData.to_location,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        if (result.failedEntries && result.failedEntries.length > 0) {
          const errorMessages = result.failedEntries
            .map((failed) => {
              const product = productEntries.find(
                (entry) => entry.product_id === failed.product_id,
              );
              return `${product?.product?.name || failed.product_id}: ${
                failed.error
              }`;
            })
            .join(", ");

          toast.warning(
            `Algunos productos no se registraron: ${errorMessages}`,
          );

          if (result.inventory_movement_id) {
            toast.success(
              `${
                entries.length - result.failedEntries.length
              } productos traspasados exitosamente`,
            );
          }
        } else {
          toast.success(result.message || "¡Traspaso registrado exitosamente!");
        }

        // Resetear formulario
        setProductEntries([]);
        setExpandedProducts([]);
        setFormData({
          movement_type: "transfer",
          from_location: formData.from_location,
          to_location: "",
          notes: "",
        });
        setSearchTerm("");

        router.push("/dashboard/inventarios/historial");
      } else {
        toast.warning(result.message || "Error al registrar el traspaso");
      }
    } catch (err: any) {
      toast.warning(err.message || "Error inesperado al registrar el traspaso");
    } finally {
      setSubmitting(false);
    }
  };

  // Calcular totales
  const totalQuantity = productEntries.reduce((sum, entry) => {
    const qty = parseInt(entry.quantity) || 0;
    return sum + qty;
  }, 0);

  const totalProducts = productEntries.filter(
    (entry) => entry.product_id,
  ).length;

  // Obtener ubicaciones de destino (excluyendo la de origen)
  {
    /*
  const destinationLocations = locations.filter(
    (location) => location.id !== formData.from_location,
  );
  */
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header con el mismo diseño */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Flecha y título */}
          <div className="flex-1">
            {/* Flecha arriba */}
            <div className="mb-2">
              <Link
                href="/dashboard/inventarios/historial"
                className="inline-flex items-center text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>

            {/* Título */}
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Registrar traspaso de inventario
            </h1>
          </div>

          {/* Botón Registrar - alineado con el título */}
          <div className="flex items-center sm:items-start sm:pt-8">
            <button
              type="submit"
              disabled={
                !formData.from_location ||
                !formData.to_location ||
                submitting ||
                productEntries.length === 0 ||
                productEntries.some((entry) => entry.quantityError)
              }
              className="inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-yellow-500 disabled:cursor-not-allowed transition-colors font-medium w-full sm:w-auto"
              title={submitting ? "Registrando..." : "Registrar traspaso"}
              onClick={handleSubmit}
            >
              <Save className="w-5 h-5" />
              <span className="ml-2">
                {submitting ? "Registrando..." : "Registrar traspaso"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de error general */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
            <span className="text-red-800 text-sm sm:text-base">{error}</span>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-[#0A0F17] rounded-lg shadow p-4 sm:p-6">
        <form className="space-y-4 sm:space-y-6">
          {/* Información general del movimiento - Primero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Origen */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                Origen del traspaso *
              </label>
              <select
                value={formData.from_location}
                onChange={(e) => handleFromLocationChange(e.target.value)}
                className="w-full bg-[#0A0F17] border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="">Selecciona una ubicación de origen</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Selecciona desde dónde salen los productos
              </p>
            </div>

            {/* Destino */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                Destino del traspaso *
              </label>
              <select
                value={formData.to_location}
                onChange={(e) => handleToLocationChange(e.target.value)}
                className="w-full bg-[#0A0F17] border border-gray-300 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!formData.from_location}
              >
                <option value="">Selecciona una ubicación destino</option>
                {destinationLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Selecciona hacia dónde se dirige el producto
              </p>
            </div>
          </div>

          {/* Tipo de movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Tipo de Movimiento *
            </label>
            <select
              value={formData.movement_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  movement_type: e.target.value as any,
                })
              }
              className="w-full border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500"
            >
              <option value="transfer">Transferencia entre ubicaciones</option>
              <option value="sale">Venta a cliente</option>
              <option value="adjustment">Ajuste de inventario</option>
              <option value="loss">Pérdida o daño</option>
              <option value="return">Devolución</option>
            </select>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
              Notas u Observaciones
            </label>
            <textarea
              rows={2}
              placeholder="Motivo del traspaso, observaciones adicionales..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full border border-gray-700 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500"
            />
          </div>

          {/* Separador */}
          <div className="flex items-center my-4 sm:my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* BUSCADOR DE PRODUCTOS */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Buscar y agregar producto
            </label>
            <div className="flex gap-2 sm:gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar producto por nombre, código o código de barras..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowProductList(true);
                    setSelectedProductFromSearch(null);
                  }}
                  onFocus={() => setShowProductList(true)}
                  onBlur={() => {
                    setTimeout(() => setShowProductList(false), 200);
                  }}
                  className="w-full border border-gray-700 rounded-lg pl-3 pr-10 py-2 text-sm sm:text-base focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 text-white bg-[#070B14] placeholder-gray-500"
                  disabled={loading || loadingProducts}
                />
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute right-3 top-2.5" />

                {showProductList && !loading && (
                  <div className="absolute z-10 w-full mt-1 bg-[#070B14] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loadingProducts ? (
                      <div className="p-3 sm:p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-gray-400 text-sm">
                          Cargando productos...
                        </p>
                      </div>
                    ) : filteredProducts.length > 0 ? (
                      <>
                        <div className="max-h-48 overflow-y-auto">
                          {filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              onClick={() =>
                                handleProductSelectFromSearch(product)
                              }
                              className="p-2 sm:p-3 hover:bg-[#070B14] cursor-pointer border-b border-gray-700 last:border-b-0"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm sm:text-base">
                                  {product.name}
                                </span>
                                <span className="text-xs sm:text-sm text-gray-500">
                                  {product.code}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                <div>Código de barras: {product.bar_code}</div>
                                <div className="font-semibold text-blue-600">
                                  Stock disponible en{" "}
                                  {getLocationName(formData.from_location)}:{" "}
                                  {product.quantity} unidades
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {filteredProducts.length > 5 && (
                          <div className="p-2 text-xs text-gray-400 text-center border-t">
                            Mostrando {Math.min(5, filteredProducts.length)} de{" "}
                            {filteredProducts.length} productos
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-3 text-gray-500 text-center text-sm">
                        {searchTerm.trim()
                          ? "No se encontraron productos"
                          : "No hay productos disponibles"}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* Botón de agregar - solo ícono en móvil, texto en desktop */}
              <button
                type="button"
                onClick={addProductFromSearch}
                disabled={!selectedProductFromSearch}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-yellow-500 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                title={
                  selectedProductFromSearch
                    ? "Agregar producto"
                    : "Selecciona un producto primero"
                }
              >
                <Plus className="w-4 h-4 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline ml-1 sm:ml-2">Agregar</span>
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {selectedProductFromSearch
                ? `Producto seleccionado: ${selectedProductFromSearch.name}`
                : "Busca y selecciona un producto para agregarlo"}
            </p>
          </div>

          {/* Lista de productos agregados - Mismo diseño */}
          {productEntries.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-medium text-white">
                  Productos para traspasar ({productEntries.length})
                </h3>
              </div>

              {/* CONTENEDOR SIN ALTURA FIJA Y SIN SCROLL - MUESTRA TODOS LOS PRODUCTOS */}
              <div className="space-y-3 sm:space-y-4">
                {productEntries.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="border border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Header del producto - Siempre visible */}
                    <div
                      className="bg-[#070B14] px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-[#0A0F17] transition-colors flex justify-between items-center"
                      onClick={() => toggleProductExpand(index)}
                    >
                      <div className="flex items-center min-w-0">
                        {expandedProducts[index] ? (
                          <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-2 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-2 flex-shrink-0" />
                        )}
                        <div className="flex items-center min-w-0">
                          <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="font-medium text-gray-400 text-sm sm:text-base truncate">
                            {entry.product
                              ? entry.product.name
                              : `Producto #${entry.id}`}
                          </span>
                          {entry.product && entry.quantity && (
                            <span className="ml-2 sm:ml-3 text-xs sm:text-sm bg-blue-100 text-blue-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
                              {entry.quantity} unid.
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProductEntry(index);
                        }}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0 ml-2"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {/* Contenido expandible */}
                    {expandedProducts[index] && (
                      <div className="p-3 sm:p-4 bg-[#0A0F17] space-y-3 sm:space-y-4">
                        {/* Información del producto seleccionado */}
                        {entry.product && (
                          <div className="bg-[#070B14] border border-blue-700 rounded-lg p-3 sm:p-4">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <h4 className="font-medium text-blue-400 text-sm sm:text-base">
                                  {entry.product.name}
                                </h4>
                                <div className="space-y-1 mt-1">
                                  <p className="text-xs sm:text-sm text-blue-700">
                                    Código: {entry.product.code}
                                  </p>
                                  <p className="text-xs sm:text-sm text-blue-700">
                                    Código de barras: {entry.product.bar_code}
                                  </p>
                                  <p className="text-xs sm:text-sm text-blue-700">
                                    Stock disponible en{" "}
                                    {getLocationName(formData.from_location)}:{" "}
                                    <span className="font-bold">
                                      {entry.product.quantity} unidades
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 ml-2 flex-shrink-0" />
                            </div>
                          </div>
                        )}

                        {/* Cantidad */}
                        <div>
                          <label className="block text-sm font-medium text-gray-400 mb-1 sm:mb-2">
                            Cantidad *
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            max={entry.product?.quantity || 1}
                            value={entry.quantity}
                            onChange={(e) =>
                              handleQuantityChange(e.target.value, index)
                            }
                            onKeyDown={(e) => {
                              if (["e", "E", "+", "-", "."].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onInput={(e) => {
                              const input = e.target as HTMLInputElement;
                              if (input.value.includes(".")) {
                                input.value = input.value.replace(".", "");
                              }
                            }}
                            className={`w-full border rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 ${
                              entry.quantityError
                                ? "border-red-300 focus:ring-red-500"
                                : "border-gray-700 focus:ring-blue-500"
                            }`}
                            required
                            disabled={!entry.product}
                            placeholder="Ingresa solo números enteros"
                          />
                          {entry.quantityError && (
                            <p className="text-xs sm:text-sm text-red-600 mt-1 flex items-center">
                              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                              {entry.quantityError}
                            </p>
                          )}
                          {entry.product && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              Máximo: {entry.product.quantity} unidades
                              disponibles en{" "}
                              {getLocationName(formData.from_location)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumen del movimiento */}
          {productEntries.length > 0 && (
            <div className="bg-[#0A0F17] rounded-lg p-3 sm:p-4 border">
              <h3 className="font-medium text-white mb-2 sm:mb-3 flex items-center">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
                Resumen del Traspaso
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-400">Desde:</span>
                  <p className="font-medium text-blue-400">
                    {getLocationName(formData.from_location) ||
                      "No seleccionada"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Hacia:</span>
                  <p className="font-medium text-green-400">
                    {getLocationName(formData.to_location) || "No seleccionada"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Productos:</span>
                  <p className="font-medium">
                    {totalProducts} producto(s) para traspasar
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Cantidad total:</span>
                  <p className="font-medium">
                    {totalQuantity} unidades
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-gray-400">Tipo de movimiento:</span>
                  <p className="font-medium capitalize">
                    {getMovementTypeDescription()}
                  </p>
                </div>
              </div>

              {/* Lista de productos en resumen */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
                <h4 className="font-medium text-white mb-2 text-sm sm:text-base">
                  Productos incluidos:
                </h4>
                <div className="space-y-1 sm:space-y-2">
                  {productEntries
                    .filter((entry) => entry.product)
                    .map((entry, index) => {
                      const quantity = parseInt(entry.quantity) || 0;
                      const availableStock = entry.product?.quantity || 0;
                      const exceedsStock = quantity > availableStock;

                      return (
                        <div
                          key={index}
                        className="flex justify-between items-center text-xs sm:text-sm bg-[#0A0F17] p-1.5 sm:p-2 rounded border"
                        >
                          <div className="flex items-center min-w-0">
                            <Package className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <span className="text-gray-400 truncate max-w-[120px] sm:max-w-[180px]">
                              {entry.product?.name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`font-medium ${
                                exceedsStock ? "text-red-600" : "text-blue-600"
                              } flex-shrink-0 ml-2`}
                            >
                              {quantity} unid.
                            </span>
                            {exceedsStock && (
                              <span className="text-xs text-red-600 ml-1 sm:ml-2 flex-shrink-0">
                                (Excede stock)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
