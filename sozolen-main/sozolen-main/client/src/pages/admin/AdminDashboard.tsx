import { useState, useMemo } from "react";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { useCustomRequests } from "@/hooks/use-custom-requests";
import { Package, ShoppingBag, SendToBack, IndianRupee, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type DateFilterType = "this_month" | "last_month" | "custom";

function getMonthStartEnd(month: "this" | "last"): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  if (month === "this") {
    const start = new Date(year, monthIdx, 1);
    const end = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  const start = new Date(year, monthIdx - 1, 1);
  const end = new Date(year, monthIdx, 0, 23, 59, 59, 999);
  return { start, end };
}

function isInRange(dateInput: string | Date | null, start: Date, end: Date): boolean {
  if (dateInput == null) return false;
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return d >= start && d <= end;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  shipped: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  delivered: "bg-green-500/20 text-green-700 dark:text-green-400",
  cancelled: "bg-red-500/20 text-red-700 dark:text-red-400",
};

export default function AdminDashboard() {
  const { data: orders = [], isLoading: ordersLoading } = useOrders();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: requests = [], isLoading: requestsLoading } = useCustomRequests();

  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const { start: rangeStart, end: rangeEnd } = useMemo(() => {
    if (dateFilterType === "this_month") return getMonthStartEnd("this");
    if (dateFilterType === "last_month") return getMonthStartEnd("last");
    const start = customStart ? new Date(customStart) : new Date(0);
    const end = customEnd ? new Date(customEnd + "T23:59:59.999") : new Date();
    return { start, end };
  }, [dateFilterType, customStart, customEnd]);

  const filteredOrders = useMemo(
    () => orders.filter((o) => isInRange(o.createdAt ?? null, rangeStart, rangeEnd)),
    [orders, rangeStart, rangeEnd]
  );
  const filteredRequests = useMemo(
    () => requests.filter((r) => isInRange(r.createdAt ?? null, rangeStart, rangeEnd)),
    [requests, rangeStart, rangeEnd]
  );

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);
  const pendingRequests = filteredRequests.filter((r) => r.status === "pending").length;

  const stats = [
    { title: "Revenue (filtered)", value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee },
    { title: "Orders (filtered)", value: filteredOrders.length, icon: ShoppingBag },
    { title: "Active Products", value: products.length, icon: Package },
    { title: "Pending Requests (filtered)", value: pendingRequests, icon: SendToBack },
  ];

  const revenueByDay = useMemo(() => {
    const byDay: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const key = o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }) : "";
      if (key) {
        byDay[key] = (byDay[key] ?? 0) + o.totalPrice;
      }
    });
    return Object.entries(byDay)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  const ordersByDay = useMemo(() => {
    const byDay: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      const key = o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }) : "";
      if (key) {
        byDay[key] = (byDay[key] ?? 0) + 1;
      }
    });
    return Object.entries(byDay)
      .map(([date, count]) => ({ date, orders: count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  const chartConfig = useMemo(
    () => ({
      revenue: { label: "Revenue (₹)", color: "hsl(var(--primary))" },
      orders: { label: "Orders", color: "hsl(221, 83%, 53%)" },
    }),
    []
  );

  const isLoading = ordersLoading || productsLoading || requestsLoading;

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard Overview</h1>
        <Card className="p-4 mb-8 rounded-2xl border-border/50">
          <Skeleton className="h-10 w-full" />
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6 rounded-3xl border-border/50 shadow-sm">
              <Skeleton className="h-12 w-12 rounded-2xl mb-4" />
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="p-6 rounded-3xl border-border/50">
            <Skeleton className="h-5 w-36 mb-4" />
            <Skeleton className="h-[260px] w-full" />
          </Card>
          <Card className="p-6 rounded-3xl border-border/50">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-[260px] w-full" />
          </Card>
        </div>
        <Card className="rounded-3xl border-border/50 overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <Skeleton className="h-5 w-44 mb-2" />
            <Skeleton className="h-4 w-60" />
          </div>
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Dashboard Overview</h1>

      <Card className="p-4 mb-8 rounded-2xl border-border/50">
        <div className="flex flex-wrap items-center  gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Label className="text-sm font-medium">Date filter</Label>
          </div>
          <Select value={dateFilterType} onValueChange={(v) => setDateFilterType(v as DateFilterType)}>
            <SelectTrigger className="w-[180px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This month</SelectItem>
              <SelectItem value="last_month">Last month</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          {dateFilterType === "custom" && (
            <>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="rounded-lg w-[160px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="rounded-lg w-[160px]"
                />
              </div>
            </>
          )}
          <span className="text-xs text-muted-foreground ml-2">
            {rangeStart.toLocaleDateString()} – {rangeEnd.toLocaleDateString()}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((s, i) => (
          <Card key={i} className="p-6 rounded-3xl border-border/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{s.title}</p>
            <h3 className="text-3xl font-bold tracking-tight mt-1">{s.value}</h3>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="p-6 rounded-3xl border-border/50">
          <h3 className="font-semibold mb-4">Revenue by day</h3>
          {revenueByDay.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={revenueByDay} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No revenue data in selected period.</p>
          )}
        </Card>
        <Card className="p-6 rounded-3xl border-border/50">
          <h3 className="font-semibold mb-4">Orders by day</h3>
          {ordersByDay.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <BarChart data={ordersByDay} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => [String(v), "Orders"]} />} />
                <Bar dataKey="orders" fill="var(--color-orders)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No orders in selected period.</p>
          )}
        </Card>
      </div>

      <Card className="rounded-3xl border-border/50 overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <h3 className="font-semibold">Recent orders (filtered)</h3>
          <p className="text-sm text-muted-foreground mt-1">Orders in the selected date range</p>
        </div>
        {filteredOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders
                .slice()
                .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
                .slice(0, 15)
                .map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">#{o.id}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell>{o.name}</TableCell>
                    <TableCell className="font-medium">₹{o.totalPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[o.status] ?? ""}>{o.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/orders`}>
                        <span className="text-primary text-sm font-medium hover:underline">View</span>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center text-muted-foreground text-sm">No orders in selected period.</div>
        )}
      </Card>
    </div>
  );
}
