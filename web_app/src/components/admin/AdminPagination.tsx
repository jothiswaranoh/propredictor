import React from 'react';
import { Button } from '../ui/button';

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemNamePlural: string; // e.g. "teams", "matches", "users", "predictions"
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemNamePlural,
}) => {
  if (totalPages <= 1) return null;

  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <span className="text-xs text-gray-400">
        Showing <span className="font-semibold text-white">{startIdx}</span> to{" "}
        <span className="font-semibold text-white">{endIdx}</span> of{" "}
        <span className="font-semibold text-white">{totalItems}</span> {itemNamePlural}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="border-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <Button
            key={p}
            variant={currentPage === p ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(p)}
            className={
              currentPage === p
                ? "bg-green-600 hover:bg-green-700 text-white font-bold"
                : "border-white/10 text-gray-300"
            }
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="border-white/10 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default AdminPagination;
