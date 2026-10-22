"use server";

import { createClient } from "@/lib/supabase/server";

interface SaleItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OnlineOrder {
  id: string;
  order_number: string;
  user_id: string;
  user_name: string;
  status: string;
  created_at: string;
  items_count: number;
  total_amount: number;
  delivery_time?: number;
  assigned_driver?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
  isNew?: boolean;
  notificationTimestamp?: string;
  assigned_delivery_time_at: string;
}

type OrderStatus =
  | "Pendiente de pago"
  | "Pagado"
  | "Preparación"
  | "En camino"
  | "Entregado"
  | "Cancelado";

export interface SaleOrderDetail {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  product_price: number;
  product_quantity: number;
}

export interface SaleOrder {
  id: string;
  order_number: number;
  sale_order_type: string;
  status: OrderStatus;
  created_at: string;
  total: number;
  shipping_cost: number;
  special_instructions?: string | null;
  delivery_instructions?: string | null;
  details: SaleOrderDetail[];
}

export interface SaleOrderDetailItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  quantity: number;
  product_price: number;
}

export interface SaleOrderDetailS {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  order_type: string;
  user_id: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  details: SaleOrderDetailItem[];
  special_instructions?: string;
  delivery_instructions?: string;
}

interface ReorderResult {
  success: boolean;
  availableProducts?: Array<{
    product_id: string;
    product_name: string;
    product_image: string;
    product_price: number;
    requested_quantity: number;
    available_quantity: number;
    stock: number;
  }>;
  insufficientProducts?: Array<{
    product_id: string;
    name: string;
    needed: number;
    available: number;
  }>;
}

export async function createSaleOrder(
  items: SaleItem[],
  shippingCost: number,
  specialInstructions: string | null = null,
  deliveryInstructions: string | null = null,
  addressId: string | null = null
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("No se pudo obtener el cliente autenticado");
  }

  const clientId = user.id;

  const { data: orderType, error: typeError } = await supabase
    .from("sale_order_types")
    .select("id")
    .eq("code", "ONLINE")
    .single();

  if (typeError || !orderType) {
    throw new Error("No se encontró el tipo de orden 'ONLINE'");
  }

  const orderTypeId = orderType.id;

  const { data: order, error: orderError } = await supabase
    .from("sale_orders")
    .insert([
      {
        sale_order_type: orderTypeId,
        user_id: clientId,
        status: "Pendiente de pago",
        shipping_cost: shippingCost,
        special_instructions: specialInstructions,
        delivery_instructions: deliveryInstructions,
        address: addressId,
      },
    ])
    .select("id, order_number")
    .single();

  if (orderError)
    throw new Error("Error creando la orden: " + orderError.message);

  const orderId = order.id;
  const orderNumber = order.order_number;

  // Insertar los detalles de la orden
  const { error: detailsError } = await supabase
    .from("sale_order_details")
    .insert(
      items.map((item) => ({
        product_id: item.id,
        sale_order_id: orderId,
        quantity: item.quantity,
        product_price: item.price,
      }))
    );

  if (detailsError)
    throw new Error("Error agregando detalles: " + detailsError.message);

  // Actualizar stock
  for (const item of items) {
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("quantity")
      .eq("id", item.id)
      .single();

    if (productError)
      throw new Error("Error obteniendo producto: " + productError.message);

    const newStock = (product.quantity || 0) - item.quantity;
    if (newStock < 0)
      throw new Error(`Stock insuficiente para el producto ${item.name}`);

    const { error: updateError } = await supabase
      .from("products")
      .update({ quantity: newStock })
      .eq("id", item.id);

    if (updateError)
      throw new Error("Error actualizando stock: " + updateError.message);
  }

  return { success: true, orderId, orderNumber };
}

export async function markOrderAsPayed(orderId: string) {
  const supabase = await createClient();

  // Asegurarnos que no tenga espacios extra
  const trimmedOrderId = orderId.trim();

  const { data, error } = await supabase
    .from("sale_orders")
    .update({ status: "Pagado" })
    .eq("id", trimmedOrderId)
    .select();

  if (error) {
    console.error("Error actualizando la orden:", error);
    throw new Error(error.message);
  }

  if (!data) {
    console.warn("No se encontró la orden con id:", trimmedOrderId);
    return false;
  }
  return true;
}

