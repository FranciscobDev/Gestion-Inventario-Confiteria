import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ totalItems, pageSize = 8, currentPage, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="pagination-bar">
      <span>
        Mostrando <strong>{start}–{end}</strong> de <strong>{totalItems}</strong> registros
      </span>
      <div className="flex-center">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        <span style={{ padding: '0 0.4rem', fontWeight: 600 }}>
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
