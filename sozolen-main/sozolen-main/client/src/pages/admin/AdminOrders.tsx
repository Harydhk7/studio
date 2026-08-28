import { useEffect, useState, useMemo } from "react";
import { useOrders, useUpdateOrderStatus, useAdminCreateOrder } from "@/hooks/use-orders";
import { useCustomers } from "@/hooks/use-customers";
import { useProducts } from "@/hooks/use-products";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import { orderStatuses, paymentStatuses, paymentModes } from "@shared/schema";
import { PaginationControls } from "@/components/PaginationControls";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { PackagePlus, Plus, Minus, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { api } from "@shared/routes";
import { getApiUrl } from "@/lib/api-base";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  shipped: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  delivered: "bg-green-500/20 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/20 text-red-700 dark:text-red-400",
};

const paymentStatusColors: Record<string, string> = {
  not_paid: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  paid: "bg-green-500/20 text-green-700 dark:text-green-400",
  failed: "bg-red-500/20 text-red-700 dark:text-red-400",
  refunded: "bg-slate-500/20 text-slate-700 dark:text-slate-400",
};

const paymentModeLabel = (mode: string | null | undefined) =>
  !mode
    ? "Not set"
    : mode
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const paymentStatusLabel = (status: string) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

type Product = {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
  hasVariants: boolean;
  variants: { id: string; name: string; price: number; isActive: boolean; isDefault: boolean }[];
  customerCanChooseColor: boolean;
  availableColors: string[];
  customerCanChooseSize: boolean;
  availableSizes: string[];
  sizePrices: Record<string, number>;
  customerCanChooseOther: boolean;
  availableOthers: string[];
};

type LineItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  variantId?: string | null;
  variantName?: string | null;
  selectedColor?: string | null;
  selectedSize?: string | null;
  selectedOther?: string | null;
};

function getProductPrice(product: Product, variantId: string, selectedSize: string): number {
  if (product.hasVariants && variantId) {
    const v = product.variants.find((v) => v.id === variantId);
    if (v) return v.price;
  }
  if (product.customerCanChooseSize && selectedSize) {
    const sp = product.sizePrices?.[selectedSize];
    if (typeof sp === "number" && sp >= 0) return sp;
  }
  return product.price;
}

function CreateOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const adminCreateOrder = useAdminCreateOrder();
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();

  const [step, setStep] = useState(1);

  // Step 1: products
  const [productSearch, setProductSearch] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [addingProduct, setAddingProduct] = useState<Product | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [addVariantId, setAddVariantId] = useState("");
  const [addColor, setAddColor] = useState("");
  const [addSize, setAddSize] = useState("");
  const [addOther, setAddOther] = useState("");

  // Step 2: customer & delivery
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [cusName, setCusName] = useState("");
  const [cusEmail, setCusEmail] = useState("");
  const [cusPhone, setCusPhone] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressPincode, setAddressPincode] = useState("");
  const [shippingCharge, setShippingCharge] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingCalced, setShippingCalced] = useState(false);

  // Step 3: payment & finalize
  const [orderStatus, setOrderStatus] = useState<string>("confirmed");
  const [paymentStatus, setPaymentStatus] = useState<string>("not_paid");
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return (products as Product[]).slice(0, 30);
    return (products as Product[]).filter((p) => p.title.toLowerCase().includes(q)).slice(0, 30);
  }, [products, productSearch]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers.slice(0, 10);
    return customers.filter((c) =>
      `${c.name} ${c.email} ${c.phone ?? ""}`.toLowerCase().includes(q),
    ).slice(0, 10);
  }, [customers, customerSearch]);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + shippingCharge;

  function resetAll() {
    setStep(1);
    setProductSearch("");
    setItems([]);
    setAddingProduct(null);
    setAddQty(1);
    setAddVariantId("");
    setAddColor("");
    setAddSize("");
    setAddOther("");
    setCustomerSearch("");
    setSelectedCustomerId(null);
    setCusName("");
    setCusEmail("");
    setCusPhone("");
    setAddressLine("");
    setAddressCity("");
    setAddressState("");
    setAddressPincode("");
    setShippingCharge(0);
    setShippingError(null);
    setShippingCalced(false);
    setOrderStatus("confirmed");
    setPaymentStatus("not_paid");
    setPaymentMode("");
    setAdditionalNotes("");
    setAdminNotes("");
  }

  function selectProduct(product: Product) {
    setAddingProduct(product);
    setAddQty(1);
    const defaultVariant = product.hasVariants
      ? product.variants.find((v) => v.isDefault && v.isActive) ?? product.variants.find((v) => v.isActive) ?? null
      : null;
    setAddVariantId(defaultVariant?.id ?? "");
    const defaultSize = product.customerCanChooseSize && product.availableSizes.length > 0 ? product.availableSizes[0] : "";
    setAddSize(defaultSize);
    setAddColor(product.customerCanChooseColor && product.availableColors.length > 0 ? product.availableColors[0] : "");
    setAddOther(product.customerCanChooseOther && product.availableOthers.length > 0 ? product.availableOthers[0] : "");
  }

  function confirmAddProduct() {
    if (!addingProduct) return;
    const price = getProductPrice(addingProduct, addVariantId, addSize);
    const variant = addingProduct.hasVariants ? addingProduct.variants.find((v) => v.id === addVariantId) : null;
    const newItem: LineItem = {
      productId: addingProduct.id,
      name: addingProduct.title,
      price,
      quantity: addQty,
      variantId: variant?.id ?? null,
      variantName: variant?.name ?? null,
      selectedColor: addColor || null,
      selectedSize: addSize || null,
      selectedOther: addOther || null,
    };
    setItems((prev) => {
      const key = `${newItem.productId}-${newItem.variantId}-${newItem.selectedColor}-${newItem.selectedSize}-${newItem.selectedOther}`;
      const existIdx = prev.findIndex(
        (i) => `${i.productId}-${i.variantId}-${i.selectedColor}-${i.selectedSize}-${i.selectedOther}` === key,
      );
      if (existIdx >= 0) {
        const updated = [...prev];
        updated[existIdx] = { ...updated[existIdx], quantity: updated[existIdx].quantity + newItem.quantity };
        return updated;
      }
      return [...prev, newItem];
    });
    setAddingProduct(null);
    setProductSearch("");
  }

  function selectExistingCustomer(c: typeof customers[number]) {
    setSelectedCustomerId(c.id);
    setCusName(c.name);
    setCusEmail(c.email);
    setCusPhone(c.phone ?? "");
    setCustomerSearch("");
  }

  async function calculateShipping() {
    const pincode = addressPincode.trim();
    if (!pincode) { setShippingError("Enter a pincode to calculate shipping"); return; }
    setShippingLoading(true);
    setShippingError(null);
    try {
      const res = await fetch(getApiUrl(`${api.shipping.quote.get.path}?deliveryPincode=${encodeURIComponent(pincode)}`));
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to calculate shipping");
      setShippingCharge(Number(data.shippingCharge) || 0);
      setShippingCalced(true);
    } catch (err) {
      setShippingError(err instanceof Error ? err.message : "Shipping calculation failed");
    } finally {
      setShippingLoading(false);
    }
  }

  function step1Valid() { return items.length > 0; }
  function step2Valid() {
    return cusName.trim() && cusEmail.trim() && cusPhone.trim() && addressLine.trim() && addressCity.trim() && addressPincode.trim();
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const address = [addressLine, addressCity, addressState, addressPincode].filter(Boolean).join(", ");
      await adminCreateOrder.mutateAsync({
        name: cusName,
        phone: cusPhone,
        email: cusEmail,
        address,
        shippingPincode: addressPincode || undefined,
        additionalNotes: additionalNotes || undefined,
        adminNotes: adminNotes || undefined,
        customerId: selectedCustomerId ?? undefined,
        status: orderStatus as any,
        paymentStatus: paymentStatus as any,
        paymentMode: paymentMode && paymentMode !== "none" ? (paymentMode as any) : undefined,
        subtotalPrice: subtotal,
        shippingCharge,
        totalPrice: total,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
          name: i.name,
          variantId: i.variantId ?? null,
          variantName: i.variantName ?? null,
          selectedColor: i.selectedColor ?? null,
          selectedSize: i.selectedSize ?? null,
          selectedOther: i.selectedOther ?? null,
        })),
      });
      toast({ title: "Offline order created successfully" });
      onOpenChange(false);
      resetAll();
    } catch (err) {
      toast({
        title: "Failed to create order",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const addingProductPrice = addingProduct
    ? getProductPrice(addingProduct, addVariantId, addSize)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetAll(); }}>
      <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Offline Order</DialogTitle>
          <div className="flex gap-2 mt-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 1 ? "Step 1: Select Products" : step === 2 ? "Step 2: Customer & Delivery" : "Step 3: Payment & Confirm"}
          </p>
        </DialogHeader>

        {/* STEP 1: Products */}
        {step === 1 && (
          <div className="space-y-4">
            {items.length > 0 && (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <div className="px-3 py-2 bg-muted/30 text-xs font-medium text-muted-foreground">Selected Items</div>
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-3 py-2 border-t border-border/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[item.variantName, item.selectedColor, item.selectedSize, item.selectedOther].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setItems((p) => p.map((i, j) => j === idx ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => setItems((p) => p.map((i, j) => j === idx ? { ...i, quantity: i.quantity + 1 } : i))} className="w-6 h-6 rounded border flex items-center justify-center hover:bg-muted">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm font-semibold w-20 text-right">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                    <button onClick={() => setItems((p) => p.filter((_, j) => j !== idx))} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="px-3 py-2 border-t border-border/40 flex justify-between items-center font-semibold text-sm">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            {addingProduct ? (
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
                <p className="font-medium text-sm">{addingProduct.title} — ₹{addingProductPrice.toLocaleString("en-IN")}</p>
                {addingProduct.hasVariants && addingProduct.variants.filter((v) => v.isActive).length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Variant</Label>
                    <Select value={addVariantId} onValueChange={setAddVariantId}>
                      <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Select variant" /></SelectTrigger>
                      <SelectContent>
                        {addingProduct.variants.filter((v) => v.isActive).map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.name} — ₹{v.price.toLocaleString("en-IN")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {addingProduct.customerCanChooseColor && addingProduct.availableColors.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Color</Label>
                    <Select value={addColor} onValueChange={setAddColor}>
                      <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Select color" /></SelectTrigger>
                      <SelectContent>
                        {addingProduct.availableColors.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {addingProduct.customerCanChooseSize && addingProduct.availableSizes.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Size</Label>
                    <Select value={addSize} onValueChange={setAddSize}>
                      <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Select size" /></SelectTrigger>
                      <SelectContent>
                        {addingProduct.availableSizes.map((s) => (
                          <SelectItem key={s} value={s}>{s}{addingProduct.sizePrices?.[s] != null ? ` — ₹${Number(addingProduct.sizePrices[s]).toLocaleString("en-IN")}` : ""}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {addingProduct.customerCanChooseOther && addingProduct.availableOthers.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-xs">Option</Label>
                    <Select value={addOther} onValueChange={setAddOther}>
                      <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Select option" /></SelectTrigger>
                      <SelectContent>
                        {addingProduct.availableOthers.map((o) => (<SelectItem key={o} value={o}>{o}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Quantity</Label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAddQty((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-10 text-center font-medium">{addQty}</span>
                    <button onClick={() => setAddQty((q) => q + 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-muted"><Plus className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-lg flex-1" onClick={confirmAddProduct}>
                    Add to Order — ₹{(addingProductPrice * addQty).toLocaleString("en-IN")}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setAddingProduct(null)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products..."
                  className="rounded-xl"
                />
                <div className="max-h-52 overflow-y-auto space-y-1 rounded-xl border border-border/50 p-1">
                  {filteredProducts.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                  )}
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectProduct(p as Product)}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/60 flex items-center justify-between gap-2 transition-colors"
                    >
                      <span className="text-sm font-medium truncate">{p.title}</span>
                      <span className="text-xs text-muted-foreground shrink-0">₹{p.price.toLocaleString("en-IN")}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button className="rounded-xl" disabled={!step1Valid()} onClick={() => setStep(2)}>
                Next: Customer Info <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Customer & Delivery */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Existing Customer (optional)</Label>
              <Input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search by name, email, phone..."
                className="rounded-xl"
              />
              {customerSearch.trim() && filteredCustomers.length > 0 && (
                <div className="rounded-xl border border-border/50 overflow-hidden max-h-40 overflow-y-auto">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectExistingCustomer(c)}
                      className="w-full text-left px-3 py-2 hover:bg-muted/60 border-b border-border/30 last:border-0 transition-colors"
                    >
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.email} · {c.phone ?? "—"}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomerId && (
                <p className="text-xs text-green-600 dark:text-green-400">Customer #{selectedCustomerId} linked · <button className="underline" onClick={() => { setSelectedCustomerId(null); setCusName(""); setCusEmail(""); setCusPhone(""); }}>Clear</button></p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Full Name *</Label>
                <Input value={cusName} onChange={(e) => setCusName(e.target.value)} placeholder="Customer name" className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label>Phone *</Label>
                <Input value={cusPhone} onChange={(e) => setCusPhone(e.target.value)} placeholder="Phone number" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input value={cusEmail} onChange={(e) => setCusEmail(e.target.value)} type="email" placeholder="Email address" className="rounded-xl" />
            </div>

            <div className="border-t border-border/50 pt-4 space-y-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Delivery Address</Label>
              <div className="space-y-1">
                <Label>Street Address *</Label>
                <Textarea value={addressLine} onChange={(e) => setAddressLine(e.target.value)} placeholder="House/flat no, street, locality" className="rounded-xl min-h-[72px] resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>City *</Label>
                  <Input value={addressCity} onChange={(e) => setAddressCity(e.target.value)} placeholder="City" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label>State</Label>
                  <Input value={addressState} onChange={(e) => setAddressState(e.target.value)} placeholder="State" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label>Pincode *</Label>
                  <Input value={addressPincode} onChange={(e) => { setAddressPincode(e.target.value); setShippingCalced(false); }} placeholder="6-digit" className="rounded-xl" maxLength={6} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={calculateShipping} disabled={shippingLoading || !addressPincode.trim()}>
                  {shippingLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  {shippingCalced ? "Recalculate Shipping" : "Calculate Shipping"}
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={shippingCharge}
                    onChange={(e) => setShippingCharge(Number(e.target.value))}
                    className="rounded-xl w-28 h-9"
                  />
                </div>
              </div>
              {shippingError && <p className="text-xs text-destructive">{shippingError}</p>}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" className="rounded-xl" onClick={() => setStep(1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button className="rounded-xl" disabled={!step2Valid()} onClick={() => setStep(3)}>
                Next: Payment <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Payment & Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-muted/30 border border-border/50 p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>₹{shippingCharge.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div className="flex justify-between font-semibold text-base pt-1 border-t border-border/50"><span>Total</span><span className="text-primary">₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Order Status</Label>
                <Select value={orderStatus} onValueChange={setOrderStatus}>
                  <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((s) => (<SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Payment Status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paymentStatuses.map((s) => (<SelectItem key={s} value={s}>{paymentStatusLabel(s)}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Select mode (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not set</SelectItem>
                  {paymentModes.map((m) => (<SelectItem key={m} value={m}>{paymentModeLabel(m)}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Additional Notes (for customer)</Label>
              <Input value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder="Any special instructions..." className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label>Admin Notes (internal)</Label>
              <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Internal notes..." className="rounded-xl min-h-[72px] resize-none" />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" className="rounded-xl" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button className="rounded-xl" disabled={submitting} onClick={handleSubmit}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PackagePlus className="w-4 h-4 mr-2" />}
                {submitting ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminOrders() {
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | (typeof orderStatuses)[number]>("all");
  const [paymentFilter, setPaymentFilter] = useState<
    "all" | "not_paid" | "paid" | "failed" | "refunded"
  >("all");
  const [pageSize, setPageSize] = useState(10);
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...(orders ?? [])].sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
    return list.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;
      if (!q) return true;
      return (
        String(o.id).includes(q) ||
        o.name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q)
      );
    });
  }, [orders, search, statusFilter, paymentFilter]);
  const pagedOrders = useMemo(() => {
    const list = filteredOrders;
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, paymentFilter, pageSize]);

  const onStatusChange = (orderId: number, status: string) => {
    updateStatus.mutate({ id: orderId, status });
  };

  const openOrderDetail = (id: number) => {
    setDetailOrderId(id);
    setDetailOpen(true);
  };

  if (isLoading) {
        return <AdminTableSkeleton title="Orders" columns={10} rows={8} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <Button className="rounded-xl" onClick={() => setCreateOrderOpen(true)}>
          <PackagePlus className="w-4 h-4 mr-2" /> Create Order
        </Button>
      </div>
      <CreateOrderDialog open={createOrderOpen} onOpenChange={setCreateOrderOpen} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order ID, name, email, phone"
          className="max-w-md rounded-xl"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | (typeof orderStatuses)[number])
          }
          className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          {orderStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(e) =>
            setPaymentFilter(
              e.target.value as "all" | "not_paid" | "paid" | "failed" | "refunded",
            )
          }
          className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All payment</option>
          <option value="not_paid">Not Paid</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          {[5, 10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>
      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedOrders.map((o) => (
              <TableRow
                key={o.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => openOrderDetail(o.id)}
              >
                <TableCell className="font-medium">#{o.id}</TableCell>
                <TableCell>
                  {(o as any).isOfflineOrder ? (
                    <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">Offline</Badge>
                  ) : (
                    <Badge className="bg-sky-500/20 text-sky-700 dark:text-sky-400">Online</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{o.name}</div>
                  <div className="text-xs text-muted-foreground">{o.phone}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {o.items.map((i, idx) => (
                      <Badge key={idx} variant="secondary" className="w-max">
                        {i.quantity}x {i.name}
                        {i.variantName ? ` (Variant: ${i.variantName})` : ""}
                        {i.selectedColor ? ` (${i.selectedColor})` : ""}
                        {i.selectedSize ? ` (${i.selectedSize})` : ""}
                        {i.selectedOther ? ` (${i.selectedOther})` : ""}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="font-bold">
                  ₹{o.totalPrice.toLocaleString()}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={o.status}
                    onValueChange={(value) => onStatusChange(o.id, value)}
                    disabled={updateStatus.isPending}
                  >
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {orderStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          <Badge className={statusColors[s] || ""}>{s}</Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge className={paymentStatusColors[o.paymentStatus] || ""}>
                    {paymentStatusLabel(o.paymentStatus)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {paymentModeLabel(o.paymentMode)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(o.createdAt!).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {(o as { updatedAt?: string | null }).updatedAt
                    ? new Date((o as { updatedAt?: string | null }).updatedAt as string).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-primary text-sm font-medium">
                  View
                </TableCell>
              </TableRow>
            ))}
            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={11}
                  className="text-center py-8 text-muted-foreground"
                >
                  No orders yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationControls
          page={page}
          setPage={setPage}
          totalItems={filteredOrders.length}
          pageSize={pageSize}
        />
      </div>
      <OrderDetailModal
        orderId={detailOrderId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
