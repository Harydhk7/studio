export function toUrlSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryPath(categoryName: string | null | undefined): string {
  const categorySlug = toUrlSlug(categoryName || "");
  return categorySlug ? `/${categorySlug}` : "/category";
}

export function getProductPath(categoryName: string | null | undefined, productTitle: string): string {
  const categorySlug = toUrlSlug(categoryName || "uncategorized") || "uncategorized";
  const productSlug = toUrlSlug(productTitle) || "product";
  return `/${categorySlug}/${productSlug}`;
}
