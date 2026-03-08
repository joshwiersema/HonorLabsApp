import { Eye, Package, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { WcProduct } from '@/types/product';

interface ProductListProps {
  products: WcProduct[];
  isLoading: boolean;
  onViewProduct: (id: number) => void;
  onEditProduct: (id: number) => void;
}

function getStockDisplay(product: WcProduct) {
  const qty = product.stock_quantity;

  if (product.stock_status === 'outofstock') {
    return { color: 'bg-red-500', label: 'Out of stock' };
  }
  if (product.stock_status === 'onbackorder') {
    return { color: 'bg-yellow-500', label: 'On backorder' };
  }
  if (qty !== null && qty < 5) {
    return { color: 'bg-red-500', label: `${qty} in stock` };
  }
  if (qty !== null && qty < 10) {
    return { color: 'bg-yellow-500', label: `${qty} in stock` };
  }
  return {
    color: 'bg-emerald-500',
    label: qty !== null ? `${qty} in stock` : 'In stock',
  };
}

function LoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-16" /></TableCell>
          <TableCell><Skeleton className="h-8 w-16" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function ProductList({ products, isLoading, onViewProduct, onEditProduct }: ProductListProps) {
  if (!isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border py-16">
        <Package className="h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-lg font-semibold">No products found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Retail</TableHead>
            <TableHead>Wholesale</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            products.map((product) => {
              const stock = getStockDisplay(product);
              const onSale =
                product.on_sale &&
                product.sale_price &&
                product.sale_price !== product.regular_price;

              return (
                <TableRow
                  key={product.id}
                  className="cursor-pointer"
                  onClick={() => onViewProduct(product.id)}
                >
                  <TableCell>
                    {product.images.length > 0 ? (
                      <img
                        src={product.images[0].src}
                        alt={product.images[0].alt || product.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.sku || '-'}
                  </TableCell>
                  <TableCell>
                    {onSale ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-semibold text-primary">
                          ${product.sale_price}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          ${product.regular_price}
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold">
                        ${product.price || product.regular_price}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {product.wholesale_regular_price ? (
                      product.wholesale_sale_price && product.wholesale_sale_price !== product.wholesale_regular_price ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-semibold text-emerald-600">
                            ${product.wholesale_sale_price}
                          </span>
                          <span className="text-xs text-muted-foreground line-through">
                            ${product.wholesale_regular_price}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-emerald-600">
                          ${product.wholesale_regular_price}
                        </span>
                      )
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', stock.color)} />
                      <span className="text-sm">{stock.label}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {product.categories.map((cat) => (
                        <Badge
                          key={cat.id}
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                        >
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewProduct(product.id);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View details</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditProduct(product.id);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit product</TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
