import { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, Loader2, DollarSign, Tag, Package, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { WcProduct, ProductUpdatePayload } from '@/types/product';

interface ProductEditFormProps {
  product: WcProduct | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: number, data: ProductUpdatePayload) => Promise<void>;
  isSaving: boolean;
}

interface FormState {
  name: string;
  short_description: string;
  description: string;
  sku: string;
  regular_price: string;
  sale_price: string;
  wholesale_regular_price: string;
  wholesale_sale_price: string;
  manage_stock: boolean;
  stock_quantity: string;
  stock_status: string;
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function buildInitialState(product: WcProduct | null): FormState {
  return {
    name: product?.name ?? '',
    short_description: product?.short_description ? stripHtml(product.short_description) : '',
    description: product?.description ? stripHtml(product.description) : '',
    sku: product?.sku ?? '',
    regular_price: product?.regular_price ?? '',
    sale_price: product?.sale_price ?? '',
    wholesale_regular_price: product?.wholesale_regular_price ?? '',
    wholesale_sale_price: product?.wholesale_sale_price ?? '',
    manage_stock: product?.manage_stock ?? false,
    stock_quantity: product?.stock_quantity?.toString() ?? '',
    stock_status: product?.stock_status ?? 'instock',
  };
}

function isValidPrice(val: string): boolean {
  if (val === '') return true;
  const num = parseFloat(val);
  return !isNaN(num) && num >= 0;
}

export function ProductEditForm({ product, open, onClose, onSave, isSaving }: ProductEditFormProps) {
  const [form, setForm] = useState<FormState>(() => buildInitialState(product));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saveResult, setSaveResult] = useState<'success' | 'error' | null>(null);
  const [savedBaseline, setSavedBaseline] = useState<FormState | null>(null);

