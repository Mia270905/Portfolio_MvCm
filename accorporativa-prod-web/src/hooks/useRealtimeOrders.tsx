"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type NotificationType = 
  | "payment_confirmed" 
  | "preparing" 
  | "on_the_way" 
  | "delivered" 
  | "cancelled";

interface OrderNotification {
  message: string;
  order: {
    id: string;
    order_number?: string;
    total?: number;
    customerInfo?: { name?: string; email?: string };
    status?: string;
  };
  timestamp: string;
  id: string;
  read: boolean;
  type: "payment_confirmed";
}

const NOTIFIED_ORDERS_KEY = "notified_orders";

export function useRealtimeOrders() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  
  const [notifiedOrders, setNotifiedOrders] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    
    try {
      const saved = localStorage.getItem(NOTIFIED_ORDERS_KEY);
      if (saved) {
        const ordersArray = JSON.parse(saved);
        return new Set(ordersArray);
      }
    } catch (error) {
      return new Set();
    }
    return new Set();
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    try {
      const ordersArray = Array.from(notifiedOrders);
      localStorage.setItem(NOTIFIED_ORDERS_KEY, JSON.stringify(ordersArray));
    } catch (error) {}
  }, [notifiedOrders]);

  useEffect(() => {
    console.log("🔄 Iniciando suscripción a sale_orders...");

    const subscription = supabase
      .channel("public:sale_orders")
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

          if (order.status === "Preparado") {
            return;
          }

          if (order.status === "Pagado" && previousOrder.status !== "Pagado") {
            
            if (notifiedOrders.has(order.id)) {
              return;
            }

            try {
              const { data: orderType, error: typeError } = await supabase
                .from("sale_order_types")
                .select("code")
                .eq("id", order.sale_order_type)
                .single();

              if (typeError) {
                return;
              }

              if (orderType?.code !== "ONLINE") {
                return;
              }

              const { data: user, error: userError } = await supabase
                .from("users")
                .select("full_name, email")
                .eq("id", order.user_id)
                .single();

              const { data: orderDetails, error: detailsError } = await supabase
                .from("sale_order_details")
                .select("quantity, product_price")
                .eq("sale_order_id", order.id);

              let total = 0;
              if (!detailsError && orderDetails) {
                const subtotal = orderDetails.reduce((sum, item) => {
                  return sum + (item.quantity * item.product_price);
                }, 0);
                
                total = subtotal + (order.shipping_cost || 0);
              }

              let orderNumber = order.order_number?.toString();
              if (!orderNumber) {
                orderNumber = `ORD-${order.id.substring(0, 8).toUpperCase()}`;
              }

              const paymentNotification: OrderNotification = {
                id: `payment-${order.id}-${Date.now()}`,
                message: "💰 Pago Confirmado - Pedido listo para preparar",
                order: {
                  id: order.id,
                  order_number: orderNumber,
                  total: total,
                  status: order.status,
                  customerInfo: {
                    name: user?.full_name || "Cliente Online",
                    email: user?.email || "",
                  },
                },
                timestamp: new Date().toISOString(),
                read: false,
                type: "payment_confirmed" 
              };
              
              setNotifications((prev) => {
                const updated = [paymentNotification, ...prev].slice(0, 10);
                return updated;
              });

              setNotifiedOrders(prev => {
                const newSet = new Set(prev);
                newSet.add(order.id);
                return newSet;
              });

            } catch (error) {}
          }
        }
      )
      .subscribe((status) => {
        console.log(status);
      });

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase, notifiedOrders]);

  return { notifications };
}