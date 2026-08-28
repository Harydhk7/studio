import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/store/cart";
import { useCreateOrder } from "@/hooks/use-orders";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useCustomerAddresses } from "@/hooks/use-customer-addresses";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingBag, Loader2, MapPin } from "lucide-react";
import { getCustomerToken } from "@/lib/auth";
import { api } from "@shared/routes";

const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(10, "Complete address is required"),
  additionalNotes: z.string().optional(),
});

const formatMoney = (value: number) =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function formatAddress(a: {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
}) {
  const parts = [
    a.addressLine1,
    a.addressLine2,
    [a.city, a.state, a.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);
  return parts.join(", ");
}

export default function Checkout() {
  const { items, getTotal, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const createOrder = useCreateOrder();
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const { data: addresses } = useCustomerAddresses();
  const defaultAddress = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
  const [selectedAddress, setSelectedAddress] = useState<typeof defaultAddress>(
    defaultAddress ?? undefined,
  );
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [shippingDistanceKm, setShippingDistanceKm] = useState<number | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
  });

  // Checkout only for logged-in users: redirect to login if no token or session invalid
  const hasToken = !!getCustomerToken();
  useEffect(() => {
    if (!hasToken) {
      setLocation("/login?redirect=/checkout");
      return;
    }
    if (hasToken && !authLoading && customer === null) {
      setLocation("/login?redirect=/checkout");
    }
  }, [hasToken, authLoading, customer, setLocation]);

  // Pre-fill name, email, phone from logged-in customer
  useEffect(() => {
    if (customer) {
      setValue("name", customer.name);
      setValue("email", customer.email);
      setValue("phone", customer.phone ?? "");
    }
  }, [customer, setValue]);

  useEffect(() => {
    if (defaultAddress && !selectedAddress) setSelectedAddress(defaultAddress);
  }, [defaultAddress, selectedAddress]);

  useEffect(() => {
    if (selectedAddress) {
      setValue("address", formatAddress(selectedAddress));
    }
  }, [selectedAddress, setValue]);

  useEffect(() => {
    const run = async () => {
      const pincode = selectedAddress?.pincode?.trim() ?? "";
      if (!pincode) {
        setShippingCharge(0);
        setShippingDistanceKm(null);
        setShippingError("Selected address must include pincode to calculate shipping.");
        return;
      }
      setShippingLoading(true);
      setShippingError(null);
      try {
        const res = await fetch(
          `${api.shipping.quote.get.path}?deliveryPincode=${encodeURIComponent(pincode)}`,
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to calculate shipping");
        }
        setShippingCharge(Number(data.shippingCharge) || 0);
        setShippingDistanceKm(Number(data.distanceKm) || null);
      } catch (err) {
        setShippingCharge(0);
        setShippingDistanceKm(null);
        setShippingError(
          err instanceof Error ? err.message : "Failed to calculate shipping",
        );
      } finally {
        setShippingLoading(false);
      }
    };
    if (!selectedAddress) return;
    run();
  }, [selectedAddress]);

  if (items.length === 0) {
    setLocation("/cart");
    return null;
  }

  if (!hasToken || (!customer && !authLoading)) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#fbfbfd] dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (authLoading || !customer) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#fbfbfd] dark:bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const needsAddress = !addresses || addresses.length === 0;
  const subtotal = getTotal();
  const grandTotal = subtotal + shippingCharge;
  const roundedPayable = Math.round(grandTotal);
  const roundOffAmount = roundedPayable - grandTotal;

  const onSubmit = async (data: z.infer<typeof checkoutSchema>) => {
    if (shippingLoading) return;
    if (shippingError) {
      console.error(shippingError);
      return;
    }
    const deliveryPincode = selectedAddress?.pincode?.trim() ?? "";
    if (!deliveryPincode) return;
    try {
      const order = await createOrder.mutateAsync({
        ...data,
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
        subtotalPrice: subtotal,
        shippingCharge,
        totalPrice: grandTotal,
        shippingPincode: deliveryPincode,
        ...(customer ? { customerId: customer.id } : {}),
      });
      clearCart();
      setLocation(`/checkout/thank-you?order=${order.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (needsAddress) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-[#fbfbfd] dark:bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight mb-8">
            Secure Checkout
          </h1>
          <div className="bg-card p-8 md:p-12 rounded-3xl shadow-xl shadow-black/5 border border-border/50 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Address required</h2>
            <p className="text-muted-foreground mb-6">
              Add an address in your profile to continue placing your order.
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/profile">Go to Profile & add address</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#fbfbfd] dark:bg-[#0a0a0a]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">
          Secure Checkout
        </h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-card p-8 md:p-12 rounded-3xl shadow-xl shadow-black/5 border border-border/50"
        >
          <div className="mb-8 pb-8 border-b border-border">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <ShoppingBag className="w-5 h-5 mr-2" /> Order Summary
            </h2>
            <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 md:p-5 space-y-3">
              {items.map((i) => (
                <div
                  key={i.itemKey}
                  className="flex items-start justify-between gap-3 rounded-xl bg-background/60 border border-border/40 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm leading-5">
                      {i.quantity}x {i.name}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
                      {i.variantName ? <span>Variant: {i.variantName}</span> : null}
                      {i.selectedColor ? <span>Color: {i.selectedColor}</span> : null}
                      {i.selectedSize ? <span>Size: {i.selectedSize}</span> : null}
                      {i.selectedOther ? <span>Option: {i.selectedOther}</span> : null}
                    </div>
                  </div>
                  <span className="font-semibold text-sm shrink-0">
                    ₹{formatMoney(i.price * i.quantity)}
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center text-base font-semibold mt-3 pt-4 border-t border-border/60">
                <span>Subtotal</span>
                <span className="text-primary text-lg">
                  ₹{formatMoney(subtotal)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm mt-2">
                <span>
                  Shipping
                  {shippingDistanceKm != null ? (
                    <span className="text-muted-foreground"> ({shippingDistanceKm} KM)</span>
                  ) : null}
                </span>
                <span>
                  {shippingLoading ? "Calculating..." : `₹${formatMoney(shippingCharge)}`}
                </span>
              </div>

              <div className="flex justify-between items-center text-base font-semibold mt-2 pt-3 border-t border-border/60">
                <span>Grand Total</span>
                <span className="text-primary text-lg">
                  ₹{formatMoney(grandTotal)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Round Off</span>
                <span>{roundOffAmount >= 0 ? "+" : ""}₹{formatMoney(roundOffAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-base font-semibold">
                <span>Payable Amount (Rounded)</span>
                <span className="text-primary text-lg">₹{roundedPayable.toLocaleString("en-IN")}</span>
              </div>
              {shippingError ? (
                <p className="text-xs text-destructive mt-2">{shippingError}</p>
              ) : null}
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-6">Delivery Information</h2>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  {...register("name")}
                  className="h-12 rounded-xl bg-background"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <span className="text-xs text-destructive">
                    {errors.name.message}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  {...register("email")}
                  type="email"
                  className="h-12 rounded-xl bg-background"
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <span className="text-xs text-destructive">
                    {errors.email.message}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number (WhatsApp preferred)</Label>
              <Input
                {...register("phone")}
                className="h-12 rounded-xl bg-background"
              />
              {errors.phone && (
                <span className="text-xs text-destructive">
                  {errors.phone.message}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label>Delivery Address (mandatory)</Label>
              {addresses && addresses.length > 0 ? (
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                  {selectedAddress && (
                    <>
                      {selectedAddress.isDefault && (
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Default address
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">
                        {formatAddress(selectedAddress)}
                      </p>
                    </>
                  )}
                  {!selectedAddress && (
                    <p className="text-sm text-muted-foreground">
                      Select an address
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 rounded-xl"
                    onClick={() => setAddressDialogOpen(true)}
                  >
                    Change address
                  </Button>
                </div>
              ) : (
                <>
                  <Textarea
                    {...register("address")}
                    className="min-h-[100px] rounded-xl bg-background resize-none"
                    placeholder="Full address with city, state, pincode"
                  />
                  {errors.address && (
                    <span className="text-xs text-destructive">
                      {errors.address.message}
                    </span>
                  )}
                </>
              )}
            </div>
            <Dialog
              open={addressDialogOpen}
              onOpenChange={setAddressDialogOpen}
            >
              <DialogContent className="rounded-2xl max-w-md">
                <DialogHeader>
                  <DialogTitle>Select delivery address</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 pt-2">
                  {addresses?.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddress(addr);
                        setValue("address", formatAddress(addr));
                        setAddressDialogOpen(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl border transition-colors ${
                        selectedAddress?.id === addr.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <p className="text-sm font-medium">
                        {addr.label || "Address"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatAddress(addr)}
                      </p>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            <div className="space-y-2">
              <Label>Additional Notes (Optional)</Label>
              <Input
                {...register("additionalNotes")}
                className="h-12 rounded-xl bg-background"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || shippingLoading || !!shippingError}
            className="w-full h-14 rounded-2xl text-sm md:text-base font-semibold mt-10 shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            <span>{isSubmitting ? "Placing Order..." : "Confirm & Place Order"}</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
