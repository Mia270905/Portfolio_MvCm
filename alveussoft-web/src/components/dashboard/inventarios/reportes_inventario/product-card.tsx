import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { InventoryProduct } from "@/lib/actions/inventory_reports.actions";

interface ProductCardProps {
  product: InventoryProduct;
  formatCurrency: (value: number) => string;
}

export const ProductCard = ({ product, formatCurrency }: ProductCardProps) => {
  return (
    <Card className="p-4 space-y-3 bg-custom-bg-primary border-custom-border hover:border-custom-accent-primary/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm leading-tight truncate text-custom-text-primary">
            {product.name}
          </h3>
          <p className="text-xs text-custom-text-secondary mt-1">
            {product.code}{product.bar_code && ` • ${product.bar_code}`}
          </p>
        </div>
        <div className="shrink-0">
          {product.quantity > 0 ? (
            <Check className="h-5 w-5 text-success text-green-500" />
          ) : (
            <X className="h-5 w-5 text-destructive" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-custom-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-custom-text-secondary">Cantidad:</span>
          <Badge
            variant={product.quantity > 0 ? "default" : "destructive"}
            className="min-w-10 justify-center text-xs"
          >
            {product.quantity}
          </Badge>
        </div>
        <div className="text-sm font-semibold text-custom-text-primary">
          {formatCurrency(product.cost_price)}
        </div>
      </div>
    </Card>
  );
};
