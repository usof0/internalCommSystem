import React from 'react';
import { useListTagsQuery } from '../../../api/orgsApi';
import { SkeletonList } from '../../../components/Loading';
import { ErrorBanner } from '../../../components/ErrorBanner';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const TagPicker: React.FC<Props> = ({ selectedIds, onChange }) => {
  const { data: tags, isLoading, error, refetch } = useListTagsQuery();

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  if (isLoading) return <SkeletonList count={3} />;
  if (error) return <ErrorBanner onRetry={refetch} />;

  return (
    <div className="tag-picker">
      {(!tags || tags.length === 0) && (
        <p className="tag-picker__empty">Нет тегов подразделений</p>
      )}
      <div className="tag-picker__list">
        {(tags ?? []).map((tag) => {
          const checked = selectedIds.includes(tag.id);
          return (
            <label
              key={tag.id}
              className={`tag-picker__tag${checked ? ' tag-picker__tag--selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(tag.id)}
                className="tag-picker__check"
              />
              {tag.name}
            </label>
          );
        })}
      </div>
    </div>
  );
};
