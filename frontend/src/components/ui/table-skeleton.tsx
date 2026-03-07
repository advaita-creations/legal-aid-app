import { cn } from '@/lib/utils';

interface TableSkeletonProps {
  columns: number;
  rows?: number;
  className?: string;
}

export function TableSkeleton({ columns, rows = 5, className }: TableSkeletonProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded animate-pulse flex-1" />
        ))}
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="px-4 py-3 flex gap-4">
            {Array.from({ length: columns }).map((_, col) => (
              <div
                key={col}
                className="h-4 bg-gray-100 rounded animate-pulse flex-1"
                style={{ animationDelay: `${(row * columns + col) * 50}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

export function CardSkeleton({ count = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
