"use server";

import { createClient } from "@/lib/supabase/server";

export interface SalesFiltersType {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  productId: string;
  priceMin: string;
  priceMax: string;
  categoryId: string;
}

export interface ProductCategory {
  id: string;
  title: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory | null;
}

export interface SaleOrderDetail {
  quantity: number;
  product_price: number;
  product?: Product | null;
  product_id?: string; // si viene directo desde la tabla
}

export interface User {
  full_name: string;
}

export interface SaleOrder {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  user?: User | null;
  driver?: User | null;
  sale_order_details: SaleOrderDetail[];
}

/* 🔹 Filtros comunes */
function applyCommonFilters(query: any, filters: SalesFiltersType) {
  if (filters.dateFrom && filters.dateTo) {
    const start = new Date(filters.dateFrom);
    const end = new Date(filters.dateTo);

    end.setHours(23, 59, 59, 999);

    query = query
      .gte("sale_orders.created_at", start.toISOString())
      .lte("sale_orders.created_at", end.toISOString());
  }

  if (filters.productId) query = query.eq("product_id", filters.productId);
  if (filters.categoryId)
    query = query.eq("products.category_id", filters.categoryId);
  if (filters.priceMin)
    query = query.gte("product_price", Number(filters.priceMin));
  if (filters.priceMax)
    query = query.lte("product_price", Number(filters.priceMax));

  return query;
}

/* 🔸 1. Productos más vendidos */
export async function getTopSellingProducts(
  limit = 10,
  filters: SalesFiltersType
) {
  const supabase = await createClient();

  let query = supabase
    .from("sale_order_details")
    .select(
      `
      product_id,
      quantity,
      product_price,
      sale_orders:sale_order_details_sale_order_id_fkey!inner(status, created_at),
      products:purchase_order_details_product_id_fkey!inner(id, name, category_id)
    `
    )
    .not("sale_orders.status", "in", '("Cancelado","Pendiente de pago")');

  query = applyCommonFilters(query, filters);
  const { data, error } = await query;

  if (error || !data) {
    console.error("❌ Error al obtener productos más vendidos:", error);
    return [];
  }

  const aggregated = Object.values(
    data.reduce<
      Record<string, { name: string; sales: number; revenue: number }>
    >((acc, item) => {
      const name = (item as any).products?.name ?? "Desconocido";
      if (!acc[name]) acc[name] = { name, sales: 0, revenue: 0 };

      acc[name].sales += Number(item.quantity);
      acc[name].revenue += Number(item.quantity) * Number(item.product_price);
      return acc;
    }, {})
  );

  return aggregated.sort((a, b) => b.sales - a.sales).slice(0, limit);
}

/* 🔸 2. Tendencia de ventas */
export async function getSalesTrend(filters: SalesFiltersType) {
  const supabase = await createClient();

  let query = supabase
    .from("sale_order_details")
    .select(
      `
      quantity,
      product_price,
      sale_orders:sale_order_details_sale_order_id_fkey!inner(id, status, created_at),
      products:purchase_order_details_product_id_fkey!inner(category_id)
    `
    )
    .not("sale_orders.status", "in", '("Cancelado","Pendiente de pago")');

  query = applyCommonFilters(query, filters);
  const { data, error } = await query;

  if (error || !data) {
    console.error("❌ Error al obtener tendencia de ventas:", error);
    return [];
  }

  const sameDay =
    filters.dateFrom &&
    filters.dateTo &&
    filters.dateFrom.toDateString() === filters.dateTo.toDateString();

  const grouped = data.reduce<
    Record<string, { ventas: number; pedidos: Set<string> }>
  >((acc, item) => {
    const order = (item as any).sale_orders;
    if (!order) return acc;

    const dateObj = new Date(order.created_at);
    const key = sameDay
      ? dateObj.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
      : dateObj.toLocaleString("es-ES", { month: "short" });

    if (!acc[key]) acc[key] = { ventas: 0, pedidos: new Set() };

    acc[key].ventas += Number(item.quantity) * Number(item.product_price);
    acc[key].pedidos.add(order.id);

    return acc;
  }, {});

  return Object.entries(grouped).map(([date, values]) => ({
    date,
    ventas: values.ventas,
    pedidos: values.pedidos.size,
  }));
}

/* 🔸 3. Resumen de ventas */
export async function getSalesSummary(filters: SalesFiltersType) {
  const supabase = await createClient();

  let query = supabase
    .from("sale_order_details")
    .select(
      `
      quantity,
      product_price,
      sale_orders:sale_order_details_sale_order_id_fkey!inner(id, status, created_at),
      products:purchase_order_details_product_id_fkey!inner(id, name, category_id)
    `
    )
    .not("sale_orders.status", "in", '("Cancelado","Pendiente de pago")');

  query = applyCommonFilters(query, filters);
  const { data, error } = await query;

  if (error || !data) {
    console.error("❌ Error al obtener resumen de ventas:", error);
    return { totalSales: 0, totalOrders: 0, avgTicket: 0, totalProducts: 0 };
  }

  const orders = new Map<string, number>();
  let totalSales = 0;
  let totalProducts = 0;

  for (const item of data) {
    const sale = (item as any).sale_orders;
    if (!sale) continue;

    const subtotal = Number(item.quantity) * Number(item.product_price);
    totalSales += subtotal;
    totalProducts += Number(item.quantity);

    if (!orders.has(sale.id)) orders.set(sale.id, subtotal);
  }

  const totalOrders = orders.size;
  const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
  return { totalSales, totalOrders, avgTicket, totalProducts };
}

