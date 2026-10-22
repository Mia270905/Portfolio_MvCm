"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type NotificationType = 
  | "payment_confirmed" 
  | "preparing" 
  | "on_the_way" 
  | "delivered" 
  | "cancelled";

export function usePushNotifications() {
  const supabase = createClient();

  // Obtener ícono para notificación
  const getNotificationIcon = (type: NotificationType): string => {
    switch (type) {
      case "payment_confirmed": return "💰";
      case "preparing": return "👨‍🍳";
      case "on_the_way": return "🚚";
      case "delivered": return "✅";
      case "cancelled": return "❌";
      default: return "📦";
    }
  };

  // Obtener título y mensaje según el tipo
  const getNotificationContent = (type: NotificationType, orderNumber: string, userName: string) => {
    switch (type) {
      case "payment_confirmed":
        return {
          title: "Pagado",
          body: `Orden #${orderNumber} - ${userName} - ¡Hemos recibido tu pago!`
        };
      case "preparing":
        return {
          title: "Preparación",
          body: `Orden #${orderNumber} - ${userName} - Se está preparando`
        };
      case "on_the_way":
        return {
          title: "En Camino",
          body: `Orden #${orderNumber} - ${userName} - En reparto`
        };
      case "delivered":
        return {
          title: "Entregado",
          body: `Orden #${orderNumber} - ${userName} - Entregado exitosamente`
        };
      case "cancelled":
        return {
          title: "Cancelado",
          body: `Orden #${orderNumber} - ${userName} - Pedido cancelado`
        };
      default:
        return {
          title: "Actualización",
          body: `Orden #${orderNumber} - ${userName} - Estado actualizado`
        };
    }
  };

  // Función para mostrar notificación push
  const showPushNotification = (title: string, body: string, orderId: string, type: NotificationType) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    // Solo mostrar si tenemos permiso
    if (Notification.permission === "granted") {
      try {
        const icon = getNotificationIcon(type);
        
        // Notificación del navegador
        const notification = new Notification(`${icon} ${title}`, {
          body: body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: `${type}-${orderId}`,
          requireInteraction: true,
        });

        // Cuando se hace clic en la notificación
        notification.onclick = () => {
          window.focus();
          // Redirigir a la página de detalles del pedido
          const orderUrl = `/historial/order/${orderId}`;
          window.location.href = orderUrl;
          notification.close();
        };

        // Cerrar automáticamente después de 10 segundos
        setTimeout(() => notification.close(), 10000);

      } catch (error) {
        console.warn("No se pudo mostrar la notificación:", error);
      }
    }
  };

  // Función para cambiar el título de la pestaña
  const showTabNotification = (hasNotifications: boolean) => {
    const originalTitle = document.title;
    
    if (hasNotifications) {
      // Alternar entre el título original y el título con notificación
      if (!document.title.includes('🔔')) {
        document.title = `🔔 ${originalTitle}`;
      }
    } else {
      // Restaurar título original
      document.title = originalTitle.replace('🔔 ', '');
    }
  };

  useEffect(() => {
    const subscription = supabase
      .channel("global_order_notifications")
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

          // PRIMERO VERIFICAR SI HAY USUARIO AUTENTICADO
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            // console.log("Usuario no autenticado, omitiendo notificación");
            return;
          }

          // VERIFICAR CRÍTICO: Que la orden pertenezca al usuario autenticado
          if (order.user_id !== user.id) {
            // console.log("Orden no pertenece al usuario autenticado, omitiendo notificación");
            return;
          }

          // Solo procesar si el estado cambió
          if (order.status !== previousOrder.status) {
            let notificationType: NotificationType | null = null;

            // Determinar el tipo de notificación
            if (order.status === "Pagado" && previousOrder.status !== "Pagado") {
              notificationType = "payment_confirmed";
            } else if (order.status === "Preparación" && previousOrder.status !== "Preparación") {
              notificationType = "preparing";
            } else if (order.status === "En camino" && previousOrder.status !== "En camino") {
              notificationType = "on_the_way";
            } else if (order.status === "Entregado" && previousOrder.status !== "Entregado") {
              notificationType = "delivered";
            } else if (order.status === "Cancelado" && previousOrder.status !== "Cancelado") {
              notificationType = "cancelled";
            }

            if (notificationType) {
              try {
                // Verificar si es una orden ONLINE
                const { data: orderType, error: typeError } = await supabase
                  .from("sale_order_types")
                  .select("code")
                  .eq("id", order.sale_order_type)
                  .single();

                if (typeError || !orderType) {
                  return;
                }

                const { data: userInfo, error: userError } = await supabase
                  .from("users")
                  .select("full_name")
                  .eq("id", user.id) 
                  .single();

                const orderNumber = order.order_number 
                  ? order.order_number.toString()
                  : `ORD-${order.id.substring(0, 8)}`;

                const userName = userInfo?.full_name || "Cliente";

                const { title, body } = getNotificationContent(
                  notificationType, 
                  orderNumber, 
                  userName
                );
                
                showPushNotification(title, body, order.id, notificationType);

                showTabNotification(true);

                try {
                  const audio = new Audio("/sounds/notification.mp3");
                  audio.volume = 0.3;
                  audio.play().catch(() => {});
                } catch (error) {
                  console.log("Sonido de notificación no disponible");
                }

                // Quitar la notificación de la pestaña después de 5 segundos
                setTimeout(() => {
                  showTabNotification(false);
                }, 5000);

              } catch (error) {
                console.error("❌ Error procesando notificación:", error);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase]);

  // Función para solicitar permisos
  const requestNotificationPermission = async (): Promise<boolean> => {
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
    requestNotificationPermission
  };
}