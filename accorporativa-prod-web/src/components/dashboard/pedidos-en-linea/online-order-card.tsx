import {
  Package,
  Calendar,
  User,
  Hash,
  MoreVertical,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
  UserCheck,
  BanknoteArrowUp
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { OnlineOrder } from "@/lib/actions/sale_order.actions";
import { useOnlineOrderActions } from "@/components/dashboard/pedidos-en-linea/online-order-actions";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface OnlineOrderCardProps {
  order: OnlineOrder;
  viewMode: "grid" | "list";
  userPermissions?: string[];
}

export function OnlineOrderCard({
  order,
  viewMode,
  userPermissions = [],
}: OnlineOrderCardProps) {
  const { handleViewDetails, handleEdit } = useOnlineOrderActions();
  const canUpdateOrders = userPermissions.includes("update:online_orders");

  // Formatear fecha
  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));

  // Tiempo transcurrido desde que llegó el pedido
  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: es,
      });
    } catch (error) {
      return "Fecha no disponible";
    }
  };

  const isOrderOverdue = () => {
    if (order.status === "Entregado" || order.status === "Cancelado") return false;
    
    if (!order.delivery_time || order.delivery_time <= 0) return false;

    const orderDate = new Date(order.assigned_delivery_time_at);
    console.log(order.assigned_delivery_time_at)
    const currentTime = new Date();
    const elapsedMinutes = Math.floor(
      (currentTime.getTime() - orderDate.getTime()) / (1000 * 60)
    );

    return elapsedMinutes > order.delivery_time;
  };

  // Formatear moneda
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);

  // Badge según estado con colores e íconos
  const getStatusConfig = (status: string) => {
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
        icon: React.ReactNode;
        color: string;
      }
    > = {
      "Pendiente de pago": {
        label: "Pendiente de pago",
        variant: "secondary",
        icon: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />,
        color: "text-grey-700 bg-grey-100 border-grey-300",
      },
      Preparación: {
        label: "Preparación",
        variant: "secondary",
        icon: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />,
        color: "text-yellow-700 bg-yellow-100 border-yellow-300",
      },
      Pagado: {
        label: "Pagado",
        variant: "secondary",
        icon: <BanknoteArrowUp className="w-4 h-4" />,
        color: "bg-orange-50 text-orange-700 border-orange-200",
    },
      "En camino": {
        label: "En camino",
        variant: "default",
        icon: <Truck className="w-3 h-3 sm:w-4 sm:h-4" />,
        color: "text-blue-700 bg-blue-100 border-blue-300",
      },
      Entregado: {
        label: "Entregado",
        variant: "outline",
        icon: <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
        color: "text-green-700 bg-green-100 border-green-300",
      },
      Cancelado: {
        label: "Cancelado",
        variant: "destructive",
        icon: <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
        color: "text-red-700 bg-red-100 border-red-300",
      },
    };
    return (
      statusConfig[status] || {
        label: status,
        variant: "outline",
        icon: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />,
        color: "text-gray-700 bg-gray-100 border-gray-300",
      }
    );
  };

  const statusConfig = getStatusConfig(order.status);
  const isOverdue = isOrderOverdue();

  const shouldShowDeliveryTime =
    order.delivery_time != null && order.delivery_time > 0;

  return (
    <Card
      className="p-4 sm:p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 cursor-pointer"
      onClick={() => handleViewDetails(order)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 space-y-4">
          {/* Header - Reorganizado para móvil */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            {/* Número de orden - Ahora ocupa todo el ancho en móvil */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Orden
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 font-mono tracking-tight break-all">
                {order.order_number}
              </h3>
            </div>

            {/* Estado, tiempo estimado y repartidor - Ahora en línea horizontal en móvil también */}
            <div className="flex flex-col items-start sm:items-end gap-2">
              <div
                className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-full border-2 text-xs sm:text-sm font-semibold ${statusConfig.color}`}
              >
                {statusConfig.icon}
                <span>{statusConfig.label}</span>
              </div>

              {/* Contenedor para repartidor y tiempo - Ahora en fila tanto en móvil como escritorio */}
              <div className="flex flex-row items-center gap-2">
                {/* REPARTIDOR ASIGNADO - Siempre a la izquierda del tiempo estimado */}
                {order.assigned_driver && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                    <UserCheck className="w-3 h-3" />
                    <span className="hidden xs:inline">Repartidor</span>
                    <span className="xs:hidden">Rep. asignado</span>
                  </div>
                )}

                {/* Tiempo estimado de entrega */}
                {shouldShowDeliveryTime && (
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                    <Clock className="w-3 h-3" />
                    <span>{order.delivery_time} min</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información del cliente - Rediseñada para móvil */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="font-medium text-xs sm:text-sm">Cliente:</span>
              <span className="text-gray-900 text-sm truncate">{order.user_name}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="font-medium text-xs sm:text-sm">Recibido:</span>
              <span className="text-gray-900 text-xs sm:text-sm">
                {formatDate(order.created_at)}
              </span>
            </div>

            <div
              className={`flex items-center gap-2 text-xs rounded px-2 py-1 border ${
                isOverdue && order.status !== "Entregado" && order.status !== "Cancelado"
                  ? "text-red-700 bg-red-100 border-red-300 font-medium"
                  : "text-gray-500 bg-white border-gray-300"
              }`}
            >
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Llegó {getTimeAgo(order.created_at)}</span>
              {isOverdue && order.status !== "Entregado" && order.status !== "Cancelado" && (
                <span className="ml-1 flex-shrink-0">• Entrega atrasada</span>
              )}
            </div>
          </div>

          {/* Información del pedido y monto - Mejor organizado en móvil */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Package className="w-4 h-4" />
                <span className="text-sm">
                  <strong className="text-gray-900">{order.items_count}</strong>{" "}
                  producto{order.items_count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-900">
              {formatCurrency(order.total_amount || 0)}
            </div>
          </div>
        </div>

        {/* Acciones - Reposicionado para móvil */}
        {canUpdateOrders && (
          <div className="flex justify-end sm:flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                  <MoreVertical size={16} className="text-gray-500 sm:w-4 sm:h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                className="w-40 sm:w-48 p-2 bg-white border border-gray-200 rounded-lg shadow-lg"
                align="end"
              >
                <div className="space-y-1">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-blue-50 rounded-md transition-colors"
                    onClick={() => handleViewDetails(order)}
                  >
                    <Package className="w-3 h-3 sm:w-4 sm:h-4" />
                    Ver detalles
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    onClick={() => handleEdit(order)}
                  >
                    <Truck className="w-3 h-3 sm:w-4 sm:h-4" />
                    Actualizar estado
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>
    </Card>
  );
}