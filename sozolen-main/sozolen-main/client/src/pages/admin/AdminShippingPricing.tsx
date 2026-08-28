import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Plus, Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateShippingRange,
  useDeleteShippingRange,
  useShippingRanges,
  useShippingSettings,
  useUpdateShippingRange,
  useUpdateShippingSettings,
} from "@/hooks/use-shipping-pricing";
import { ArrowLeft } from "lucide-react";

const parseApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!(err instanceof Error) || !err.message) return fallback;
  try {
    const parsed = JSON.parse(err.message);
    if (parsed && typeof parsed.message === "string") return parsed.message;
  } catch {
    // keep fallback behavior
  }
  return err.message;
};

type RangeFormState = {
  id: number | null;
  minKm: string;
  maxKm: string;
  price: string;
};

export default function AdminShippingPricing() {
  const { toast } = useToast();
  const settingsQuery = useShippingSettings();
  const rangesQuery = useShippingRanges();
  const updateSettings = useUpdateShippingSettings();
  const createRange = useCreateShippingRange();
  const updateRange = useUpdateShippingRange();
  const deleteRange = useDeleteShippingRange();

  const [warehousePincode, setWarehousePincode] = useState("");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [rangeForm, setRangeForm] = useState<RangeFormState>({
    id: null,
    minKm: "",
    maxKm: "",
    price: "",
  });

  const rows = useMemo(() => rangesQuery.data ?? [], [rangesQuery.data]);

  const syncedPincode =
    settingsQuery.data?.warehousePincode && warehousePincode === ""
      ? settingsQuery.data.warehousePincode
      : warehousePincode;

  const openCreateRange = () => {
    setRangeForm({ id: null, minKm: "", maxKm: "", price: "" });
    setRangeOpen(true);
  };

  const openEditRange = (row: { id: number; minKm: number; maxKm: number; price: number }) => {
    setRangeForm({
      id: row.id,
      minKm: String(row.minKm),
      maxKm: String(row.maxKm),
      price: String(row.price),
    });
    setRangeOpen(true);
  };

  const savePincode = async () => {
    const value = syncedPincode.trim();
    if (!value) {
      toast({ variant: "destructive", title: "Warehouse pincode is required" });
      return;
    }
    try {
      const updated = await updateSettings.mutateAsync({ warehousePincode: value });
      setWarehousePincode(updated.warehousePincode);
      toast({ title: "Warehouse pincode saved" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: parseApiErrorMessage(err, "Could not save warehouse pincode"),
      });
    }
  };

  const saveRange = async () => {
    const minKm = Number(rangeForm.minKm);
    const maxKm = Number(rangeForm.maxKm);
    const price = Number(rangeForm.price);
    if (!Number.isFinite(minKm) || !Number.isFinite(maxKm) || !Number.isFinite(price)) {
      toast({ variant: "destructive", title: "Enter valid numeric values" });
      return;
    }
    try {
      if (rangeForm.id) {
        await updateRange.mutateAsync({ id: rangeForm.id, minKm, maxKm, price });
        toast({ title: "Range updated" });
      } else {
        await createRange.mutateAsync({ minKm, maxKm, price });
        toast({ title: "Range created" });
      }
      setRangeOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to save range",
        description: parseApiErrorMessage(err, "Could not save shipping range"),
      });
    }
  };

  const onDeleteRange = async (id: number) => {
    try {
      await deleteRange.mutateAsync(id);
      toast({ title: "Range deleted" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to delete range",
        description: parseApiErrorMessage(err, "Could not delete shipping range"),
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/attributes">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Product Attributes
          </Button>
        </Link>
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shipping Price</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set warehouse pincode and manage distance-based shipping ranges.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <Label>Warehouse location pincode</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={syncedPincode}
            onChange={(e) => setWarehousePincode(e.target.value)}
            className="rounded-xl max-w-[240px]"
            placeholder="Enter warehouse pincode"
          />
          <Button onClick={savePincode} className="rounded-xl">
            <Save className="w-4 h-4 mr-2" />
            Save pincode
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">KM Range Pricing</h2>
        <Button onClick={openCreateRange} className="rounded-xl">
          <Plus className="w-4 h-4 mr-2" />
          Add range
        </Button>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Min KM</TableHead>
              <TableHead>Max KM</TableHead>
              <TableHead>Price (₹)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.minKm}</TableCell>
                <TableCell>{row.maxKm}</TableCell>
                <TableCell>₹{row.price.toLocaleString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEditRange(row)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDeleteRange(row.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && !rangesQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No shipping ranges yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={rangeOpen} onOpenChange={setRangeOpen}>
        <DialogContent className="sm:max-w-[520px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>{rangeForm.id ? "Edit range" : "Add range"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Min KM</Label>
              <Input
                type="number"
                min={0}
                value={rangeForm.minKm}
                onChange={(e) =>
                  setRangeForm((prev) => ({ ...prev, minKm: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Max KM</Label>
              <Input
                type="number"
                min={0}
                value={rangeForm.maxKm}
                onChange={(e) =>
                  setRangeForm((prev) => ({ ...prev, maxKm: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input
                type="number"
                min={0}
                value={rangeForm.price}
                onChange={(e) =>
                  setRangeForm((prev) => ({ ...prev, price: e.target.value }))
                }
                className="rounded-xl"
              />
            </div>
          </div>
          <Button onClick={saveRange} className="w-full rounded-xl">
            Save range
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