export async function markOrderAsPrepared(orderId: string) {
  const supabase = await createClient();

  // Asegurarnos que no tenga espacios extra
  const trimmedOrderId = orderId.trim();

  const { data, error } = await supabase
    .from("sale_orders")
    .update({ status: "Preparación" })
    .eq("id", trimmedOrderId)
    .select();

  if (error) {
    console.error("Error actualizando la orden:", error);
    throw new Error(error.message);
  }

  if (!data) {
    console.warn("No se encontró la orden con id:", trimmedOrderId);
    return false;
  }
  return true;
}

export async function getSaleOrders(): Promise<SaleOrder[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("No se pudo obtener el usuario autenticado");
  }

  const { data: orders, error: ordersError } = await supabase
    .from("sale_orders")
    .select(
      `
      id,
      order_number,
      status,
      created_at,
      shipping_cost,
      special_instructions,
      delivery_instructions,
      sale_order_type:sale_order_types (
        name
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (ordersError) {
    console.error("Error obteniendo órdenes:", ordersError);
    throw new Error("Error al obtener las órdenes de compra");
  }

  if (!orders || orders.length === 0) {
    return [];
  }

  const orderIds = orders.map((order) => order.id);

  const { data: details, error: detailsError } = await supabase
    .from("sale_order_details")
    .select(
      `
      id,
      sale_order_id,
      product_id,
      quantity,
      product_price,
      products (
        name,
        image_url,
        quantity
      )
    `
    )
    .in("sale_order_id", orderIds);

  if (detailsError) {
    console.error("Error obteniendo detalles:", detailsError);
    throw new Error("Error al obtener los detalles de las órdenes");
  }

  const saleOrders: SaleOrder[] = orders.map((order) => {
    const orderDetails =
      details?.filter((detail) => detail.sale_order_id === order.id) || [];

    const mappedDetails: SaleOrderDetail[] = orderDetails.map((detail) => {
      const productArray = Array.isArray(detail.products)
        ? detail.products
        : [detail.products];
      const product = productArray[0] || {};

      return {
        id: detail.id,
        product_id: detail.product_id,
        product_name: product.name || "Producto sin nombre",
        product_image: product.image_url || "/placeholder.svg",
        quantity: Number(detail.quantity),
        product_price: Number(detail.product_price),
        product_quantity: Number(product.quantity),
      };
    });

    const total = mappedDetails.reduce(
      (sum, detail) => sum + detail.quantity * detail.product_price,
      0
    );

    const typeArray = Array.isArray(order.sale_order_type)
      ? order.sale_order_type
      : [order.sale_order_type];
    const orderType = typeArray[0] || {};

    return {
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      created_at: order.created_at,
      sale_order_type: orderType.name || "Desconocido",
      total,
      shipping_cost: order.shipping_cost || 0,
      special_instructions: order.special_instructions,
      delivery_instructions: order.delivery_instructions,
      details: mappedDetails,
    };
  });

  return saleOrders;
}

export async function getSaleOrderDetail(
  orderId: string
): Promise<SaleOrderDetailS | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("No se pudo obtener el usuario autenticado");
  }

  // Obtener la orden específica con nuevos campos
  const { data: order, error: orderError } = await supabase
    .from("sale_orders")
    .select(
      `id,
      order_number,
      status,
      created_at,
      user_id,
      shipping_cost,
      special_instructions,
      delivery_instructions,
      sale_order_types ( name ),
      address,
      delivery_time,
      assigned_delivery_time_at`
    )
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (orderError || !order) {
    console.error("Error obteniendo orden:", orderError);
    return null;
  }

  // Obtener los detalles de la orden
  const { data: details, error: detailsError } = await supabase
    .from("sale_order_details")
    .select(
      `id,
      product_id,
      quantity,
      product_price,
      products (
        name,
        image_url
      )`
    )
    .eq("sale_order_id", orderId);

  if (detailsError) {
    console.error("Error obteniendo detalles:", detailsError);
    throw new Error("Error al obtener los detalles de la orden");
  }

  const mappedDetails: SaleOrderDetailItem[] = (details || []).map((detail) => {
    const product = Array.isArray(detail.products)
      ? detail.products[0]
      : detail.products;

    return {
      id: detail.id,
      product_id: detail.product_id,
      product_name: product?.name || "Producto sin nombre",
      product_image: product?.image_url || "/placeholder.svg",
      quantity: detail.quantity,
      product_price: detail.product_price,
    };
  });

  const subtotal = mappedDetails.reduce(
    (sum, detail) => sum + detail.quantity * detail.product_price,
    0
  );
  const shippingCost = Number(order.shipping_cost) || 0;
  const total = subtotal + shippingCost;

  // 5) Tipo de orden
  const orderType =
    Array.isArray(order.sale_order_types) && order.sale_order_types.length > 0
      ? order.sale_order_types[0].name
      : order.sale_order_types[0]?.name || "Desconocido";

  // 6) Extraer addressId de order.addresses (soporta id string, array, o objeto)
  const extractAddressId = (addressesField: any): string | null => {
    if (!addressesField) return null;
    if (typeof addressesField === "string") return addressesField;
    if (Array.isArray(addressesField) && addressesField.length > 0) {
      const first = addressesField[0];
      if (!first) return null;
      if (typeof first === "object" && first.id) return first.id;
      if (typeof first === "string") return first;
    }
    if (typeof addressesField === "object" && addressesField.id)
      return addressesField.id;
    return null;
  };

  const addressId = extractAddressId(order.address);

  // 7) Obtener registro de addresses si existe addressId
  let addressObj: {
    postal_code: string;
    neighborhood: string;
    street: string;
    exterior_number: string;
    interior_number?: string | null;
    phone_number?: string | null;
  } | null = null;

  if (addressId) {
    const { data: addressRow, error: addressError } = await supabase
      .from("addresses")
      .select(
        `id, postal_code, neighborhood, street, exterior_number, interior_number, phone_number`
      )
      .eq("id", addressId)
      .single();

    if (addressError) {
      console.warn(
        "No se encontró la dirección con id:",
        addressId,
        addressError
      );
      addressObj = null;
    } else {
      addressObj = {
        postal_code: addressRow.postal_code,
        neighborhood: addressRow.neighborhood,
        street: addressRow.street,
        exterior_number: addressRow.exterior_number,
        interior_number: addressRow.interior_number ?? null,
        phone_number: addressRow.phone_number ?? null,
      };
    }
  }

  return {
    id: order.id,
    order_number: order.order_number,
    status: order.status,
    created_at: order.created_at,
    order_type: orderType || "Desconocido",
    user_id: order.user_id,
    subtotal,
    shipping_cost: shippingCost,
    total,
    special_instructions: order.special_instructions,
    delivery_instructions: order.delivery_instructions,
    delivery_time: order.delivery_time ?? null,
    assigned_delivery_time_at: order.assigned_delivery_time_at ?? null,
    details: mappedDetails,
    address: addressObj,
  } as unknown as SaleOrderDetailS; // casteo final para forzar compatibilidad con tu tipo actual
}
/**
 * Obtener todos los pedidos en línea
 */
export async function getOnlineOrders(): Promise<OnlineOrder[]> {
  const supabase = await createClient();

  const { data: orders, error } = await supabase
    .from("sale_orders")
    .select(
      `id,
      order_number,
      user_id,
      status,
      created_at,
      shipping_cost,
      special_instructions,
      delivery_instructions,
      assigned_delivery_time_at,
      address (
        postal_code,
        neighborhood,
        street,
        exterior_number,
        interior_number,
        phone_number
      ),
      delivery_time,
      assigned_delivery_driver,
      sale_order_type (code, name),
      sale_order_details (
        id,
        product_id,
        quantity,
        product_price
      ),
      users!purchase_orders_user_id_fkey (id, full_name, email),
      assigned_driver:users!sale_orders_assigned_delivery_driver_fkey (id, full_name, email)
    `
    )
    .eq("sale_order_type.code", "ONLINE")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching online orders:", error);
    return [];
  }

  return (orders || []).map((order: any) => {
    const items_count = order.sale_order_details?.length || 0;
    const total_amount =
      order.sale_order_details?.reduce(
        (sum: number, item: any) =>
          sum + (item.quantity * item.product_price || 0),
        0
      ) || 0;

    const assigned_driver = order.assigned_driver
      ? {
          id: order.assigned_driver.id,
          full_name: order.assigned_driver.full_name,
          email: order.assigned_driver.email,
        }
      : null;

    return {
      id: order.id,
      order_number: order.order_number || `ORD-${order.id.slice(0, 8)}`,
      user_id: order.user_id,
      user_name: order.users?.full_name || "Cliente",
      status: order.status || "Preparación",
      created_at: order.created_at,
      delivery_time: order.delivery_time || 0,
      items_count,
      total_amount,
      assigned_driver,
      assigned_delivery_time_at: order.assigned_delivery_time_at,
    };
  });
}

/**
 * Obtener detalles de un pedido específico
 */
export async function getSaleOrderDetails(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sale_order_details")
    .select(
      `
      id,
      product_id,
      quantity,
      product_price,
      products (name)
    `
    )
    .eq("sale_order_id", orderId);

  if (error) {
    console.error("Error fetching order details:", error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    name: item.products?.name || "Producto desconocido",
    quantity: item.quantity,
    price: item.product_price,
  }));
}

/**
 * Obtener detalles completos de un pedido específico con toda la información
 */
export async function getFullOrderDetails(orderId: string) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("sale_orders")
    .select(
      `
      id,
      order_number,
      user_id,
      status,
      created_at,
      shipping_cost,
      special_instructions,
      delivery_instructions,
      delivery_time,
      assigned_delivery_driver,
      sale_order_type (code, name),
      sale_order_details (
        id,
        product_id,
        quantity,
        product_price,
        products (
          id,
          code,
          name,
          description,
          image_url
        )
      ),
      users!purchase_orders_user_id_fkey (id, full_name, email),
      assigned_driver:users!sale_orders_assigned_delivery_driver_fkey (id, full_name, email)
    `
    )
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching full order details:", error);
    return null;
  }

  if (!order) return null;

  const details = (order.sale_order_details || []).map((item: any) => ({
    id: item.id,
    product_id: item.product_id,
    product_code: item.products?.code || "N/A", 
    product_name: item.products?.name || "Producto desconocido",
    product_description: item.products?.description || "",
    product_image: item.products?.image_url || null,
    quantity: item.quantity,
    product_price: item.product_price,
  }));

  const subtotal = details.reduce(
    (sum, item) => sum + item.quantity * item.product_price,
    0
  );

  const shipping = order.shipping_cost || 0;
  const total = subtotal + shipping;

  const user = Array.isArray(order.users) ? order.users[0] : order.users;
  const orderType = Array.isArray(order.sale_order_type)
    ? order.sale_order_type[0]
    : order.sale_order_type;

  const assignedDriver = Array.isArray(order.assigned_driver)
    ? order.assigned_driver[0]
    : order.assigned_driver;

  return {
    id: order.id,
    order_number: order.order_number || `ORD-${order.id.slice(0, 8)}`,
    user_id: order.user_id,
    user_name: user?.full_name || "Cliente",
    user_email: user?.email,
    status: order.status || "Preparación",
    created_at: order.created_at,
    shipping_cost: shipping,
    special_instructions: order.special_instructions,
    delivery_instructions: order.delivery_instructions,
    delivery_time: order.delivery_time || 0,
    order_type_name: orderType?.name || "Pedido en línea",
    assigned_driver: assignedDriver
      ? {
          id: assignedDriver.id,
          full_name: assignedDriver.full_name,
          email: assignedDriver.email,
        }
      : null,
    details,
    subtotal,
    total,
  };
}

export async function updateDeliveryTime(
  orderId: string,
  deliveryMinutes: number
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sale_orders")
    .update({
      delivery_time: deliveryMinutes,
      assigned_delivery_time_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .select("id, delivery_time, status, assigned_delivery_time_at, status");

  if (error) {
    console.error("Error actualizando tiempo de entrega:", error);
    throw new Error(error.message);
  }

  return data?.[0] || null;
}

//-------------------------------------------------------------------FUNCIONES DE REPARTIDOR-------------------------------------------------------------------
export interface DeliveryDriver {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
}

/**
 * Obtener repartidores disponibles
 */
export async function getDeliveryDrivers(): Promise<DeliveryDriver[]> {
  const supabase = await createClient();

  // Primero, obtén el perfil de repartidor correcto
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("code", "delivery_driver")
    .single();

  if (profileError || !profile) {
    console.error("Error fetching delivery driver profile:", profileError);
    return [];
  }

  // Luego obtén los usuarios con ese perfil
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      id,
      full_name,
      email,
      profile_id
    `
    )
    .eq("active", true)
    .eq("profile_id", profile.id);

  if (error) {
    console.error("Error fetching delivery drivers:", error);
    return [];
  }

  return (data || []).map((user: any) => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
  }));
}
/**
 * Obtener el repartidor asignado a una orden
 */
