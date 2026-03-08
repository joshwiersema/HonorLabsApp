import { Package, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useProduct } from '@/hooks/useProducts';
import type { WcProduct } from '@/types/product';
import { formatDate, formatNumber } from '@/utils/formatters';

interface ProductDetailProps {
  product: WcProduct | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (product: WcProduct) => void;
}

function getStockInfo(product: WcProduct) {
  const qty = product.stock_quantity;

  if (product.stock_status === 'outofstock') {
    return { color: 'bg-red-500', textColor: 'text-red-600', label: 'Out of stock', variant: 'destructive' as const };
  }
  if (product.stock_status === 'onbackorder') {
    return { color: 'bg-yellow-500', textColor: 'text-yellow-600', label: 'On backorder', variant: 'warning' as const };
  }
  if (qty !== null && qty < 5) {
    return { color: 'bg-red-500', textColor: 'text-red-600', label: `${qty} in stock`, variant: 'destructive' as const };
  }
  if (qty !== null && qty < 10) {
    return { color: 'bg-yellow-500', textColor: 'text-yellow-600', label: `${qty} in stock`, variant: 'warning' as const };
  }
  return {
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600',
    label: qty !== null ? `${qty} in stock` : 'In stock',
    variant: 'success' as const,
  };
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-20 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetail({ product, open, onClose, onEdit }: ProductDetailProps) {
  const { data: freshProduct, isLoading } = useProduct(product?.id ?? null);
  const displayProduct = freshProduct ?? product;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle>{displayProduct?.name ?? 'Product Details'}</DialogTitle>
              <DialogDescription>
                {displayProduct?.sku ? `SKU: ${displayProduct.sku}` : 'Product information'}
              </DialogDescription>
            </div>
            {displayProduct && onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(displayProduct)}
                className="shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Product
              </Button>
            )}
          </div>
        </DialogHeader>

        {isLoading && !displayProduct ? (
          <DetailSkeleton />
        ) : displayProduct ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Product Image */}
            <div className="overflow-hidden rounded-lg bg-muted">
              {displayProduct.images.length > 0 ? (
                <img
                  src={displayProduct.images[0].src}
                  alt={displayProduct.images[0].alt || displayProduct.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex aspect-square items-center justify-center">
                  <Package className="h-20 w-20 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{displayProduct.name}</h3>
                {displayProduct.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {displayProduct.sku}</p>
                )}
              </div>

              {/* Retail Pricing */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Retail Price</p>
                {displayProduct.on_sale && displayProduct.sale_price && displayProduct.sale_price !== displayProduct.regular_price ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-primary">
                      ${displayProduct.sale_price}
                    </span>
                    <span className="text-lg text-muted-foreground line-through">
                      ${displayProduct.regular_price}
                    </span>
                    <Badge variant="destructive" className="text-xs">Sale</Badge>
                  </div>
                ) : (
                  <span className="text-2xl font-bold">
                    ${displayProduct.price || displayProduct.regular_price}
                  </span>
                )}
              </div>

              {/* Wholesale Pricing */}
              {displayProduct.wholesale_regular_price && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Wholesale Price (Doctors)</p>
                  {displayProduct.wholesale_sale_price && displayProduct.wholesale_sale_price !== displayProduct.wholesale_regular_price ? (
                    <div className="flex items-baseline gap-3">
                      <span className="text-xl font-bold text-emerald-600">
                        ${displayProduct.wholesale_sale_price}
                      </span>
                      <span className="text-base text-muted-foreground line-through">
                        ${displayProduct.wholesale_regular_price}
                      </span>
                      <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">
                        W. Sale
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-xl font-bold text-emerald-600">
                      ${displayProduct.wholesale_regular_price}
                    </span>
                  )}
                  {/* Margin indicator */}
                  {(() => {
                    const retail = parseFloat(displayProduct.regular_price);
                    const wholesale = parseFloat(displayProduct.wholesale_regular_price || '0');
                    if (!isNaN(retail) && !isNaN(wholesale) && retail > 0) {
                      const margin = ((retail - wholesale) / retail) * 100;
                      return (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {margin.toFixed(1)}% margin (${(retail - wholesale).toFixed(2)} spread)
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <Separator />

              {/* Stock Status */}
              {(() => {
                const stock = getStockInfo(displayProduct);
                return (
                  <div className="flex items-center gap-2">
                    <span className={cn('h-2.5 w-2.5 rounded-full', stock.color)} />
                    <span className={cn('text-sm font-medium', stock.textColor)}>
                      {stock.label}
                    </span>
                    {displayProduct.manage_stock && displayProduct.stock_quantity !== null && (
                      <span className="text-sm text-muted-foreground">
                        (Managed)
                      </span>
                    )}
                  </div>
                );
              })()}

              {/* Categories */}
              {displayProduct.categories.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1.5">Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {displayProduct.categories.map((cat) => (
                      <Badge key={cat.id} variant="outline">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {displayProduct.short_description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1.5">Description</p>
                  <div
                    className="prose prose-sm max-w-none text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: displayProduct.short_description }}
                  />
                </div>
              )}

              <Separator />

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Sales</p>
                  <p className="font-semibold">{formatNumber(displayProduct.total_sales)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-semibold capitalize">{displayProduct.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-semibold">{formatDate(displayProduct.date_created)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Modified</p>
                  <p className="font-semibold">{formatDate(displayProduct.date_modified)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Full Description */}
        {displayProduct?.description && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Full Description</p>
              <div
                className="prose prose-sm max-w-none text-sm"
                dangerouslySetInnerHTML={{ __html: displayProduct.description }}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
