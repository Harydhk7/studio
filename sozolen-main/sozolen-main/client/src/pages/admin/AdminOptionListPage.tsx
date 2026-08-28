import { useEffect, useMemo, useState } from "react";
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
import { Edit, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useColorOptions,
  useCreateOption,
  useDeleteOption,
  useOtherOptions,
  useSizeOptions,
  useUpdateOption,
} from "@/hooks/use-option-lists";
import { ArrowLeft } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";

type OptionType = "colors" | "sizes" | "others";

type Props = {
  type: OptionType;
  title: string;
  addButtonText: string;
  helperText?: string;
  backHref?: string;
};

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

const toPickerSafeHex = (value: string): string => {
  const trimmed = value.trim();
  const hexMatch = /^#?[0-9a-fA-F]{6}$/.exec(trimmed);
  if (hexMatch) {
    const hex = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    return hex.toLowerCase();
  }
  return "#ffffff";
};

const isHexColor = (value: string): boolean =>
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());

export function AdminOptionListPage({
  type,
  title,
  addButtonText,
  helperText,
  backHref = "/admin/attributes",
}: Props) {
  const { toast } = useToast();
  const listQuery =
    type === "colors"
      ? useColorOptions()
      : type === "sizes"
        ? useSizeOptions()
        : useOtherOptions();
  const createMutation = useCreateOption(type);
  const updateMutation = useUpdateOption(type);
  const deleteMutation = useDeleteOption(type);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [pickerColor, setPickerColor] = useState("#ffffff");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const rows = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(q));
  }, [rows, search]);
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setPickerColor("#ffffff");
    setOpen(true);
  };

  const openEdit = (row: { id: number; name: string }) => {
    setEditingId(row.id);
    setName(row.name);
    setPickerColor(toPickerSafeHex(row.name));
    setOpen(true);
  };

  const onSave = async () => {
    const trimmed = name.trim();
    const finalValue = type === "colors" ? (trimmed || pickerColor) : trimmed;
    if (!finalValue) {
      toast({ variant: "destructive", title: "Name is required" });
      return;
    }
    if (type === "colors" && finalValue.trim().startsWith("#") && !isHexColor(finalValue)) {
      toast({
        variant: "destructive",
        title: "Invalid color code",
        description: "Use #RGB or #RRGGBB format.",
      });
      return;
    }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, name: finalValue });
        toast({ title: "Updated" });
      } else {
        await createMutation.mutateAsync({ name: finalValue });
        toast({ title: "Created" });
      }
      setOpen(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: parseApiErrorMessage(err, "Could not save item"),
      });
    }
  };

  const onDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "Deleted" });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to delete",
        description: parseApiErrorMessage(err, "Could not delete item"),
      });
    }
  };

  return (
    <div>
      <div className="mb-3">
        <Link href={backHref}>
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Product Attributes
          </Button>
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {helperText ? (
            <p className="text-sm text-muted-foreground mt-1">{helperText}</p>
          ) : null}
        </div>
        <Button onClick={openCreate} className="rounded-xl px-6">
          <Plus className="w-4 h-4 mr-2" />
          {addButtonText}
        </Button>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name"
            className="w-[240px] rounded-xl"
          />
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">
                  {type === "colors" ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border border-black/20"
                        style={{ backgroundColor: row.name }}
                      />
                      {row.name}
                    </span>
                  ) : (
                    row.name
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(row)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(row.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredRows.length === 0 && !listQuery.isLoading && (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                  No items yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationControls
          page={page}
          setPage={setPage}
          totalItems={filteredRows.length}
          pageSize={pageSize}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Update" : "Create"}{" "}
              {type === "colors" ? "color" : type === "sizes" ? "size" : "decoration"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              {type === "colors" && (
                <p className="text-xs text-muted-foreground">
                  Enter color name or choose color code. If name is entered, name is saved. If empty, selected color code is saved.
                </p>
              )}
              <Input
                value={name}
                onChange={(e) => {
                  const next = e.target.value;
                  setName(next);
                  if (type === "colors") {
                    setPickerColor(toPickerSafeHex(next));
                  }
                }}
                className="rounded-xl"
                placeholder={type === "colors" ? "Enter color (e.g. #ff6600 or red)" : "Enter name"}
              />
            </div>
            {type === "colors" && (
              <div className="space-y-2">
                <Label>Color picker</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={pickerColor}
                    onChange={(e) => {
                      const nextColor = e.target.value;
                      setPickerColor(nextColor);
                      const current = name.trim();
                      if (!current || isHexColor(current)) {
                        setName(nextColor);
                      }
                    }}
                    className="h-10 w-14 p-1 rounded-xl cursor-pointer"
                  />
                  <span className="text-xs font-mono text-muted-foreground">
                    {pickerColor.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <Button onClick={onSave} className="w-full rounded-xl">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
