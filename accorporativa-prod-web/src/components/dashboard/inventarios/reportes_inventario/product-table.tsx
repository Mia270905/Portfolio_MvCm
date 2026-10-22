import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InventoryProduct } from "@/lib/actions/inventory_reports.actions";

interface ProductTableProps {
  products: InventoryProduct[];
  formatCurrency: (value: number) => string;
}

export const ProductTable = ({ products, formatCurrency }: ProductTableProps) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-custom-border">
              <TableHead className="whitespace-nowrap text-custom-text-secondary">Código</TableHead>
              <TableHead className="whitespace-nowrap hidden sm:table-cell text-custom-text-secondary">
                Código de Barras
              </TableHead>
              <TableHead className="whitespace-nowrap text-custom-text-secondary">Producto</TableHead>
              <TableHead className="text-center whitespace-nowrap text-custom-text-secondary">Cantidad</TableHead>
              <TableHead className="text-right whitespace-nowrap text-custom-text-secondary">Costo</TableHead>
              <TableHead className="text-center whitespace-nowrap text-custom-text-secondary">
                Disponible
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="border-custom-border hover:bg-custom-accent-hover">
                <TableCell className="font-medium whitespace-nowrap text-custom-text-primary">
                  {product.code}
                </TableCell>
                <TableCell className="text-custom-text-secondary hidden sm:table-cell">
                  {product.bar_code || "-"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-custom-text-primary">
                  {product.name}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={product.quantity > 0 ? "default" : "destructive"}
                    className="min-w-[50px] justify-center"
                  >
                    {product.quantity}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap text-custom-text-primary">
                  {formatCurrency(product.cost_price)}
                </TableCell>
                <TableCell className="text-center">
                  {product.quantity > 0 ? (
                    <Check className="h-5 w-5 text-green-500 mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-destructive mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
