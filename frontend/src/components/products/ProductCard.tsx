import { Package, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { WcProduct } from '@/types/product';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: WcProduct;
  onClick: () => void;
  onEdit: () => void;
}

function getStockIndicator(product: WcProduct) {
  const qty = product.stock_quantity;

  if (product.stock_status === 'outofstock') {
    return { color: 'bg-red-500', label: 'Out of stock', variant: 'destructive' as const };
  }
  if (product.stock_status === 'onbackorder') {
    return { color: 'bg-yellow-500', label: 'On backorder', variant: 'warning' as const };
  }
  if (qty !== null && qty < 5) {
    return { color: 'bg-red-500', label: `${qty} in stock`, variant: 'destructive' as const };
  }
  if (qty !== null && qty < 10) {
    return { color: 'bg-yellow-500', label: `${qty} in stock`, variant: 'warning' as const };
  }
  return {
    color: 'bg-emerald-500',
    label: qty !== null ? `${qty} in stock` : 'In stock',
    variant: 'success' as const,
  };
}

export function ProductCard({ product, onClick, onEdit }: ProductCardProps) {
  const stock = getStockIndicator(product);
  const hasImage = product.images.length > 0;
  const onSale = product.on_sale && product.sale_price && product.sale_price !== product.regular_price;

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden transition-all hover:shadow-md hover:border-primary/20"
      onClick={onClick}
    >
      {/* Edit button - top right corner */}
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-2 right-2 z-10 h-7 w-7 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        aria-label="Edit product"
      >
        <Pencil className="h-3 w-3" />
      </Button>

      <div className="aspect-square overflow-hidden bg-muted">
        {hasImage ? (
          <img
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold leading-tight line-clamp-2">{product.name}</h3>

        {product.sku && (
          <p className="mt-1 text-sm text-muted-foreground">SKU: {product.sku}</p>
        )}

        {/* Retail Price */}
        <div className="mt-2 flex items-baseline gap-2">
          {onSale ? (
            <>
              <span className="text-lg font-bold text-primary">${product.sale_price}</span>
              <span className="text-sm text-muted-foreground line-through">${product.regular_price}</span>
            </>
          ) : (
            <span className="text-lg font-bold">${product.price || product.regular_price}</span>
          )}
        </div>

        {/* Wholesale Price */}
        {product.wholesale_regular_price && (
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">Wholesale:</span>
            {product.wholesale_sale_price && product.wholesale_sale_price !== product.wholesale_regular_price ? (
              <>
                <span className="text-sm font-semibold text-emerald-600">${product.wholesale_sale_price}</span>
                <span className="text-xs text-muted-foreground line-through">${product.wholesale_regular_price}</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-emerald-600">${product.wholesale_regular_price}</span>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', stock.color)} />
          <span className="text-xs text-muted-foreground">{stock.label}</span>
        </div>

        {product.categories.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {product.categories.map((cat) => (
              <Badge key={cat.id} variant="outline" className="text-xs px-1.5 py-0">
                {cat.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
