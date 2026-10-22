"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OnlineOrder } from "@/lib/actions/sale_order.actions";

// Claves para localStorage
const PENDING_ORDERS_STORAGE_KEY = "pending_online_orders";
const UNSEEN_NOTIFICATIONS_KEY = "unseen_order_notifications";

interface NotificationOrder extends OnlineOrder {
  notificationType?: "payment_confirmed"; // 🔥 Solo notificaciones de pago
}

export function useRealtimeOnlineOrders() {
  const supabase = createClient();
  const [newOrders, setNewOrders] = useState<OnlineOrder[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OnlineOrder[]>([]);
  const [unseenNotifications, setUnseenNotifications] = useState<NotificationOrder[]>([]);

  // Cargar pedidos pendientes y notificaciones no vistas al inicializar
  useEffect(() => {
    // Cargar pedidos pendientes
    const savedPendingOrders = localStorage.getItem(PENDING_ORDERS_STORAGE_KEY);
    if (savedPendingOrders) {
      try {
        const parsed = JSON.parse(savedPendingOrders);
        setPendingOrders(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Error parsing pending orders:", error);
        setPendingOrders([]);
      }
    }

    // Cargar notificaciones no vistas
    const savedUnseenNotifications = localStorage.getItem(UNSEEN_NOTIFICATIONS_KEY);
    if (savedUnseenNotifications) {
      try {
        const parsed = JSON.parse(savedUnseenNotifications);
        setUnseenNotifications(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Error parsing unseen notifications:", error);
        setUnseenNotifications([]);
      }
    }
  }, []);

  // Guardar pedidos pendientes cuando cambien
  useEffect(() => {
    localStorage.setItem(
      PENDING_ORDERS_STORAGE_KEY,
      JSON.stringify(pendingOrders)
    );
  }, [pendingOrders]);

  // Guardar notificaciones no vistas cuando cambien
  useEffect(() => {
    localStorage.setItem(
      UNSEEN_NOTIFICATIONS_KEY,
      JSON.stringify(unseenNotifications)
    );
  }, [unseenNotifications]);

  // Función para mostrar notificación del navegador
  const showBrowserNotification = (title: string, body: string, orderId: string) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body: body,
          icon: "/favicon.ico",
          tag: orderId,
          badge: "/favicon.ico"
        });
      } catch (error) {
        console.warn("No se pudo mostrar la notificación:", error);
        if (navigator.serviceWorker?.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            notification: {
              title: title,
              body: body,
              tag: orderId
            }
          });
        }
      }
    }
  };

  useEffect(() => {
    // console.log("🔔 Iniciando suscripción a pedidos online...");

    const subscription = supabase
      .channel("online_orders_realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sale_orders"
        },
        async (payload) => {
          const order = payload.new;
          const previousOrder = payload.old;

          // 🔥 SOLO procesar si el estado cambió a "Pagado"
          if (order.status === "Pagado" && previousOrder.status !== "Pagado") {
            // console.log("💰 Orden actualizada a Pagado:", order.id, "Anterior estado:", previousOrder.status, "Nuevo estado:", order.status);

            try {
              // Verificar si es una orden ONLINE
              const { data: orderType, error: typeError } = await supabase
                .from("sale_order_types")
                .select("code")
                .eq("id", order.sale_order_type)
                .single();

              if (typeError) {
                console.error("Error obteniendo tipo de orden:", typeError);
                return;
              }

              // console.log("✅ Es una orden ONLINE pagada, procesando...");

              // Obtener información del usuario
              const { data: user, error: userError } = await supabase
                .from("users")
                .select("full_name")
                .eq("id", order.user_id)
                .single();

              // Obtener detalles para información completa
              const { data: orderDetails, error: detailsError } = await supabase
                .from("sale_order_details")
                .select("quantity, product_price")
                .eq("sale_order_id", order.id);

              let totalAmount = 0;
              let itemsCount = 0;
              
              if (!detailsError && orderDetails) {
                totalAmount = orderDetails.reduce((sum, item) => {
                  return sum + (item.quantity * item.product_price);
                }, 0) + (order.shipping_cost || 0);

                itemsCount = orderDetails.reduce((count, item) => {
                  return count + item.quantity;
                }, 0);
              }

              // Obtener información del repartidor asignado si existe
              let assignedDriver = null;
              if (order.assigned_delivery_driver) {
                const { data: driver, error: driverError } = await supabase
                  .from("users")
                  .select("id, full_name, email")
                  .eq("id", order.assigned_delivery_driver)
                  .single();

                if (!driverError && driver) {
                  assignedDriver = {
                    id: driver.id,
                    full_name: driver.full_name,
                    email: driver.email
                  };
                }
              }

              // Crear objeto de orden actualizado PARA NOTIFICACIÓN
              const paymentNotification: NotificationOrder = {
                id: order.id,
                order_number: order.order_number?.toString() || `ORD-${order.id.substring(0, 8)}`,
                user_id: order.user_id,
                user_name: user?.full_name || "Cliente Online",
                status: order.status, 
                created_at: order.created_at,
                items_count: itemsCount,
                total_amount: totalAmount,
                delivery_time: order.delivery_time || undefined,
                assigned_driver: assignedDriver,
                isNew: true,
                notificationTimestamp: new Date().toISOString(),
                assigned_delivery_time_at: order.assigned_delivery_time_at,
                notificationType: "payment_confirmed" 
              };

              // console.log("💰 Notificación de pago creada:", paymentNotification);

              setUnseenNotifications(prev => {
                // Evitar duplicados del mismo tipo para la misma orden
                const existing = prev.find(p => 
                  p.id === paymentNotification.id && 
                  p.notificationType === "payment_confirmed"
                );
                if (existing) {
                  // console.log("📭 Notificación de pago ya existe, omitiendo");
                  return prev;
                }
                return [paymentNotification, ...prev].slice(0, 20); 
              });

              setPendingOrders(prev => 
                prev.map(p => 
                  p.id === order.id 
                    ? { 
                        ...p, 
                        status: "Pagado", 
                      } 
                    : p
                )
              );

              setNewOrders(prev =>
                prev.map(p =>
                  p.id === order.id
                    ? { ...p, status: "Pagado" }
                    : p
                )
              );

              // // Mostrar notificación del navegador para PAGO CONFIRMADO
              // showBrowserNotification(
              //   "📦 Nuevo Pedido Recibido", 
              //   `Orden #${paymentNotification.order_number} - ${paymentNotification.user_name} - Hemos recibido el pago`,
              //   paymentNotification.id
              // );

            } catch (error) {
              console.error("❌ Error procesando actualización de orden:", error);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(status);
      });

    return () => {
      // console.log("🔕 Limpiando suscripción de pedidos online");
      supabase.removeChannel(subscription);
    };
  }, [supabase]);

  // Limpiar notificaciones no vistas cuando el usuario vea la lista
  const clearUnseenNotifications = () => {
    // console.log("👀 Marcando notificaciones como vistas");
    setUnseenNotifications([]);
    localStorage.removeItem(UNSEEN_NOTIFICATIONS_KEY);
  };

  // Limpiar pedidos pendientes
  const clearPendingOrders = () => {
    // console.log("🧹 Limpiando pedidos pendientes");
    setPendingOrders([]);
    localStorage.removeItem(PENDING_ORDERS_STORAGE_KEY);
  };

  // Solicitar permisos de notificación
  const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    } catch (error) {
      console.warn("Error solicitando permisos de notificación:", error);
      return false;
    }
  };

  return { 
    newOrders, 
    pendingOrders,
    unseenNotifications,
    clearNewOrders: () => setNewOrders([]),
    clearPendingOrders,
    clearUnseenNotifications,
    requestNotificationPermission
  };
}