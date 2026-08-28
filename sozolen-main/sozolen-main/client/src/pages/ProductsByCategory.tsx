import { useRoute } from "wouter";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useCategories, useProductsByCategory } from "@/hooks/use-categories";
import { useProductRatingsBatch } from "@/hooks/use-reviews";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import type { ProductCardData } from "@/components/ProductCard";
import { ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { PaginationControls } from "@/components/PaginationControls";
import { toUrlSlug } from "@/lib/product-path";

export default function ProductsByCategory() {
  const [, slugParams] = useRoute("/:categoryName");
  const [, legacyIdParams] = useRoute("/products/category/:id");
  const categorySlug = slugParams?.categoryName ?? "";
  const legacyCategoryId = legacyIdParams?.id ? Number(legacyIdParams.id) : null;
  const { data: categories } = useCategories();
  const category =
    (categories ?? []).find((c) => toUrlSlug(c.name) === categorySlug) ??
    (legacyCategoryId != null ? (categories ?? []).find((c) => c.id === legacyCategoryId) : undefined);
  const categoryId = category?.id ?? null;
  const { data: products, isLoading } = useProductsByCategory(categoryId);
  const productIds = (products ?? []).map((p) => p.id);
  const { data: ratingsBatch } = useProductRatingsBatch(productIds);
  const ratingMap = new Map((ratingsBatch ?? []).map((r) => [r.productId, r]));
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const pagedProducts = useMemo(() => {
    const list = products ?? [];
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [products, page]);

  if ((!categorySlug && legacyCategoryId == null) || (!isLoading && categories && !category)) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Invalid category.</p>
        <Link href="/category" className="ml-2 text-primary hover:underline">Back to categories</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <Link href="/category" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="w-4 h-4" /> Back to categories
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{category?.name ?? "Category"}</h1>
          <p className="text-lg text-muted-foreground">Products in this category.</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[300px] w-full rounded-xl" />
                <Skeleton className="h-6 w-2/3 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {pagedProducts.map((product, i) => {
              const rating = ratingMap.get(product.id);
              return (
                <ProductCard
                  key={product.id}
                  product={
                    {
                      id: product.id,
                      title: product.title,
                      description: product.description ?? "",
                      price: product.price,
                      categoryName: category?.name ?? null,
                      imageUrl:
                        (Array.isArray(product.productImages) && product.productImages[0]) ||
                        product.imageUrl ||
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
          <PaginationControls
            page={page}
            setPage={setPage}
            totalItems={products.length}
            pageSize={pageSize}
          />
          </>
        ) : (
          <p className="text-muted-foreground text-center py-12">No products in this category yet.</p>
        )}
      </div>
    </div>
  );
}
