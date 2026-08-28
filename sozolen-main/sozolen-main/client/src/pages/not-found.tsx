import { Link } from "wouter";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 z-0">
        <img
          src="/bg-img-1.webp"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="absolute inset-0 z-[1] bg-black/60 dark:bg-black/70" aria-hidden />

      <div className="absolute inset-0 pointer-events-none z-[2]">
        <motion.div
          className="absolute w-80 h-80 rounded-full bg-primary/20 blur-3xl"
          style={{ left: "8%", top: "18%" }}
          animate={{ x: [0, 28, 0], y: [0, -24, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-72 h-72 rounded-full bg-blue-500/20 blur-3xl"
          style={{ right: "10%", bottom: "15%" }}
          animate={{ x: [0, -30, 0], y: [0, 22, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/20 bg-black/40 backdrop-blur-md p-8 md:p-12 text-center text-white shadow-2xl"
      >
        <p className="text-sm tracking-[0.2em] font-semibold text-white/70">ERROR PAGE</p>
        <h1 className="mt-3 text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight">404</h1>
        <h2 className="mt-4 text-2xl sm:text-3xl font-semibold">Page not found</h2>
        <p className="mt-4 text-white/80 text-sm sm:text-base max-w-xl mx-auto">
          The page you are looking for does not exist or you do not have permission to access it.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-95 transition-opacity"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Home
          </Link>
          <Link
            href="/category"
            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-full border border-white/40 bg-white/10 text-white font-semibold hover:bg-white/15 transition-colors"
          >
            <Search className="w-4 h-4 mr-2" />
            Browse Products
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
