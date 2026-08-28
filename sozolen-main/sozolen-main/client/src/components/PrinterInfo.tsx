import { motion } from "framer-motion";
import { Zap, Ruler, Settings2, CheckCircle2 } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";

const FEATURES = [
  { icon: Zap, title: "High-speed printing", description: "Produce models quickly without sacrificing detail or strength." },
  { icon: Ruler, title: "Ultra-precise layer resolution", description: "Fine layer heights for smooth surfaces and accurate dimensions." },
  { icon: Settings2, title: "Smart calibration system", description: "Automatic bed leveling and flow calibration for consistent results." },
  { icon: CheckCircle2, title: "Consistent print quality", description: "Reliable output every time, from first layer to last." },
];

export function PrinterInfo() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
              Powered by Bambu Lab A1
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              The Bambu Lab A1 is a next-generation 3D printer designed for speed, precision, and reliability. With automatic calibration, intelligent flow control, and high-speed printing, it enables us to create highly detailed models with exceptional quality.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map((f, i) => (
                <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-2xl overflow-hidden bg-card border border-border/50 shadow-lg aspect-[4/3] max-h-[480px]"
          >
            <img
              src="/printer_image.png"
              alt="Bambu Lab A1 3D Printer"
              className="w-full h-full object-cover object-center"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
