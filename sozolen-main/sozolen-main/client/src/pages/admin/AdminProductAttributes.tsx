import { Link } from "wouter";
import { Palette, Ruler, Sparkles, Truck } from "lucide-react";

const cards = [
  {
    title: "Colors",
    description: "Create and manage product color options.",
    href: "/admin/attributes/colors",
    icon: Palette,
  },
  {
    title: "Size",
    description: "Create and manage product size options.",
    href: "/admin/attributes/size",
    icon: Ruler,
  },
  {
    title: "Product decoration",
    description: "Create decoration options (LED light, design, etc).",
    href: "/admin/attributes/decoration",
    icon: Sparkles,
  },
  {
    title: "Shipping charge",
    description: "Configure warehouse pincode and KM-based charges.",
    href: "/admin/attributes/shipping-charge",
    icon: Truck,
  },
];

export default function AdminProductAttributes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Product Attributes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage reusable product attributes and shipping charge setup.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group block rounded-2xl border border-border/60 bg-card p-5 hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold group-hover:text-primary transition-colors">
                  {card.title}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {card.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
