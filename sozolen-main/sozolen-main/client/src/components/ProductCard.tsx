import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { getProductPath } from "@/lib/product-path";

export interface ProductCardData {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryName?: string | null;
  ratingAverage?: number;
  ratingCount?: number;
}

interface ProductCardProps {
  product: ProductCardData;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const detailPath = getProductPath(product.categoryName, product.title);

  return (
    <motion.div
      className="h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
    >
      <Link href={detailPath} className="block group h-full">
        <motion.div
          className="h-full rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-black/5 group-hover:-translate-y-1 group-hover:border-primary/20 flex flex-col"
          whileHover={{ transition: { duration: 0.2 } }}
        >
          <div className="aspect-[4/3] overflow-hidden bg-muted/30">
            <motion.img
              src={product.imageUrl || "https://images.unsplash.com/photo-1616423640778-28d1b53229bd?w=800&auto=format&fit=crop"}
              alt={product.title}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          </div>
          <div className="p-5 flex flex-1 flex-col">
            <h3 className="font-semibold text-lg tracking-tight group-hover:text-primary transition-colors">
              {product.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {product.description}
            </p>
            <div className="mt-auto pt-4 flex items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                {(product.ratingAverage != null && product.ratingCount != null && product.ratingCount > 0) && (
                  <StarRating average={product.ratingAverage} count={product.ratingCount} size="sm" />
                )}
                <span className="font-semibold text-primary">₹{product.price.toLocaleString()}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1.5 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shrink-0">
                View Product <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}
