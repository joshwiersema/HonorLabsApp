import { useState, useMemo, useCallback } from 'react';
import { LayoutGrid, List, AlertTriangle, PackageX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductList } from '@/components/products/ProductList';
import { ProductDetail } from '@/components/products/ProductDetail';
import { ProductEditForm } from '@/components/products/ProductEditForm';
import { useProducts, useUpdateProduct } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';
import type { WcProduct, ProductUpdatePayload } from '@/types/product';

type ViewMode = 'grid' | 'list';

export function Products() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const { data, isLoading } = useProducts({ search: search || undefined });
  const updateMutation = useUpdateProduct();

  const products: WcProduct[] = data?.data ?? [];

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  const editingProduct = useMemo(
    () => products.find((p) => p.id === editingProductId) ?? null,
    [products, editingProductId]
  );

  // Inventory alerts
  const outOfStockProducts = useMemo(
    () => products.filter((p) => p.stock_status === 'outofstock'),
    [products]
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.stock_status !== 'outofstock' &&
          p.stock_quantity !== null &&
          p.stock_quantity < 10
      ),
    [products]
  );

  const hasAlerts = outOfStockProducts.length > 0 || lowStockProducts.length > 0;

  const handleEditFromDetail = useCallback((product: WcProduct) => {
    setSelectedProductId(null);
    // Small delay to allow detail dialog to close before edit opens
    setTimeout(() => setEditingProductId(product.id), 150);
  }, []);

  const handleSaveProduct = useCallback(async (id: number, data: ProductUpdatePayload) => {
    await updateMutation.mutateAsync({ id, data });
  }, [updateMutation]);

  const handleCloseEdit = useCallback(() => {
    setEditingProductId(null);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your supplement catalog and monitor inventory."
        actions={
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Inventory Alerts */}
      {!isLoading && hasAlerts && (
        <div className="grid gap-3 sm:grid-cols-2">
          {outOfStockProducts.length > 0 && (
            <Card className="border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
                  <PackageX className="h-4 w-4" />
                  Out of Stock
                  <Badge variant="destructive" className="ml-auto text-xs">
                    {outOfStockProducts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {outOfStockProducts.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
                    >
                      {p.name}
                    </button>
                  ))}
                  {outOfStockProducts.length > 5 && (
                    <span className="px-2 py-0.5 text-xs text-red-500">
                      +{outOfStockProducts.length - 5} more
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {lowStockProducts.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50 dark:border-yellow-900/50 dark:bg-yellow-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  Low Stock
                  <Badge variant="warning" className="ml-auto text-xs">
                    {lowStockProducts.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {lowStockProducts.slice(0, 5).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={cn(
                        'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                        p.stock_quantity !== null && p.stock_quantity < 5
                          ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300'
                      )}
                    >
                      {p.name} ({p.stock_quantity})
                    </button>
                  ))}
                  {lowStockProducts.length > 5 && (
                    <span className="px-2 py-0.5 text-xs text-yellow-500">
                      +{lowStockProducts.length - 5} more
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search products by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Product Views */}
      {viewMode === 'grid' ? (
        <ProductGrid
          products={products}
          isLoading={isLoading}
          onViewProduct={setSelectedProductId}
          onEditProduct={setEditingProductId}
        />
      ) : (
        <ProductList
          products={products}
          isLoading={isLoading}
          onViewProduct={setSelectedProductId}
          onEditProduct={setEditingProductId}
        />
      )}

      {/* Product Detail Dialog */}
      <ProductDetail
        product={selectedProduct}
        open={selectedProductId !== null}
        onClose={() => setSelectedProductId(null)}
        onEdit={handleEditFromDetail}
      />

      {/* Product Edit Dialog */}
      <ProductEditForm
        product={editingProduct}
        open={editingProductId !== null}
        onClose={handleCloseEdit}
        onSave={handleSaveProduct}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}
