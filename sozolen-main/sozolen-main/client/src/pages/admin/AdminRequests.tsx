import {
  useConvertCustomRequestToOrder,
  useCustomRequests,
  useSendCustomRequestQuote,
  useUpdateCustomRequestStatus,
} from "@/hooks/use-custom-requests";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PaginationControls } from "@/components/PaginationControls";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

const roundMoney = (value: number) => Math.round(value * 100) / 100;

export default function AdminRequests() {
  const { data: requests, isLoading } = useCustomRequests();
  const updateStatus = useUpdateCustomRequestStatus();
  const sendQuote = useSendCustomRequestQuote();
  const convertToOrder = useConvertCustomRequestToOrder();
  const { toast } = useToast();
  const [quoteByRequest, setQuoteByRequest] = useState<
    Record<
      number,
      {
        quotedPrice: string;
        quoteNotes: string;
        quoteEta: string;
        filamentWeightGrams: string;
        perGramCost: string;
        printingTimeMinutes: string;
        perMinuteCost: string;
        othersCost: string;
        extraProfitCost: string;
      }
    >
  >({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "in_progress" | "completed"
  >("all");
  const [pageSize, setPageSize] = useState(10);
  const filteredRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...(requests ?? [])].sort((a, b) => {
      const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    });
    return list.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      const trackId = `SOZOLEN3D-${r.id}`.toLowerCase();
      return (
        trackId.includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.toLowerCase().includes(q)
      );
    });
  }, [requests, search, statusFilter]);
  type RequestRow = NonNullable<typeof requests>[number];
  const pagedRequests = useMemo(() => {
    const list = filteredRequests;
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [filteredRequests, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const getDraft = (r: RequestRow) => {
    const existing = quoteByRequest[r.id];
    return {
      quotedPrice: existing?.quotedPrice ?? String(r.quotedPrice ?? ""),
      quoteNotes: existing?.quoteNotes ?? (r.quoteNotes ?? ""),
      quoteEta: existing?.quoteEta ?? (r.quoteEta ?? ""),
      filamentWeightGrams: existing?.filamentWeightGrams ?? "",
      perGramCost: existing?.perGramCost ?? "",
      printingTimeMinutes: existing?.printingTimeMinutes ?? "",
      perMinuteCost: existing?.perMinuteCost ?? "",
      othersCost: existing?.othersCost ?? "",
      extraProfitCost: existing?.extraProfitCost ?? "",
    };
  };

  const setDraft = (
    requestId: number,
    updater: (prev: ReturnType<typeof getDraft>) => ReturnType<typeof getDraft>,
  ) => {
    const currentRequest = requests?.find((item) => item.id === requestId);
    if (!currentRequest) return;
    const previous = getDraft(currentRequest);
    const next = updater(previous);
    setQuoteByRequest((prev) => ({
      ...prev,
      [requestId]: next,
    }));
  };

  const formatRequestAddress = (r: RequestRow) => {
    if (r.addressLine1 || r.city || r.pincode) {
      return [
        r.addressLine1,
        r.addressLine2,
        [r.city, r.state, r.pincode].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join(", ");
    }
    return r.address ?? "";
  };

  if (isLoading) {
    return <AdminTableSkeleton title="Custom Requests" columns={7} rows={8} />;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Custom Requests</h1>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Track ID (e.g. SOZOLEN3D-12), name, email, phone"
          className="max-w-xl rounded-xl"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as "all" | "pending" | "in_progress" | "completed",
            )
          }
          className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
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
      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tracking ID</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Description Preview</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quote</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRequests.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm font-medium">SOZOLEN3D-{r.id}</TableCell>
                <TableCell>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.email}</div>
                </TableCell>
                <TableCell className="max-w-xs truncate">{r.description}</TableCell>
                <TableCell>
                  <Select 
                    value={r.status}
                    onValueChange={(val) => updateStatus.mutate({ id: r.id, status: val })}
                  >
                    <SelectTrigger className="w-[140px] h-9 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    <div className="font-medium">
                      {r.quoteStatus === "accepted"
                        ? "Accepted"
                        : r.quoteStatus === "sent"
                          ? "Sent"
                          : r.quoteStatus === "rejected"
                            ? "Rejected"
                            : "Pending"}
                    </div>
                    {typeof r.quotedPrice === "number" && (
                      <div className="text-muted-foreground">INR {r.quotedPrice.toLocaleString("en-IN")}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(r.createdAt!).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-lg"><Eye className="w-4 h-4 mr-2"/> View</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] max-h-[90vh] rounded-3xl flex flex-col overflow-hidden p-0">
                      <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
                        <DialogTitle>Request Details</DialogTitle>
                      </DialogHeader>
                      <div className="overflow-y-auto flex-1 min-h-0 px-6 pb-6 space-y-4 mt-2 text-sm">
                        <div><strong className="text-foreground">Tracking ID:</strong> <span className="font-mono font-semibold">SOZOLEN3D-{r.id}</span></div>
                        <div><strong className="text-foreground">Name:</strong> {r.name}</div>
                        <div><strong className="text-foreground">Email:</strong> {r.email}</div>
                        <div><strong className="text-foreground">Phone:</strong> {r.phone}</div>
                        {formatRequestAddress(r) && (
                          <div>
                            <strong className="text-foreground">Address:</strong>
                            <p className="mt-1 bg-muted p-3 rounded-xl text-muted-foreground">
                              {formatRequestAddress(r)}
                            </p>
                          </div>
                        )}
                        {r.pincode && (
                          <div>
                            <strong className="text-foreground">Delivery pincode:</strong> {r.pincode}
                          </div>
                        )}
                        <div><strong className="text-foreground">Quote status:</strong> {r.quoteStatus}</div>
                        {typeof r.quotedPrice === "number" && (
                          <div><strong className="text-foreground">Quoted price:</strong> INR {r.quotedPrice.toLocaleString("en-IN")}</div>
                        )}
                        {r.quoteEta && (
                          <div><strong className="text-foreground">Quote ETA:</strong> {r.quoteEta}</div>
                        )}
                        {r.quoteNotes && (
                          <div><strong className="text-foreground">Quote notes:</strong> {r.quoteNotes}</div>
                        )}
                        <div>
                          <strong className="text-foreground">Description:</strong>
                          <p className="mt-1 bg-muted p-4 rounded-xl text-muted-foreground leading-relaxed">{r.description}</p>
                        </div>
                        {r.imageUrls.length > 0 && (
                          <div>
                            <strong className="text-foreground">Reference Images:</strong>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {r.imageUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noreferrer">
                                  <img src={url} className="w-full h-24 object-cover rounded-lg border border-border" alt="" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="rounded-xl border border-border/50 p-3 space-y-3">
                          <h4 className="font-medium">Send quote</h4>
                          <Input
                            type="number"
                            placeholder="Quoted price (INR)"
                            value={getDraft(r).quotedPrice}
                            onChange={(e) =>
                              setDraft(r.id, (prev) => ({
                                ...prev,
                                quotedPrice: e.target.value,
                              }))
                            }
                          />
                          <div className="rounded-lg border border-border/60 p-3 space-y-3 bg-muted/20">
                            <p className="text-xs text-muted-foreground">
                              Cost calculation: (Filament weight x per gram) + (Print time x per min) + Others + Extra profit
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                min={0}
                                placeholder="Filament weight (g)"
                                value={getDraft(r).filamentWeightGrams}
                                onChange={(e) =>
                                  setDraft(r.id, (prev) => ({
                                    ...prev,
                                    filamentWeightGrams: e.target.value,
                                  }))
                                }
                              />
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                placeholder="Per gram cost (INR)"
                                value={getDraft(r).perGramCost}
                                onChange={(e) =>
                                  setDraft(r.id, (prev) => ({
                                    ...prev,
                                    perGramCost: e.target.value,
                                  }))
                                }
                              />
                              <Input
                                type="number"
                                min={0}
                                placeholder="Print time (min)"
                                value={getDraft(r).printingTimeMinutes}
                                onChange={(e) =>
                                  setDraft(r.id, (prev) => ({
                                    ...prev,
                                    printingTimeMinutes: e.target.value,
                                  }))
                                }
                              />
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                placeholder="Per minute cost (INR)"
                                value={getDraft(r).perMinuteCost}
                                onChange={(e) =>
                                  setDraft(r.id, (prev) => ({
                                    ...prev,
                                    perMinuteCost: e.target.value,
                                  }))
                                }
                              />
                              <Input
                                type="number"
                                min={0}
                                placeholder="Others (INR)"
                                value={getDraft(r).othersCost}
                                onChange={(e) =>
                                  setDraft(r.id, (prev) => ({
                                    ...prev,
                                    othersCost: e.target.value,
                                  }))
                                }
                              />
                              <Input
                                type="number"
                                min={0}
                                placeholder="Extra profit (INR)"
                                value={getDraft(r).extraProfitCost}
                                onChange={(e) =>
                                  setDraft(r.id, (prev) => ({
                                    ...prev,
                                    extraProfitCost: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            {(() => {
                              const draft = getDraft(r);
                              const fields = [
                                draft.filamentWeightGrams,
                                draft.perGramCost,
                                draft.printingTimeMinutes,
                                draft.perMinuteCost,
                                draft.othersCost,
                                draft.extraProfitCost,
                              ];
                              const allFilled = fields.every(
                                (value) =>
                                  value !== "" &&
                                  Number.isFinite(Number(value)) &&
                                  Number(value) >= 0,
                              );
                              if (!allFilled) return null;
                              const f = Number(draft.filamentWeightGrams);
                              const pg = Number(draft.perGramCost);
                              const t = Number(draft.printingTimeMinutes);
                              const pm = Number(draft.perMinuteCost);
                              const o = Number(draft.othersCost);
                              const e = Number(draft.extraProfitCost);
                              const calc = roundMoney(f * pg + t * pm + o + e);
                              return (
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium text-primary">
                                    Calculated quote: INR{" "}
                                    {calc.toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </p>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setDraft(r.id, (prev) => ({
                                        ...prev,
                                        quotedPrice: String(calc),
                                      }))
                                    }
                                  >
                                    Use calculated
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
                          <Input
                            placeholder="Estimated timeline (e.g. 7-10 days)"
                            value={getDraft(r).quoteEta}
                            onChange={(e) =>
                              setDraft(r.id, (prev) => ({
                                ...prev,
                                quoteEta: e.target.value,
                              }))
                            }
                          />
                          <Textarea
                            placeholder="Quote notes"
                            value={getDraft(r).quoteNotes}
                            onChange={(e) =>
                              setDraft(r.id, (prev) => ({
                                ...prev,
                                quoteNotes: e.target.value,
                              }))
                            }
                            className="min-h-[72px]"
                          />
                          <Button
                            type="button"
                            className="w-full"
                            disabled={sendQuote.isPending}
                            onClick={async () => {
                              const draft = getDraft(r);
                              const raw = draft.quotedPrice;
                              const quotedPrice = Number(raw);
                              if (!Number.isFinite(quotedPrice) || quotedPrice < 0.01) {
                                toast({
                                  variant: "destructive",
                                  title: "Valid quote price required",
                                });
                                return;
                              }
                              try {
                                await sendQuote.mutateAsync({
                                  id: r.id,
                                  quotedPrice,
                                  quoteEta: draft.quoteEta || undefined,
                                  quoteNotes: draft.quoteNotes || undefined,
                                });
                                toast({ title: "Quote sent" });
                              } catch (e: any) {
                                toast({
                                  variant: "destructive",
                                  title: e?.message ?? "Failed to send quote",
                                });
                              }
                            }}
                          >
                            Send quote
                          </Button>
                        </div>
                        <div className="rounded-xl border border-border/50 p-3 space-y-2">
                          <h4 className="font-medium">Convert to order</h4>
                          <p className="text-xs text-muted-foreground">
                            Customer must accept the quote before normal conversion.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Override converts without customer acceptance (for offline/manual approvals).
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              type="button"
                              variant="default"
                              disabled={
                                convertToOrder.isPending ||
                                !!r.convertedOrderId ||
                                r.quoteStatus !== "accepted"
                              }
                              onClick={async () => {
                                try {
                                  await convertToOrder.mutateAsync({ id: r.id });
                                  toast({ title: "Converted to order" });
                                } catch (e: any) {
                                  toast({
                                    variant: "destructive",
                                    title: e?.message ?? "Failed to convert",
                                  });
                                }
                              }}
                            >
                              Convert
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={convertToOrder.isPending || !!r.convertedOrderId}
                              onClick={async () => {
                                try {
                                  await convertToOrder.mutateAsync({ id: r.id, adminOverride: true });
                                  toast({ title: "Converted with admin override" });
                                } catch (e: any) {
                                  toast({
                                    variant: "destructive",
                                    title: e?.message ?? "Failed to convert",
                                  });
                                }
                              }}
                            >
                              Override
                            </Button>
                          </div>
                          {r.quoteStatus !== "accepted" && !r.convertedOrderId && (
                            <p className="text-xs text-amber-600 dark:text-amber-400">
                              Convert is disabled until customer accepts the quote.
                            </p>
                          )}
                          {r.convertedOrderId && (
                            <p className="text-xs text-muted-foreground">
                              Converted as order #{r.convertedOrderId}
                            </p>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
            {filteredRequests.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No custom requests yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationControls
          page={page}
          setPage={setPage}
          totalItems={filteredRequests.length}
          pageSize={pageSize}
        />
      </div>
    </div>
  );
}
