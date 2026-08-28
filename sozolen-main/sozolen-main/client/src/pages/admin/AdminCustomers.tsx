import { useEffect, useMemo, useState } from "react";
import {
  useCustomers,
  useCustomerCustomRequests,
  useCustomerOrders,
  useCreateCustomer,
} from "@/hooks/use-customers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderDetailModal } from "@/components/admin/OrderDetailModal";
import { ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";

const createCustomerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone number required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

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

export default function AdminCustomers() {
  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const { data: customerOrders, isLoading: customerOrdersLoading } = useCustomerOrders(selectedCustomerId);
  const { data: customerCustomRequests, isLoading: customerCustomRequestsLoading } =
    useCustomerCustomRequests(selectedCustomerId);
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(5);
  const [activeTab, setActiveTab] = useState("orders");
  const [ordersSearch, setOrdersSearch] = useState("");
  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(5);
  const [formsSearch, setFormsSearch] = useState("");
  const [formPage, setFormPage] = useState(1);
  const [formPageSize, setFormPageSize] = useState(5);
  const [createOpen, setCreateOpen] = useState(false);

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors, isSubmitting: createSubmitting },
  } = useForm<z.infer<typeof createCustomerSchema>>({
    resolver: zodResolver(createCustomerSchema),
  });

  const onCreateCustomer = async (data: z.infer<typeof createCustomerSchema>) => {
    try {
      await createCustomer.mutateAsync(data);
      toast({ title: "Customer created successfully" });
      setCreateOpen(false);
      resetCreate();
    } catch (err) {
      toast({
        title: "Failed to create customer",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const sortedCustomers = useMemo(() => {
    const list = [...(customers ?? [])];
    list.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at || b.id - a.id;
    });
    return list;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sortedCustomers;
    return sortedCustomers.filter((c) =>
      `${c.id} ${c.name ?? ""} ${c.email ?? ""} ${c.phone ?? ""}`.toLowerCase().includes(q),
    );
  }, [sortedCustomers, search]);

  const pagedCustomers = useMemo(() => {
    const start = (customerPage - 1) * customerPageSize;
    return filteredCustomers.slice(start, start + customerPageSize);
  }, [filteredCustomers, customerPage, customerPageSize]);

  const sortedCustomerOrders = useMemo(() => {
    const list = [...(customerOrders ?? [])];
    list.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at || b.id - a.id;
    });
    return list;
  }, [customerOrders]);

  const filteredOrders = useMemo(() => {
    const q = ordersSearch.trim().toLowerCase();
    if (!q) return sortedCustomerOrders;
    return sortedCustomerOrders.filter((o) =>
      `${o.id} ${o.status} ${o.paymentStatus} ${o.paymentMode ?? ""} ${o.items
        .map((i) => i.name)
        .join(" ")}`.toLowerCase().includes(q),
    );
  }, [sortedCustomerOrders, ordersSearch]);

  const pagedCustomerOrders = useMemo(() => {
    const start = (orderPage - 1) * orderPageSize;
    return filteredOrders.slice(start, start + orderPageSize);
  }, [filteredOrders, orderPage, orderPageSize]);

  const sortedCustomForms = useMemo(() => {
    const list = [...(customerCustomRequests ?? [])];
    list.sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at || b.id - a.id;
    });
    return list;
  }, [customerCustomRequests]);

  const filteredCustomForms = useMemo(() => {
    const q = formsSearch.trim().toLowerCase();
    if (!q) return sortedCustomForms;
    return sortedCustomForms.filter((r) =>
      `${r.id} ${r.status} ${r.quoteStatus ?? ""} ${r.description ?? ""}`.toLowerCase().includes(q),
    );
  }, [sortedCustomForms, formsSearch]);

  const pagedCustomForms = useMemo(() => {
    const start = (formPage - 1) * formPageSize;
    return filteredCustomForms.slice(start, start + formPageSize);
  }, [filteredCustomForms, formPage, formPageSize]);

  const selectedCustomer = customers?.find((c) => c.id === selectedCustomerId);

  const openOrderDetail = (id: number) => {
    setDetailOrderId(id);
    setDetailOpen(true);
  };

  useEffect(() => {
    setOrderPage(1);
    setFormPage(1);
  }, [selectedCustomerId]);
  useEffect(() => setCustomerPage(1), [search, customerPageSize]);
  useEffect(() => setOrderPage(1), [ordersSearch, orderPageSize]);
  useEffect(() => setFormPage(1), [formsSearch, formPageSize]);

  if (selectedCustomerId == null && isLoading) {
    return <AdminTableSkeleton title="Customers" columns={6} rows={8} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
        <Button className="rounded-xl" onClick={() => setCreateOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Create Customer
        </Button>
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetCreate(); }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Create Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit(onCreateCustomer)} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input {...registerCreate("name")} placeholder="Enter full name" className="rounded-xl" />
              {createErrors.name && <p className="text-xs text-destructive">{createErrors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input {...registerCreate("email")} type="email" placeholder="Enter email address" className="rounded-xl" />
              {createErrors.email && <p className="text-xs text-destructive">{createErrors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Phone Number</Label>
              <Input {...registerCreate("phone")} placeholder="Enter phone number" className="rounded-xl" />
              {createErrors.phone && <p className="text-xs text-destructive">{createErrors.phone.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input {...registerCreate("password")} type="password" placeholder="Set a password" className="rounded-xl" />
              {createErrors.password && <p className="text-xs text-destructive">{createErrors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={createSubmitting}>
              {createSubmitting ? "Creating..." : "Create Customer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {selectedCustomerId == null ? (
        <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by id, name, email, phone..."
              className="max-w-md rounded-xl"
            />
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Limit</span>
              <select
                value={customerPageSize}
                onChange={(e) => setCustomerPageSize(Number(e.target.value))}
                className="h-9 rounded-lg border border-input bg-background px-2"
              >
                {[5, 10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedCustomers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">#{c.id}</TableCell>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.phone ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => setSelectedCustomerId(c.id)}
                    >
                      View orders
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No customers yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <PaginationControls
            page={customerPage}
            setPage={setCustomerPage}
            totalItems={filteredCustomers.length}
            pageSize={customerPageSize}
          />
        </div>
      ) : (
        <div className="space-y-6">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl -ml-2"
            onClick={() => setSelectedCustomerId(null)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to customers
          </Button>
          <div className="bg-card rounded-3xl shadow-sm border border-border/50 p-6">
            <h2 className="text-xl font-semibold mb-1">
              {selectedCustomer?.name}
            </h2>
            <p className="text-muted-foreground text-sm">
              {selectedCustomer?.email}
            </p>
            <p className="text-muted-foreground text-sm">
              {selectedCustomer?.phone ?? "—"}
            </p>
          </div>
          <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-4 pt-4 border-b border-border/50">
                <TabsList className="rounded-xl">
                  <TabsTrigger value="orders">Orders</TabsTrigger>
                  <TabsTrigger value="forms">Custom Forms</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="orders" className="mt-0">
                <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <Input
                    value={ordersSearch}
                    onChange={(e) => setOrdersSearch(e.target.value)}
                    placeholder="Search orders..."
                    className="max-w-md rounded-xl"
                  />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Limit</span>
                    <select
                      value={orderPageSize}
                      onChange={(e) => setOrderPageSize(Number(e.target.value))}
                      className="h-9 rounded-lg border border-input bg-background px-2"
                    >
                      {[5, 10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {customerOrdersLoading ? (
                  <div className="p-4">
                    <AdminTableSkeleton columns={8} rows={6} />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-24"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedCustomerOrders.map((o) => (
                        <TableRow
                          key={o.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openOrderDetail(o.id)}
                        >
                          <TableCell className="font-medium">#{o.id}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {o.items.map((i, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {i.quantity}x {i.name}
                                  {i.selectedColor ? ` (${i.selectedColor})` : ""}
                                  {i.selectedSize ? ` (${i.selectedSize})` : ""}
                                  {i.selectedOther ? ` (${i.selectedOther})` : ""}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">₹{o.totalPrice.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[o.status] || ""}>{o.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={paymentStatusColors[o.paymentStatus] || ""}>
                              {paymentStatusLabel(o.paymentStatus)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {paymentModeLabel(o.paymentMode)}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation();
                                openOrderDetail(o.id);
                              }}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredOrders.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No orders found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
                <PaginationControls
                  page={orderPage}
                  setPage={setOrderPage}
                  totalItems={filteredOrders.length}
                  pageSize={orderPageSize}
                />
              </TabsContent>

              <TabsContent value="forms" className="mt-0">
                <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <Input
                    value={formsSearch}
                    onChange={(e) => setFormsSearch(e.target.value)}
                    placeholder="Search custom forms..."
                    className="max-w-md rounded-xl"
                  />
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Limit</span>
                    <select
                      value={formPageSize}
                      onChange={(e) => setFormPageSize(Number(e.target.value))}
                      className="h-9 rounded-lg border border-input bg-background px-2"
                    >
                      {[5, 10, 20, 50, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {customerCustomRequestsLoading ? (
                  <div className="p-4">
                    <AdminTableSkeleton columns={6} rows={6} />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tracking ID</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Quote</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Converted Order</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedCustomForms.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-sm">SOZOLEN3D-{r.id}</TableCell>
                          <TableCell className="max-w-[360px] truncate">{r.description}</TableCell>
                          <TableCell>{r.status}</TableCell>
                          <TableCell>
                            {r.quoteStatus}
                            {typeof r.quotedPrice === "number"
                              ? ` (INR ${r.quotedPrice.toLocaleString("en-IN")})`
                              : ""}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                          </TableCell>
                          <TableCell>{r.convertedOrderId ? `#${r.convertedOrderId}` : "—"}</TableCell>
                        </TableRow>
                      ))}
                      {filteredCustomForms.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No custom forms found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
                <PaginationControls
                  page={formPage}
                  setPage={setFormPage}
                  totalItems={filteredCustomForms.length}
                  pageSize={formPageSize}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
      <OrderDetailModal
        orderId={detailOrderId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
