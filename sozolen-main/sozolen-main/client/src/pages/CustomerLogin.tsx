import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { User, Loader2 } from "lucide-react";
import { useEffect } from "react";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

export default function CustomerLogin() {
  const { login, customer } = useCustomerAuth();
  const [, setLocation] = useLocation();
  const redirect = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("redirect") : null;

  useEffect(() => {
    if (customer) setLocation(redirect && redirect.startsWith("/") ? redirect : "/profile");
  }, [customer, redirect, setLocation]);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login.mutateAsync(data);
      setLocation(redirect && redirect.startsWith("/") ? redirect : "/profile");
    } catch (e) {
      // toast or show error
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#fbfbfd] dark:bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md mx-auto bg-card p-10 rounded-3xl shadow-xl shadow-black/5 border border-border/50">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Login</h1>
          <p className="text-muted-foreground text-sm mt-1">Sign in to view your orders and profile</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input {...register("email")} type="email" className="h-11 rounded-xl" placeholder="Enter your email address" />
            {errors.email && <span className="text-xs text-destructive">{errors.email.message}</span>}
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <PasswordInput {...register("password")} className="h-11 rounded-xl" placeholder="Enter your password" />
            {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
          </div>
          <Button disabled={login.isPending} type="submit" className="w-full h-12 rounded-xl text-md mt-4">
            {login.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Login"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/forgot-password" className="text-primary font-medium hover:underline">Forgot password?</Link>
        </p>
        <p className="text-center text-sm text-muted-foreground mt-2">
          Don&apos;t have an account? <Link href="/register" className="text-primary font-medium hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
