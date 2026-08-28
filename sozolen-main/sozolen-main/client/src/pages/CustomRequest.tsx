import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCustomRequest } from "@/hooks/use-custom-requests";
import { useUploadFile } from "@/hooks/use-uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useCustomerAddresses } from "@/hooks/use-customer-addresses";
import { UploadCloud, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  addressLine1: z.string().min(3, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(3, "Pincode is required"),
  description: z.string().min(10, "Please provide more details about your request"),
});

export default function CustomRequest() {
  const { toast } = useToast();
  const { customer } = useCustomerAuth();
  const { data: addresses } = useCustomerAddresses();
  const createRequest = useCreateCustomRequest();
  const uploadFile = useUploadFile();
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  });

  useEffect(() => {
    if (!customer) return;
    if (!getValues("name")) setValue("name", customer.name);
    if (!getValues("email")) setValue("email", customer.email);
    if (!getValues("phone")) setValue("phone", customer.phone ?? "");
    const defaultAddress = addresses?.find((a) => a.isDefault) ?? addresses?.[0];
    if (defaultAddress && !getValues("addressLine1")) {
      setValue("addressLine1", defaultAddress.addressLine1 ?? "");
      setValue("addressLine2", defaultAddress.addressLine2 ?? "");
      setValue("city", defaultAddress.city ?? "");
      setValue("state", defaultAddress.state ?? "");
      setValue("pincode", defaultAddress.pincode ?? "");
    }
  }, [customer, addresses, getValues, setValue]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of files) {
        const res = await uploadFile.mutateAsync(file);
        imageUrls.push(res.url);
      }
      
      const result = await createRequest.mutateAsync({
        name: data.name,
        email: data.email,
        phone: data.phone,
        description: data.description,
        imageUrls,
        address: [
          data.addressLine1,
          data.addressLine2,
          [data.city, data.state, data.pincode].filter(Boolean).join(", "),
        ]
          .filter(Boolean)
          .join(", "),
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || "",
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        ...(customer?.id ? { customerId: customer.id } : {}),
      });
      setTrackingId(`SOZOLEN3D-${result.id}`);
      setIsSuccess(true);
      toast({ title: "Request Sent!", description: "Check your email for confirmation and tracking ID." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit request." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/bg-img-1.webp" alt="" className="w-full h-full object-cover" aria-hidden />
          <div className="absolute inset-0 bg-background/80 dark:bg-background/90" aria-hidden />
        </div>
        <div className="text-center max-w-md mx-auto p-8 glass rounded-3xl relative z-10">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold tracking-tight mb-4">Request Received</h2>
          <p className="text-muted-foreground mb-4">Thank you for your custom request. We've sent a confirmation email with your tracking ID.</p>
          {trackingId && (
            <p className="mb-4 font-mono text-lg font-semibold text-primary">Tracking ID: {trackingId}</p>
          )}
          <p className="text-sm text-muted-foreground mb-6">You can track your request anytime at the Track page using this ID.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild className="rounded-full flex-1">
              <Link href="/track">Track request</Link>
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="rounded-full flex-1">Return Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/bg-img-1.webp" alt="" className="w-full h-full object-cover" aria-hidden />
        <div className="absolute inset-0 bg-background/80 dark:bg-background/90" aria-hidden />
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Custom Commission</h1>
          <p className="text-lg text-muted-foreground">Have a specific design in mind? Let us print it for you.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-card p-8 md:p-12 rounded-3xl shadow-xl shadow-black/5 border border-border/50">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input {...register("name")} className="h-12 rounded-xl" placeholder="Enter your full name" />
              {errors.name && <span className="text-sm text-destructive">{errors.name.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...register("email")} type="email" className="h-12 rounded-xl" placeholder="Enter your email address" />
              {errors.email && <span className="text-sm text-destructive">{errors.email.message}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phone</Label>
            <Input {...register("phone")} className="h-12 rounded-xl" placeholder="+91 98765 43210" />
            {errors.phone && <span className="text-sm text-destructive">{errors.phone.message}</span>}
          </div>

          <div className="space-y-2">
            <Label>Address line 1</Label>
            <Input {...register("addressLine1")} className="h-12 rounded-xl" placeholder="House no, street, area" />
            {errors.addressLine1 && <span className="text-sm text-destructive">{errors.addressLine1.message}</span>}
          </div>

          <div className="space-y-2">
            <Label>Address line 2 (optional)</Label>
            <Input {...register("addressLine2")} className="h-12 rounded-xl" placeholder="Landmark, apartment, suite" />
            {errors.addressLine2 && <span className="text-sm text-destructive">{errors.addressLine2.message}</span>}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>City</Label>
              <Input {...register("city")} className="h-12 rounded-xl" placeholder="City" />
              {errors.city && <span className="text-sm text-destructive">{errors.city.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input {...register("state")} className="h-12 rounded-xl" placeholder="State" />
              {errors.state && <span className="text-sm text-destructive">{errors.state.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Pincode</Label>
              <Input {...register("pincode")} className="h-12 rounded-xl" placeholder="Pincode" />
              {errors.pincode && <span className="text-sm text-destructive">{errors.pincode.message}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} className="min-h-[150px] rounded-xl resize-none" placeholder="Describe the model, dimensions, colors, and any specific requirements..." />
            {errors.description && <span className="text-sm text-destructive">{errors.description.message}</span>}
          </div>

          <div className="space-y-2">
            <Label>Reference Images (Optional)</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <UploadCloud className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Click or drag images to upload</p>
              {files.length > 0 && (
                <p className="mt-2 text-sm text-primary">{files.length} file(s) selected</p>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-xl text-lg font-semibold mt-4">
            {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...</> : "Submit Request"}
          </Button>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already submitted? <Link href="/track" className="text-primary font-medium hover:underline">Track your request</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