export async function getAssignedDriver(orderId: string) {
  const supabase = await createClient();

  const { data: order, error } = await supabase
    .from("sale_orders")
    .select(
      `
      assigned_delivery_driver,
      users!sale_orders_assigned_delivery_driver_fkey (
        id,
        full_name,
        email
      )
    `
    )
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching assigned driver:", error);
    return null;
  }

  if (!order.assigned_delivery_driver) {
    return null;
  }

  const user = Array.isArray(order.users) ? order.users[0] : order.users;

  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
  };
}

/**
 * Asignar repartidor a una orden
 */
export async function assignDriverToOrder(orderId: string, driverId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sale_orders")
    .update({
      assigned_delivery_driver: driverId,
    })
    .eq("id", orderId).select(`
      id,
      assigned_delivery_driver,
      users!sale_orders_assigned_delivery_driver_fkey (
        id,
        full_name,
        email
      )
    `);

  if (error) {
    console.error("Error assigning driver:", error);
    throw new Error(error.message);
  }

  const order = data?.[0];
  const user = order
    ? Array.isArray(order.users)
      ? order.users[0]
      : order.users
    : null;

  return {
    id: user?.id,
    full_name: user?.full_name,
    email: user?.email,
  };
}

/**
 * Quitar repartidor asignado a una orden
 */
