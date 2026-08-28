import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

const FOOTER_SECTIONS = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/#powered-by-bambu-lab" },
      { label: "Why SOZOLEN 3D", href: "/#why-choose" },
    ],
  },
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Request Custom 3D Print", href: "/custom" },
      { label: "Track your request", href: "/track" },

    ],
  },
  
  {
    title: "Contact",
    links: [
      { label: "Instagram", href: "https://www.instagram.com/sozolen_3d?igsh=MXMyaDFtaW9wc3F1", external: true },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[#fbfbfd] dark:bg-[#0a0a0a] border-t border-border mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-2">
            <img
              src="/website-logo.png"
              alt="SOZOLEN 3D Logo"
              className="h-32 w-32 rounded-xl object-contain mb-3 p-2 bg-white ring-1 ring-border shadow-sm"
            />
            <h3 className="text-lg font-semibold tracking-tight">SOZOLEN 3D</h3>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Premium 3D printed models and custom commissions. Crafted with precision and passion.
            </p>
          </div>
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        {link.label}
                      </a>
                    ) : link.href.startsWith("/#") ? (
                      <a href={link.href} className="hover:text-primary transition-colors">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="hover:text-primary transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© 2026 SOZOLEN 3D. All rights reserved.</p>
          <p>
            Designed and developed by{" "}
            <a
              href="https://arasug.netlify.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline transition-colors"
            >
              Arasu
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
