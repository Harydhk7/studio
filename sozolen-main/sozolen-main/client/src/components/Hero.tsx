import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { HeroScene } from "@/components/HeroScene";
import { Suspense } from "react";

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 pb-32">
      {/* Background image - bg-img-1.webp */}
      <div className="absolute inset-0 z-0">
        <img
          src="/bg-img-1.webp"
          alt=""
          className="w-full h-full object-cover brightness-[0.75] saturate-[0.9] dark:brightness-[0.62]"
        />
      </div>
      {/* 3D models animation in background */}
      <Suspense fallback={null}>
        <HeroScene />
      </Suspense>
      {/* Overlay for text readability */}
      <div
        className="absolute inset-0 z-[1] bg-black/62 dark:bg-black/72 pointer-events-none"
        aria-hidden
      />
      {/* Gradient orbs for extra depth */}
      <div className="absolute inset-0 pointer-events-none z-[2]">
        <motion.div
          className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl"
          style={{ left: "10%", top: "20%" }}
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-primary/3 blur-3xl"
          style={{ right: "15%", top: "40%" }}
          animate={{ x: [0, -25, 0], y: [0, 15, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center"
        style={{ textShadow: "0 2px 14px rgba(0,0,0,0.5)" }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-[hsl(var(--theme-dark-foreground))]"
        >
          Reality, <br />
          <span className="text-primary">printed.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-lg sm:text-xl md:text-2xl text-[hsl(var(--theme-dark-foreground)/0.86)] max-w-2xl mx-auto font-medium leading-relaxed"
        >
          Premium 3D printed models crafted with precision using the Bambu Lab
          A1 3D Printer. From custom figurines to functional designs, we turn
          digital ideas into real-world creations.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/category"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-95 transition-opacity shadow-lg shadow-primary/25 hover:shadow-primary/30"
          >
            Shop Collection <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
          <Link
            href="/custom"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full border-2 border-white/50 bg-black/35 text-[hsl(var(--theme-dark-foreground))] font-semibold hover:bg-black/50 transition-colors"
          >
            Request Custom
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
