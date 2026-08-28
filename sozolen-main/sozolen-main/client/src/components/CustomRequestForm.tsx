import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateCustomRequest } from "@/hooks/use-custom-requests";
import { useUploadFile } from "@/hooks/use-uploads";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useCustomerAddresses } from "@/hooks/use-customer-addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().min(1, "Email is required").email("Valid email is required"),
  phone: z.string().min(10, "Mobile number is required"),
  addressLine1: z.string().min(3, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(3, "Pincode is required"),
  description: z.string().min(10, "Please describe your idea or upload design details"),
});

export function CustomRequestForm() {
  const { toast } = useToast();
  const { customer } = useCustomerAuth();
  const { data: addresses } = useCustomerAddresses();
  const createRequest = useCreateCustomRequest();
  const uploadFile = useUploadFile();
  const [files, setFiles] = useState<File[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const { register, handleSubmit, setValue, getValues, formState: { errors, isSubmitting } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
      setSubmitted(true);
      toast({ title: "Request sent", description: "Check your email for confirmation and tracking ID." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to submit request." });
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
        <h3 className="font-semibold text-lg mb-2">Request received</h3>
        <p className="text-sm text-muted-foreground mb-2">We've sent a confirmation email. You can track your request using the ID below.</p>
        {trackingId && (
          <p className="font-mono font-semibold text-primary mb-4">Tracking ID: {trackingId}</p>
        )}
        <Link href="/track">
          <span className="text-sm font-medium text-primary hover:underline">Track your request →</span>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...register("name")} className="rounded-xl h-11" placeholder="Enter your full name" />
          {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
        </div>
        <div className="space-y-2">
          <Label>Email (required)</Label>
          <Input {...register("email")} type="email" className="rounded-xl h-11" placeholder="Enter your email address" />
          {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Mobile number (required)</Label>
        <Input {...register("phone")} type="tel" className="rounded-xl h-11" placeholder="e.g. 9876543210" />
        {errors.phone && <span className="text-xs text-destructive">{errors.phone.message}</span>}
      </div>
      <div className="space-y-2">
        <Label>Address line 1 (required)</Label>
        <Input {...register("addressLine1")} className="rounded-xl h-11" placeholder="House no, street, area" />
        {errors.addressLine1 && <span className="text-xs text-destructive">{errors.addressLine1.message}</span>}
      </div>
      <div className="space-y-2">
        <Label>Address line 2 (optional)</Label>
        <Input {...register("addressLine2")} className="rounded-xl h-11" placeholder="Landmark, apartment, suite" />
        {errors.addressLine2 && <span className="text-xs text-destructive">{errors.addressLine2.message}</span>}
      </div>
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>City</Label>
          <Input {...register("city")} className="rounded-xl h-11" placeholder="City" />
          {errors.city && <span className="text-xs text-destructive">{errors.city.message}</span>}
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Input {...register("state")} className="rounded-xl h-11" placeholder="State" />
          {errors.state && <span className="text-xs text-destructive">{errors.state.message}</span>}
        </div>
        <div className="space-y-2">
          <Label>Pincode</Label>
          <Input {...register("pincode")} className="rounded-xl h-11" placeholder="Pincode" />
          {errors.pincode && <span className="text-xs text-destructive">{errors.pincode.message}</span>}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Upload reference images</Label>
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">
          <UploadCloud className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">
            {files.length ? `${files.length} image(s) selected` : "Click or drag images (JPG, PNG, WebP)"}
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </label>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          {...register("description")}
          className="rounded-xl min-h-[120px] resize-none"
          placeholder="Describe your design or attach reference images..."
        />
        {errors.description && <span className="text-xs text-destructive">{errors.description.message}</span>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-12 font-semibold">
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Request Custom Print"}
      </Button>
      <p className="text-center text-sm text-muted-foreground pt-2">
        Already submitted? <Link href="/track" className="text-primary font-medium hover:underline">Track your request</Link>
      </p>
    </form>
  );
}
