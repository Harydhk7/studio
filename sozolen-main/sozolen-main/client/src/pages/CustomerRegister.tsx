import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { useEffect } from "react";

const step1Schema = z.object({
  name: z.string().min(2, "Name required"),
  phone: z.string().min(10, "Mobile number required (10 digits)"),
  email: z.string().email("Valid email (Gmail) required"),
});

const step2Schema = z.object({
  code: z.string().length(6, "Enter 6-digit code"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function CustomerRegister() {
  const { verifyAndRegister, sendOtp, customer } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, setPending] = useState<{ name: string; phone: string; email: string } | null>(null);

  useEffect(() => {
    if (customer) setLocation("/profile");
  }, [customer, setLocation]);

  const step1Form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
  });

  const step2Form = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
  });

  const onStep1 = async (data: z.infer<typeof step1Schema>) => {
    try {
      await sendOtp.mutateAsync({ email: data.email, type: "signup" });
      setPending(data);
      setStep(2);
    } catch (e: any) {
      step1Form.setError("root", { message: e?.message || "Failed to send code" });
    }
  };

  const onStep2 = async (data: z.infer<typeof step2Schema>) => {
    if (!pending) return;
    try {
      await verifyAndRegister.mutateAsync({
        email: pending.email,
        code: data.code,
        name: pending.name,
        phone: pending.phone,
        password: data.password,
      });
      setLocation("/profile");
    } catch (e: any) {
      step2Form.setError("root", { message: e?.message || "Invalid or expired code" });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#fbfbfd] dark:bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md mx-auto bg-card p-10 rounded-3xl shadow-xl shadow-black/5 border border-border/50">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Account</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 1 ? "Enter your details. We'll send a verification code to your email." : "Enter the 6-digit code and set your password."}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={step1Form.handleSubmit(onStep1)} className="space-y-5">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input {...step1Form.register("name")} className="h-11 rounded-xl" placeholder="Enter your full name" />
              {step1Form.formState.errors.name && <span className="text-xs text-destructive">{step1Form.formState.errors.name.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input {...step1Form.register("phone")} type="tel" className="h-11 rounded-xl" placeholder="Enter 10-digit mobile number" />
              {step1Form.formState.errors.phone && <span className="text-xs text-destructive">{step1Form.formState.errors.phone.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Email (Gmail)</Label>
              <Input {...step1Form.register("email")} type="email" className="h-11 rounded-xl" placeholder="Enter your email address" />
              {step1Form.formState.errors.email && <span className="text-xs text-destructive">{step1Form.formState.errors.email.message}</span>}
            </div>
            {step1Form.formState.errors.root && <p className="text-sm text-destructive">{step1Form.formState.errors.root.message}</p>}
            <Button disabled={sendOtp.isPending} type="submit" className="w-full h-12 rounded-xl text-md mt-4">
              {sendOtp.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send verification code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={step2Form.handleSubmit(onStep2)} className="space-y-5">
            <p className="text-sm text-muted-foreground">Code sent to {pending?.email}</p>
            <div className="space-y-2">
              <Label>6-digit code</Label>
              <Input {...step2Form.register("code")} maxLength={6} className="h-11 rounded-xl font-mono text-center" placeholder="000000" />
              {step2Form.formState.errors.code && <span className="text-xs text-destructive">{step2Form.formState.errors.code.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>Password (min 6 characters)</Label>
              <PasswordInput {...step2Form.register("password")} className="h-11 rounded-xl" />
              {step2Form.formState.errors.password && <span className="text-xs text-destructive">{step2Form.formState.errors.password.message}</span>}
            </div>
            {step2Form.formState.errors.root && <p className="text-sm text-destructive">{step2Form.formState.errors.root.message}</p>}
            <Button disabled={verifyAndRegister.isPending} type="submit" className="w-full h-12 rounded-xl text-md mt-4">
              {verifyAndRegister.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verify & Create account"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(1)}>
              Change email
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link href="/login" className="text-primary font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
