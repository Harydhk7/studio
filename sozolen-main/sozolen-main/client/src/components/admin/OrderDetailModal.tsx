import { useOrder, useUpdateOrder } from "@/hooks/use-orders";
import { useCreateAdminReview, useOrderReviewsForAdmin } from "@/hooks/use-reviews";
import { orderStatuses, paymentModes, paymentStatuses } from "@shared/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { openOrderInvoice } from "@/lib/invoice";

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

const paymentModeLabel = (mode: string) =>
  mode
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

interface OrderDetailModalProps {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailModal({
  orderId,
  open,
  onOpenChange,
}: OrderDetailModalProps) {
  const { data: order, isLoading } = useOrder(orderId);
  const productIds = order?.items?.map((i) => i.productId) ?? [];
  const orderReviewsByProduct = useOrderReviewsForAdmin(orderId ?? null, productIds);
  const updateOrder = useUpdateOrder();
  const createAdminReview = useCreateAdminReview();
  const { toast } = useToast();
  const [totalPrice, setTotalPrice] = useState(0);
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [reviewByProduct, setReviewByProduct] = useState<
    Record<number, { rating: number; comment: string }>
  >({});
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

  useEffect(() => {
    if (order) {
      setTotalPrice(order.totalPrice);
      setStatus(order.status);
      setPaymentStatus(order.paymentStatus);
      setPaymentMode(order.paymentMode ?? "");
      setAdminNotes(order.adminNotes ?? "");
    }
  }, [order]);

  const handleSave = async () => {
    if (orderId == null) return;
    try {
      await updateOrder.mutateAsync({
        id: orderId,
        totalPrice,
        status,
        paymentStatus,
        paymentMode: paymentMode || undefined,
        adminNotes: adminNotes || null,
      });
      toast({ title: "Order updated" });
      onOpenChange(false);
    } catch {
      toast({ variant: "destructive", title: "Failed to update order" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle>Order #{orderId}</DialogTitle>
          {order?.paymentStatus === "paid" && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl shrink-0"
              onClick={async () => {
                if (orderId == null) return;
                try {
                  await openOrderInvoice(orderId, getAuthHeaders());
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
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : order ? (
          <div className="space-y-6 pt-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Customer
              </h4>
              <p className="font-medium">{order.name}</p>
              <p className="text-sm text-muted-foreground">{order.email}</p>
              <p className="text-sm text-muted-foreground">{order.phone}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">
                Delivery address
              </h4>
              <p className="text-sm whitespace-pre-wrap">{order.address}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Items
              </h4>
              <div className="space-y-1">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                      {item.selectedColor ? ` (Color: ${item.selectedColor})` : ""}
                    </span>
                    <span>
                      ₹{formatMoney(item.quantity * item.price)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-1 mt-3 pt-3 border-t border-border/50 text-sm">
                {(() => {
                  const subtotal =
                    typeof order.subtotalPrice === "number"
                      ? order.subtotalPrice
                      : order.items.reduce(
                          (sum, item) => sum + item.quantity * item.price,
                          0,
                        );
                  const shipping =
                    typeof order.shippingCharge === "number"
                      ? order.shippingCharge
                      : 0;
                  const grandTotal =
                    typeof order.totalPrice === "number"
                      ? order.totalPrice
                      : subtotal + shipping;
                  const roundedPayable = Math.round(grandTotal);
                  const roundOffAmount = roundedPayable - grandTotal;
                  return (
                    <>
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
                        <span>
                          {roundOffAmount >= 0 ? "+" : ""}₹
                          {formatMoney(roundOffAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Payable Amount (Rounded)</span>
                        <span>₹{roundedPayable.toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            {productIds.some((pid) => (orderReviewsByProduct[pid]?.length ?? 0) > 0) && (
              <div className="border-t border-border/50 pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Customer reviews (this order)
                </h4>
                <div className="space-y-3">
                  {order.items.map((item, idx) => {
                    const reviews = orderReviewsByProduct[item.productId] ?? [];
                    if (reviews.length === 0) return null;
                    return (
                      <div key={idx} className="rounded-lg border border-border/50 p-3 bg-muted/20 text-sm">
                        <p className="font-medium mb-1">{item.name}</p>
                        {reviews.map((r) => (
                          <div key={r.id} className="flex flex-wrap items-center gap-2 text-muted-foreground">
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-4 h-4 ${r.rating >= s ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                                />
                              ))}
                            </div>
                            {r.customerName && <span>{r.customerName}</span>}
                            {r.comment && <span className="w-full mt-1 block">{r.comment}</span>}
                            {r.createdAt && (
                              <span className="text-xs">{new Date(r.createdAt).toLocaleDateString()}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="border-t border-border/50 pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Add review for product
              </h4>
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-border/50 p-3 bg-muted/20 space-y-2"
                  >
                    <p className="text-sm font-medium">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Rating:
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setReviewByProduct((prev) => ({
                                ...prev,
                                [item.productId]: {
                                  rating: s,
                                  comment: prev[item.productId]?.comment ?? "",
                                },
                              }))
                            }
                            className="p-0.5 rounded hover:bg-muted"
                          >
                            <Star
                              className={`w-5 h-5 ${
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
                    <Textarea
                      placeholder="Comment (required)"
                      value={reviewByProduct[item.productId]?.comment ?? ""}
                      onChange={(e) =>
                        setReviewByProduct((prev) => ({
                          ...prev,
                          [item.productId]: {
                            rating: prev[item.productId]?.rating ?? 5,
                            comment: e.target.value,
                          },
                        }))
                      }
                      className="rounded-lg min-h-[60px] resize-none text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-lg"
                        disabled={
                          addingProductId !== null ||
                          createAdminReview.isPending ||
                          (reviewByProduct[item.productId]?.rating ?? 0) < 1 ||
                          !(reviewByProduct[item.productId]?.comment?.trim())
                        }
                        onClick={async () => {
                          const r = reviewByProduct[item.productId];
                          const comment = r?.comment?.trim();
                          if (!comment) {
                            toast({
                              variant: "destructive",
                              title: "Rating and review comment are required.",
                            });
                            return;
                          }
                          if ((r?.rating ?? 0) < 1) {
                            toast({
                              variant: "destructive",
                              title: "Please select a rating (1–5 stars).",
                            });
                            return;
                          }
                          setAddingProductId(item.productId);
                          try {
                            await createAdminReview.mutateAsync({
                              productId: item.productId,
                              rating: r?.rating ?? 5,
                              comment,
                            });
                            toast({ title: "Review added" });
                            setReviewByProduct((prev) => {
                              const next = { ...prev };
                              delete next[item.productId];
                              return next;
                            });
                          } catch {
                            toast({
                              variant: "destructive",
                              title: "Failed to add review",
                            });
                          } finally {
                            setAddingProductId(null);
                          }
                        }}
                      >
                        {addingProductId === item.productId ||
                        createAdminReview.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Add review"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Total amount (₹)</Label>
                <Input
                  type="number"
                  step="any"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(Number(e.target.value) || 0)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        <Badge className={statusColors[s]}>{s}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment status</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        <Badge className={paymentStatusColors[s]}>{paymentStatusLabel(s)}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentModes.map((m) => (
                      <SelectItem key={m} value={m}>
                        {paymentModeLabel(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Admin notes / review</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this order..."
                  className="rounded-xl min-h-[80px] resize-none"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={updateOrder.isPending}
              className="w-full rounded-xl h-11"
            >
              {updateOrder.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save changes"
              )}
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground py-4">Order not found.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
