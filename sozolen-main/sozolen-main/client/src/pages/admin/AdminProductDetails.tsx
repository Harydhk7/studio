import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, X, ArrowUp, ArrowDown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/use-categories";
import { useProduct, useCreateProduct, useUpdateProduct } from "@/hooks/use-products";
import { useDeleteUpload, useUploadFile } from "@/hooks/use-uploads";
import { useColorOptions, useOtherOptions, useSizeOptions } from "@/hooks/use-option-lists";
import { useCreateAdminReview, useProductReviews } from "@/hooks/use-reviews";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const productSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.coerce.number().min(0),
  hasVariants: z.boolean().optional(),
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

const roundMoney = (value: number) => Math.round(value * 100) / 100;
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

type VariantFormItem = {
  localId: string;
  id: string;
  name: string;
  price: string;
  isDefault: boolean;
  images: ProductImageItem[];
};

type VariantCalcFields = {
  filamentWeightGrams: string;
  perGramCost: string;
  printingTimeMinutes: string;
  perMinuteCost: string;
  othersCost: string;
  extraProfitCost: string;
};

const revokeLocalPreviewUrls = (items: ProductImageItem[]) => {
  for (const item of items) {
    if (item.kind === "new") URL.revokeObjectURL(item.previewUrl);
  }
};

