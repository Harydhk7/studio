import { useMemo, useState } from "react";
import { CalendarRange, Download, FileSpreadsheet, Filter } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { useOrders } from "@/hooks/use-orders";
import { useCustomRequests } from "@/hooks/use-custom-requests";
import { useCustomers } from "@/hooks/use-customers";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { Input } from "@/components/ui/input";

type CsvRow = Record<string, unknown>;
type FilterType = "all" | "date" | "month" | "year" | "range";

const toCsv = (rows: CsvRow[]) => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    if (value == null) return "";
    const str =
      typeof value === "string"
        ? value
        : typeof value === "number" || typeof value === "boolean"
          ? String(value)
          : JSON.stringify(value);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
};

const downloadCsv = (filename: string, rows: CsvRow[]) => {
  const csv = toCsv(rows);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const toDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || !value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const yyyyMmDd = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function AdminReports() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading } = useProducts(null);
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: customRequests, isLoading: customRequestsLoading } = useCustomRequests();
  const { data: customers, isLoading: customersLoading } = useCustomers();

  const loading =
    authLoading ||
    categoriesLoading ||
    productsLoading ||
    ordersLoading ||
    customRequestsLoading ||
    customersLoading;

  const currentYear = new Date().getFullYear();
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [specificDate, setSpecificDate] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(currentYear));
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const categoryRows = useMemo(
    () =>
      (categories ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        imageUrl: c.imageUrl,
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : "",
      })),
    [categories],
  );

  const productRows = useMemo(
    () =>
      (products ?? []).map((p) => ({
        id: p.id,
        sku: p.sku ?? "",
        title: p.title,
        categoryId: p.categoryId ?? "",
        price: p.price,
        customerCanChooseColor: p.customerCanChooseColor,
        customerCanChooseSize: p.customerCanChooseSize,
        customerCanChooseOther: p.customerCanChooseOther,
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : "",
      })),
    [products],
  );

  const orderRows = useMemo(
    () =>
      (orders ?? []).map((o) => ({
        id: o.id,
        customerId: o.customerId ?? "",
        name: o.name,
        email: o.email,
        phone: o.phone,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMode: o.paymentMode ?? "",
        totalPrice: o.totalPrice,
        items: o.items,
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : "",
      })),
    [orders],
  );

  const customRequestRows = useMemo(
    () =>
      (customRequests ?? []).map((r) => ({
        id: r.id,
        customerId: r.customerId ?? "",
        name: r.name,
        email: r.email,
        phone: r.phone,
        status: r.status,
        quoteStatus: r.quoteStatus,
        quotedPrice: r.quotedPrice ?? "",
        description: r.description,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
      })),
    [customRequests],
  );

  const customerRows = useMemo(
    () =>
      (customers ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone ?? "",
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : "",
      })),
    [customers],
  );

  const isInFilter = (createdAt: unknown): boolean => {
    if (filterType === "all") return true;
    const d = toDate(createdAt);
    if (!d) return false;

    if (filterType === "date") {
      if (!specificDate) return true;
      return yyyyMmDd(d) === specificDate;
    }
    if (filterType === "month") {
      const monthNum = Number(month);
      const yearNum = Number(year);
      if (!Number.isFinite(monthNum) || !Number.isFinite(yearNum)) return true;
      return d.getFullYear() === yearNum && d.getMonth() + 1 === monthNum;
    }
    if (filterType === "year") {
      const yearNum = Number(year);
      if (!Number.isFinite(yearNum)) return true;
      return d.getFullYear() === yearNum;
    }
    if (filterType === "range") {
      const start = rangeStart ? new Date(`${rangeStart}T00:00:00`) : null;
      const end = rangeEnd ? new Date(`${rangeEnd}T23:59:59.999`) : null;
      if (start && d < start) return false;
      if (end && d > end) return false;
      return true;
    }
    return true;
  };

  const filteredCategoryRows = useMemo(
    () => categoryRows.filter((r) => isInFilter(r.createdAt)),
    [categoryRows, filterType, specificDate, month, year, rangeStart, rangeEnd],
  );
  const filteredProductRows = useMemo(
    () => productRows.filter((r) => isInFilter(r.createdAt)),
    [productRows, filterType, specificDate, month, year, rangeStart, rangeEnd],
  );
  const filteredOrderRows = useMemo(
    () => orderRows.filter((r) => isInFilter(r.createdAt)),
    [orderRows, filterType, specificDate, month, year, rangeStart, rangeEnd],
  );
  const filteredCustomRequestRows = useMemo(
    () => customRequestRows.filter((r) => isInFilter(r.createdAt)),
    [customRequestRows, filterType, specificDate, month, year, rangeStart, rangeEnd],
  );
  const filteredCustomerRows = useMemo(
    () => customerRows.filter((r) => isInFilter(r.createdAt)),
    [customerRows, filterType, specificDate, month, year, rangeStart, rangeEnd],
  );

  const filterLabel = useMemo(() => {
    if (filterType === "all") return "all-time";
    if (filterType === "date") return specificDate || "single-date";
    if (filterType === "month") return `${year}-${String(month).padStart(2, "0")}`;
    if (filterType === "year") return year;
    if (filterType === "range") return `${rangeStart || "start"}_to_${rangeEnd || "end"}`;
    return "all-time";
  }, [filterType, month, year, specificDate, rangeStart, rangeEnd]);

  const withSuffix = (name: string) =>
    `${name}-${filterLabel.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`;

  if (loading) {
    return <AdminTableSkeleton title="Reports" columns={2} rows={6} />;
  }

  if (!user || (user.role !== "super_admin" && user.role !== "admin")) {
    return (
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Reports</h1>
        <p className="text-muted-foreground">Only admin users can access reports.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Reports</h1>
      <p className="text-muted-foreground mb-8">
        Download operational data as CSV sheets.
      </p>

      <div className="rounded-2xl border border-border/50 bg-card p-4 md:p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4" />
          <h2 className="text-sm font-semibold tracking-wide">Report Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Filter type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            >
              <option value="all">All time</option>
              <option value="date">Date</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="range">Custom range</option>
            </select>
          </div>

          {filterType === "date" && (
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs text-muted-foreground">Date</label>
              <Input
                type="date"
                value={specificDate}
                onChange={(e) => setSpecificDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}

          {filterType === "month" && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Month</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={String(m)}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Year</label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </>
          )}

          {filterType === "year" && (
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs text-muted-foreground">Year</label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="rounded-xl"
              />
            </div>
          )}

          {filterType === "range" && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">From</label>
                <Input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">To</label>
                <Input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="rounded-xl border border-border/50 bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Categories</p>
          <p className="text-xl font-semibold">{filteredCategoryRows.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Products</p>
          <p className="text-xl font-semibold">{filteredProductRows.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Orders</p>
          <p className="text-xl font-semibold">{filteredOrderRows.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Custom Requests</p>
          <p className="text-xl font-semibold">{filteredCustomRequestRows.length}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">Customers</p>
          <p className="text-xl font-semibold">{filteredCustomerRows.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          className="h-14 rounded-2xl justify-between shadow-sm hover:shadow-md transition-all"
          onClick={() => downloadCsv(withSuffix("categories-sheet"), filteredCategoryRows)}
          disabled={filteredCategoryRows.length === 0}
        >
          <span className="inline-flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Categories sheet
          </span>
          <Download className="w-4 h-4" />
        </Button>
        <Button
          className="h-14 rounded-2xl justify-between shadow-sm hover:shadow-md transition-all"
          onClick={() => downloadCsv(withSuffix("products-sheet"), filteredProductRows)}
          disabled={filteredProductRows.length === 0}
        >
          <span className="inline-flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Products sheet
          </span>
          <Download className="w-4 h-4" />
        </Button>
        <Button
          className="h-14 rounded-2xl justify-between shadow-sm hover:shadow-md transition-all"
          onClick={() => downloadCsv(withSuffix("orders-sheet"), filteredOrderRows)}
          disabled={filteredOrderRows.length === 0}
        >
          <span className="inline-flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Orders sheet
          </span>
          <Download className="w-4 h-4" />
        </Button>
        <Button
          className="h-14 rounded-2xl justify-between shadow-sm hover:shadow-md transition-all"
          onClick={() =>
            downloadCsv(withSuffix("custom-requests-sheet"), filteredCustomRequestRows)
          }
          disabled={filteredCustomRequestRows.length === 0}
        >
          <span className="inline-flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Custom requests sheet
          </span>
          <Download className="w-4 h-4" />
        </Button>
        <Button
          className="h-14 rounded-2xl justify-between md:col-span-2 shadow-sm hover:shadow-md transition-all"
          onClick={() => downloadCsv(withSuffix("customers-sheet"), filteredCustomerRows)}
          disabled={filteredCustomerRows.length === 0}
        >
          <span className="inline-flex items-center gap-2">
            <CalendarRange className="w-4 h-4" /> Customers sheet
          </span>
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

