import { Button } from "@/components/ui/button";
import { useEffect } from "react";

type PaginationControlsProps = {
  page: number;
  setPage: (page: number) => void;
  totalItems: number;
  pageSize?: number;
};

export function PaginationControls({
  page,
  setPage,
  totalItems,
  pageSize = 10,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const safePage = Math.min(page, totalPages);
  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage, setPage]);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border/50">
      <p className="text-xs text-muted-foreground">
        Page {safePage} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={safePage <= 1}
          onClick={() => setPage(safePage - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={safePage >= totalPages}
          onClick={() => setPage(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
