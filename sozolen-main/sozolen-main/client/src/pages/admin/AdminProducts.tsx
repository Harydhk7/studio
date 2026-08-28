import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/hooks/use-products";
import { useCategories } from "@/hooks/use-categories";
import { useDeleteUpload, useUploadFile } from "@/hooks/use-uploads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Edit, Trash2, Loader2, Star, GripVertical, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateAdminReview, useProductReviews } from "@/hooks/use-reviews";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PaginationControls } from "@/components/PaginationControls";
import { AdminTableSkeleton } from "@/components/admin/AdminTableSkeleton";
import { useColorOptions, useOtherOptions, useSizeOptions } from "@/hooks/use-option-lists";
import { useLocation } from "wouter";

const productSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().min(0),
  categoryId: z.coerce.number().optional().nullable(),
  customerCanChooseColor: z.boolean().optional(),
  customerCanChooseSize: z.boolean().optional(),
  sizeSelectionMode: z.enum(["inherit", "add", "override"]).optional(),
  defaultSize: z.string().optional().nullable(),
  customerCanChooseOther: z.boolean().optional(),
  overallSize: z.string().optional().nullable(),
  productSizeOptions: z.string().optional().nullable(),
  filamentWeightGrams: z.coerce.number().min(0).optional().nullable(),
  perGramCost: z.coerce.number().min(0).optional().nullable(),
  printingTimeMinutes: z.coerce.number().min(0).optional().nullable(),
  perMinuteCost: z.coerce.number().min(0).optional().nullable(),
  othersCost: z.coerce.number().min(0).optional().nullable(),
  extraProfitCost: z.coerce.number().min(0).optional().nullable(),
});

const IMAGE_DND_TYPE = "product-image";
const roundMoney = (value: number) => Math.round(value * 100) / 100;
const PRODUCT_DRAFT_STORAGE_KEY = "admin:product:draft:v1";

const toFolderSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

type ProductImageItem =
  | { id: string; kind: "existing"; url: string }
  | { id: string; kind: "new"; file: File; previewUrl: string };

const revokeLocalPreviewUrls = (items: ProductImageItem[]) => {
  for (const item of items) {
    if (item.kind === "new") {
      URL.revokeObjectURL(item.previewUrl);
    }
  }
};