export default function AdminProductDetails() {
  const [, setLocation] = useLocation();
  const [isNew] = useRoute("/admin/products/new");
  const [isEditRoute, editParams] = useRoute("/admin/products/:id");
  const parsedEditId = Number(editParams?.id);
  const isEdit = isEditRoute && Number.isInteger(parsedEditId) && parsedEditId > 0;
  const editingId = isEdit ? parsedEditId : null;
  const { data: editingProduct, isLoading: productLoading } = useProduct(editingId ?? 0);
  const { data: productReviews = [] } = useProductReviews(editingId);

  const { data: categories = [] } = useCategories();
  const { data: colorOptions = [] } = useColorOptions();
  const { data: sizeOptions = [] } = useSizeOptions();
  const { data: otherOptions = [] } = useOtherOptions();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const createAdminReview = useCreateAdminReview();
  const uploadFile = useUploadFile();
  const deleteUpload = useDeleteUpload();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [productImages, setProductImages] = useState<ProductImageItem[]>([]);
  const [originalProductImages, setOriginalProductImages] = useState<string[]>([]);
  const [variantItems, setVariantItems] = useState<VariantFormItem[]>([]);
  const [originalVariantImageUrls, setOriginalVariantImageUrls] = useState<string[]>([]);
  const [variantCalcById, setVariantCalcById] = useState<Record<string, VariantCalcFields>>({});
  const [sizePricesBySize, setSizePricesBySize] = useState<Record<string, string>>({});
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [addingReview, setAddingReview] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
  } = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      hasVariants: false,
      categoryId: undefined,
      customerCanChooseColor: false,
      customerCanChooseSize: false,
      sizeSelectionMode: "inherit",
      defaultSize: "",
      customerCanChooseOther: false,
      overallSize: "",
      productSizeOptions: "",
    },
  });

  useEffect(() => {
    if (!isEdit || !editingProduct) return;
    setValue("title", editingProduct.title);
    setValue("description", editingProduct.description);
    setValue("price", editingProduct.price);
    setValue("hasVariants", !!editingProduct.hasVariants);
    setValue("categoryId", editingProduct.categoryId ?? undefined);
    setValue("customerCanChooseColor", !!editingProduct.customerCanChooseColor);
    setValue("customerCanChooseSize", !!editingProduct.customerCanChooseSize);
    setValue(
      "sizeSelectionMode",
      editingProduct.sizeSelectionMode === "add" || editingProduct.sizeSelectionMode === "override"
        ? editingProduct.sizeSelectionMode
        : "inherit",
    );
    setValue("defaultSize", editingProduct.defaultSize ?? "");
    setValue("customerCanChooseOther", !!editingProduct.customerCanChooseOther);
    setValue("overallSize", editingProduct.overallSize ?? "");
    setValue(
      "productSizeOptions",
      Array.isArray(editingProduct.availableSizes) ? editingProduct.availableSizes.join("\n") : "",
    );
    setValue("filamentWeightGrams", editingProduct.filamentWeightGrams ?? undefined);
    setValue("perGramCost", editingProduct.perGramCost ?? undefined);
    setValue("printingTimeMinutes", editingProduct.printingTimeMinutes ?? undefined);
    setValue("perMinuteCost", editingProduct.perMinuteCost ?? undefined);
    setValue("othersCost", editingProduct.othersCost ?? undefined);
    setValue("extraProfitCost", editingProduct.extraProfitCost ?? undefined);

    const existingImages =
      Array.isArray(editingProduct.productImages) && editingProduct.productImages.length > 0
        ? editingProduct.productImages.filter(Boolean)
        : editingProduct.imageUrl
          ? [editingProduct.imageUrl]
          : [];
    setProductImages(
      existingImages.map((url) => ({
        id: `${url}-${Math.random().toString(36).slice(2, 8)}`,
        kind: "existing" as const,
        url,
      })),
    );
    setOriginalProductImages(existingImages);
    const variants =
      Array.isArray((editingProduct as { variants?: unknown }).variants)
        ? ((editingProduct as { variants?: unknown }).variants as Array<{
            id?: string;
            name?: string;
            price?: number;
            images?: string[];
            isDefault?: boolean;
          }>)
            .map((variant, index) => ({
              localId: `variant-local-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
              id:
                typeof variant.id === "string" && variant.id.trim().length > 0
                  ? variant.id.trim()
                  : `variant-${index + 1}`,
              name: typeof variant.name === "string" ? variant.name : "",
              price: Number.isFinite(Number(variant.price)) ? String(Number(variant.price)) : "",
              isDefault: !!variant.isDefault,
              images: (Array.isArray(variant.images) ? variant.images : [])
                .filter(Boolean)
                .map((url) => ({
                  id: `${url}-${Math.random().toString(36).slice(2, 8)}`,
                  kind: "existing" as const,
                  url,
                })),
            }))
        : [];
    setVariantItems(
      variants.length > 0
        ? variants
        : [
            {
              localId: `variant-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              id: `variant-1`,
              name: "",
              price: "",
              isDefault: true,
              images: [],
            },
          ],
    );
    setVariantCalcById({});
    setOriginalVariantImageUrls(
      variants.flatMap((variant) =>
        variant.images
          .filter((image) => image.kind === "existing")
          .map((image) => image.url),
      ),
    );
    setSizePricesBySize(
      editingProduct.sizePrices && typeof editingProduct.sizePrices === "object" && !Array.isArray(editingProduct.sizePrices)
        ? Object.entries(editingProduct.sizePrices as Record<string, unknown>).reduce(
            (acc, [size, amount]) => {
              const num = Number(amount);
              if (Number.isFinite(num) && num >= 0) acc[size] = String(num);
              return acc;
            },
            {} as Record<string, string>,
          )
        : {},
    );
  }, [editingProduct, isEdit, setValue]);

  useEffect(() => {
    return () => revokeLocalPreviewUrls(productImages);
  }, [productImages]);

  useEffect(() => {
    return () => {
      for (const variant of variantItems) revokeLocalPreviewUrls(variant.images);
    };
  }, [variantItems]);

  const watchedProductSizeOptions = watch("productSizeOptions");
  const watchedSizeSelectionMode = watch("sizeSelectionMode");
  const hasVariants = !!watch("hasVariants");
  const parsedProductSizes = useMemo(
    () =>
      String(watchedProductSizeOptions ?? "")
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter(Boolean),
    [watchedProductSizeOptions],
  );
  const sizeChoices = useMemo(() => {
    const mode =
      watchedSizeSelectionMode === "add" || watchedSizeSelectionMode === "override"
        ? watchedSizeSelectionMode
        : "inherit";
    const globalSizes = sizeOptions.map((row) => row.name);
    if (mode === "override") return parsedProductSizes;
    if (mode === "add") return Array.from(new Set([...globalSizes, ...parsedProductSizes]));
    return globalSizes;
  }, [parsedProductSizes, sizeOptions, watchedSizeSelectionMode]);

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
    e.target.value = "";
  };

  const removeImageAt = (index: number) => {
    setProductImages((prev) => {
      const target = prev[index];
      if (target?.kind === "new") URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    setProductImages((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const ensureDefaultVariant = (variants: VariantFormItem[]) => {
    if (variants.length === 0) return variants;
    const hasDefault = variants.some((variant) => variant.isDefault);
    if (hasDefault) return variants;
    return variants.map((variant, index) =>
      index === 0 ? { ...variant, isDefault: true } : variant,
    );
  };

  const getVariantResolvedPrice = (variant: VariantFormItem): number | null => {
    const calculatedVariantPrice = getVariantCalculatedPrice(variant.localId);
    if (calculatedVariantPrice != null) return calculatedVariantPrice;
    const manualVariantPrice = Number(variant.price);
    if (!Number.isFinite(manualVariantPrice) || manualVariantPrice < 0) return null;
    return roundMoney(manualVariantPrice);
  };

  const validateVariantRequiredFields = (
    variants: VariantFormItem[],
  ): { valid: true } | { valid: false; message: string } => {
    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      const variantName = variant.name.trim();
      if (!variantName) {
        return {
          valid: false,
          message: `Fill Variant ${index + 1} name before adding next variant.`,
        };
      }
      if (getVariantResolvedPrice(variant) == null) {
        return {
          valid: false,
          message: `Fill Variant ${index + 1} price before adding next variant.`,
        };
      }
      if (!Array.isArray(variant.images) || variant.images.length === 0) {
        return {
          valid: false,
          message: `Add at least one image for Variant ${index + 1} before adding next variant.`,
        };
      }
    }
    return { valid: true };
  };

  const addVariant = () => {
    const check = validateVariantRequiredFields(variantItems);
    if (!check.valid) {
      toast({ variant: "destructive", title: check.message });
      return;
    }
    setVariantItems((prev) =>
      ensureDefaultVariant([
        ...prev,
        {
          localId: `variant-local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          id: `variant-${Date.now()}`,
          name: "",
          price: "",
          isDefault: prev.length === 0,
          images: [],
        },
      ]),
    );
  };

  const removeVariant = (localId: string) => {
    setVariantItems((prev) => {
      const target = prev.find((variant) => variant.localId === localId);
      if (target) revokeLocalPreviewUrls(target.images);
      return ensureDefaultVariant(prev.filter((variant) => variant.localId !== localId));
    });
  };

  const setVariantAsDefault = (localId: string) => {
    setVariantItems((prev) =>
      prev.map((variant) => ({ ...variant, isDefault: variant.localId === localId })),
    );
  };

  const updateVariantField = (
    localId: string,
    field: "name" | "price",
    value: string,
  ) => {
    setVariantItems((prev) =>
      prev.map((variant) =>
        variant.localId === localId ? { ...variant, [field]: value } : variant,
      ),
    );
  };

  const getVariantCalcFields = (localId: string): VariantCalcFields =>
    variantCalcById[localId] ?? {
      filamentWeightGrams: "",
      perGramCost: "",
      printingTimeMinutes: "",
      perMinuteCost: "",
      othersCost: "",
      extraProfitCost: "",
    };

  const updateVariantCalcField = (
    localId: string,
    field: keyof VariantCalcFields,
    value: string,
  ) => {
    setVariantCalcById((prev) => ({
      ...prev,
      [localId]: {
        ...getVariantCalcFields(localId),
        [field]: value,
      },
    }));
  };

  const getVariantCalculatedPrice = (localId: string): number | null => {
    const calc = getVariantCalcFields(localId);
    const f = Number(calc.filamentWeightGrams);
    const pg = Number(calc.perGramCost);
    const t = Number(calc.printingTimeMinutes);
    const pm = Number(calc.perMinuteCost);
    const o = Number(calc.othersCost);
    const e = Number(calc.extraProfitCost);
    const values = [f, pg, t, pm, o, e];
    if (!values.every((value) => Number.isFinite(value) && value >= 0)) return null;
    return roundMoney(f * pg + t * pm + o + e);
  };

  const onVariantImagesChange = (
    localId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    const newItems: ProductImageItem[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: "new",
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setVariantItems((prev) =>
      prev.map((variant) =>
        variant.localId === localId
          ? { ...variant, images: [...variant.images, ...newItems] }
          : variant,
      ),
    );
    e.target.value = "";
  };

  const removeVariantImageAt = (localId: string, imageIndex: number) => {
    setVariantItems((prev) =>
      prev.map((variant) => {
        if (variant.localId !== localId) return variant;
        const target = variant.images[imageIndex];
        if (target?.kind === "new") URL.revokeObjectURL(target.previewUrl);
        return {
          ...variant,
          images: variant.images.filter((_, idx) => idx !== imageIndex),
        };
      }),
    );
  };

  const moveVariantImage = (
    localId: string,
    imageIndex: number,
    direction: "up" | "down",
  ) => {
    setVariantItems((prev) =>
      prev.map((variant) => {
        if (variant.localId !== localId) return variant;
        const next = [...variant.images];
        const targetIndex = direction === "up" ? imageIndex - 1 : imageIndex + 1;
        if (targetIndex < 0 || targetIndex >= next.length) return variant;
        const [moved] = next.splice(imageIndex, 1);
        next.splice(targetIndex, 0, moved);
        return { ...variant, images: next };
      }),
    );
  };

  useEffect(() => {
    if (!hasVariants) return;
    if (variantItems.length > 0) return;
    addVariant();
  }, [hasVariants, variantItems.length]);

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    if (!isNew && !isEdit) return;
    setSaving(true);
    try {
      if (!hasVariants && productImages.length === 0) {
        toast({ variant: "destructive", title: "Add at least one product image" });
        return;
      }
      if (hasVariants && variantItems.length === 0) {
        toast({ variant: "destructive", title: "Add at least one variant" });
        return;
      }

      if (data.customerCanChooseColor && colorOptions.length === 0) {
        toast({
          variant: "destructive",
          title: "Color list is empty",
          description: "Add colors in Color List page first.",
        });
        return;
      }
      if (data.customerCanChooseSize && sizeOptions.length === 0 && parsedProductSizes.length === 0) {
        toast({
          variant: "destructive",
          title: "Size list is empty",
          description: "Add sizes in Size List page first.",
        });
        return;
      }
      if (data.customerCanChooseOther && otherOptions.length === 0) {
        toast({
          variant: "destructive",
          title: "Other list is empty",
          description: "Add decoration options first.",
        });
        return;
      }

      if (data.customerCanChooseSize) {
        if (sizeChoices.length === 0) {
          toast({ variant: "destructive", title: "No size options available" });
          return;
        }
        const defaultSize = data.defaultSize?.trim() ?? "";
        if (!defaultSize || !sizeChoices.includes(defaultSize)) {
          toast({
            variant: "destructive",
            title: "Default size is required",
            description: "Choose a valid default size.",
          });
          return;
        }
        if (!hasVariants) {
          for (const size of sizeChoices) {
            const amount = Number(sizePricesBySize[size]);
            if (!Number.isFinite(amount) || amount < 0) {
              toast({
                variant: "destructive",
                title: `Invalid price for ${size}`,
                description: "Enter valid size price.",
              });
              return;
            }
          }
        }
      }

      const folderName = toFolderSlug(data.title || "untitled-product") || "untitled-product";
      const newItemUrlById = new Map<string, string>();
      if (!hasVariants) {
        for (const item of productImages) {
          if (item.kind !== "new") continue;
          const uploaded = await uploadFile.mutateAsync({
            file: item.file,
            folder: `Product/${folderName}`,
          });
          newItemUrlById.set(item.id, uploaded.url);
        }
      }

      const normalizedImages = hasVariants
        ? []
        : productImages
            .map((item) => (item.kind === "existing" ? item.url : newItemUrlById.get(item.id) ?? ""))
            .map((url) => url.trim())
            .filter(Boolean);
      if (!hasVariants && normalizedImages.length === 0) {
        toast({ variant: "destructive", title: "Image upload failed" });
        return;
      }

      const normalizedVariants = hasVariants
        ? await (async () => {
            const items = [];
            for (let index = 0; index < variantItems.length; index += 1) {
              const variant = variantItems[index];
              const variantName = variant.name.trim();
              const variantPrice = getVariantResolvedPrice(variant);
              if (!variantName) {
                toast({
                  variant: "destructive",
                  title: `Variant ${index + 1} name is required`,
                });
                return null;
              }
              if (variantPrice == null) {
                toast({
                  variant: "destructive",
                  title: `Variant ${variantName} price is invalid`,
                  description: "Enter price or fill all calculation fields.",
                });
                return null;
              }
              const variantUrlByItemId = new Map<string, string>();
              for (const imageItem of variant.images) {
                if (imageItem.kind !== "new") continue;
                const uploaded = await uploadFile.mutateAsync({
                  file: imageItem.file,
                  folder: `Product/${folderName}/${(toFolderSlug(variantName) || "variant")}-${index + 1}`,
                });
                variantUrlByItemId.set(imageItem.id, uploaded.url);
              }
              const variantImages = variant.images
                .map((imageItem) =>
                  imageItem.kind === "existing"
                    ? imageItem.url
                    : variantUrlByItemId.get(imageItem.id) ?? "",
                )
                .map((url) => url.trim())
                .filter(Boolean);
              if (variantImages.length === 0) {
                toast({
                  variant: "destructive",
                  title: `Add at least one image for ${variantName}`,
                });
                return null;
              }
              items.push({
                id: variant.id || `variant-${index + 1}`,
                name: variantName,
                price: roundMoney(variantPrice),
                images: variantImages,
                isDefault: !!variant.isDefault,
                isActive: true,
                sortOrder: index,
              });
            }
            if (items.length === 0) return null;
            if (!items.some((variant) => variant.isDefault)) {
              items[0].isDefault = true;
            }
            let defaultSeen = false;
            for (const variant of items) {
              if (variant.isDefault && !defaultSeen) {
                defaultSeen = true;
              } else if (variant.isDefault && defaultSeen) {
                variant.isDefault = false;
              }
            }
            return items;
          })()
        : [];
      if (hasVariants && !normalizedVariants) return;

      const f = Number(data.filamentWeightGrams) || 0;
      const pg = Number(data.perGramCost) || 0;
      const t = Number(data.printingTimeMinutes) || 0;
      const pm = Number(data.perMinuteCost) || 0;
      const o = Number(data.othersCost) || 0;
      const e = Number(data.extraProfitCost) || 0;
      const priceFields = [
        data.filamentWeightGrams,
        data.perGramCost,
        data.printingTimeMinutes,
        data.perMinuteCost,
        data.othersCost,
        data.extraProfitCost,
      ];
      const useCalculation = priceFields.every((v) => v != null && Number.isFinite(Number(v)) && Number(v) >= 0);
      const calculatedPrice = useCalculation ? roundMoney(f * pg + t * pm + o + e) : null;
      const finalPrice =
        hasVariants && normalizedVariants && normalizedVariants.length > 0
          ? normalizedVariants.find((variant) => variant.isDefault)?.price ?? normalizedVariants[0].price
          : calculatedPrice != null && calculatedPrice >= 0
            ? calculatedPrice
            : roundMoney(Math.max(0, Number(data.price) || 0));

      const sizeSelectionMode =
        data.sizeSelectionMode === "add" || data.sizeSelectionMode === "override"
          ? data.sizeSelectionMode
          : "inherit";

      const payload = {
        ...data,
        price: finalPrice,
        imageUrl:
          hasVariants && normalizedVariants && normalizedVariants.length > 0
            ? normalizedVariants.find((variant) => variant.isDefault)?.images?.[0] ??
              normalizedVariants[0].images[0]
            : normalizedImages[0],
        productImages: hasVariants ? [] : normalizedImages,
        hasVariants,
        variants: hasVariants ? normalizedVariants ?? [] : [],
        model3dUrl: null,
        categoryId: data.categoryId ? Number(data.categoryId) : null,
        customerCanChooseColor: !!data.customerCanChooseColor,
        availableColors: [],
        customerCanChooseSize: !!data.customerCanChooseSize,
        sizeSelectionMode,
        defaultSize: data.customerCanChooseSize ? data.defaultSize?.trim() || null : null,
        availableSizes: data.customerCanChooseSize
          ? (() => {
              const uniqueProductSizes = Array.from(new Set(parsedProductSizes));
              if (sizeSelectionMode === "override") return uniqueProductSizes;
              if (sizeSelectionMode === "add") return uniqueProductSizes;
              return [];
            })()
          : [],
        sizePrices: data.customerCanChooseSize
          ? hasVariants
            ? {}
            : sizeChoices.reduce((acc, size) => {
              const amount = Number(sizePricesBySize[size]);
              if (Number.isFinite(amount) && amount >= 0) acc[size] = roundMoney(amount);
              return acc;
            }, {} as Record<string, number>)
          : {},
        customerCanChooseOther: !!data.customerCanChooseOther,
        availableOthers: [],
        overallSize: data.overallSize?.trim() ? data.overallSize.trim() : null,
        filamentWeightGrams:
          data.filamentWeightGrams != null && Number.isFinite(Number(data.filamentWeightGrams))
            ? roundMoney(Number(data.filamentWeightGrams))
            : null,
        perGramCost:
          data.perGramCost != null && Number.isFinite(Number(data.perGramCost))
            ? roundMoney(Number(data.perGramCost))
            : null,
        printingTimeMinutes:
          data.printingTimeMinutes != null && Number.isFinite(Number(data.printingTimeMinutes))
            ? roundMoney(Number(data.printingTimeMinutes))
            : null,
        perMinuteCost:
          data.perMinuteCost != null && Number.isFinite(Number(data.perMinuteCost))
            ? roundMoney(Number(data.perMinuteCost))
            : null,
        othersCost:
          data.othersCost != null && Number.isFinite(Number(data.othersCost))
            ? roundMoney(Number(data.othersCost))
            : null,
        extraProfitCost:
          data.extraProfitCost != null && Number.isFinite(Number(data.extraProfitCost))
            ? roundMoney(Number(data.extraProfitCost))
            : null,
      };

      const nextVariantImageUrls = hasVariants
        ? (normalizedVariants ?? []).flatMap((variant) => variant.images)
        : [];
      const removedExistingUrls = [
        ...originalProductImages.filter((url) => !normalizedImages.includes(url)),
        ...originalVariantImageUrls.filter((url) => !nextVariantImageUrls.includes(url)),
      ];

      if (isEdit && editingId) {
        await updateProduct.mutateAsync({ id: editingId, ...payload });
      } else {
        await createProduct.mutateAsync(payload);
      }

      if (removedExistingUrls.length > 0) {
        await Promise.allSettled(removedExistingUrls.map((url) => deleteUpload.mutateAsync(url)));
      }

      toast({ title: "Saved", description: "Product saved successfully." });
      setLocation("/admin/products");
    } catch {
      toast({ variant: "destructive", title: "Failed to save product" });
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && !isEdit) {
    return <div className="py-8 text-muted-foreground">Invalid product route.</div>;
  }

  if (isEdit && productLoading) {
    return <div className="py-8 text-muted-foreground inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading product...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEdit ? "Edit Product Details" : "Create Product Details"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Fill product Title, Price, Description, Category, Color, Size, Other, Images and Review.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={() => setLocation("/admin/products")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-border/50 bg-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Title</Label>
            <Input {...register("title")} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <select
              {...register("categoryId")}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea {...register("description")} className="rounded-xl min-h-[100px]" />
          </div>
          {!hasVariants && (
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input type="number" min={0} step="any" {...register("price")} className="rounded-xl" />
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-border/60 p-4 bg-muted/20">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("hasVariants")} />
            This product has variants (shape, model, etc.)
          </label>
          {hasVariants ? (
            <p className="text-xs text-muted-foreground">
              Price and images are managed only on variants. Product-level price and image are ignored.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Single product mode: use base price and product images.
            </p>
          )}
        </div>

        {hasVariants && (
          <div className="space-y-4 rounded-xl border border-border/60 p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Variants</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} className="rounded-lg">
                Add variant
              </Button>
            </div>
            {variantItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">No variants added yet.</p>
            ) : (
              <div className="space-y-4">
                {variantItems.map((variant, variantIndex) => (
                  <div key={variant.localId} className="rounded-xl border border-border/50 p-3 bg-background/60 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 flex-1">
                        <Input
                          value={variant.name}
                          onChange={(e) => updateVariantField(variant.localId, "name", e.target.value)}
                          placeholder={`Variant ${variantIndex + 1} name`}
                          className="rounded-lg"
                        />
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={variant.price}
                          onChange={(e) => updateVariantField(variant.localId, "price", e.target.value)}
                          placeholder="Variant price"
                          className="rounded-lg"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs flex items-center gap-1">
                          <input
                            type="radio"
                            checked={variant.isDefault}
                            onChange={() => setVariantAsDefault(variant.localId)}
                          />
                          Default
                        </label>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeVariant(variant.localId)}
                          disabled={variantItems.length <= 1}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 rounded-lg border border-border/50 p-3 bg-muted/20">
                      <Label className="text-xs">Variant price calculation</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Filament (g)</Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={getVariantCalcFields(variant.localId).filamentWeightGrams}
                            onChange={(e) =>
                              updateVariantCalcField(variant.localId, "filamentWeightGrams", e.target.value)
                            }
                            className="rounded-lg h-9 text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Per gram (Rs)</Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={getVariantCalcFields(variant.localId).perGramCost}
                            onChange={(e) =>
                              updateVariantCalcField(variant.localId, "perGramCost", e.target.value)
                            }
                            className="rounded-lg h-9 text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Time (min)</Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={getVariantCalcFields(variant.localId).printingTimeMinutes}
                            onChange={(e) =>
                              updateVariantCalcField(variant.localId, "printingTimeMinutes", e.target.value)
                            }
                            className="rounded-lg h-9 text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Per min (Rs)</Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={getVariantCalcFields(variant.localId).perMinuteCost}
                            onChange={(e) =>
                              updateVariantCalcField(variant.localId, "perMinuteCost", e.target.value)
                            }
                            className="rounded-lg h-9 text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Others (Rs)</Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={getVariantCalcFields(variant.localId).othersCost}
                            onChange={(e) =>
                              updateVariantCalcField(variant.localId, "othersCost", e.target.value)
                            }
                            className="rounded-lg h-9 text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">Profit (Rs)</Label>
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            value={getVariantCalcFields(variant.localId).extraProfitCost}
                            onChange={(e) =>
                              updateVariantCalcField(variant.localId, "extraProfitCost", e.target.value)
                            }
                            className="rounded-lg h-9 text-right"
                          />
                        </div>
                      </div>
                    </div>
                    {getVariantCalculatedPrice(variant.localId) != null && (
                      <div className="flex items-center justify-between rounded-lg border border-border/40 px-2 py-1 bg-muted/20">
                        <p className="text-xs text-muted-foreground">
                          Calculated price: Rs {getVariantCalculatedPrice(variant.localId)?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 rounded-md text-xs"
                          onClick={() =>
                            updateVariantField(
                              variant.localId,
                              "price",
                              String(getVariantCalculatedPrice(variant.localId)),
                            )
                          }
                        >
                          Use this
                        </Button>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-xs">Variant images</Label>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => onVariantImagesChange(variant.localId, e)}
                        className="rounded-lg h-9"
                      />
                      {variant.images.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {variant.images.map((imageItem, imageIndex) => (
                            <div key={`${imageItem.id}-${imageIndex}`} className="rounded-lg border border-border p-2">
                              <img
                                src={imageItem.kind === "existing" ? imageItem.url : imageItem.previewUrl}
                                alt={`${variant.name || "Variant"} ${imageIndex + 1}`}
                                className="h-20 w-full rounded-md object-cover"
                              />
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() => moveVariantImage(variant.localId, imageIndex, "up")}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    className="h-6 w-6"
                                    onClick={() => moveVariantImage(variant.localId, imageIndex, "down")}
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="h-6 w-6"
                                  onClick={() => removeVariantImageAt(variant.localId, imageIndex)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No images added for this variant.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3 rounded-xl border border-border/60 p-4 bg-muted/20">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("customerCanChooseColor")} />
            Customer can choose color
          </label>
          {watch("customerCanChooseColor") && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                This product shows colors from the global <strong>Color List</strong>.
              </p>
              <p className="text-xs text-muted-foreground">Available now: {colorOptions.length}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-border/60 p-4 bg-muted/20">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register("customerCanChooseSize")} />
            Customer can choose size
          </label>
          {watch("customerCanChooseSize") && (
            <div className="space-y-2">
              <select
                {...register("sizeSelectionMode")}
                className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="inherit">Use only global sizes</option>
                <option value="add">Add product sizes with global sizes</option>
                <option value="override">Override global sizes with product sizes</option>
              </select>
              <Textarea
                {...register("productSizeOptions")}
                className="rounded-xl min-h-[84px] resize-none"
                placeholder="Optional product sizes (one per line or comma separated)"
              />
              <select
                {...register("defaultSize")}
                className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="">Select default size</option>
                {sizeChoices.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              {!hasVariants && sizeChoices.length > 0 && (
                <div className="space-y-2 rounded-lg border border-border/50 p-3 bg-background/60">
                  <Label className="text-xs">Size-wise price</Label>
                  {sizeChoices.map((size) => (
                    <div key={size} className="grid grid-cols-[1fr,140px] gap-2 items-center">
                      <span className="text-xs text-muted-foreground">{size}</span>
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={sizePricesBySize[size] ?? ""}
                        onChange={(e) =>
                          setSizePricesBySize((prev) => ({ ...prev, [size]: e.target.value }))
                        }
                        className="h-8 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
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
                This product shows options from the global <strong>Other List</strong>.
              </p>
              <p className="text-xs text-muted-foreground">Available now: {otherOptions.length}</p>
            </div>
          )}
        </div>

        {!hasVariants && (
          <>
            <div className="space-y-3 rounded-xl border border-border/60 p-4 bg-muted/20">
              <Label className="text-sm font-medium">Price calculation</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input type="number" min={0} placeholder="Filament (g)" {...register("filamentWeightGrams")} className="rounded-xl h-9" />
                <Input type="number" min={0} step="any" placeholder="Per gram (₹)" {...register("perGramCost")} className="rounded-xl h-9" />
                <Input type="number" min={0} placeholder="Time (min)" {...register("printingTimeMinutes")} className="rounded-xl h-9" />
                <Input type="number" min={0} step="any" placeholder="Per min (₹)" {...register("perMinuteCost")} className="rounded-xl h-9" />
                <Input type="number" min={0} step="any" placeholder="Others (₹)" {...register("othersCost")} className="rounded-xl h-9" />
                <Input type="number" min={0} step="any" placeholder="Profit (₹)" {...register("extraProfitCost")} className="rounded-xl h-9" />
              </div>
              {(() => {
                const f = Number(watch("filamentWeightGrams"));
                const pg = Number(watch("perGramCost"));
                const t = Number(watch("printingTimeMinutes"));
                const pm = Number(watch("perMinuteCost"));
                const o = Number(watch("othersCost"));
                const e = Number(watch("extraProfitCost"));
                const values = [f, pg, t, pm, o, e];
                if (!values.every((value) => Number.isFinite(value) && value >= 0)) return null;
                const calc = roundMoney(f * pg + t * pm + o + e);
                return (
                  <div className="flex items-center justify-between rounded-lg border border-border/40 px-2 py-1 bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                      Calculated price: Rs{" "}
                      {calc.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 rounded-md text-xs"
                      onClick={() => setValue("price", calc)}
                    >
                      Use this
                    </Button>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <Input type="file" multiple accept="image/*" onChange={onImagesChange} className="rounded-xl" />
              {productImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {productImages.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="rounded-xl border border-border p-2">
                      <img
                        src={item.kind === "existing" ? item.url : item.previewUrl}
                        alt={`Product ${index + 1}`}
                        className="h-24 w-full rounded-lg object-cover"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => moveImage(index, "up")}>
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => moveImage(index, "down")}>
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button type="button" size="icon" variant="destructive" className="h-7 w-7" onClick={() => removeImageAt(index)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No images added yet.</p>
              )}
            </div>
          </>
        )}

        <div className="space-y-4 rounded-xl border border-border/60 p-4 bg-muted/20">
          <Label className="text-sm font-medium">Review</Label>
          {!editingId ? (
            <p className="text-xs text-muted-foreground">
              Save this product first, then you can add and manage reviews in edit mode.
            </p>
          ) : (
            <>
              {productReviews.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto rounded-xl border border-border/50 p-3 bg-background/60">
                  {productReviews.map((review) => {
                    const displayName = (review as { customerName?: string }).customerName ?? "Customer";
                    const initial = displayName.charAt(0).toUpperCase();
                    return (
                      <div
                        key={review.id}
                        className="flex items-start gap-3 rounded-lg border border-border/30 p-3 text-sm bg-background/60"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-foreground text-xs">
                            {initial}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{displayName}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${review.rating >= s ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
                              />
                            ))}
                            {review.createdAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {review.comment && (
                            <p className="mt-1 text-xs text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No reviews yet.</p>
              )}

              <div className="space-y-3">
                <Label className="text-xs">Add review</Label>
                <div className="flex items-center gap-3">
                  <span className="text-sm">Rating:</span>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
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
                  disabled={addingReview || createAdminReview.isPending || !newReviewComment.trim()}
                  onClick={async () => {
                    const comment = newReviewComment.trim();
                    if (!comment || !editingId) return;
                    if (newReviewRating < 1 || newReviewRating > 5) {
                      toast({
                        variant: "destructive",
                        title: "Please select a rating (1-5 stars).",
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
                    } catch {
                      toast({ variant: "destructive", title: "Failed to add review" });
                    } finally {
                      setAddingReview(false);
                    }
                  }}
                >
                  {addingReview || createAdminReview.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Add review"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => setLocation("/admin/products")}>
            Cancel
          </Button>
          <Button type="submit" className="rounded-xl" disabled={saving || uploadFile.isPending}>
            {saving || uploadFile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