  // Reset form only when the dialog opens or when switching to a different product.
  // Intentionally excluding the full `product` object to prevent resetting the form
  // (and clearing the success message) when the cache updates after a save.
  useEffect(() => {
    if (open && product) {
      setForm(buildInitialState(product));
      setSavedBaseline(null);
      setErrors({});
      setSaveResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  // Auto-dismiss success message
  useEffect(() => {
    if (saveResult === 'success') {
      const timer = setTimeout(() => setSaveResult(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveResult]);

  const updateField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSaveResult(null);
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!isValidPrice(form.regular_price)) {
      newErrors.regular_price = 'Must be a valid price';
    }
    if (!isValidPrice(form.sale_price)) {
      newErrors.sale_price = 'Must be a valid price';
    }
    if (form.sale_price && form.regular_price && parseFloat(form.sale_price) >= parseFloat(form.regular_price)) {
      newErrors.sale_price = 'Sale price must be less than regular price';
    }
    if (!isValidPrice(form.wholesale_regular_price)) {
      newErrors.wholesale_regular_price = 'Must be a valid price';
    }
    if (!isValidPrice(form.wholesale_sale_price)) {
      newErrors.wholesale_sale_price = 'Must be a valid price';
    }
    if (form.wholesale_sale_price && form.wholesale_regular_price && parseFloat(form.wholesale_sale_price) >= parseFloat(form.wholesale_regular_price)) {
      newErrors.wholesale_sale_price = 'Sale price must be less than regular price';
    }
    if (form.manage_stock && form.stock_quantity !== '' && (isNaN(parseInt(form.stock_quantity)) || parseInt(form.stock_quantity) < 0)) {
      newErrors.stock_quantity = 'Must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  // Build payload with only changed fields (compare against saved baseline if we've saved in this session)
  const buildPayload = useCallback((): ProductUpdatePayload => {
    if (!product) return {};
    const initial = savedBaseline ?? buildInitialState(product);
    const payload: ProductUpdatePayload = {};

    if (form.name !== initial.name) payload.name = form.name;
    if (form.short_description !== initial.short_description) payload.short_description = form.short_description;
    if (form.description !== initial.description) payload.description = form.description;
    if (form.sku !== initial.sku) payload.sku = form.sku;
    if (form.regular_price !== initial.regular_price) payload.regular_price = form.regular_price;
    if (form.sale_price !== initial.sale_price) payload.sale_price = form.sale_price;
    if (form.wholesale_regular_price !== initial.wholesale_regular_price) payload.wholesale_regular_price = form.wholesale_regular_price;
    if (form.wholesale_sale_price !== initial.wholesale_sale_price) payload.wholesale_sale_price = form.wholesale_sale_price;
    if (form.manage_stock !== initial.manage_stock) payload.manage_stock = form.manage_stock;
    if (form.stock_status !== initial.stock_status) payload.stock_status = form.stock_status;
    if (form.manage_stock && form.stock_quantity !== initial.stock_quantity) {
      payload.stock_quantity = form.stock_quantity ? parseInt(form.stock_quantity) : 0;
    }

    return payload;
  }, [form, product, savedBaseline]);

  const hasChanges = useMemo(() => {
    if (!product) return false;
    const payload = buildPayload();
    return Object.keys(payload).length > 0;
  }, [buildPayload, product]);

  const handleSave = useCallback(async () => {
    if (!product || !validate()) return;
    const payload = buildPayload();
    if (Object.keys(payload).length === 0) return;

    try {
      await onSave(product.id, payload);
      setSavedBaseline({ ...form });
      setSaveResult('success');
    } catch {
      setSaveResult('error');
    }
  }, [product, validate, buildPayload, onSave, form]);

  // Margin calculation
  const marginInfo = useMemo(() => {
    const retail = parseFloat(form.regular_price);
    const wholesale = parseFloat(form.wholesale_regular_price);
    if (isNaN(retail) || isNaN(wholesale) || retail === 0) return null;
    const margin = ((retail - wholesale) / retail) * 100;
    return {
      retail,
      wholesale,
      margin: margin.toFixed(1),
      spread: (retail - wholesale).toFixed(2),
    };
  }, [form.regular_price, form.wholesale_regular_price]);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Edit Product
          </DialogTitle>
          <DialogDescription>
            {product.name} {product.sku ? `(SKU: ${product.sku})` : ''}
          </DialogDescription>
        </DialogHeader>

        {/* Success / Error feedback */}
        {saveResult === 'success' && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
            Product updated successfully.
          </div>
        )}
        {saveResult === 'error' && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            Failed to update product. Please try again.
          </div>
        )}

        <Tabs defaultValue="pricing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pricing" className="gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              Pricing
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Details
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Inventory
            </TabsTrigger>
          </TabsList>

          {/* PRICING TAB */}
          <TabsContent value="pricing" className="space-y-4 mt-4">
            {/* Margin Summary */}
            {marginInfo && (
              <div className="rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-blue-950/20 dark:to-indigo-950/20 dark:border-blue-900/40">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-muted-foreground">Pricing Summary</p>
                    <p className="text-lg font-semibold">
                      Retail: ${marginInfo.retail.toFixed(2)}
                      <span className="mx-2 text-muted-foreground">{'-->'}</span>
                      Wholesale: ${marginInfo.wholesale.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{marginInfo.margin}%</p>
                    <p className="text-xs text-muted-foreground">margin (${marginInfo.spread} spread)</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Retail Pricing Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    Retail Pricing
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Prices patients pay</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="regular_price">Regular Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        id="regular_price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        value={form.regular_price}
                        onChange={(e) => updateField('regular_price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.regular_price && (
                      <p className="text-xs text-destructive">{errors.regular_price}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Sale Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        id="sale_price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        value={form.sale_price}
                        onChange={(e) => updateField('sale_price', e.target.value)}
                        placeholder="Leave blank for no sale"
                      />
                    </div>
                    {errors.sale_price && (
                      <p className="text-xs text-destructive">{errors.sale_price}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Wholesale Pricing Card */}
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    Wholesale Pricing
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Prices doctors pay (B2BKing)</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="wholesale_regular_price">Regular Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        id="wholesale_regular_price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        value={form.wholesale_regular_price}
                        onChange={(e) => updateField('wholesale_regular_price', e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.wholesale_regular_price && (
                      <p className="text-xs text-destructive">{errors.wholesale_regular_price}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wholesale_sale_price">Sale Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                      <Input
                        id="wholesale_sale_price"
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-7"
                        value={form.wholesale_sale_price}
                        onChange={(e) => updateField('wholesale_sale_price', e.target.value)}
                        placeholder="Leave blank for no sale"
                      />
                    </div>
                    {errors.wholesale_sale_price && (
                      <p className="text-xs text-destructive">{errors.wholesale_sale_price}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* DETAILS TAB */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Product name"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => updateField('sku', e.target.value)}
                placeholder="Product SKU"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Textarea
                id="short_description"
                value={form.short_description}
                onChange={(e) => updateField('short_description', e.target.value)}
                placeholder="Brief product summary..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Detailed product description..."
                rows={6}
              />
            </div>
          </TabsContent>

          {/* INVENTORY TAB */}
          <TabsContent value="inventory" className="space-y-4 mt-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="manage_stock" className="cursor-pointer">Manage Stock</Label>
                <p className="text-xs text-muted-foreground">
                  Enable stock tracking for this product
                </p>
              </div>
              <Switch
                id="manage_stock"
                checked={form.manage_stock}
                onCheckedChange={(checked) => updateField('manage_stock', checked)}
              />
            </div>

            {form.manage_stock && (
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">Stock Quantity</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  value={form.stock_quantity}
                  onChange={(e) => updateField('stock_quantity', e.target.value)}
                  placeholder="0"
                />
                {errors.stock_quantity && (
                  <p className="text-xs text-destructive">{errors.stock_quantity}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="stock_status">Stock Status</Label>
              <Select
                value={form.stock_status}
                onValueChange={(val) => updateField('stock_status', val)}
              >
                <SelectTrigger id="stock_status">
                  <SelectValue placeholder="Select stock status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instock">In Stock</SelectItem>
                  <SelectItem value="outofstock">Out of Stock</SelectItem>
                  <SelectItem value="onbackorder">On Backorder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {hasChanges ? (
              <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>
            ) : (
              <span>No changes</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
