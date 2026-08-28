import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useCustomerOrders } from "@/hooks/use-customer-orders";
import {
  useCustomerAddresses,
  useCreateCustomerAddress,
  useDeleteCustomerAddress,
  useSetDefaultAddress,
  useUpdateCustomerAddress,
} from "@/hooks/use-customer-addresses";
import { useLocation, Link } from "wouter";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Package, LogOut, Loader2, MapPin, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PaginationControls } from "@/components/PaginationControls";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  shipped: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  delivered: "bg-green-500/20 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/20 text-red-700 dark:text-red-400",
};

const paymentStatusColors: Record<string, string> = {
  not_paid: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  paid: "bg-green-500/20 text-green-700 dark:text-green-400",
  failed: "bg-red-500/20 text-red-700 dark:text-red-400",
  refunded: "bg-slate-500/20 text-slate-700 dark:text-slate-400",
};

const paymentModeLabel = (mode: string | null | undefined) =>
  !mode
    ? "Not set"
    : mode
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const paymentStatusLabel = (status: string) =>
  status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const addressSchema = z.object({
  label: z.string().optional(),
  addressLine1: z.string().min(1, "Address line 1 required"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  pincode: z.string().min(1, "Pincode required"),
  phone: z.string().min(1, "Phone required"),
  isDefault: z.boolean().optional(),
});

function formatAddress(a: {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state?: string | null;
  pincode?: string | null;
}) {
  const parts = [
    a.addressLine1,
    a.addressLine2,
    [a.city, a.state, a.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);
  return parts.join(", ");
}

export default function Profile() {
  const { customer, isLoading: authLoading, logout } = useCustomerAuth();
  const { data: orders, isLoading: ordersLoading } = useCustomerOrders();
  const { data: addresses, isLoading: addressesLoading } =
    useCustomerAddresses();
  const createAddress = useCreateCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();
  const setDefault = useSetDefaultAddress();
  const [, setLocation] = useLocation();
  const [addressOpen, setAddressOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const { toast } = useToast();
  const [addressPage, setAddressPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const pageSize = 5;
  const pagedAddresses = useMemo(() => {
    const list = addresses ?? [];
    const start = (addressPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [addresses, addressPage]);
  const pagedOrders = useMemo(() => {
    const list = orders ?? [];
    const start = (orderPage - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [orders, orderPage]);

  const addressForm = useForm<z.infer<typeof addressSchema>>({
    resolver: zodResolver(addressSchema),
    defaultValues: { isDefault: false },
  });

  useEffect(() => {
    if (!authLoading && !customer) setLocation("/login");
  }, [authLoading, customer, setLocation]);

  const onAddAddress = async (data: z.infer<typeof addressSchema>) => {
    try {
      if (editingAddressId) {
        await updateAddress.mutateAsync({ id: editingAddressId, ...data });
        toast({ title: "Address updated" });
      } else {
        await createAddress.mutateAsync(data);
        toast({ title: "Address added" });
      }
      setAddressOpen(false);
      addressForm.reset();
      setEditingAddressId(null);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Could not save address",
      });
    }
  };

  const onEditAddress = (a: NonNullable<typeof addresses>[number]) => {
    setEditingAddressId(a.id);
    addressForm.reset({
      label: a.label ?? "",
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? "",
      city: a.city,
      state: a.state ?? "",
      pincode: a.pincode ?? "",
      phone: a.phone ?? "",
      isDefault: !!a.isDefault,
    });
    setAddressOpen(true);
  };

  const onDeleteAddress = async (a: NonNullable<typeof addresses>[number]) => {
    if (a.isDefault) {
      toast({
        variant: "destructive",
        title: "Default address cannot be deleted",
      });
      return;
    }
    try {
      await deleteAddress.mutateAsync(a.id);
      toast({ title: "Address deleted" });
    } catch {
      toast({
        variant: "destructive",
        title: "Could not delete address",
      });
    }
  };

  if (authLoading || !customer) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#fbfbfd] dark:bg-[#0a0a0a]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight mb-8">My Profile</h1>

        <div className="grid gap-8 md:grid-cols-2 mb-10">
          <Card className="rounded-2xl border border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Name:</span>{" "}
                {customer.name}
              </p>
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                {customer.email}
              </p>
              {customer.phone && (
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  {customer.phone}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-2xl border border-border/50 flex flex-col justify-center">
            <CardContent className="pt-6">
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                {logout.isPending ? "Logging out..." : "Logout"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-2xl border border-border/50 overflow-hidden mb-10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Addresses
            </CardTitle>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => {
                setEditingAddressId(null);
                addressForm.reset({ isDefault: false });
                setAddressOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add address
            </Button>
          </CardHeader>
          <CardContent>
            {addressesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : addresses && addresses.length > 0 ? (
              <ul className="space-y-4">
                {pagedAddresses.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {a.label && (
                          <span className="font-medium">{a.label}</span>
                        )}
                        {a.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatAddress(a)}
                      </p>
                      {a.phone && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {a.phone}
                        </p>
                      )}
                    </div>
                    {!a.isDefault && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl shrink-0"
                          onClick={() => setDefault.mutate(a.id)}
                          disabled={setDefault.isPending}
                        >
                          Set as default
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl shrink-0"
                          onClick={() => onEditAddress(a)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-xl shrink-0"
                          onClick={() => onDeleteAddress(a)}
                          disabled={deleteAddress.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                    {a.isDefault && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl shrink-0"
                          onClick={() => onEditAddress(a)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-xl shrink-0"
                          onClick={() => onDeleteAddress(a)}
                          disabled
                          title="Default address cannot be deleted"
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No addresses. Add one for faster checkout.
              </p>
            )}
            <PaginationControls
              page={addressPage}
              setPage={setAddressPage}
              totalItems={addresses?.length ?? 0}
              pageSize={pageSize}
            />
          </CardContent>
        </Card>

        <Dialog
          open={addressOpen}
          onOpenChange={(open) => {
            setAddressOpen(open);
            if (!open) {
              setEditingAddressId(null);
              addressForm.reset({ isDefault: false });
            }
          }}
        >
          <DialogContent className="rounded-2xl max-w-md">
            <DialogHeader>
              <DialogTitle>{editingAddressId ? "Edit address" : "Add address"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={addressForm.handleSubmit(onAddAddress)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Label (optional)</Label>
                <Input
                  {...addressForm.register("label")}
                  placeholder="Home, Work..."
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Address line 1 *</Label>
                <Input
                  {...addressForm.register("addressLine1")}
                  className="rounded-xl"
                />
                {addressForm.formState.errors.addressLine1 && (
                  <span className="text-xs text-destructive">
                    {addressForm.formState.errors.addressLine1.message}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <Label>Address line 2 (optional)</Label>
                <Input
                  {...addressForm.register("addressLine2")}
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    {...addressForm.register("city")}
                    className="rounded-xl"
                  />
                  {addressForm.formState.errors.city && (
                    <span className="text-xs text-destructive">
                      {addressForm.formState.errors.city.message}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Input
                    {...addressForm.register("state")}
                    className="rounded-xl"
                  />
                  {addressForm.formState.errors.state && (
                    <span className="text-xs text-destructive">
                      {addressForm.formState.errors.state.message}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pincode *</Label>
                  <Input
                    {...addressForm.register("pincode")}
                    className="rounded-xl"
                  />
                  {addressForm.formState.errors.pincode && (
                    <span className="text-xs text-destructive">
                      {addressForm.formState.errors.pincode.message}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    {...addressForm.register("phone")}
                    className="rounded-xl"
                  />
                  {addressForm.formState.errors.phone && (
                    <span className="text-xs text-destructive">
                      {addressForm.formState.errors.phone.message}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...addressForm.register("isDefault")}
                  id="isDefault"
                  className="rounded"
                />
                <Label htmlFor="isDefault">Set as default address</Label>
              </div>
              <Button
                type="submit"
                disabled={createAddress.isPending || updateAddress.isPending}
                className="w-full rounded-xl"
              >
                {createAddress.isPending || updateAddress.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  editingAddressId ? "Update address" : "Save address"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Card className="rounded-2xl border border-border/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              My Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : orders && orders.length > 0 ? (
              <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-24">Review</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedOrders.map((o) => (
                    <TableRow key={o.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link
                          href={`/profile/orders/${o.id}`}
                          className="text-primary hover:underline"
                        >
                          #{o.id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {o.items.map((i, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {i.quantity}x {i.name}
                              {i.variantName ? ` (Variant: ${i.variantName})` : ""}
                              {i.selectedColor ? ` (${i.selectedColor})` : ""}
                              {i.selectedSize ? ` (${i.selectedSize})` : ""}
                              {i.selectedOther ? ` (${i.selectedOther})` : ""}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>₹{o.totalPrice.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[o.status] || ""}>
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={paymentStatusColors[o.paymentStatus] || ""}>
                          {paymentStatusLabel(o.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {paymentModeLabel(o.paymentMode)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(o.createdAt!).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {o.status === "delivered" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs h-7"
                            asChild
                          >
                            <Link href={`/profile/orders/${o.id}`}>
                              Write review
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg text-xs h-7"
                          asChild
                        >
                          <Link href={`/profile/orders/${o.id}`}>
                            Order details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationControls
                page={orderPage}
                setPage={setOrderPage}
                totalItems={orders?.length ?? 0}
                pageSize={pageSize}
              />
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No orders yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
