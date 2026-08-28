import { useParams, Link, useLocation } from "wouter";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useCustomerOrders } from "@/hooks/use-customer-orders";
import { useCreateReview, useReviewsForOrderItems } from "@/hooks/use-reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Star, FileText } from "lucide-react";
import { getCustomerAuthHeaders } from "@/lib/auth";
import { openOrderInvoice } from "@/lib/invoice";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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

const formatMoney = (value: number) =>
  value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const orderId = id ? Number(id) : NaN;
  const [, setLocation] = useLocation();
  const { data: orders, isLoading } = useCustomerOrders();
  const createReview = useCreateReview();
  const { toast } = useToast();
  const { customer, isLoading: authLoading } = useCustomerAuth();
  const order = orders?.find((o) => o.id === orderId);
  const productIds = order?.items?.map((i) => i.productId) ?? [];
  const existingReviewsByProduct = useReviewsForOrderItems(
    productIds,
    orderId,
    customer?.id,
  );

  const [reviewByProduct, setReviewByProduct] = useState<
    Record<number, { rating: number; comment: string }>
  >({});

  useEffect(() => {
    if (!authLoading && !customer) setLocation("/login");
  }, [authLoading, customer, setLocation]);
  useEffect(() => {
    if (!Number.isInteger(orderId) || orderId < 1) setLocation("/profile");
  }, [orderId, setLocation]);

  if (authLoading || isLoading || !orders) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen pt-24 max-w-3xl mx-auto px-4">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link href="/profile">Back to Profile</Link>
        </Button>
      </div>
    );
  }

  const setReviewForProduct = (
    productId: number,
    rating: number,
    comment: string,
  ) => {
    setReviewByProduct((prev) => ({
      ...prev,
      [productId]: { rating, comment },
    }));
  };

  const submitReview = async (productId: number, name: string) => {
    const r = reviewByProduct[productId];
    if (!r) return;
    try {
      await createReview.mutateAsync({
        productId,
        orderId: order.id,
        rating: r.rating,
        comment: r.comment || undefined,
      });
      toast({ title: "Review submitted" });
      setReviewByProduct((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: e?.message ?? "Could not submit review",
      });
    }
  };

  const subtotal =
    typeof order.subtotalPrice === "number"
      ? order.subtotalPrice
      : order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const shipping =
    typeof order.shippingCharge === "number" ? order.shippingCharge : 0;
  const grandTotal =
    typeof order.totalPrice === "number" ? order.totalPrice : subtotal + shipping;
  const roundedPayable = Math.round(grandTotal);
  const roundOffAmount = roundedPayable - grandTotal;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/profile"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Profile
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Order #{order.id}
        </h1>
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Badge className={statusColors[order.status] || ""}>
            {order.status}
          </Badge>
          <Badge className={paymentStatusColors[order.paymentStatus] || ""}>
            Payment: {paymentStatusLabel(order.paymentStatus)}
          </Badge>
          <Badge variant="secondary">
            Mode: {paymentModeLabel(order.paymentMode)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString()
              : ""}
          </span>
          {order.paymentStatus === "paid" && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl ml-auto"
              onClick={async () => {
                try {
                  await openOrderInvoice(order.id, getCustomerAuthHeaders());
                } catch (e) {
                  toast({
                    variant: "destructive",
                    title: "Could not open invoice",
                    description: e instanceof Error ? e.message : "Please try again.",
                  });
                }
              }}
            >
              <FileText className="w-4 h-4 mr-2" />
              View Invoice
            </Button>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden divide-y divide-border/50">
          <div className="p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-1">
              Delivery address
            </h2>
            <p className="text-sm whitespace-pre-wrap">{order.address}</p>
          </div>
          <div className="p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">
              Items
            </h2>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>
                    {item.quantity}x {item.name}
                    {item.variantName ? ` (Variant: ${item.variantName})` : ""}
                    {item.selectedColor
                      ? ` (Color: ${item.selectedColor})`
                      : ""}
                    {item.selectedSize ? ` (Size: ${item.selectedSize})` : ""}
                    {item.selectedOther ? ` (${item.selectedOther})` : ""}
                  </span>
                  <span>₹{formatMoney(item.quantity * item.price)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2 mt-4 pt-4 border-t border-border/50 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{formatMoney(shipping)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Grand Total</span>
                <span>₹{formatMoney(grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Round Off</span>
                <span>{roundOffAmount >= 0 ? "+" : ""}₹{formatMoney(roundOffAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base">
                <span>Payable Amount (Rounded)</span>
                <span className="text-primary">₹{roundedPayable.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Write a review - only for delivered orders, uses POST /api/reviews */}
        {order.status === "delivered" && order.items.length > 0 && (
          <div className="mt-8 bg-card rounded-2xl border border-border/50 p-6">
            <h3 className="font-semibold mb-2">Write a review</h3>
            <p className="text-sm text-muted-foreground mb-4">
              You can add a review from your order history after the order is
              delivered.
            </p>
            <div className="mb-6">
              <Label className="text-sm">Order (delivered order ID)</Label>
              <Input
                readOnly
                value={order.id}
                className="rounded-xl mt-1 bg-muted/50 cursor-default"
              />
            </div>
            <div className="space-y-8">
              {order.items.map((item, idx) => {
                const existingReview = existingReviewsByProduct[item.productId];
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-border/50 p-6 bg-muted/20"
                  >
                    <p className="font-medium mb-4">{item.name}</p>
                    {existingReview ? (
                      <div className="rounded-lg border border-border/50 bg-background/50 p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Your review (read-only)
                        </p>
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-5 h-5 ${
                                existingReview.rating >= s
                                  ? "fill-amber-500 text-amber-500"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        {existingReview.comment && (
                          <p className="text-sm text-muted-foreground">
                            {existingReview.comment}
                          </p>
                        )}
                        {existingReview.createdAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(
                              existingReview.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <Label>Rating</Label>
                          <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() =>
                                  setReviewForProduct(
                                    item.productId,
                                    s,
                                    reviewByProduct[item.productId]?.comment ??
                                      "",
                                  )
                                }
                                className="p-1 rounded hover:bg-muted"
                              >
                                <Star
                                  className={`w-8 h-8 ${
                                    (reviewByProduct[item.productId]?.rating ??
                                      0) >= s
                                      ? "fill-amber-500 text-amber-500"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label>Comment (optional)</Label>
                          <Textarea
                            value={
                              reviewByProduct[item.productId]?.comment ?? ""
                            }
                            onChange={(e) =>
                              setReviewForProduct(
                                item.productId,
                                reviewByProduct[item.productId]?.rating ?? 5,
                                e.target.value,
                              )
                            }
                            placeholder="Share your experience..."
                            className="rounded-xl mt-1 min-h-[80px] resize-none bg-background"
                          />
                        </div>
                        <Button
                          className="rounded-xl"
                          disabled={
                            createReview.isPending ||
                            (reviewByProduct[item.productId]?.rating ?? 0) < 1
                          }
                          onClick={() =>
                            submitReview(item.productId, item.name)
                          }
                        >
                          {createReview.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Submit review
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
