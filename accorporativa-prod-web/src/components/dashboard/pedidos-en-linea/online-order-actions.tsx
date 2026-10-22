"use client";

import { useRouter } from "next/navigation";
import { OnlineOrder } from "@/lib/actions/sale_order.actions";

interface OnlineOrderActionsProps {
  order: OnlineOrder;
  onEdit?: (order: OnlineOrder) => void;
  onViewDetails?: (order: OnlineOrder) => void;
}

export function useOnlineOrderActions() {
  const router = useRouter();

  const handleViewDetails = (order: OnlineOrder) => {
    // Navegar a la página de detalles
    router.push(`/dashboard/ventas/pedidos_en_linea/pedidos_detalles/${order.id}`);
  };

  const handleEdit = (order: OnlineOrder) => {
    // Navegar a la página de edición
    router.push(`/online-orders/${order.id}/edit`);
  };

  return {
    handleViewDetails,
    handleEdit
  };
}