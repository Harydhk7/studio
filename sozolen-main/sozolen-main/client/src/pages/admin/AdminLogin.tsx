import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { useEffect } from "react";

const loginSchema = z.object({
  username: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

export default function AdminLogin() {
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) setLocation('/admin');
  }, [user, setLocation]);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      await login.mutateAsync(data);
    } catch (e) {
      // Handled by react-query / global error boundary
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd] dark:bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md bg-card p-10 rounded-3xl shadow-xl shadow-black/5 border border-border/50">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Access</h1>
          <p className="text-muted-foreground text-sm mt-1">Authenticate to manage your store</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input {...register("username")} className="h-11 rounded-xl" />
            {errors.username && <span className="text-xs text-destructive">{errors.username.message}</span>}
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <PasswordInput {...register("password")} className="h-11 rounded-xl" />
            {errors.password && <span className="text-xs text-destructive">{errors.password.message}</span>}
          </div>
          <Button disabled={login.isPending} className="w-full h-12 rounded-xl text-md mt-4">
            {login.isPending ? "Authenticating..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}
