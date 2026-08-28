import { Link } from "wouter";
import { useCategories } from "@/hooks/use-categories";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/PaginationControls";
import { ArrowRight } from "lucide-react";
import { getCategoryPath } from "@/lib/product-path";

export default function Products() {
  const { data: categories, isLoading } = useCategories();
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const pagedCategories = useMemo(() => {
    const list = categories ?? [];
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [categories, page]);

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Shop by Category</h1>
          <p className="text-lg text-muted-foreground">Choose a category to explore our 3D printed models.</p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {pagedCategories.map((category, i) => (
              <motion.div
                className="h-full"
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Link href={getCategoryPath(category.name)} className="block group h-full">
                  <div className="h-full rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-primary/20 flex flex-col">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted/30">
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white border border-white/60 bg-black/45 backdrop-blur-sm rounded-full px-3 py-1.5">
                          View Category <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                    <div className="p-4 text-center flex flex-1 flex-row justify-center items-center">
                      <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                        {category.name}
                      </h2>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
          <PaginationControls
            page={page}
            setPage={setPage}
            totalItems={categories.length}
            pageSize={pageSize}
          />
          </>
        ) : (
          <p className="text-center text-muted-foreground py-12">No categories yet. Check back soon.</p>
        )}
      </div>
    </div>
  );
}
