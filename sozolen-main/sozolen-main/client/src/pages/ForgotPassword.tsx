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
import { KeyRound, Loader2 } from "lucide-react";

const step1Schema = z.object({ email: z.string().email("Valid email required") });
const step2Schema = z.object({
  code: z.string().length(6, "Enter 6-digit code"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export default function ForgotPassword() {
  const { sendOtp, verifyAndResetPassword } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");

  const step1Form = useForm<z.infer<typeof step1Schema>>({ resolver: zodResolver(step1Schema) });
  const step2Form = useForm<z.infer<typeof step2Schema>>({ resolver: zodResolver(step2Schema) });

  const onStep1 = async (data: z.infer<typeof step1Schema>) => {
    try {
      await sendOtp.mutateAsync({ email: data.email, type: "forgot_password" });
      setEmail(data.email);
      setStep(2);
    } catch (e: any) {
      step1Form.setError("root", { message: e?.message || "Failed to send code" });
    }
  };

  const onStep2 = async (data: z.infer<typeof step2Schema>) => {
    try {
      await verifyAndResetPassword.mutateAsync({
        email,
        code: data.code,
        newPassword: data.newPassword,
      });
      setLocation("/login");
    } catch (e: any) {
      step2Form.setError("root", { message: e?.message || "Invalid or expired code" });
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#fbfbfd] dark:bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md mx-auto bg-card p-10 rounded-3xl shadow-xl shadow-black/5 border border-border/50">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Forgot password</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 1 ? "Enter your email to receive a verification code" : "Enter the code and your new password"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={step1Form.handleSubmit(onStep1)} className="space-y-5">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input {...step1Form.register("email")} type="email" className="h-11 rounded-xl" placeholder="Enter your email address" />
              {step1Form.formState.errors.email && <span className="text-xs text-destructive">{step1Form.formState.errors.email.message}</span>}
            </div>
            {step1Form.formState.errors.root && <p className="text-sm text-destructive">{step1Form.formState.errors.root.message}</p>}
            <Button disabled={sendOtp.isPending} type="submit" className="w-full h-12 rounded-xl">
              {sendOtp.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={step2Form.handleSubmit(onStep2)} className="space-y-5">
            <p className="text-sm text-muted-foreground">Code sent to {email}</p>
            <div className="space-y-2">
              <Label>6-digit code</Label>
              <Input {...step2Form.register("code")} maxLength={6} className="h-11 rounded-xl font-mono text-center" placeholder="000000" />
              {step2Form.formState.errors.code && <span className="text-xs text-destructive">{step2Form.formState.errors.code.message}</span>}
            </div>
            <div className="space-y-2">
              <Label>New password</Label>
              <PasswordInput {...step2Form.register("newPassword")} className="h-11 rounded-xl" />
              {step2Form.formState.errors.newPassword && <span className="text-xs text-destructive">{step2Form.formState.errors.newPassword.message}</span>}
            </div>
            {step2Form.formState.errors.root && <p className="text-sm text-destructive">{step2Form.formState.errors.root.message}</p>}
            <Button disabled={verifyAndResetPassword.isPending} type="submit" className="w-full h-12 rounded-xl">
              {verifyAndResetPassword.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Reset password"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => setStep(1)}>
              Use different email
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/login" className="text-primary font-medium hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
