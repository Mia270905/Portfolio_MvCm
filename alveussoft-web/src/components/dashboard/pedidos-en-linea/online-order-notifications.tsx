"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import {
  Bell,
  X,
  Package,
  ShoppingBag,
  ChevronUp,
  ChevronDown,
  Trash2,
  Settings,
} from "lucide-react";

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
  };
  timestamp: string;
  id: string;
  read: boolean;
  type: "payment_confirmed"; 
}

const NOTIFICATIONS_STORAGE_KEY = "online_order_notifications";
const PUSH_PERMISSION_KEY = "push_notification_permission";

export default function OrderNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const { notifications: realtimeNotifications } = useRealtimeOrders();

  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [collapsed, setCollapsed] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [swipeStates, setSwipeStates] = useState<{ [key: string]: number }>({});
  const [isSwiping, setIsSwiping] = useState(false);
  const [pushPermission, setPushPermission] =
    useState<NotificationPermission>("default");
  const [showSettings, setShowSettings] = useState(false);

  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const currentSwipeId = useRef<string | null>(null);

  const isOrderDetailsPage = pathname?.includes("/pedidos_detalles/");

  const getCurrentOrderId = () => {
    if (!isOrderDetailsPage) return null;
    const match = pathname.match(/\/pedidos_detalles\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const currentOrderId = getCurrentOrderId();

  // FILTRAR notificaciones - SOLO PAGOS CONFIRMADOS
  //const paymentNotifications = notifications.filter(n => n.type === "payment_confirmed");
  const paymentNotifications = notifications; 
  console.log("🔔 Notificaciones recibidas:", notifications);
  // Verificar y solicitar permisos para notificaciones push
  useEffect(() => {
    const checkPushPermission = async () => {
      if (!("Notification" in window)) {
        return;
      }

      const savedPermission = localStorage.getItem(
        PUSH_PERMISSION_KEY
      ) as NotificationPermission;

      if (savedPermission && ["granted", "denied"].includes(savedPermission)) {
        setPushPermission(savedPermission);
      } else {
        setPushPermission(Notification.permission);
      }
    };

    checkPushPermission();
  }, []);

  const requestPushPermission = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador no soporta notificaciones push");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      localStorage.setItem(PUSH_PERMISSION_KEY, permission);

      if (permission === "granted") {
        showPushNotification({
          title: "Notificaciones Activadas",
          body: "Ahora recibirás notificaciones cuando los pedidos estén en preparación",
          silent: true,
        });
        setShowSettings(false);
      }
    } catch (error) {
      console.error("Error al solicitar permiso:", error);
    }
  };

  const showPushNotification = (options: {
    title: string;
    body: string;
    orderId?: string;
    silent?: boolean;
  }) => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    try {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.ready
          .then((registration) => {
            registration.showNotification(options.title, {
              body: options.body,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              tag: options.orderId || "order-notification",
              requireInteraction: true,
              silent: options.silent || false,
              data: {
                orderId: options.orderId,
                url: options.orderId
                  ? `/dashboard/ventas/pedidos_en_linea/pedidos_detalles/${options.orderId}`
                  : "/dashboard/ventas/pedidos_en_linea",
              },
            });
          })
          .catch(() => {
            if ("Notification" in window) {
              const notification = new Notification(options.title, {
                body: options.body,
                icon: "/favicon.ico",
                tag: options.orderId || "order-notification",
              });

              notification.onclick = () => {
                window.focus();
                if (options.orderId) {
                  router.push(
                    `/dashboard/ventas/pedidos_en_linea/pedidos_detalles/${options.orderId}`
                  );
                } else {
                  router.push("/dashboard/ventas/pedidos_en_linea");
                }
                notification.close();
              };

              setTimeout(() => notification.close(), 10000);
            }
          });
      } else {
        if ("Notification" in window) {
          const notification = new Notification(options.title, {
            body: options.body,
            icon: "/favicon.ico",
            tag: options.orderId || "order-notification",
          });

          notification.onclick = () => {
            window.focus();
            if (options.orderId) {
              router.push(
                `/dashboard/ventas/pedidos_en_linea/pedidos_detalles/${options.orderId}`
              );
            } else {
              router.push("/dashboard/ventas/pedidos_en_linea");
            }
            notification.close();
          };

          setTimeout(() => notification.close(), 10000);
        }
      }
    } catch (error) {
      console.error("Error mostrando notificación:", error);
    }
  };

  useEffect(() => {
    const savedNotifications = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        setNotifications([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      NOTIFICATIONS_STORAGE_KEY,
      JSON.stringify(notifications)
    );
  }, [notifications]);

  useEffect(() => {
    if (currentOrderId && notifications.length > 0) {
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.order.id === currentOrderId
            ? { ...notification, read: true }
            : notification
        )
      );

      setHighlightedId((prev) =>
        prev &&
        notifications.find((n) => n.id === prev)?.order.id === currentOrderId
          ? null
          : prev
      );
    }
  }, [currentOrderId, notifications]);

  useEffect(() => {
    if (!realtimeNotifications || realtimeNotifications.length === 0) return;

    const newNotifications = realtimeNotifications.filter(
      (realtimeNotif) =>
        !notifications.some(
          (existing) => existing.order.id === realtimeNotif.order.id
        )
    );

    if (newNotifications.length > 0) {
      setNotifications((prev) => {
        const updated = [...newNotifications, ...prev].slice(0, 10);
        return updated;
      });

      setHighlightedId(newNotifications[0].id);

      if (collapsed) {
        setCollapsed(false);
      }

      if (!isOrderDetailsPage) {
        try {
          const audio = new Audio("/sounds/new-order.mp3");
          audio.volume = 0.4;
          audio.play().catch(() => {});
        } catch (error) {
          console.error("Error playing sound:", error);
        }
      }

      newNotifications.forEach((notification) => {
        if (Notification.permission === "granted") {
          showPushNotification({
            title: "Pedido en Preparación",
            body: `Orden #${notification.order.order_number} - Se está preparando`,
            orderId: notification.order.id,
          });
        }
      });
    }
  }, [
    realtimeNotifications,
    isOrderDetailsPage,
    collapsed,
    notifications,
  ]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setHighlightedId(null);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setHighlightedId(null);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setSwipeStates((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setHighlightedId(null);
    setSwipeStates({});
  };

  const handleNotificationClick = (notification: OrderNotification) => {
    markAsRead(notification.id);
    const orderId = notification.order?.id;
    if (orderId) {
      router.push(
        `/dashboard/ventas/pedidos_en_linea/pedidos_detalles/${orderId}`
      );
    }
    if (isMobile) setCollapsed(true);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    currentSwipeId.current = id;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent, id: string) => {
    if (!isSwiping || currentSwipeId.current !== id) return;
    touchCurrentX.current = e.touches[0].clientX;
    const deltaX = touchCurrentX.current - touchStartX.current;
    const swipeDistance = Math.max(-80, Math.min(0, deltaX));
    setSwipeStates((prev) => ({ ...prev, [id]: swipeDistance }));
  };

  const handleTouchEnd = (id: string) => {
    if (!isSwiping) return;
    const currentSwipe = swipeStates[id] || 0;
    if (currentSwipe <= -50) {
      removeNotification(id);
    } else {
      setSwipeStates((prev) => ({ ...prev, [id]: 0 }));
    }
    setIsSwiping(false);
    currentSwipeId.current = null;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalCount = notifications.length;

  const getFilteredNotifications = () => {
    if (!isOrderDetailsPage || !currentOrderId) {
      return notifications;
    }

    return notifications.filter(
      (notification) =>
        notification.order.id !== currentOrderId || notification.read
    );
  };

  const filteredNotifications = getFilteredNotifications();
  const filteredUnreadCount = filteredNotifications.filter(
    (n) => !n.read
  ).length;

  const renderNotificationItem = (n: OrderNotification, swipeOffset = 0) => (
    <div
      key={n.id}
      className={`relative mb-2 rounded-lg overflow-hidden transition-all duration-200 ${
        n.id === highlightedId ? "ring-2 ring-yellow-400" : ""
      } ${
        n.order.id === currentOrderId ? "bg-blue-50 border border-blue-200" : ""
      }`}
    >
      <div
        className={`transition-transform duration-200 cursor-pointer ${
          !n.read && n.order.id !== currentOrderId
            ? "bg-yellow-50 border border-yellow-200 shadow-sm"
            : "bg-gray-50 border border-gray-100"
        }`}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onClick={() => handleNotificationClick(n)}
        onTouchStart={(e) => handleTouchStart(e, n.id)}
        onTouchMove={(e) => handleTouchMove(e, n.id)}
        onTouchEnd={() => handleTouchEnd(n.id)}
      >
        <div className="p-3 flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full flex-shrink-0 ${
                !n.read && n.order.id !== currentOrderId
                  ? "bg-yellow-100"
                  : n.order.id === currentOrderId
                  ? "bg-blue-100"
                  : "bg-green-100"
              }`}
            >
              <Package
                className={`w-4 h-4 ${
                  !n.read && n.order.id !== currentOrderId
                    ? "text-yellow-600"
                    : n.order.id === currentOrderId
                    ? "text-blue-600"
                    : "text-green-600"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-gray-900 text-sm">
                  {n.message}
                </p>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeNotification(n.id);
                  }}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0 p-1 transition-colors ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                Orden #{n.order.order_number || n.order.id.slice(0, 8)}
              </p>
              {n.order.customerInfo?.name && (
                <p className="text-gray-600 text-sm">
                  Cliente: {n.order.customerInfo.name}
                </p>
              )}
              {n.order.total && n.order.total > 0 && (
                <p className="text-gray-600 text-sm font-semibold">
                  Total: ${n.order.total.toFixed(2)}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.timestamp).toLocaleString("es-ES")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isMobile && (
        <div
          className="absolute top-0 right-0 bottom-0 w-20 bg-red-500 flex items-center justify-center transition-transform duration-200"
          style={{ transform: `translateX(${swipeOffset + 80}px)` }}
        >
          <Trash2 className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );

  const PushNotificationSettings = () => (
    <div className="p-4 border-t border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900 text-sm">
          Notificaciones Push
        </h4>
        <button
          onClick={() => setShowSettings(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {pushPermission === "granted" ? (
        <div className="text-center">
          <div className="bg-green-100 text-green-800 text-sm py-2 px-3 rounded-lg mb-3">
            Notificaciones push activadas
          </div>
          <p className="text-xs text-gray-600">
            Recibirás notificaciones cuando los pedidos estén en preparación
          </p>
        </div>
      ) : pushPermission === "denied" ? (
        <div className="text-center">
          <div className="bg-red-100 text-red-800 text-sm py-2 px-3 rounded-lg mb-3">
            Notificaciones push bloqueadas
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Las notificaciones están bloqueadas en tu navegador
          </p>
          <button
            onClick={requestPushPermission}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            Intentar Activar Nuevamente
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Si no funciona, permite las notificaciones manualmente en la
            configuración de tu navegador
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-gray-700 mb-3">
            Activa las notificaciones push para recibir alertas cuando los pedidos estén en preparación
          </p>
          <button
            onClick={requestPushPermission}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
          >
            Activar Notificaciones Push
          </button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="bg-red-600 hover:bg-red-700 rounded-full p-4 shadow-2xl border-2 border-white relative transition-all duration-200"
          >
            <Bell className="w-6 h-6 text-white" />
            {filteredUnreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-yellow-400 text-red-600 text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-white animate-pulse">
                {filteredUnreadCount > 9 ? "9+" : filteredUnreadCount}
              </span>
            )}
          </button>
        </div>

        {!collapsed && (
          <>
            <div
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
              onClick={() => setCollapsed(true)}
            />
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[70vh] flex flex-col animate-in slide-in-from-bottom duration-300">
              <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-2xl flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">Notificaciones de Preparación</h3>
                  <p className="text-red-100 text-sm">
                    {filteredUnreadCount} sin leer •{" "}
                    {filteredNotifications.length} total
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowSettings(!showSettings);
                    }}
                    className="text-red-100 hover:text-white p-1 transition-colors"
                    title="Configuración de notificaciones"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCollapsed(true);
                    }}
                    className="text-red-100 hover:text-white p-1 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 p-3 bg-red-50">
                {filteredUnreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markAllAsRead();
                    }}
                    className="text-xs bg-white text-red-600 hover:bg-red-100 px-3 py-1 rounded-full border border-red-200 transition-colors"
                  >
                    Marcar todas como leídas
                  </button>
                )}
                {filteredNotifications.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearAllNotifications();
                    }}
                    className="text-xs bg-white text-red-600 hover:bg-red-100 px-3 py-1 rounded-full border border-red-200 transition-colors"
                  >
                    Limpiar todo
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No hay notificaciones</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Los pedidos en preparación aparecerán aquí
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((n) =>
                      renderNotificationItem(n, swipeStates[n.id] || 0)
                    )}
                  </div>
                )}
              </div>

              {showSettings && <PushNotificationSettings />}
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div className="fixed top-20 right-4 z-50 max-w-sm w-full">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden transition-all duration-300">
        <div
          className="p-4 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 text-white cursor-pointer flex justify-between items-center hover:bg-red-700 transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          <div>
            <h3 className="font-semibold text-lg">Notificaciones de Preparación</h3>
            <div className="flex items-center gap-2 text-red-100 text-sm">
              <span
                className={
                  filteredUnreadCount > 0 ? "font-semibold text-yellow-300" : ""
                }
              >
                {filteredUnreadCount} sin leer
              </span>
              •<span>{filteredNotifications.length} total</span>
              {pushPermission !== "granted" && (
                <span className="text-yellow-300 text-xs ml-2">🔔</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {filteredUnreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs text-red-100 hover:text-white underline mr-2 transition-colors"
              >
                Marcar todas
              </button>
            )}
            {filteredNotifications.length > 0 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearAllNotifications();
                }}
                className="text-xs text-red-100 hover:text-white underline mr-2 transition-colors"
              >
                Limpiar todo
              </button>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className="text-red-100 hover:text-white p-1 transition-colors"
              title="Configuración de notificaciones"
            >
              <Settings className="w-4 h-4" />
            </button>
            {collapsed ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </div>
        </div>

        <div
          className={`transition-all duration-300 ${
            collapsed ? "max-h-0 opacity-0" : "max-h-96 opacity-100"
          } overflow-hidden`}
        >
          <div className="overflow-y-auto max-h-80 custom-scroll">
            {filteredNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No hay notificaciones</p>
                <p className="text-sm text-gray-400 mt-1">
                  Los pedidos en preparación aparecerán aquí
                </p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filteredNotifications.map((n) => renderNotificationItem(n))}
              </div>
            )}

            {showSettings && <PushNotificationSettings />}
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 8px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}