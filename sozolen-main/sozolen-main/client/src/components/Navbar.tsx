import { Link, useLocation } from "wouter";
import { ShoppingBag, Menu, X, User, Sun, Moon } from "lucide-react";
import { useCart } from "@/store/cart";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DARK_KEY = "solozzen-3d-dark";

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    const stored = localStorage.getItem(DARK_KEY);
    const preferDark =
      stored === "true" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", preferDark);
    setDark(preferDark);
  }, []);

  const toggle = () => {
    const isNowDark = document.documentElement.classList.toggle("dark");
    setDark(isNowDark);
    localStorage.setItem(DARK_KEY, String(isNowDark));
  };

  return { dark, toggle };
}

export function Navbar() {
  const [location] = useLocation();
  const cartItems = useCart((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const { customer } = useCustomerAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dark, toggle } = useDarkMode();

  const links = [
    { href: "/", label: "Home" },
    { href: "/category", label: "Store" },
    { href: "/custom", label: "Custom Request" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4 min-h-16">
          <div className="flex items-center shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight hover:opacity-80 transition-opacity"
            >
              <img
                src="/favicon.png"
                alt="SOZOLEN logo"
                className="h-7 w-7 rounded-sm object-contain"
              />
              <span>SOZOLEN 3D</span>
            </Link>
          </div>

          {/* Desktop Nav - centered */}
          <nav className="hidden md:flex items-center justify-center flex-1 space-x-8">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary whitespace-nowrap ${
                  location === link.href ? "text-primary" : "text-foreground/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: auth, theme, cart, mobile menu - aligned in a row */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
            {customer ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <User className="w-5 h-5 shrink-0" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium px-2 sm:px-3 py-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 whitespace-nowrap"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium px-2 sm:px-3 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 whitespace-nowrap"
                >
                  Register
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={toggle}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <Link
              href="/cart"
              className="relative p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors shrink-0"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-primary rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t border-border/50"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    location === link.href
                      ? "text-primary bg-primary/5"
                      : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {customer ? (
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-primary/5"
                >
                  Profile
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-primary/5"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-primary hover:bg-primary/5"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
