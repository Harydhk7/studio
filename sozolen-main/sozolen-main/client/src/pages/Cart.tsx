import { useCart } from "@/store/cart";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useProducts } from "@/hooks/use-products";
import { useProductRatingsBatch } from "@/hooks/use-reviews";
import { ProductCard } from "@/components/ProductCard";
import type { ProductCardData } from "@/components/ProductCard";

export default function Cart() {
  const { items, updateQuantity, removeItem, getTotal } = useCart();
  const [, setLocation] = useLocation();
  const { data: allProducts } = useProducts();
  const cartProductIds = new Set(items.map((i) => i.productId));
  const candidateProducts = (allProducts ?? []).filter(
    (p) => !cartProductIds.has(p.id),
  );
  const candidateIds = candidateProducts.map((p) => p.id);
  const { data: ratingsBatch } = useProductRatingsBatch(candidateIds);
  const ratingMap = new Map((ratingsBatch ?? []).map((r) => [r.productId, r]));
  const recommended = [...candidateProducts]
    .sort(
      (a, b) =>
        (ratingMap.get(b.id)?.average ?? 0) -
        (ratingMap.get(a.id)?.average ?? 0),
    )
    .slice(0, 4);

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center pt-20 px-4 text-center">
        <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mb-8">
          <Trash2 className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-4">
          Your cart is empty
        </h2>
        <p className="text-muted-foreground mb-8">
          Looks like you haven't added any models yet.
        </p>
        <Link href="/category">
          <Button className="rounded-full px-8 h-12">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight mb-12">
          Shopping Cart
        </h1>

        <div className="grid md:grid-cols-[minmax(0,1fr)_330px] lg:grid-cols-[minmax(0,1fr)_360px] gap-8 lg:gap-10">
          <div className="space-y-6">
            {items.map((item, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={item.itemKey}
                className="flex items-center gap-6 bg-card p-4 rounded-3xl shadow-sm border border-border/50"
              >
                <div className="w-24 h-24 bg-muted rounded-2xl flex-shrink-0 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    {item.variantName && <p>Variant: {item.variantName}</p>}
                    {item.selectedColor && <p>Color: {item.selectedColor}</p>}
                    {item.selectedSize && <p>Size: {item.selectedSize}</p>}
                    {item.selectedOther && <p>Option: {item.selectedOther}</p>}
                  </div>
                  <p className="text-muted-foreground mt-1 font-medium">
                    ₹{item.price.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-muted/50 rounded-full p-1">
                  <button
                    onClick={() =>
                      updateQuantity(item.itemKey, item.quantity - 1)
                    }
                    className="p-2 hover:bg-background rounded-full transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-4 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.itemKey, item.quantity + 1)
                    }
                    className="p-2 hover:bg-background rounded-full transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.itemKey)}
                  className="p-3 text-muted-foreground hover:text-destructive transition-colors mr-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="h-fit sticky top-24">
            <div className="rounded-3xl border border-border/50 bg-card shadow-xl shadow-black/[0.05] overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/50">
                <h2 className="text-xl font-bold">Order Summary</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {items.length} item{items.length > 1 ? "s" : ""} in your cart
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    ₹{getTotal().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                    Calculated at checkout
                  </span>
                </div>

                <div className="pt-4 border-t border-dashed border-border flex justify-between items-end">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-2xl font-bold tracking-tight text-primary">
                    ₹{getTotal().toLocaleString()}
                  </span>
                </div>

                <Button
                  onClick={() => setLocation("/checkout")}
                  className="w-full h-14 rounded-2xl text-sm md:text-base font-semibold group shadow-md hover:shadow-lg transition-all inline-flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>

                <p className="text-[11px] text-muted-foreground text-center">
                  Secure checkout • Address required • Pay status managed by
                  admin
                </p>
              </div>
            </div>
          </div>
        </div>

        {recommended.length > 0 && (
          <div className="mt-16 pt-12 border-t border-border/50">
            <h2 className="text-2xl font-bold tracking-tight mb-8">
              Recommended for you
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Based on customer ratings
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommended.map((p, i) => {
                const rating = ratingMap.get(p.id);
                return (
                  <ProductCard
                    key={p.id}
                    product={
                      {
                        id: p.id,
                        title: p.title,
                        description: p.description ?? "",
                        price: p.price,
                        imageUrl:
                          (Array.isArray(p.productImages) &&
                            p.productImages[0]) ||
                          p.imageUrl ||
                          "",
                        ratingAverage: rating?.average,
                        ratingCount: rating?.count,
                      } satisfies ProductCardData
                    }
                    index={i}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
