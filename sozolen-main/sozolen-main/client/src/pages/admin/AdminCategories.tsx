import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { useUploadFile } from "@/hooks/use-uploads";
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
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMemo } from "react";
import { PaginationControls } from "@/components/PaginationControls";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const toFolderSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const CATEGORY_DRAFT_STORAGE_KEY = "admin:category:draft:v1";

export default function AdminCategories() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: allProducts, isLoading: productsLoading } = useProducts(null);
  const productCountByCategoryId: Record<number, number> = {};
  if (allProducts && categories) {
    for (const c of categories) {
      productCountByCategoryId[c.id] = allProducts.filter(
        (p) => p.categoryId === c.id,
      ).length;
    }
  }
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const uploadFile = useUploadFile();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [productsFilter, setProductsFilter] = useState<"all" | "with" | "without">("all");
  const [pageSize, setPageSize] = useState(10);
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = categories ?? [];
    return list.filter((c) => {
      const count = productCountByCategoryId[c.id] ?? 0;
      if (productsFilter === "with" && count < 1) return false;
      if (productsFilter === "without" && count > 0) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q);
    });
  }, [categories, productCountByCategoryId, search, productsFilter]);
  const pagedCategories = useMemo(() => {
    const list = filteredCategories;
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [filteredCategories, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, productsFilter, pageSize]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
  });

  const saveDraftLocally = () => {
    try {
      const values = getValues();
      localStorage.setItem(
        CATEGORY_DRAFT_STORAGE_KEY,
        JSON.stringify({
          editingId,
          values,
          imgPreview,
          savedAt: new Date().toISOString(),
        }),
      );
      toast({
        title: "Draft saved",
        description: "Saved locally. New image files are not stored in draft.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Draft save failed",
        description: "Could not save this draft locally.",
      });
    }
  };

  const restoreDraftLocally = (targetEditingId: number | null) => {
    try {
      const raw = localStorage.getItem(CATEGORY_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        editingId: number | null;
        values: z.infer<typeof categorySchema>;
        imgPreview?: string | null;
      };
      if (draft.editingId !== targetEditingId) return;
      reset(draft.values);
      setImgFile(null);
      setImgPreview(draft.imgPreview ?? null);
      toast({
        title: "Draft restored",
        description: "Loaded your locally saved draft.",
      });
    } catch {
      // Ignore broken local draft payloads.
    }
  };

  const openEdit = (c: { id: number; name: string; imageUrl: string }) => {
    setEditingId(c.id);
    setValue("name", c.name);
    setValue("imageUrl", c.imageUrl ?? "");
    setImgFile(null);
    setImgPreview(c.imageUrl || null);
    restoreDraftLocally(c.id);
    setOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    reset({ name: "", imageUrl: "" });
    setImgFile(null);
    setImgPreview(null);
    restoreDraftLocally(null);
    setOpen(true);
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImgFile(file);
    if (file) {
      setImgPreview(URL.createObjectURL(file));
    } else {
      setImgPreview(
        editingId
          ? (categories?.find((c) => c.id === editingId)?.imageUrl ?? null)
          : null,
      );
    }
  };

  const onSubmit = async (data: z.infer<typeof categorySchema>) => {
    try {
      let imageUrl = data.imageUrl;
      if (imgFile) {
        const folderName = toFolderSlug(data.name || "untitled-category") || "untitled-category";
        const res = await uploadFile.mutateAsync({
          file: imgFile,
          folder: `Category/${folderName}`,
        });
        imageUrl = res.url;
      }
      if (!imageUrl) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Category image is required",
        });
        return;
      }
      if (editingId) {
        await updateCategory.mutateAsync({
          id: editingId,
          name: data.name,
          imageUrl,
        });
      } else {
        await createCategory.mutateAsync({ name: data.name, imageUrl });
      }
      localStorage.removeItem(CATEGORY_DRAFT_STORAGE_KEY);
      setOpen(false);
      toast({ title: "Success", description: "Category saved successfully" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save category",
      });
    }
  };

  if (categoriesLoading || productsLoading) {
    return <AdminTableSkeleton title="Categories" columns={6} rows={8} />;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total data: {categories?.length ?? 0}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search category name"
            className="w-[240px] rounded-xl"
          />
          <select
            value={productsFilter}
            onChange={(e) =>
              setProductsFilter(e.target.value as "all" | "with" | "without")
            }
            className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All categories</option>
            <option value="with">With products</option>
            <option value="without">Without products</option>
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
          <Button onClick={openNew} className="rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedCategories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <img
                    src={c.imageUrl}
                    className="w-16 h-16 rounded-lg object-cover"
                    alt={c.name}
                  />
                </TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {productCountByCategoryId[c.id] ?? 0}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {(c as { updatedAt?: string | null }).updatedAt
                    ? new Date((c as { updatedAt?: string | null }).updatedAt as string).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openEdit(c)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteCategory.mutate(c.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredCategories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No categories yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationControls
          page={page}
          setPage={setPage}
          totalItems={filteredCategories.length}
          pageSize={pageSize}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[480px] max-h-[90vh] rounded-3xl flex flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
            <DialogTitle>
              {editingId ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  {...register("name")}
                  className="rounded-xl"
                  placeholder="e.g. Miniatures"
                />
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="rounded-xl"
                />
                {imgPreview && (
                  <div className="mt-2 rounded-xl border border-border overflow-hidden bg-muted/30 w-full max-w-[280px] aspect-video flex items-center justify-center">
                    <img
                      src={imgPreview}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={saveDraftLocally}
                  disabled={isSubmitting}
                  className="h-12 rounded-xl"
                >
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || uploadFile.isPending}
                  className="h-12 rounded-xl"
                >
                  {isSubmitting || uploadFile.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
