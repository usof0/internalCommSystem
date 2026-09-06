import React from 'react';
import { Button } from './Button';

export const Pagination: React.FC<{
  page: number;
  total: number;
  limit: number;
  onChange: (page: number) => void;
}> = ({ page, total, limit, onChange }) => {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => {
    if (p === 1 || p === totalPages) return true;
    if (Math.abs(p - page) <= 1) return true;
    return false;
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
      <Button size="sm" onClick={() => onChange(1)} disabled={page === 1}>
        ««
      </Button>
      <Button size="sm" onClick={() => onChange(page - 1)} disabled={page === 1}>
        « Назад
      </Button>

      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {pages.map((p, i) => (
          <React.Fragment key={p}>
            {i > 0 && pages[i - 1] !== p - 1 && <span style={{ padding: '0.375rem 0.75rem' }}>...</span>}
            <Button
              size="sm"
              variant={p === page ? 'primary' : 'default'}
              onClick={() => onChange(p)}
              disabled={p === page}
            >
              {p}
            </Button>
          </React.Fragment>
        ))}
      </div>

      <Button size="sm" onClick={() => onChange(page + 1)} disabled={page === totalPages}>
        Вперед »
      </Button>
      <Button size="sm" onClick={() => onChange(totalPages)} disabled={page === totalPages}>
        »»
      </Button>

      <span style={{ marginLeft: '1rem', color: 'var(--text-secondary)' }}>
        Страница {page} из {totalPages} (всего: {total})
      </span>
    </div>
  );
};
