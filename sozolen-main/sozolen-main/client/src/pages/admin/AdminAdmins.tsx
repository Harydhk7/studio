import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdmins, useCreateAdmin, useUpdateAdminPassword } from "@/hooks/use-admins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, KeyRound, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PaginationControls } from "@/components/PaginationControls";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

const createAdminSchema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(1, "Password required"),
});

const changePasswordSchema = z.object({
  password: z.string().min(1, "New password required"),
});

export default function AdminAdmins() {
  const { data: admins, isLoading, isError, error } = useAdmins();
  const createAdmin = useCreateAdmin();
  const updatePassword = useUpdateAdminPassword();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordForId, setPasswordForId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "super_admin" | "admin">(
    "all",
  );
  const [pageSize, setPageSize] = useState(10);
  const filteredAdmins = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = admins ?? [];
    return list.filter((a) => {
      if (roleFilter !== "all" && a.role !== roleFilter) return false;
      if (!q) return true;
      return (
        String(a.id).includes(q) || a.username.toLowerCase().includes(q)
      );
    });
  }, [admins, search, roleFilter]);
  const pagedAdmins = useMemo(() => {
    const list = filteredAdmins;
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [filteredAdmins, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, pageSize]);

  const createForm = useForm<z.infer<typeof createAdminSchema>>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: { username: "", password: "" },
  });

  const passwordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: "" },
  });

  const onCreate = async (data: z.infer<typeof createAdminSchema>) => {
    try {
      await createAdmin.mutateAsync(data);
      toast({ title: "Admin created" });
      setCreateOpen(false);
      createForm.reset();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create admin", variant: "destructive" });
    }
  };

  const onChangePassword = async (data: z.infer<typeof changePasswordSchema>) => {
    if (passwordForId == null) return;
    try {
      await updatePassword.mutateAsync({ id: passwordForId, password: data.password });
      toast({ title: "Password updated" });
      setPasswordForId(null);
      passwordForm.reset();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to update password", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Admins" columns={4} rows={8} />;
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{error instanceof Error ? error.message : "You don't have permission to view admins."}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admins</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin users</CardTitle>
          <p className="text-sm text-muted-foreground">Manage admin accounts and passwords. Only super admin can create or edit admins.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID or username"
              className="w-[240px] rounded-xl"
            />
            <select
              value={roleFilter}
              onChange={(e) =>
                setRoleFilter(e.target.value as "all" | "super_admin" | "admin")
              }
              className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedAdmins.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>{a.id}</TableCell>
                  <TableCell className="font-medium">{a.username}</TableCell>
                  <TableCell>
                    <Badge variant={a.role === "super_admin" ? "default" : "secondary"}>{a.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {a.role === "admin" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPasswordForId(a.id);
                          passwordForm.reset({ password: "" });
                        }}
                      >
                        <KeyRound className="w-4 h-4 mr-1" />
                        Password
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredAdmins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No admins found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <PaginationControls
            page={page}
            setPage={setPage}
            totalItems={filteredAdmins.length}
            pageSize={pageSize}
          />
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onCreate)} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input {...createForm.register("username")} placeholder="username" />
              {createForm.formState.errors.username && (
                <p className="text-sm text-destructive mt-1">{createForm.formState.errors.username.message}</p>
              )}
            </div>
            <div>
              <Label>Password</Label>
              <PasswordInput {...createForm.register("password")} placeholder="••••••••" />
              {createForm.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">{createForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createAdmin.isPending}>
                {createAdmin.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordForId != null} onOpenChange={(open) => !open && setPasswordForId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
          </DialogHeader>
          <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
            <div>
              <Label>New password</Label>
              <PasswordInput {...passwordForm.register("password")} placeholder="••••••••" />
              {passwordForm.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPasswordForId(null)}>Cancel</Button>
              <Button type="submit" disabled={updatePassword.isPending}>
                {updatePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
