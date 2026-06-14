import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Select } from '@/shared/components/ui/Select';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPage,
  onPageSize,
  pageSizeOptions = [12, 24, 48],
}: PaginationProps) {
  if (totalCount === 0) return null;
  const safeTotalPages = Math.max(1, totalPages);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs">
      <div className="flex items-center gap-3">
        <span className="tabular text-muted">
          Page {page} of {safeTotalPages} · {totalCount} total
        </span>
        {onPageSize && (
          <label className="inline-flex items-center gap-1.5 text-muted">
            Per page
            <Select
              value={String(pageSize)}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="h-7 w-auto py-0 text-xs"
            >
              {pageSizeOptions.map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-bg px-3 text-xs font-medium transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPage(Math.max(1, page - 1))}
        >
          <ChevronLeft size={14} />Prev
        </button>
        <button
          className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-bg px-3 text-xs font-medium transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-50"
          disabled={page >= safeTotalPages}
          onClick={() => onPage(Math.min(safeTotalPages, page + 1))}
        >
          Next<ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
