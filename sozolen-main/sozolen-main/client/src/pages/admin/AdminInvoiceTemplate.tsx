import { useInvoiceTemplate, useSaveInvoiceTemplate } from "@/hooks/use-invoice-template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FileText, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

type TemplateForm = {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  footerText: string;
};

const SAMPLE_ORDER = {
  id: 12345,
  name: "Sample Customer",
  email: "customer@example.com",
  phone: "+91 98765 43210",
  address: "123, Sample Street\nCity, State - 560001",
  items: [
    { name: "Sample Product A", quantity: 2, price: 499, selectedColor: "White", selectedSize: null, selectedOther: null },
    { name: "Sample Product B", quantity: 1, price: 1299, selectedColor: null, selectedSize: "Medium", selectedOther: null },
  ],
  totalPrice: 2297,
  date: new Date().toISOString().slice(0, 10),
};

function InvoicePreview({ form }: { form: TemplateForm }) {
  const showAddress = form.address.trim().length > 0;
  const showPhone = form.phone.trim().length > 0;
  const showEmail = form.email.trim().length > 0;

  return (
    <div className="rounded-2xl border border-border/50 bg-white text-black shadow-sm overflow-hidden">
      <div className="p-6 max-w-[480px] mx-auto">
        <div className="flex justify-between items-start gap-4 mb-6 pb-4 border-b border-gray-200">
          <div>
            <img src="/website-logo.png" alt="Logo" className="max-h-12 mb-2 object-contain" />
            {!!form.companyName.trim() && (
              <h1 className="text-lg font-bold">{form.companyName}</h1>
            )}
            {showAddress && (
              <p className="text-xs text-gray-600 whitespace-pre-wrap mt-1">
                {form.address}
              </p>
            )}
            {showPhone && (
              <p className="text-xs text-gray-600">Phone: {form.phone}</p>
            )}
            {showEmail && (
              <p className="text-xs text-gray-600">Email: {form.email}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold text-gray-800">INVOICE</h2>
            <p className="text-sm font-medium">#{SAMPLE_ORDER.id}</p>
            <p className="text-xs text-gray-600">Date: {SAMPLE_ORDER.date}</p>
          </div>
        </div>

        <p className="text-xs font-medium text-gray-700 mb-1">Bill To</p>
        <p className="text-sm text-gray-800 mb-4">
          {SAMPLE_ORDER.name}<br />
          {SAMPLE_ORDER.email}<br />
          {SAMPLE_ORDER.phone}<br />
          <span className="whitespace-pre-wrap">{SAMPLE_ORDER.address}</span>
        </p>

        <table className="w-full text-sm border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-200 p-2 text-left font-medium">Item</th>
              <th className="border border-gray-200 p-2 text-center font-medium w-14">Qty</th>
              <th className="border border-gray-200 p-2 text-right font-medium">Unit</th>
              <th className="border border-gray-200 p-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_ORDER.items.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-gray-200 p-2">
                  {item.name}
                  {item.selectedColor ? ` (Color: ${item.selectedColor})` : ""}
                  {item.selectedSize ? ` (Size: ${item.selectedSize})` : ""}
                </td>
                <td className="border border-gray-200 p-2 text-center">{item.quantity}</td>
                <td className="border border-gray-200 p-2 text-right">₹{item.price.toLocaleString()}</td>
                <td className="border border-gray-200 p-2 text-right">₹{(item.quantity * item.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-sm font-bold text-right mt-3">Total: ₹{SAMPLE_ORDER.totalPrice.toLocaleString()}</p>

        {!!form.footerText.trim() && (
          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600">
            {form.footerText}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminInvoiceTemplate() {
  const { data: template, isLoading } = useInvoiceTemplate();
  const saveTemplate = useSaveInvoiceTemplate();
  const { toast } = useToast();
  const { register, handleSubmit, reset, watch } = useForm<TemplateForm>({
    defaultValues: {
      companyName: "",
      address: "",
      phone: "",
      email: "",
      footerText: "",
    },
  });

  const formValues = watch();

  useEffect(() => {
    if (template) {
      reset({
        companyName: template.companyName ?? "",
        address: template.address ?? "",
        phone: template.phone ?? "",
        email: template.email ?? "",
        footerText: template.footerText ?? "",
      });
    }
  }, [template, reset]);

  const onSubmit = async (data: TemplateForm) => {
    try {
      await saveTemplate.mutateAsync({
        companyName: data.companyName,
        address: data.address,
        phone: data.phone,
        email: data.email,
        footerText: data.footerText,
      });
      toast({ title: "Saved", description: "Invoice template updated." });
    } catch {
      toast({ variant: "destructive", title: "Failed to save template" });
    }
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Invoice Template" columns={1} rows={6} />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
        <FileText className="w-8 h-8" />
        Invoice Template
      </h1>
      <p className="text-muted-foreground mb-8">
        Customize the invoice that is generated when an order is marked as paid.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Info / Form */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
            <Info className="w-5 h-5" />
            Info
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label>Company name</Label>
              <Input {...register("companyName")} className="rounded-xl" placeholder="SOZOLEN 3D" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea {...register("address")} className="rounded-xl resize-none" rows={3} placeholder="Your business address" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input {...register("phone")} className="rounded-xl" placeholder="+91 ..." />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register("email")} type="email" className="rounded-xl" placeholder="contact@example.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Footer text</Label>
              <Textarea {...register("footerText")} className="rounded-xl resize-none" rows={2} placeholder="Thank you for your order!" />
            </div>
            <Button type="submit" disabled={saveTemplate.isPending} className="rounded-xl">
              {saveTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save template"}
            </Button>
          </form>
        </div>

        {/* Right: Invoice preview */}
        <div className="rounded-2xl border border-border/50 bg-muted/30 p-6 shadow-sm sticky top-24">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" />
            Invoice preview
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sample invoice with your template. Changes update live.
          </p>
          <InvoicePreview form={formValues} />
        </div>
      </div>
    </div>
  );
}
