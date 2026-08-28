import { Link, useRoute } from "wouter";
import { useProduct, useProducts } from "@/hooks/use-products";
import { useCategories, useProductsByCategory } from "@/hooks/use-categories";
import { useCart } from "@/store/cart";
import { ThreeViewer } from "@/components/ThreeViewer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import type { ProductCardData } from "@/components/ProductCard";
import { StarRating } from "@/components/StarRating";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useProductRating, useProductReviews } from "@/hooks/use-reviews";
import { ArrowLeft, Check, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useColorOptions, useOtherOptions, useSizeOptions } from "@/hooks/use-option-lists";
import NotFound from "@/pages/not-found";
import { getCategoryPath, toUrlSlug } from "@/lib/product-path";

export default function ProductDetail() {
  const [isIdRoute, idParams] = useRoute("/products/:id");
  const [isSlugRoute, slugParams] = useRoute("/:categoryName/:productName");
  const shouldResolveSlug = !isIdRoute && isSlugRoute;
  const idFromRoute = Number(idParams?.id ?? "");
  const { data: categories = [], isLoading: isCategoriesLoading } = useCategories();
  const { data: allProducts = [], isLoading: isAllProductsLoading } = useProducts(
    null,
    shouldResolveSlug,
  );
  const slugMatchedProductId = useMemo(() => {
    if (!shouldResolveSlug) return null;
    const categorySlug = toUrlSlug(slugParams?.categoryName ?? "");
    const productSlug = toUrlSlug(slugParams?.productName ?? "");
    if (!categorySlug || !productSlug) return null;

    const matched = allProducts.find((candidate) => {
      const candidateCategoryName =
        categories.find((category) => category.id === candidate.categoryId)?.name ?? "uncategorized";
      return (
        toUrlSlug(candidateCategoryName) === categorySlug &&
        toUrlSlug(candidate.title) === productSlug
      );
    });

    return matched?.id ?? null;
  }, [allProducts, categories, shouldResolveSlug, slugParams?.categoryName, slugParams?.productName]);
  const productId = isIdRoute ? idFromRoute : slugMatchedProductId ?? 0;
  const { data: product, isLoading: isProductLoading } = useProduct(productId);
  const { data: rating } = useProductRating(productId);
  const { data: reviews } = useProductReviews(productId);
  const { data: colorOptions = [] } = useColorOptions();
  const { data: sizeOptions = [] } = useSizeOptions();
  const { data: otherOptions = [] } = useOtherOptions();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedOther, setSelectedOther] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { data: categoryProducts } = useProductsByCategory(
    product?.categoryId ?? null,
  );
  const isLoading =
    isProductLoading ||
    (shouldResolveSlug && (isCategoriesLoading || isAllProductsLoading));
  const currentCategoryName =
    categories.find((category) => category.id === product?.categoryId)?.name ?? null;
  const backCategoryLabel = currentCategoryName ?? "Shop";
  const backCategoryHref = currentCategoryName ? getCategoryPath(currentCategoryName) : "/category";
  const relatedProducts = (categoryProducts ?? [])
    .filter((p) => p.id !== productId)
    .slice(0, 4);

  useEffect(() => {
    setSelectedColor("");
    setSelectedSize("");
    setSelectedOther("");
    setSelectedVariantId("");
    setActiveImageIndex(0);
  }, [productId]);

  const initialVariantInfo = (() => {
    if (!product || !product.hasVariants) {
      return { hasVariants: false, defaultVariantId: "" };
    }
    const variants = Array.isArray((product as { variants?: unknown }).variants)
      ? ((product as { variants?: unknown }).variants as Array<{
          id?: string;
          name?: string;
          price?: number;
          images?: string[];
          isDefault?: boolean;
          isActive?: boolean;
        }>)
          .map((variant, idx) => ({
            id: typeof variant.id === "string" ? variant.id : `variant-${idx + 1}`,
            name: typeof variant.name === "string" ? variant.name : `Variant ${idx + 1}`,
            price: Number(variant.price),
            images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
            isDefault: !!variant.isDefault,
            isActive: variant.isActive !== false,
          }))
          .filter(
            (variant) =>
              variant.name.trim().length > 0 &&
              Number.isFinite(variant.price) &&
              variant.price >= 0 &&
              variant.images.length > 0 &&
              variant.isActive,
          )
      : [];
    if (variants.length === 0) return { hasVariants: false, defaultVariantId: "" };
    const defaultVariantId = (variants.find((variant) => variant.isDefault) ?? variants[0]).id;
    return { hasVariants: true, defaultVariantId };
  })();

  useEffect(() => {
    if (!initialVariantInfo.hasVariants) return;
    if (selectedVariantId) return;
    if (initialVariantInfo.defaultVariantId) {
      setSelectedVariantId(initialVariantInfo.defaultVariantId);
    }
  }, [initialVariantInfo.hasVariants, initialVariantInfo.defaultVariantId, selectedVariantId]);

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12">
        <Skeleton className="h-[500px] rounded-3xl" />
        <div className="space-y-6 pt-10">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product) return <NotFound />;

  const canChooseColor =
    !!product.customerCanChooseColor &&
    colorOptions.length > 0;
  const canChooseSize =
    !!product.customerCanChooseSize &&
    (() => {
      const mode =
        product.sizeSelectionMode === "add" || product.sizeSelectionMode === "override"
          ? product.sizeSelectionMode
          : "inherit";
      const productSizes = Array.isArray(product.availableSizes)
        ? product.availableSizes
        : [];
      if (mode === "override") return productSizes.length > 0;
      if (mode === "add") return sizeOptions.length > 0 || productSizes.length > 0;
      return sizeOptions.length > 0;
    })();
  const canChooseOther =
    !!product.customerCanChooseOther &&
    otherOptions.length > 0;
  const variants =
    Array.isArray((product as { variants?: unknown }).variants)
      ? ((product as { variants?: unknown }).variants as Array<{
          id?: string;
          name?: string;
          price?: number;
          images?: string[];
          isDefault?: boolean;
          isActive?: boolean;
        }>)
          .map((variant, idx) => ({
            id: typeof variant.id === "string" ? variant.id : `variant-${idx + 1}`,
            name: typeof variant.name === "string" ? variant.name : `Variant ${idx + 1}`,
            price: Number(variant.price),
            images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
            isDefault: !!variant.isDefault,
            isActive: variant.isActive !== false,
          }))
          .filter(
            (variant) =>
              variant.name.trim().length > 0 &&
              Number.isFinite(variant.price) &&
              variant.price >= 0 &&
              variant.images.length > 0 &&
              variant.isActive,
          )
      : [];
  const hasVariants = !!product.hasVariants && variants.length > 0;
  const configuredDefaultVariant =
    variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;
  const currentVariant =
    (hasVariants
      ? variants.find((variant) => variant.id === selectedVariantId) ?? null
      : null) ?? configuredDefaultVariant;
  const orderedImages = hasVariants
    ? (currentVariant?.images ?? [])
    : Array.isArray(product.productImages) && product.productImages.length > 0
      ? product.productImages
      : product.imageUrl
        ? [product.imageUrl]
        : [];
  const activeImage = orderedImages[activeImageIndex] ?? orderedImages[0];
  const sizeChoices = (() => {
    const mode =
      product.sizeSelectionMode === "add" || product.sizeSelectionMode === "override"
        ? product.sizeSelectionMode
        : "inherit";
    const productSizes = Array.isArray(product.availableSizes)
      ? product.availableSizes
      : [];
    const globalSizes = sizeOptions.map((row) => row.name);
    if (mode === "override") return productSizes;
    if (mode === "add") return Array.from(new Set([...globalSizes, ...productSizes]));
    return globalSizes;
  })();
  const sizePrices =
    product.sizePrices && typeof product.sizePrices === "object" && !Array.isArray(product.sizePrices)
      ? (product.sizePrices as Record<string, unknown>)
      : {};
  const configuredDefaultSize =
    typeof product.defaultSize === "string" && sizeChoices.includes(product.defaultSize)
      ? product.defaultSize
      : "";
  const currentDisplaySize = selectedSize || configuredDefaultSize;
  const currentDisplayPrice = (() => {
    if (hasVariants && currentVariant) return currentVariant.price;
    if (!canChooseSize || !currentDisplaySize) return product.price;
    const amount = Number(sizePrices[currentDisplaySize]);
    return Number.isFinite(amount) && amount >= 0 ? amount : product.price;
  })();

  const handleAddToCart = () => {
    if (canChooseColor && !selectedColor) {
      toast({
        variant: "destructive",
        title: "Select a color",
        description: "Please choose a color before adding this item to cart.",
      });
      return;
    }
    if (canChooseSize && !selectedSize) {
      toast({
        variant: "destructive",
        title: "Select a size",
        description: "Please choose a size before adding this item to cart.",
      });
      return;
    }
    if (hasVariants && !selectedVariantId) {
      toast({
        variant: "destructive",
        title: "Select a variant",
        description: "Please choose a variant before adding this item to cart.",
      });
      return;
    }
    addItem({
      productId: product.id,
      name: product.title,
      price: hasVariants
        ? currentVariant?.price ?? product.price
        : canChooseSize
        ? (() => {
            const amount = Number(sizePrices[selectedSize]);
            return Number.isFinite(amount) && amount >= 0 ? amount : product.price;
          })()
        : product.price,
      imageUrl: orderedImages[0] || product.imageUrl,
      variantId: hasVariants ? selectedVariantId : null,
      variantName: hasVariants ? currentVariant?.name ?? null : null,
      selectedColor: canChooseColor ? selectedColor : null,
      selectedSize: canChooseSize ? selectedSize : null,
      selectedOther: canChooseOther ? selectedOther : null,
    });
    setAdded(true);
    toast({
      title: "Added to Cart",
      description: `${product.title} was added to your cart.`,
    });
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href={backCategoryHref}
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to {backCategoryLabel}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl overflow-hidden shadow-2xl shadow-black/5 bg-[#fbfbfd] dark:bg-[#111]"
            >
              {product.model3dUrl ? (
                <ThreeViewer url={product.model3dUrl} className="h-[500px]" />
              ) : (
                <img
                  src={activeImage || product.imageUrl}
                  alt={product.title}
                  className="w-full h-[500px] object-cover"
                />
              )}
            </motion.div>
            {!product.model3dUrl && orderedImages.length > 1 && (
              <div className="mt-4 grid grid-cols-5 gap-3">
                {orderedImages.map((imageUrl, idx) => (
                  <button
                    key={`${imageUrl}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`overflow-hidden rounded-xl border ${
                      idx === activeImageIndex
                        ? "border-primary"
                        : "border-border/50"
                    }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`${product.title} ${idx + 1}`}
                      className="h-20 w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col h-full"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {product.title}
            </h1>
            <div className="mt-3 flex items-center gap-2">
              {rating && rating.count > 0 ? (
                <StarRating
                  average={rating.average}
                  count={rating.count}
                  size="md"
                  showCount={true}
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  No reviews yet
                </span>
              )}
            </div>
            <p className="text-2xl font-medium mt-4 text-primary">
              ₹{currentDisplayPrice.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </p>
            {hasVariants && currentVariant && (
              <p className="text-xs text-muted-foreground mt-1">
                Showing price for variant: <span className="font-medium">{currentVariant.name}</span>
              </p>
            )}
            {canChooseSize && !selectedSize && configuredDefaultSize && (
              <p className="text-xs text-muted-foreground mt-1">
                Default shown for: <span className="font-medium">{configuredDefaultSize}</span>. Select a size to continue.
              </p>
            )}
            {product.overallSize && (
              <p className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Overall size:</span>{" "}
                {product.overallSize}
              </p>
            )}

            <div className="mt-8 prose prose-gray dark:prose-invert">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground text-base">
                {product.description
                  .split(/\r?\n/)
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line, idx) => {
                    const colonIndex = line.indexOf(":");
                    if (colonIndex > 0) {
                      const label = line.slice(0, colonIndex).trim();
                      const value = line.slice(colonIndex + 1).trim();
                      return (
                        <li key={idx} className="leading-relaxed">
                          <span className="font-semibold text-foreground">
                            {label}:
                          </span>{" "}
                          {value}
                        </li>
                      );
                    }
                    return (
                      <li key={idx} className="leading-relaxed">
                        {line}
                      </li>
                    );
                  })}
              </ul>
            </div>

            <div className="mt-12 space-y-4">
              {hasVariants && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Choose variant</label>
                  <div className="flex flex-wrap gap-3">
                    {variants.map((variant) => {
                      const isSelected = selectedVariantId === variant.id;
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(variant.id);
                            setActiveImageIndex(0);
                          }}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/60 hover:border-primary/60 bg-background"
                          }`}
                        >
                          {variant.name}
                        </button>
                      );
                    })}
                  </div>
                  {!selectedVariantId && (
                    <p className="text-xs text-muted-foreground">
                      Select one variant option.
                    </p>
                  )}
                </div>
              )}
              {canChooseColor && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Choose color</label>
                  <div className="flex flex-wrap gap-3">
                    {colorOptions.map((row) => {
                      const color = row.name;
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`relative h-9 w-9 rounded-md border transition-all ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/30"
                              : "border-border/60 hover:border-primary/60"
                          }`}
                          style={{ backgroundColor: color }}
                          aria-label={`Select color option`}
                          title="Color option"
                        >
                          {isSelected && (
                            <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!selectedColor && (
                    <p className="text-xs text-muted-foreground">
                      Select one color option.
                    </p>
                  )}
                </div>
              )}
              {canChooseSize && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Choose size</label>
                  <div className="flex flex-wrap gap-3">
                    {sizeChoices.map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/60 hover:border-primary/60 bg-background"
                          }`}
                        >
                          <span className="mr-2">{size}</span>
                          <span className="text-xs opacity-90">
                            ₹
                            {(() => {
                              const amount = Number(sizePrices[size]);
                              const value =
                                hasVariants && currentVariant
                                  ? currentVariant.price
                                  : Number.isFinite(amount) && amount >= 0
                                    ? amount
                                    : product.price;
                              return value.toLocaleString("en-IN", {
                                maximumFractionDigits: 2,
                              });
                            })()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {!selectedSize && (
                    <p className="text-xs text-muted-foreground">
                      Select one size option.
                    </p>
                  )}
                </div>
              )}
              {canChooseOther && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Choose option (e.g. light, design){" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {otherOptions.map((row) => {
                      const other = row.name;
                      const isSelected = selectedOther === other;
                      return (
                        <button
                          key={other}
                          type="button"
                          onClick={() => setSelectedOther(other)}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border/60 hover:border-primary/60 bg-background"
                          }`}
                        >
                          {other}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <Button
                onClick={handleAddToCart}
                size="lg"
                className={`w-full h-14 rounded-2xl text-lg font-semibold transition-all ${added ? "bg-green-500 hover:bg-green-600" : ""}`}
              >
                {added ? (
                  <>
                    <Check className="mr-2 w-5 h-5" /> Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 w-5 h-5" /> Add to Cart
                  </>
                )}
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-border grid grid-cols-2 gap-4 text-sm text-muted-foreground font-medium">
              <div>Free shipping over ₹5000</div>
              <div>Premium materials</div>
              <div>Secure packaging</div>
              <div>24/7 Support</div>
            </div>
          </motion.div>
        </div>

        {/* Reviews */}
        <div className="mt-20 pt-16 border-t border-border/50">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Reviews</h2>
          {rating && rating.count > 0 && (
            <div className="mb-8 p-6 rounded-2xl bg-muted/30 border border-border/50">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Overall rating
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold">
                  {rating.average.toFixed(1)}
                </span>
                <StarRating
                  average={rating.average}
                  count={0}
                  showCount={false}
                  size="md"
                />
                <span className="text-muted-foreground">
                  ({rating.count} {rating.count === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>
          )}
          {reviews && reviews.length > 0 ? (
            <div className="space-y-6 mb-10">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Customer reviews
              </p>
              {reviews.map((r) => {
                const displayName = r.customerName ?? "Custom user";
                const initial = displayName.charAt(0).toUpperCase();
                return (
                  <div
                    key={r.id}
                    className="bg-muted/20 rounded-xl p-4 border border-border/30"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 shrink-0 rounded-full">
                        <AvatarFallback className="rounded-full bg-primary/10 text-sm font-medium text-foreground">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{displayName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating
                            average={r.rating}
                            count={0}
                            showCount={false}
                            size="sm"
                          />
                          {r.createdAt && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {r.comment && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {r.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground mb-6">No reviews yet.</p>
          )}
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-16 border-t border-border/50">
            <h2 className="text-2xl font-bold tracking-tight mb-8">
              Related products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={
                    {
                      id: p.id,
                      title: p.title,
                      description: p.description ?? "",
                      price: p.price,
                      categoryName: currentCategoryName,
                      imageUrl:
                        (Array.isArray(p.productImages) &&
                          p.productImages[0]) ||
                        p.imageUrl ||
                        "",
                    } satisfies ProductCardData
                  }
                  index={i}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
