import React from 'react';
import { useGetOrgTreeQuery } from '../../../api/orgsApi';
import { SkeletonList } from '../../../components/Loading';
import { ErrorBanner } from '../../../components/ErrorBanner';
import type { OrgUnitNode } from '../../../types/orgTypes';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

function flattenTree(
  nodes: OrgUnitNode[],
  depth = 0
): { node: OrgUnitNode; depth: number }[] {
  return nodes.flatMap((n) => [
    { node: n, depth },
    ...flattenTree(n.children, depth + 1),
  ]);
}

export const OrgUnitPicker: React.FC<Props> = ({ selectedIds, onChange }) => {
  const { data, isLoading, error, refetch } = useGetOrgTreeQuery();
  const flat = flattenTree(data?.items ?? []);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  if (isLoading) return <SkeletonList count={4} />;
  if (error) return <ErrorBanner onRetry={refetch} />;

  return (
    <div className="org-picker">
      {flat.length === 0 && (
        <p className="org-picker__empty">Нет подразделений</p>
      )}
      {flat.map(({ node, depth }) => {
        const checked = selectedIds.includes(node.id);
        return (
          <label
            key={node.id}
            className={`org-picker__item${checked ? ' org-picker__item--selected' : ''}`}
            style={{ paddingLeft: `${0.75 + depth * 1.25}rem` }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(node.id)}
              className="org-picker__check"
            />
            <span className="org-picker__name">{node.name}</span>
          </label>
        );
      })}
    </div>
  );
};