/* 🔸 4. Producto más y menos vendido */
export async function getTopProducts(filters: SalesFiltersType) {
  const supabase = await createClient();

  let query = supabase
    .from("sale_order_details")
    .select(
      `
      product_id,
      quantity,
      product_price,
      sale_orders:sale_order_details_sale_order_id_fkey!inner(status, created_at),
      products:purchase_order_details_product_id_fkey!inner(id, name, category_id)
    `
    )
    .not("sale_orders.status", "in", '("Cancelado","Pendiente de pago")');

  query = applyCommonFilters(query, filters);
  const { data, error } = await query;

  if (error || !data?.length) {
    console.error("❌ Error al obtener productos:", error);
    return { top: null, bottom: null };
  }

  const grouped = data.reduce<
    Record<string, { name: string; units: number; revenue: number }>
  >((acc, item) => {
    const id = item.product_id as string;
    const name = (item as any).products?.name ?? "Desconocido";
    if (!acc[id]) acc[id] = { name, units: 0, revenue: 0 };
    acc[id].units += Number(item.quantity);
    acc[id].revenue += Number(item.quantity) * Number(item.product_price);
    return acc;
  }, {});

  const sorted = Object.values(grouped).sort((a, b) => b.units - a.units);
  const totalUnits = sorted.reduce((sum, p) => sum + p.units, 0);
  if (sorted.length === 0) return { top: null, bottom: null };

  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];

  return {
    top: {
      name: top.name,
      sales: top.units,
      revenue: `$${top.revenue.toFixed(2)}`,
      percentage: totalUnits
        ? ((top.units / totalUnits) * 100).toFixed(1)
        : "0",
    },
    bottom: {
      name: bottom.name,
      sales: bottom.units,
      revenue: `$${bottom.revenue.toFixed(2)}`,
      percentage: totalUnits
        ? ((bottom.units / totalUnits) * 100).toFixed(1)
        : "0",
    },
  };
}

/* 🔸 5. Opciones de filtros */
export async function getFilterOptions() {
  const supabase = await createClient();

  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id, name")
    .order("name");

  const { data: categories, error: catError } = await supabase
    .from("product_categories")
    .select("id, title")
    .order("title");

  if (prodError || catError) {
    console.error("❌ Error al cargar filtros:", prodError || catError);
    return { products: [], categories: [] };
  }

  return { products: products || [], categories: categories || [] };
}

export async function getSalesReportExcelData(
  filters: SalesFiltersType
): Promise<SaleOrder[]> {
  const supabase = await createClient();

  let query = supabase
    .from("sale_orders")
    .select(`
      id,
      order_number,
      created_at,
      status,
      user:users!sale_orders_user_id_fkey(full_name),
      driver:users!sale_orders_assigned_delivery_driver_fkey(full_name),
      sale_order_details (
        quantity,
        product_price,
        product:products (
          id,
          name,
          category:product_categories(id, title)
        )
      )
    `)
    .not("status", "in", "(Cancelado,Pendiente de pago)")
    .order("created_at", { ascending: true }); 

  // Filtros de orden por fechas
  if (filters.dateFrom && filters.dateTo) {
    const start = new Date(filters.dateFrom);
    const end = new Date(filters.dateTo);
    end.setHours(23, 59, 59, 999);

    query = query.gte("created_at", start.toISOString())
                 .lte("created_at", end.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error al obtener datos del reporte:", error);
    throw new Error("Error obteniendo datos del reporte de ventas");
  }

  // Filtrar productos en memoria
  const filteredData: SaleOrder[] = (data || []).map((order: any) => {
    let details: SaleOrderDetail[] = order.sale_order_details || [];

    if (filters.productId && filters.productId.trim() !== "") {
      details = details.filter(d => {
        const productId = d.product_id ?? d.product?.id;
        return productId === filters.productId;
      });
    }

    if (filters.categoryId) {
      details = details.filter(d => d.product?.category?.id === filters.categoryId);
    }

    if (filters.priceMin) {
      details = details.filter(d => d.product_price >= Number(filters.priceMin));
    }

    if (filters.priceMax) {
      details = details.filter(d => d.product_price <= Number(filters.priceMax));
    }

    // Solo devolver la orden si tiene al menos 1 detalle filtrado
    if (details.length === 0) return null;

    return {
      ...order,
      sale_order_details: details,
    };
  }).filter((o): o is SaleOrder => o !== null);

  return filteredData;
}