export async function removeDriverFromOrder(orderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sale_orders")
    .update({
      assigned_delivery_driver: null,
    })
    .eq("id", orderId)
    .select();

  if (error) {
    console.error("Error removing driver:", error);
    throw new Error(error.message);
  }

  return data?.[0] || null;
}
export async function reorderSaleOrder(
  orderId: string
): Promise<ReorderResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("No se pudo obtener el cliente autenticado");
  }

  // Obtener la orden original con sus detalles y las price_lists actuales
  const { data: originalOrder, error: orderError } = await supabase
    .from("sale_orders")
    .select(
      `id,
      shipping_cost,
      special_instructions,
      delivery_instructions,
      address,
      sale_order_type,
      sale_order_details (
        product_id,
        quantity,
        product_price,
        products (
          id,
          name,
          quantity,
          image_url,
          cost_price,
          price_lists:products_price_lists(
            price_list_id,
            price,
            price_list:price_lists(
              code
            )
          )
        )
      )
    `
    )
    .eq("id", orderId)
    .eq("user_id", user.id)
    .single();

  if (orderError || !originalOrder) {
    throw new Error("No se encontró la orden original");
  }

  const availableProducts: Array<{
    product_id: string;
    product_name: string;
    product_image: string;
    product_price: number;
    requested_quantity: number;
    available_quantity: number;
    stock: number;
  }> = [];

  const insufficientProducts: Array<{
    product_id: string;
    name: string;
    needed: number;
    available: number;
  }> = [];

  for (const detail of originalOrder.sale_order_details) {
    const product = Array.isArray(detail.products)
      ? detail.products[0]
      : detail.products;
    const availableQuantity = product?.quantity || 0;
    const neededQuantity = detail.quantity;

    // Buscar el precio actual de la lista default
    const defaultPrice = product?.price_lists?.find(
      (pl: any) => pl.price_list?.code === "default"
    )?.price;

    // Usar el precio actual de la lista default o el precio original de la orden como fallback
    const currentProductPrice = defaultPrice || detail.product_price;

    if (availableQuantity > 0) {
      // Hay al menos algo de stock disponible
      availableProducts.push({
        product_id: detail.product_id,
        product_name: product?.name || "Producto desconocido",
        product_image: product?.image_url || "/placeholder.svg",
        product_price: currentProductPrice,
        requested_quantity: neededQuantity,
        available_quantity: Math.min(availableQuantity, neededQuantity),
        stock: availableQuantity,
      });

      // Si no hay suficiente para completar el pedido, agregarlo a insuficientes
      if (availableQuantity < neededQuantity) {
        insufficientProducts.push({
          product_id: detail.product_id,
          name: product?.name || "Producto desconocido",
          needed: neededQuantity,
          available: availableQuantity,
        });
      }
    } else {
      // No hay stock disponible
      insufficientProducts.push({
        product_id: detail.product_id,
        name: product?.name || "Producto desconocido",
        needed: neededQuantity,
        available: 0,
      });
    }
  }

  // Si hay productos sin suficiente inventario, retornar con información detallada
  if (insufficientProducts.length > 0) {
    return {
      success: false,
      availableProducts,
      insufficientProducts,
    };
  }

  return {
    success: true,
    availableProducts,
  };
}
