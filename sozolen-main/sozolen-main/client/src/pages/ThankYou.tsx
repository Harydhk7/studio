import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";

export default function ThankYou() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const orderId = params.get("order");

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#fbfbfd] dark:bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-card p-8 md:p-12 rounded-3xl shadow-xl shadow-black/5 border border-border/50">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">Thank you for your order!</h1>
          <p className="text-muted-foreground mb-6">
            Your order has been placed successfully. We&apos;ll get started on it right away.
          </p>
          {orderId && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
              <Package className="w-4 h-4" />
              <span>Order #{orderId}</span>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {orderId && (
              <Button asChild className="rounded-xl" size="lg">
                <Link href={`/profile/orders/${orderId}`}>
                  View order details
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
            <Button asChild variant={orderId ? "outline" : "default"} className="rounded-xl" size="lg">
              <Link href="/">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
