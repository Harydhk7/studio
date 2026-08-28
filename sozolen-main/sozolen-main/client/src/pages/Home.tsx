import { Link } from "wouter";
import { motion } from "framer-motion";
import { Hero } from "@/components/Hero";
import { PrinterInfo } from "@/components/PrinterInfo";
import { FeatureCard } from "@/components/FeatureCard";
import { CustomRequestForm } from "@/components/CustomRequestForm";
import { useCategories } from "@/hooks/use-categories";
import { useHomeSliderProducts } from "@/hooks/use-products";
import { usePublicSiteConfig } from "@/hooks/use-site-config";
import { Target, Zap, Palette, ArrowRight } from "lucide-react";
import { getCategoryPath, getProductPath } from "@/lib/product-path";

const WHY_CHOOSE = [
  { icon: Target, title: "Precision Printing", description: "Every model is printed using advanced calibration and high resolution layers." },
  { icon: Zap, title: "Fast Production", description: "Rapid printing speeds allow us to deliver models quickly without compromising quality." },
  { icon: Palette, title: "Custom Creations", description: "We can bring your unique designs to life using modern 3D printing technology." },
];

export default function Home() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: sliderProducts } = useHomeSliderProducts(12);
  const { data: siteConfig } = usePublicSiteConfig();
  const topOrdered = sliderProducts?.topOrdered ?? [];
  const recent = sliderProducts?.recent ?? [];
  const categoryNameById = new Map((categories ?? []).map((category) => [category.id, category.name]));

  return (
    <div className="min-h-screen pt-16">
      <Hero />

     

      {/* Shop by Category */}
      {categories && categories.length > 0 && (
        <section className="py-20 border-t border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Shop by Category</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Choose a category to explore our 3D printed models.</p>
            </motion.div>
            {!categoriesLoading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categories.map((category, i) => (
                  <motion.div key={category.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                    <Link href={getCategoryPath(category.name)} className="block group">
                      <div className="rounded-xl border border-border/50 bg-card overflow-hidden shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-0.5">
                        <div className="relative aspect-square overflow-hidden bg-muted/30">
                          <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white border border-white/60 bg-black/45 backdrop-blur-sm rounded-full px-3 py-1.5">
                              View Category <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </span>
                          </div>
                        </div>
                        <div className="p-4 text-center">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">{category.name}</h3>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Banner below Shop by Category */}
      {siteConfig?.bannerImageUrl && (
        <section className="pb-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-border/50 shadow-sm"
            >
              {siteConfig.bannerLinkUrl ? (
                <a href={siteConfig.bannerLinkUrl} target="_blank" rel="noreferrer">
                  <img
                    src={siteConfig.bannerImageUrl}
                    alt="Banner"
                    className="w-full h-[180px] md:h-[240px] object-cover"
                  />
                </a>
              ) : (
                <img
                  src={siteConfig.bannerImageUrl}
                  alt="Banner"
                  className="w-full h-[180px] md:h-[240px] object-cover"
                />
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* Product Slider */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-center">Customer Favorites You Will Love</h2>
        <p className="text-muted-foreground max-w-xl mx-auto text-center">Explore our best-loved creations, handpicked from what customers are ordering most right now.</p>
      </div>
      {(topOrdered.length > 0 || recent.length > 0) && (
        <section className="py-10 border-t border-border/50">
          <div className="space-y-4">
            {/* Top Ordered */}
            {topOrdered.length > 0 && (
              <div className="home-slider-row">
                <div className="home-slider-track">
                  {[...topOrdered, ...topOrdered].map((product, idx) => {
                    const imageUrl =
                      (Array.isArray(product.productImages) &&
                        product.productImages[0]) ||
                      product.imageUrl;
                      return (
                        <Link
                          key={`top-${product.id}-${idx}`}
                          href={getProductPath(categoryNameById.get(product.categoryId ?? -1), product.title)}
                          className="home-slider-card"
                        >
                          
                          <img
                            src={imageUrl}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                          
                        </Link>
                      );
                  })}
                </div>
              </div>
            )}
            {/* Recent */}
            {recent.length > 0 && (
              <div className="home-slider-row">
                <div className="home-slider-track home-slider-track-reverse">
                  {[...recent, ...recent].map((product, idx) => {
                    const imageUrl =
                      (Array.isArray(product.productImages) &&
                        product.productImages[0]) ||
                      product.imageUrl;
                    return (
                      <Link
                        key={`recent-${product.id}-${idx}`}
                        href={getProductPath(categoryNameById.get(product.categoryId ?? -1), product.title)}
                        className="home-slider-card"
                      >
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <PrinterInfo />

      {/* Why Choose SOZOLEN 3D - bg-img-2 as background */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/bg-img-2.webp" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/85 dark:bg-background/90" aria-hidden />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Why Choose SOZOLEN 3D</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Quality and care in every print.</p>
          </motion.div>
          <div id="why-choose" className="grid grid-cols-1 md:grid-cols-3 gap-8 scroll-mt-24">
            {WHY_CHOOSE.map((item, i) => (
              <FeatureCard key={item.title} icon={item.icon} title={item.title} description={item.description} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Custom Commission - animated background with Bambu Lab imagery */}
      <section id="custom-request" className="py-24 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/bg-img-1.webp" alt="" className="w-full h-full object-cover" aria-hidden />
          <div className="absolute inset-0 bg-background/75 dark:bg-background/85" aria-hidden />
        </div>
        <div className="relative z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Need a Custom 3D Print?</h2>
            <p className="text-muted-foreground">
              Upload your design or describe your idea and our team will transform it into a high-quality 3D printed model.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border/50 bg-card p-6 sm:p-10 shadow-sm"
          >
            <CustomRequestForm />
          </motion.div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Prefer a full form? <Link href="/custom" className="text-primary font-medium hover:underline">Open custom request page</Link>.
          </p>
        </div>
      </div>
      </section>
    </div>
  );
}