function DraggableImageTile({
  index,
  imageUrl,
  moveImage,
  onRemove,
}: {
  index: number;
  imageUrl: string;
  moveImage: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: IMAGE_DND_TYPE,
    hover: (item: { index: number }) => {
      if (!ref.current) return;
      if (item.index === index) return;
      moveImage(item.index, index);
      item.index = index;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: IMAGE_DND_TYPE,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`relative rounded-xl border border-border bg-muted/20 p-2 ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <img src={imageUrl} alt={`Product image ${index + 1}`} className="h-24 w-full rounded-lg object-cover" />
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <GripVertical className="h-3 w-3" /> Position {index + 1}
        </span>
        <button type="button" onClick={() => onRemove(index)} className="rounded p-1 hover:bg-muted">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {index === 0 && (
        <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-0.5 text-[10px] text-white">Primary</span>
      )}
    </div>
  );
}

export default function AdminProducts() {
  const [, setLocation] = useLocation();
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");
  const { data: products, isLoading: productsLoading } = useProducts(
    categoryFilter === "" ? null : categoryFilter,
  );
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createAdminReview = useCreateAdminReview();
  const uploadFile = useUploadFile();
  const deleteUpload = useDeleteUpload();
  const { data: colorOptions = [] } = useColorOptions();
  const { data: sizeOptions = [] } = useSizeOptions();
  const { data: otherOptions = [] } = useOtherOptions();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const { data: productReviews } = useProductReviews(editingId);
  const [productImages, setProductImages] = useState<ProductImageItem[]>([]);
  const [originalProductImages, setOriginalProductImages] = useState<string[]>([]);
  const [uploadingOnSave, setUploadingOnSave] = useState(false);
  const [sizePricesBySize, setSizePricesBySize] = useState<Record<string, string>>(
    {},
  );
  const [initialRating, setInitialRating] = useState(0);
  const [initialReviewComment, setInitialReviewComment] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [addingReview, setAddingReview] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products ?? [];
    if (!q) return list;
    return list.filter((p) => {
      const categoryName = p.categoryId
        ? (categories?.find((c) => c.id === p.categoryId)?.name ?? "")
        : "";
      return (
        p.title.toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        categoryName.toLowerCase().includes(q)
      );
    });
  }, [products, categories, search]);
  const pagedProducts = useMemo(() => {
    const list = filteredProducts;
    const start = (page - 1) * pageSize;
    return list.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);
  useEffect(() => {
    setPage(1);
  }, [search, pageSize, categoryFilter]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { isSubmitting },
  } = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
  });
  const watchedProductSizeOptions = watch("productSizeOptions");
  const watchedSizeSelectionMode = watch("sizeSelectionMode");
  const parsedProductSizes = useMemo(
    () =>
      String(watchedProductSizeOptions ?? "")
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter(Boolean),
    [watchedProductSizeOptions],
  );
  const adminSizeChoices = useMemo(() => {
    const mode =
      watchedSizeSelectionMode === "add" || watchedSizeSelectionMode === "override"
        ? watchedSizeSelectionMode
        : "inherit";
    const globalSizes = sizeOptions.map((row) => row.name);
    if (mode === "override") return parsedProductSizes;
    if (mode === "add") return Array.from(new Set([...globalSizes, ...parsedProductSizes]));
    return globalSizes;
  }, [parsedProductSizes, sizeOptions, watchedSizeSelectionMode]);

  const saveDraftLocally = () => {
    try {
      const values = getValues();
      const existingImages = productImages
        .filter((item): item is Extract<ProductImageItem, { kind: "existing" }> => item.kind === "existing")
        .map((item) => item.url);
      const payload = {
        editingId,
        values,
        sizePricesBySize,
        existingImages,
        initialRating,
        initialReviewComment,
        newReviewRating,
        newReviewComment,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(PRODUCT_DRAFT_STORAGE_KEY, JSON.stringify(payload));
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
      const raw = localStorage.getItem(PRODUCT_DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as {
        editingId: number | null;
        values: z.infer<typeof productSchema>;
        sizePricesBySize?: Record<string, string>;
        existingImages?: string[];
        initialRating?: number;
        initialReviewComment?: string;
        newReviewRating?: number;
        newReviewComment?: string;
      };
      if (draft.editingId !== targetEditingId) return;
      reset(draft.values);
      setSizePricesBySize(draft.sizePricesBySize ?? {});
      const urls = Array.isArray(draft.existingImages) ? draft.existingImages.filter(Boolean) : [];
      setProductImages(
        urls.map((url) => ({
          id: `${url}-${Math.random().toString(36).slice(2, 8)}`,
          kind: "existing" as const,
          url,
        })),
      );
      setOriginalProductImages(urls);
      setInitialRating(draft.initialRating ?? 0);
      setInitialReviewComment(draft.initialReviewComment ?? "");
      setNewReviewRating(draft.newReviewRating ?? 5);
      setNewReviewComment(draft.newReviewComment ?? "");
      toast({
        title: "Draft restored",
        description: "Loaded your locally saved draft.",
      });
    } catch {
      // Ignore broken local draft payloads.
    }
  };

  const openEdit = (p: any) => {
    revokeLocalPreviewUrls(productImages);
    setEditingId(p.id);
    setValue("title", p.title);
    setValue("description", p.description);
    setValue("price", p.price);
    setValue("categoryId", p.categoryId ?? "");
    setValue("customerCanChooseColor", !!p.customerCanChooseColor);
    setValue("customerCanChooseSize", !!p.customerCanChooseSize);
    setValue(
      "sizeSelectionMode",
      p.sizeSelectionMode === "add" || p.sizeSelectionMode === "override"
        ? p.sizeSelectionMode
        : "inherit",
    );
    setValue("customerCanChooseOther", !!p.customerCanChooseOther);
    setValue("overallSize", p.overallSize ?? "");
    setValue(
      "productSizeOptions",
      Array.isArray(p.availableSizes) ? p.availableSizes.join("\n") : "",
    );
    setValue("defaultSize", p.defaultSize ?? "");
    setValue("filamentWeightGrams", p.filamentWeightGrams ?? "");
    setValue("perGramCost", p.perGramCost ?? "");
    setValue("printingTimeMinutes", p.printingTimeMinutes ?? "");
    setValue("perMinuteCost", p.perMinuteCost ?? "");
    setValue("othersCost", p.othersCost ?? "");
    setValue("extraProfitCost", p.extraProfitCost ?? "");
    setProductImages(
      (Array.isArray(p.productImages) && p.productImages.length > 0
        ? p.productImages.filter(Boolean)
        : (p.imageUrl ? [p.imageUrl] : [])
      ).map((url: string) => ({
        id: `${url}-${Math.random().toString(36).slice(2, 8)}`,
        kind: "existing" as const,
        url,
      })),
    );
    setOriginalProductImages(
      Array.isArray(p.productImages) && p.productImages.length > 0
        ? p.productImages.filter(Boolean)
        : (p.imageUrl ? [p.imageUrl] : []),
    );
    setSizePricesBySize(
      p.sizePrices && typeof p.sizePrices === "object" && !Array.isArray(p.sizePrices)
        ? Object.entries(p.sizePrices as Record<string, unknown>).reduce(
            (acc, [size, amount]) => {
              const num = Number(amount);
              if (Number.isFinite(num) && num >= 0) {
                acc[size] = String(num);
              }
              return acc;
            },
            {} as Record<string, string>,
          )
        : {},
    );
    setNewReviewRating(5);
    setNewReviewComment("");
    restoreDraftLocally(p.id);
    setOpen(true);
  };

  const openNew = () => {
    revokeLocalPreviewUrls(productImages);
    setEditingId(null);
    reset({
      title: "",
      description: "",
      price: 0,
      categoryId: undefined,
      customerCanChooseColor: false,
      customerCanChooseSize: false,
      sizeSelectionMode: "inherit",
      defaultSize: "",
      customerCanChooseOther: false,
      overallSize: "",
      productSizeOptions: "",
      filamentWeightGrams: undefined,
      perGramCost: undefined,
      printingTimeMinutes: undefined,
      perMinuteCost: undefined,
      othersCost: undefined,
      extraProfitCost: undefined,
    });
    setProductImages([]);
    setOriginalProductImages([]);
    setSizePricesBySize({});
    setInitialRating(0);
    setInitialReviewComment("");
    setNewReviewRating(5);
    setNewReviewComment("");
    restoreDraftLocally(null);
    setOpen(true);
  };

  const onImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    const newItems: ProductImageItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "new",
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setProductImages((prev) => [...prev, ...newItems]);
    toast({
      title: "Images added",
      description: `${newItems.length} image(s) ready. Upload starts when you click Save.`,
    });
    e.target.value = "";
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setProductImages((prev) => {
      if (fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const removeImageAt = (index: number) => {
    setProductImages((prev) => {
      const target = prev[index];
      if (target?.kind === "new") {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    try {
      if (productImages.length === 0) {
        toast({
          variant: "destructive",
          title: "Add at least one product image",
        });
        return;
      }

      if (data.customerCanChooseColor && colorOptions.length === 0) {
        toast({
          variant: "destructive",
          title: "Color list is empty",
          description: "Add colors in Color List page before enabling color selection.",
        });
        return;
      }

      if (data.customerCanChooseSize && sizeOptions.length === 0) {
        toast({
          variant: "destructive",
          title: "Size list is empty",
          description: "Add sizes in Size List page before enabling size selection.",
        });
        return;
      }

      if (data.customerCanChooseOther && otherOptions.length === 0) {
        toast({
          variant: "destructive",
          title: "Other list is empty",
          description: "Add other options in Other List page before enabling this selection.",
        });
        return;
      }

      if (!editingId && initialRating >= 1 && initialRating <= 5 && !initialReviewComment.trim()) {
        toast({
          variant: "destructive",
          title: "Rating and review comment are required for the initial review.",
        });
        return;
      }

      setUploadingOnSave(true);
      const title = watch("title") ?? "";
      const folderName = toFolderSlug(title || "untitled-product") || "untitled-product";
      const newItemUrlById = new Map<string, string>();
      for (const item of productImages) {
        if (item.kind !== "new") continue;
        const res = await uploadFile.mutateAsync({
          file: item.file,
          folder: `Product/${folderName}`,
        });
        newItemUrlById.set(item.id, res.url);
      }

      const normalizedImages = productImages
        .map((item) => (item.kind === "existing" ? item.url : (newItemUrlById.get(item.id) ?? "")))
        .map((url) => url.trim())
        .filter(Boolean);

      if (normalizedImages.length === 0) return;

      const f = Number(data.filamentWeightGrams) || 0;
      const pg = Number(data.perGramCost) || 0;
      const t = Number(data.printingTimeMinutes) || 0;
      const pm = Number(data.perMinuteCost) || 0;
      const o = Number(data.othersCost) || 0;
      const e = Number(data.extraProfitCost) || 0;
      const priceFields = [data.filamentWeightGrams, data.perGramCost, data.printingTimeMinutes, data.perMinuteCost, data.othersCost, data.extraProfitCost];
      const useCalculation = priceFields.every((v) => v != null && Number.isFinite(Number(v)) && Number(v) >= 0);
      const calculatedPrice = useCalculation ? roundMoney(f * pg + t * pm + o + e) : null;
      const finalPrice =
        calculatedPrice != null && calculatedPrice >= 0
          ? calculatedPrice
          : roundMoney(Math.max(0, Number(data.price) || 0));

      const sizeSelectionMode =
        data.sizeSelectionMode === "add" || data.sizeSelectionMode === "override"
          ? data.sizeSelectionMode
          : "inherit";
      const effectiveSizeChoices = (() => {
        const globalSizes = sizeOptions.map((row) => row.name);
        if (sizeSelectionMode === "override") return parsedProductSizes;
        if (sizeSelectionMode === "add") {
          return Array.from(new Set([...globalSizes, ...parsedProductSizes]));
        }
        return globalSizes;
      })();
      if (data.customerCanChooseSize) {
        if (effectiveSizeChoices.length === 0) {
          toast({
            variant: "destructive",
            title: "No size options available",
            description: "Add at least one size option or change size mode.",
          });
          return;
        }
        const defaultSize = data.defaultSize?.trim() ?? "";
        if (!defaultSize || !effectiveSizeChoices.includes(defaultSize)) {
          toast({
            variant: "destructive",
            title: "Default size is required",
            description: "Choose a valid default size for this product.",
          });
          return;
        }
        for (const size of effectiveSizeChoices) {
          const amount = Number(sizePricesBySize[size]);
          if (!Number.isFinite(amount) || amount < 0) {
            toast({
              variant: "destructive",
              title: `Invalid price for ${size}`,
              description: "Enter a valid size-wise price (0 or above).",
            });
            return;
          }
        }
      }

      const payload = {
        ...data,
        price: finalPrice,
        imageUrl: normalizedImages[0],
        productImages: normalizedImages,
        model3dUrl: null,
        categoryId: data.categoryId ? Number(data.categoryId) : null,
        customerCanChooseColor: !!data.customerCanChooseColor,
        availableColors: [],
        customerCanChooseSize: !!data.customerCanChooseSize,
        sizeSelectionMode,
        defaultSize: data.customerCanChooseSize
          ? data.defaultSize?.trim() || null
          : null,
        overallSize: data.overallSize?.trim() ? data.overallSize.trim() : null,
        availableSizes: data.customerCanChooseSize
          ? (() => {
              const uniqueProductSizes = Array.from(new Set(parsedProductSizes));
              if (sizeSelectionMode === "override") return uniqueProductSizes;
              if (sizeSelectionMode === "add") return uniqueProductSizes;
              return [];
            })()
          : [],
        sizePrices: data.customerCanChooseSize
          ? effectiveSizeChoices.reduce((acc, size) => {
              const amount = Number(sizePricesBySize[size]);
              if (Number.isFinite(amount) && amount >= 0) {
                acc[size] = roundMoney(amount);
              }
              return acc;
            }, {} as Record<string, number>)
          : {},
        customerCanChooseOther: !!data.customerCanChooseOther,
        availableOthers: [],
        filamentWeightGrams: data.filamentWeightGrams != null && Number.isFinite(Number(data.filamentWeightGrams)) ? roundMoney(Number(data.filamentWeightGrams)) : null,
        perGramCost: data.perGramCost != null && Number.isFinite(Number(data.perGramCost)) ? roundMoney(Number(data.perGramCost)) : null,
        printingTimeMinutes: data.printingTimeMinutes != null && Number.isFinite(Number(data.printingTimeMinutes)) ? roundMoney(Number(data.printingTimeMinutes)) : null,
        perMinuteCost: data.perMinuteCost != null && Number.isFinite(Number(data.perMinuteCost)) ? roundMoney(Number(data.perMinuteCost)) : null,
        othersCost: data.othersCost != null && Number.isFinite(Number(data.othersCost)) ? roundMoney(Number(data.othersCost)) : null,
        extraProfitCost: data.extraProfitCost != null && Number.isFinite(Number(data.extraProfitCost)) ? roundMoney(Number(data.extraProfitCost)) : null,
      };

      const removedExistingUrls = originalProductImages.filter(
        (url) => !normalizedImages.includes(url),
      );

      if (editingId) {
        await updateProduct.mutateAsync({ id: editingId, ...payload });
        toast({ title: "Success", description: "Product saved successfully" });
      } else {
        const created = await createProduct.mutateAsync(payload);
        if (initialRating >= 1 && initialRating <= 5) {
          try {
            await createAdminReview.mutateAsync({
              productId: created.id,
              rating: initialRating,
              comment: initialReviewComment.trim() || undefined,
            });
            toast({
              title: "Success",
              description: "Product and review saved successfully",
            });
          } catch {
            toast({
              title: "Success",
              description: "Product saved; review could not be added",
            });
          }
        } else {
          toast({
            title: "Success",
            description: "Product saved successfully",
          });
        }
      }
      if (removedExistingUrls.length > 0) {
        await Promise.allSettled(removedExistingUrls.map((url) => deleteUpload.mutateAsync(url)));
      }
      localStorage.removeItem(PRODUCT_DRAFT_STORAGE_KEY);
      revokeLocalPreviewUrls(productImages);
      setProductImages(
        normalizedImages.map((url) => ({
          id: `${url}-${Math.random().toString(36).slice(2, 8)}`,
          kind: "existing" as const,
          url,
        })),
      );
      setOriginalProductImages(normalizedImages);
      setOpen(false);
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save product",
      });
    } finally {
      setUploadingOnSave(false);
    }
  };

  if (productsLoading || categoriesLoading) {
    return <AdminTableSkeleton title="Products" columns={8} rows={8} />;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total data: {products?.length ?? 0}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, SKU, category"
            className="w-[260px] rounded-xl"
          />
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All categories</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {[5, 10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <Button onClick={() => setLocation("/admin/products/new")} className="rounded-xl px-6">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedProducts.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <img
                    src={
                      Array.isArray(p.productImages) && p.productImages.length > 0
                        ? p.productImages[0]
                        : p.imageUrl
                    }
                    className="w-12 h-12 rounded-lg object-cover"
                    alt=""
                  />
                </TableCell>
                <TableCell className="font-mono text-muted-foreground text-sm">
                  {p.sku ?? `#${p.id}`}
                </TableCell>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {p.categoryId
                    ? (categories?.find((c) => c.id === p.categoryId)?.name ??
                      "—")
                    : "—"}
                </TableCell>
                <TableCell>₹{p.price.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {(() => {
                    const variantCount = Array.isArray((p as { variants?: unknown }).variants)
                      ? (p as { variants?: unknown[] }).variants!.length
                      : 0;
                    return !!p.hasVariants && variantCount > 0
                      ? `${variantCount} variant${variantCount > 1 ? "s" : ""}`
                      : "No variant";
                  })()}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {(p as { updatedAt?: string | null }).updatedAt
                    ? new Date((p as { updatedAt?: string | null }).updatedAt as string).toLocaleDateString()
                    : "—"}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setLocation(`/admin/products/${p.id}`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteProduct.mutate(p.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No products yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <PaginationControls
          page={page}
          setPage={setPage}
          totalItems={filteredProducts.length}
          pageSize={pageSize}
        />
      </div>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            revokeLocalPreviewUrls(productImages);
          }
          setOpen(nextOpen);
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] rounded-3xl flex flex-col overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
            <DialogTitle>
              {editingId ? "Edit Product" : "New Product"}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 px-6 pb-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input {...register("title")} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Price (₹) — manual or from calculation below</Label>
                <Input
                  type="number"
                  {...register("price")}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Overall size</Label>
                <Input
                  {...register("overallSize")}
                  className="rounded-xl"
                  placeholder="e.g. 25 x 15 x 10 cm"
                />
              </div>
              <div className="space-y-3 rounded-xl border border-border/60 p-4 bg-muted/20">
                <Label className="text-sm font-medium">Price calculation</Label>
                <p className="text-xs text-muted-foreground">(Filament weight × per gram) + (Print time × per min) + Others + Extra profit</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Filament weight (g)</Label>
                    <Input type="number" min={0} {...register("filamentWeightGrams")} className="rounded-xl h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Per gram cost (₹)</Label>
                    <Input type="number" min={0} step="any" {...register("perGramCost")} className="rounded-xl h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Printing time (min)</Label>
                    <Input type="number" min={0} {...register("printingTimeMinutes")} className="rounded-xl h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Per minute cost (₹)</Label>
                    <Input type="number" min={0} step="any" {...register("perMinuteCost")} className="rounded-xl h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Others (₹) — light, design, etc.</Label>
                    <Input type="number" min={0} step="any" {...register("othersCost")} className="rounded-xl h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Extra profit (₹)</Label>
                    <Input type="number" min={0} step="any" {...register("extraProfitCost")} className="rounded-xl h-9" />
                  </div>
                </div>
                {(() => {
                  const f = Number(watch("filamentWeightGrams")) || 0;
                  const pg = Number(watch("perGramCost")) || 0;
                  const t = Number(watch("printingTimeMinutes")) || 0;
                  const pm = Number(watch("perMinuteCost")) || 0;
                  const o = Number(watch("othersCost")) || 0;
                  const e = Number(watch("extraProfitCost")) || 0;
                  const calc = roundMoney(f * pg + t * pm + o + e);
                  return Number.isFinite(calc) ? (
                    <p className="text-sm font-semibold text-primary pt-1">
                      Calculated price: ₹{calc.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (used on save when all fields filled)
                    </p>
                  ) : null;
                })()}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  {...register("description")}
                  className="rounded-xl resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  {...register("categoryId")}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">No category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3 rounded-xl border border-border/60 p-4 bg-muted/20">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" {...register("customerCanChooseColor")} />
                  Customer can choose color
                </label>
                {watch("customerCanChooseColor") && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      This product will show colors from the global <strong>Color List</strong> page.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Available now: {colorOptions.length}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3 rounded-xl border border-border/60 p-4 bg-muted/20">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" {...register("customerCanChooseSize")} />
                  Customer can choose size
                </label>
                {watch("customerCanChooseSize") && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      Global <strong>Size List</strong> count: {sizeOptions.length}
                    </p>
                    <div className="space-y-2 mt-2">
                      <Label className="text-xs">Product size mode</Label>
                      <select
                        {...register("sizeSelectionMode")}
                        className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="inherit">Use only global sizes</option>
                        <option value="add">Add product sizes with global sizes</option>
                        <option value="override">Override global sizes with product sizes</option>
                      </select>
                    </div>
                    <Textarea
                      {...register("productSizeOptions")}
                      className="rounded-xl min-h-[84px] resize-none mt-2"
                      placeholder="Optional product sizes (one per line or comma separated)"
                    />
                    <div className="space-y-2 mt-2">
                      <Label className="text-xs">Default size (customer sees price from this first)</Label>
                      <select
                        {...register("defaultSize")}
                        className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select default size</option>
                        {adminSizeChoices.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                    </div>
                    {adminSizeChoices.length > 0 && (
                      <div className="space-y-2 mt-2 rounded-lg border border-border/50 p-3 bg-background/60">
                        <Label className="text-xs">Size-wise price</Label>
                        <div className="space-y-2">
                          {adminSizeChoices.map((size) => (
                            <div key={size} className="grid grid-cols-[1fr,140px] gap-2 items-center">
                              <span className="text-xs text-muted-foreground">{size}</span>
                              <Input
                                type="number"
                                min={0}
                                step="any"
                                value={sizePricesBySize[size] ?? ""}
                                onChange={(e) =>
                                  setSizePricesBySize((prev) => ({
                                    ...prev,
                                    [size]: e.target.value,
                                  }))
                                }
                                className="h-8 rounded-lg"
                                placeholder="0.00"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {watch("sizeSelectionMode") === "override" && (
                      <p className="text-xs text-muted-foreground">
                        In override mode, size options show only values entered above. If empty, size selector will be hidden.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-3 rounded-xl border border-border/60 p-4 bg-muted/20">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" {...register("customerCanChooseOther")} />
                  Customer can choose other (e.g. light, design)
                </label>
                {watch("customerCanChooseOther") && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      This product will show options from the global <strong>Other List</strong> page.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Available now: {otherOptions.length}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <Label>Product images</Label>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={onImagesChange}
                  className="rounded-xl"
                  disabled={uploadingOnSave}
                />
                <p className="text-xs text-muted-foreground">
                  Select multiple images, then drag to set display order. Upload starts when you click Save.
                </p>
                {uploadingOnSave && (
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Uploading images...
                  </p>
                )}
                {productImages.length > 0 ? (
                  <DndProvider backend={HTML5Backend}>
                    <div className="grid grid-cols-2 gap-3">
                      {productImages.map((item, index) => (
                        <DraggableImageTile
                          key={`${item.id}-${index}`}
                          index={index}
                          imageUrl={item.kind === "existing" ? item.url : item.previewUrl}
                          moveImage={moveImage}
                          onRemove={removeImageAt}
                        />
                      ))}
                    </div>
                  </DndProvider>
                ) : (
                  <p className="text-xs text-muted-foreground">No images added yet.</p>
                )}
              </div>
              {!editingId && (
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <Label className="text-muted-foreground">
                    Review section (optional) — add a first review with rating
                    and comment
                  </Label>
                  <div className="flex items-center gap-3">
                    <span className="text-sm">Rating:</span>
                    <select
                      value={initialRating}
                      onChange={(e) => setInitialRating(Number(e.target.value))}
                      className="flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value={0}>None</option>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <option key={r} value={r}>
                          {r} star{r > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Textarea
                    placeholder="Review comment (required if rating is set)"
                    value={initialReviewComment}
                    onChange={(e) => setInitialReviewComment(e.target.value)}
                    className="rounded-xl min-h-[60px] resize-none"
                  />
                  {initialRating >= 1 && initialRating <= 5 && !initialReviewComment.trim() && (
                    <p className="text-xs text-muted-foreground">Review comment is required when rating is set.</p>
                  )}
                </div>
              )}
              {editingId && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <Label className="text-muted-foreground">Reviews</Label>
                  {productReviews && productReviews.length > 0 && (
                    <div className="space-y-3 max-h-48 overflow-y-auto rounded-xl border border-border/50 p-3 bg-muted/20">
                      {productReviews.map((r) => {
                        const displayName = (r as { customerName?: string }).customerName ?? "Custom user";
                        const initial = displayName.charAt(0).toUpperCase();
                        return (
                          <div key={r.id} className="flex items-start gap-3 text-sm rounded-lg border border-border/30 p-3 bg-background/50">
                            <Avatar className="h-8 w-8 shrink-0 rounded-full">
                              <AvatarFallback className="rounded-full bg-primary/10 text-xs font-medium text-foreground">
                                {initial}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-foreground">{displayName}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3.5 h-3.5 ${r.rating >= s ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                                  />
                                ))}
                                {r.createdAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(r.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              {r.comment && (
                                <p className="text-muted-foreground mt-1.5 text-xs">{r.comment}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="space-y-3">
                    <Label className="text-sm">Add review</Label>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">Rating:</span>
                      <select
                        value={newReviewRating}
                        onChange={(e) =>
                          setNewReviewRating(Number(e.target.value))
                        }
                        className="flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm"
                      >
                        {[1, 2, 3, 4, 5].map((r) => (
                          <option key={r} value={r}>
                            {r} star{r > 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Textarea
                      placeholder="Review comment (required)"
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="rounded-xl min-h-[60px] resize-none"
                    />
                    {!newReviewComment.trim() && (
                      <p className="text-xs text-muted-foreground">Rating and review comment are required.</p>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="rounded-xl"
                      disabled={
                        addingReview ||
                        createAdminReview.isPending ||
                        !newReviewComment.trim()
                      }
                      onClick={async () => {
                        const comment = newReviewComment.trim();
                        if (!comment) {
                          toast({
                            variant: "destructive",
                            title: "Rating and review comment are required.",
                          });
                          return;
                        }
                        if (newReviewRating < 1 || newReviewRating > 5) {
                          toast({
                            variant: "destructive",
                            title: "Please select a rating (1–5 stars).",
                          });
                          return;
                        }
                        setAddingReview(true);
                        try {
                          await createAdminReview.mutateAsync({
                            productId: editingId,
                            rating: newReviewRating,
                            comment,
                          });
                          toast({ title: "Review added" });
                          setNewReviewComment("");
                        } catch (e) {
                          toast({
                            variant: "destructive",
                            title: "Failed to add review",
                          });
                        } finally {
                          setAddingReview(false);
                        }
                      }}
                    >
                      {addingReview || createAdminReview.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Add review"
                      )}
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={saveDraftLocally}
                  disabled={isSubmitting || uploadingOnSave}
                  className="h-12 rounded-xl"
                >
                  Save Draft
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || uploadFile.isPending || uploadingOnSave}
                  className="h-12 rounded-xl"
                >
                  {isSubmitting || uploadFile.isPending || uploadingOnSave ? (
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
