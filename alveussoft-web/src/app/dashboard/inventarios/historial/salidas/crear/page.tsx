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
  createInventoryExit,
  getExitLocations,
} from "@/lib/actions/inventory.actions";
import {
  getProductStockByLocationCode,
  getLocationByCode,
} from "@/lib/actions/product_inventory.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProductWithStock {
  id: string;
  code: string;
  bar_code?: string;
  name: string;
  description: string;
  quantity: number;
  category_name?: string;
}

interface InventoryLocation {
  id: string;
  code: string;
  name: string;
  description: string;
}

interface ProductExit {
  id: string; // ID temporal para manejo interno
  product_id: string;
  quantity: string;
  product?: ProductWithStock;
  branchStock?: number | null;
  loadingStock?: boolean;
  quantityError?: string;
  maxQuantity?: number; // Máximo permitido según stock
}

export default function CreateExitPage() {
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<ProductWithStock[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithStock[]>(
    [],
  );
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [branch1Location, setBranch1Location] =
    useState<InventoryLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Estado para múltiples productos
  const [productExits, setProductExits] = useState<ProductExit[]>([]);

  // Estado del formulario general - SALE FIJO COMO TIPO
  const [formData, setFormData] = useState({
    movement_type: "sale" as
      | "sale"
      | "transfer"
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

  // Códigos fijos
  const BRANCH_1_CODE = "BRANCH_1";
  const SALES_CODE = "SALES"; // CÓDIGO FIJO PARA LA UBICACIÓN DE SALIDAS

  // Cargar todos los datos al inicio
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadingProducts(true);
      try {
        const [locationsResponse, branchLocation, productsResponse] =
          await Promise.all([
            getExitLocations(),
            getLocationByCode(BRANCH_1_CODE),
            getProductsWithStock(1, 1000, ""),
          ]);

        // Cargar ubicaciones
        setLocations(locationsResponse);

        // Cargar todos los productos
        setAllProducts(productsResponse.products);
        setFilteredProducts(productsResponse.products.slice(0, 100));

        // Guardar información de BRANCH_1 (origen fijo)
        if (branchLocation) {
          setBranch1Location({
            id: branchLocation.id,
            code: branchLocation.code,
            name: branchLocation.name,
            description: branchLocation.description,
          });

          setFormData((prev) => ({
            ...prev,
            from_location: branchLocation.id,
          }));
        } else {
          console.warn(
            `No se encontró la ubicación con código ${BRANCH_1_CODE}`,
          );
          toast.warning(`No se encontró la ubicación ${BRANCH_1_CODE}`);
        }

        // ESTABLECER UBICACIÓN DE SALIDAS COMO DESTINO FIJO
        const salesLocation = locationsResponse.find(
          (loc) => loc.code === SALES_CODE || loc.code === "OUTPUTS",
        );

        if (salesLocation) {
          setFormData((prev) => ({
            ...prev,
            to_location: salesLocation.id,
            movement_type: "sale", // Tipo de movimiento fijo
          }));
        } else {
          console.warn(`No se encontró la ubicación con código ${SALES_CODE}`);
          toast.warning(`No se encontró la ubicación de Salidas/Clientes`);
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

  // Filtrar productos en tiempo real cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(
        allProducts
          .filter(
            (product) =>
              !productExits.some((exit) => exit.product_id === product.id),
          )
          .slice(0, 100),
      );
    } else {
      const filtered = allProducts.filter(
        (product) =>
          (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ( product.bar_code && product.bar_code
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))) &&
          !productExits.some((exit) => exit.product_id === product.id),
      );
      setFilteredProducts(filtered.slice(0, 100));
    }
  }, [searchTerm, allProducts, productExits]);

  // Cargar stock de BRANCH_1 cuando se agrega un producto
  const loadBranchStock = async (productId: string, index: number) => {
    try {
      const stock = await getProductStockByLocationCode(
        productId,
        BRANCH_1_CODE,
      );

      setProductExits((prev) =>
        prev.map((exit, i) =>
          i === index
            ? {
                ...exit,
                branchStock: stock,
                maxQuantity: stock, // Establecer máximo como el stock disponible
                loadingStock: false,
              }
            : exit,
        ),
      );
    } catch (error) {
      console.error("Error cargando stock de sucursal:", error);
      setProductExits((prev) =>
        prev.map((exit, i) =>
          i === index
            ? {
                ...exit,
                branchStock: 0,
                maxQuantity: 0,
                loadingStock: false,
              }
            : exit,
        ),
      );
    }
  };

  // Actualizar producto en la lista
  const updateProductExit = (index: number, updates: Partial<ProductExit>) => {
    setProductExits((prevExits) =>
      prevExits.map((exit, i) =>
        i === index ? { ...exit, ...updates } : exit,
      ),
    );
  };

  // Seleccionar producto del buscador
  const handleProductSelectFromSearch = (product: ProductWithStock) => {
    setSelectedProductFromSearch(product);
    setSearchTerm(product.name);
    setShowProductList(false);
  };

  // Agregar producto desde el buscador
  const addProductFromSearch = () => {
    if (!selectedProductFromSearch) {
      toast.warning("Por favor selecciona un producto primero");
      return;
    }

    // Verificar si el producto ya está en la lista
    const isDuplicate = productExits.some(
      (exit) => exit.product_id === selectedProductFromSearch.id,
    );

    if (isDuplicate) {
      toast.warning("Este producto ya ha sido agregado");
      return;
    }

    const newId = (Date.now() + Math.random()).toString();
    const newExit: ProductExit = {
      id: newId,
      product_id: selectedProductFromSearch.id,
      product: selectedProductFromSearch,
      quantity: "1",
      loadingStock: true,
    };

    const newIndex = productExits.length;
    setProductExits([...productExits, newExit]);
    setExpandedProducts([...expandedProducts, false]);

    // Cargar stock después de agregar el producto
    loadBranchStock(selectedProductFromSearch.id, newIndex);

    setSelectedProductFromSearch(null);
    setSearchTerm("");
    setError("");
  };

  // Eliminar producto de la lista
  const removeProductExit = (index: number) => {
    setProductExits((prev) => prev.filter((_, i) => i !== index));
    setExpandedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  // Validar cantidad en tiempo real para un producto específico
  const handleQuantityChange = (value: string, index: number) => {
    const quantity = parseInt(value);
    const exit = productExits[index];

    let quantityError = "";
    if (isNaN(quantity) || quantity <= 0) {
      quantityError = "La cantidad debe ser mayor a 0";
    } else if (exit.branchStock !== null && quantity > (exit.branchStock || 0)) {
      quantityError = `No puedes exceder el stock disponible (${exit.branchStock} unidades)`;
    }

    updateProductExit(index, {
      quantity: value,
      quantityError: quantityError,
    });
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
      case "sale":
        return "Venta a cliente";
      case "transfer":
        return "Transferencia entre ubicaciones";
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
      setError(
        "No se ha configurado la ubicación de origen (Inventario Online)",
      );
      setSubmitting(false);
      return;
    }

    if (!formData.to_location) {
      setError("No se ha configurado la ubicación de destino (Salidas)");
      setSubmitting(false);
      return;
    }

    if (formData.from_location === formData.to_location) {
      setError("El origen y el destino no pueden ser la misma ubicación");
      setSubmitting(false);
      return;
    }

    // Validar stock para cada producto
    const hasStockErrors = productExits.some((exit) => {
      const quantity = parseInt(exit.quantity);
      return exit.branchStock !== null && quantity > (exit.branchStock || 0);
    });

    if (hasStockErrors) {
      setError("Algunos productos exceden el stock disponible");
      setSubmitting(false);
      return;
    }

    // Preparar los datos para múltiples productos
    const exits = productExits
      .filter((exit) => exit.product_id && exit.quantity && !exit.quantityError)
      .map((exit) => ({
        product_id: exit.product_id,
        quantity: parseInt(exit.quantity),
      }));

    if (exits.length === 0) {
      setError("Por favor agrega al menos un producto válido");
      setSubmitting(false);
      return;
    }

    try {
      const result = await createInventoryExit({
        entries: exits,
        movement_type: formData.movement_type,
        from_location: formData.from_location,
        to_location: formData.to_location,
        notes: formData.notes || undefined,
      });

      if (result.success) {
        if (result.failedEntries && result.failedEntries.length > 0) {
          // Algunos productos fallaron
          const errorMessages = result.failedEntries
            .map((failed) => `Producto ${failed.product_id}: ${failed.error}`)
            .join(", ");

          toast.warning(
            `Algunos productos no se registraron: ${errorMessages}`,
          );

          // if (result.movements && result.movements.length > 0) {
          //   toast.success(
          //     `${result.movements.length} productos registrados exitosamente`,
          //   );
          // }
        } else {
          // Todos los productos se registraron exitosamente
          toast.success(result.message || "¡Salidas registradas exitosamente!");
        }

        // Resetear formulario
        setProductExits([]);
        setExpandedProducts([]);
        setFormData({
          movement_type: "sale",
          from_location: formData.from_location, // Mantener Inventario Online
          to_location: formData.to_location, // Mantener Salidas
          notes: "",
        });

        router.push("/dashboard/inventarios/historial");
      } else {
        toast.warning(result.message || "Error al registrar las salidas");
      }
    } catch (err: any) {
      toast.warning(err.message || "Error inesperado al registrar las salidas");
    } finally {
      setSubmitting(false);
    }
  };

  // Calcular total de productos y cantidad total
  const totalQuantity = productExits.reduce((sum, exit) => {
    const qty = parseInt(exit.quantity) || 0;
    return sum + qty;
  }, 0);

  const totalProducts = productExits.filter((exit) => exit.product_id).length;

  // Obtener las ubicaciones fijas
  const originLocation = locations.find(
    (loc) => loc.id === formData.from_location,
  );

  const destinationLocation = locations.find(
    (loc) => loc.id === formData.to_location,
  );

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
      {/* Header con el mismo diseño que la página de entrada */}
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
              Registrar salida de inventario
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
                productExits.length === 0 ||
                productExits.some((exit) => exit.quantityError) ||
                productExits.some((exit) => {
                  const quantity = parseInt(exit.quantity) || 0;
                  return (
                    exit.branchStock !== null && quantity > (exit.branchStock || 0)
                  );
                })
              }
              className="inline-flex items-center justify-center px-4 sm:px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-yellow-500 disabled:cursor-not-allowed transition-colors font-medium w-full sm:w-auto"
              title={submitting ? "Registrando..." : "Registrar salida"}
              onClick={handleSubmit}
            >
              <Save className="w-5 h-5" />
              <span className="ml-2">
                {submitting ? "Registrando..." : "Registrar salida"}
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
          {/* Información general del movimiento - Mismo diseño que entrada */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Origen de la Salida (Fija - Inventario Online) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                Origen del movimiento *
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  value={
                    originLocation ? originLocation.name : "Inventario Online"
                  }
                  className="flex-1 border border-gray-700 rounded-lg px-3 py-2 bg-[#070B14] text-white text-sm sm:text-base"
                  readOnly
                  disabled
                />
              </div>
              {!formData.from_location && !loading && (
                <p className="text-xs sm:text-sm text-yellow-600 mt-1">
                  No se encontró la ubicación Inventario Online
                </p>
              )}
            </div>

            {/* Destino de la Salida - FIJO (SOLO LECTURA) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1 sm:mb-2">
                Destino del movimiento *
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  value={
                    destinationLocation ? destinationLocation.name : "Salidas"
                  }
                  className="flex-1 border border-gray-700 rounded-lg px-3 py-2 bg-[#070B14] text-white text-sm sm:text-base"
                  readOnly
                  disabled
                />
              </div>
              {!formData.to_location && !loading && (
                <p className="text-xs sm:text-sm text-yellow-600 mt-1">
                  No se encontró la ubicación de Salidas
                </p>
              )}
            </div>
          </div>

          {/* Tipo de movimiento */}
          <div className="sm:col-span-2">
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
              disabled={loading}
            >
              <option value="sale">Venta a cliente</option>
              <option value="transfer">Transferencia entre ubicaciones</option>
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
              placeholder="Motivo de la salida, observaciones adicionales..."
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

          {/* BUSCADOR DE PRODUCTOS - Mismo diseño */}
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
                  <div className="absolute z-10 w-full mt-1 bg-[#070B14] border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
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
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                                <div>Código de barras: {product.bar_code}</div>
                                <div className="font-semibold text-blue-600">
                                  Stock disponible: {product.quantity} unidades
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
          {productExits.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base sm:text-lg font-medium text-white">
                  Productos agregados ({productExits.length})
                </h3>
              </div>

              {/* CONTENEDOR SIN ALTURA FIJA Y SIN SCROLL - MUESTRA TODOS LOS PRODUCTOS */}
              <div className="space-y-3 sm:space-y-4">
                {productExits.map((exit, index) => (
                  <div
                    key={exit.id}
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
                            {exit.product
                              ? exit.product.name
                              : `Producto #${exit.id}`}
                          </span>
                          {exit.product && exit.quantity && (
                            <span className="ml-2 sm:ml-3 text-xs sm:text-sm bg-red-100 text-red-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded flex-shrink-0">
                              {exit.quantity} unid.
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeProductExit(index);
                        }}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0 ml-2"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {/* Contenido expandible - SOLO INFORMACIÓN Y CANTIDAD */}
                    {expandedProducts[index] && (
                      <div className="p-3 sm:p-4 bg-[#0A0F17] space-y-3 sm:space-y-4">
                        {/* Información del producto seleccionado */}
                        {exit.product && (
                          <div className="bg-[#070B14] border border-blue-700 rounded-lg p-3 sm:p-4">
                            <div className="flex items-start justify-between">
                              <div className="min-w-0">
                                <h4 className="font-medium text-blue-400 text-sm sm:text-base">
                                  {exit.product.name}
                                </h4>
                                <div className="space-y-1 mt-1">
                                  <p className="text-xs sm:text-sm text-blue-700">
                                    Código: {exit.product.code}
                                  </p>
                                  <p className="text-xs sm:text-sm text-blue-700">
                                    Código de barras: {exit.product.bar_code}
                                  </p>
                                  <p className="text-xs sm:text-sm text-blue-700">
                                    {exit.loadingStock ? (
                                      "Cargando stock..."
                                    ) : (
                                      <>
                                        Stock disponible en sucursal:{" "}
                                        <span className="font-bold">
                                          {exit.branchStock !== null
                                            ? `${exit.branchStock}`
                                            : "..."}{" "}
                                          unidades
                                        </span>
                                      </>
                                    )}
                                  </p>
                                  {exit.branchStock !== null && (
                                    <p className="text-xs sm:text-sm text-red-600">
                                      Máximo permitido: {exit.branchStock}{" "}
                                      unidades
                                    </p>
                                  )}
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
                            max={exit.branchStock || 1}
                            value={exit.quantity}
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
                              exit.quantityError
                                ? "border-red-300 focus:ring-red-500"
                                : "border-gray-700 focus:ring-yellow-500"
                            }`}
                            required
                            disabled={!exit.product}
                            placeholder="Ingresa solo números enteros"
                          />
                          {exit.quantityError && (
                            <p className="text-xs sm:text-sm text-red-600 mt-1 flex items-center">
                              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                              {exit.quantityError}
                            </p>
                          )}
                          {exit.branchStock !== null && (
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                              Máximo: {exit.branchStock} unidades disponibles
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
          {productExits.length > 0 && (
            <div className="bg-[#0A0F17] rounded-lg p-3 sm:p-4 border">
              <h3 className="font-medium text-white mb-2 sm:mb-3 flex items-center">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2" />
                Resumen del Movimiento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-gray-400">Desde:</span>
                  <p className="font-medium text-blue-400">
                    {getLocationName(formData.from_location) ||
                      "Inventario Online"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Hacia:</span>
                  <p className="font-medium text-green-400">
                    {getLocationName(formData.to_location) || "Salidas"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Productos:</span>
                  <p className="font-medium">
                    {totalProducts} producto(s) agregado(s)
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
                  {productExits
                    .filter((exit) => exit.product)
                    .map((exit, index) => {
                      const quantity = parseInt(exit.quantity) || 0;
                      const branchStock = exit.branchStock || 0;
                      const exceedsStock = quantity > branchStock;

                      return (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs sm:text-sm bg-[#0A0F17] p-1.5 sm:p-2 rounded border"
                        >
                          <div className="flex items-center min-w-0">
                            <Package className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400 mr-1.5 sm:mr-2 flex-shrink-0" />
                            <span className="text-gray-400 truncate max-w-[120px] sm:max-w-[180px]">
                              {exit.product?.name}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span
                              className={`font-medium ${
                                exceedsStock ? "text-red-600" : "text-red-600"
                              } flex-shrink-0 ml-2`}
                            >
                              {quantity} unid.
                            </span>
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
