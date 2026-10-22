"use server";

import { createClient } from "@/lib/supabase/server";

// --- Interfaces ---
export interface Address {
  postal_code: string;
  neighborhood: string;
  street: string;
  exterior_number: string;
  interior_number?: string | null;
  phone_number: string | null;
}

export interface User {
  id: string;
  full_name: string;
}

export interface OrderType {
  id: string;
  name: string;
}

export interface OrderDetail {
  sale_order_id: string;
  quantity: number;
  product_price: number;
}

export interface OrderRecord {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  shipping_cost: number | null;
  delivery_instructions: string | null;
  special_instructions: string | null;
  user_id: string;
  sale_order_type: string;
  addresses: Address | null;
  assigned_delivery_time_at?: string;
  delivery_time?: number;
}

export interface DeliveryOrder {
  id: string;
  order_number: string;
  user_name: string;
  user_address: string | null;
  user_phone: string | null;
  status: string;
  created_at: string;
  total: number;
  delivery_instructions: string | null;
  special_instructions: string | null;
  order_type_name: string;
  shipping_cost: number;
  assigned_delivery_time_at?: string;
  delivery_time?: number;
}

// --- Función principal ---
export async function getDeliveryOrders(
  driverId: string
): Promise<DeliveryOrder[]> {
  try {
    const supabase = await createClient();

    const { data: orders, error } = await supabase
      .from("sale_orders")
      .select(
        `
        id,
        order_number,
        status,
        created_at,
        shipping_cost,
        delivery_instructions,
        special_instructions,
        user_id,
        sale_order_type,
        delivery_time,
        assigned_delivery_time_at,
        addresses:addresses (
          postal_code,
          neighborhood,
          street,
          exterior_number,
          interior_number,
          phone_number
        )
      `
      )
      .eq("assigned_delivery_driver", driverId)
      .in("status", ["Preparación", "En camino", "Entregado"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error(" Error fetching delivery orders:", error);
      throw new Error("Error al obtener los pedidos");
    }

    if (!orders || orders.length === 0) return [];

    type RawOrder = Omit<OrderRecord, "addresses"> & {
      addresses: Address[] | Address | null;
    };

    const typedOrders: OrderRecord[] = (orders as RawOrder[]).map((order) => ({
      ...order,
      addresses: Array.isArray(order.addresses)
        ? order.addresses[0] ?? null
        : order.addresses,
    }));

    const userIds = [
      ...new Set(typedOrders.map((o) => o.user_id).filter(Boolean)),
    ];
    const orderTypeIds = [
      ...new Set(typedOrders.map((o) => o.sale_order_type).filter(Boolean)),
    ];

    const { data: users } = await supabase
      .from("users")
      .select("id, full_name")
      .in("id", userIds);

    const { data: orderTypes } = await supabase
      .from("sale_order_types")
      .select("id, name")
      .in("id", orderTypeIds);

    const orderIds = typedOrders.map((o) => o.id);
    const { data: orderDetails } = await supabase
      .from("sale_order_details")
      .select("sale_order_id, quantity, product_price")
      .in("sale_order_id", orderIds);

    const userMap = new Map<string, User>((users ?? []).map((u) => [u.id, u]));

    const orderTypeMap = new Map<string, OrderType>(
      (orderTypes ?? []).map((ot) => [ot.id, ot])
    );

    const orderTotalsMap = new Map<string, number>();

    // Calcular totales por pedido
    (orderDetails ?? []).forEach((detail: OrderDetail) => {
      const currentTotal = orderTotalsMap.get(detail.sale_order_id) || 0;
      orderTotalsMap.set(
        detail.sale_order_id,
        currentTotal + detail.quantity * detail.product_price
      );
    });

    const formatAddress = (address: Address | null): string | null => {
      if (!address) return null;

      const parts = [
        address.street,
        `#${address.exterior_number}`,
        address.interior_number ? `Int. ${address.interior_number}` : null,
        address.neighborhood,
        `C.P. ${address.postal_code}`,
      ].filter(Boolean);

      return parts.join(", ");
    };

    const transformedOrders: DeliveryOrder[] = typedOrders.map((order) => {
      const user = userMap.get(order.user_id);
      const orderType = orderTypeMap.get(order.sale_order_type);
      const subtotal = orderTotalsMap.get(order.id) || 0;
      const total = subtotal + Number(order.shipping_cost || 0);

      return {
        id: order.id,
        order_number: order.order_number.toString(),
        user_name: user?.full_name || "Cliente",
        user_address: formatAddress(order.addresses),
        user_phone: order.addresses?.phone_number || null,
        status: order.status,
        created_at: order.created_at,
        total,
        delivery_instructions: order.delivery_instructions,
        special_instructions: order.special_instructions,
        order_type_name: orderType?.name || "Pedido",
        shipping_cost: Number(order.shipping_cost || 0),
        delivery_time: Number(order.delivery_time),
        assigned_delivery_time_at: order.assigned_delivery_time_at,
      };
    });

    return transformedOrders;
  } catch (error) {
    console.error(" Error in getDeliveryOrders:", error);
    throw error;
  }
}

// --- Actualizar estado de pedido ---
export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from("sale_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error(" Error updating order status:", error);
      throw new Error("Error al actualizar el estado del pedido");
    }

    return { success: true };
  } catch (error) {
    console.error(" Error in updateOrderStatus:", error);
    throw error;
  }
}

// --- Obtener usuario actual ---
export async function getCurrentUser() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error(" Error getting current user:", error);
      return null;
    }

    return user;
  } catch (error) {
    console.error(" Error in getCurrentUser:", error);
    return null;
  }
}
