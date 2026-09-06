import React, { useState } from 'react';
import { useSearchUsersDirectoryQuery } from '../../../api/usersApi';
import { Avatar } from '../../../components/ui/Avatar';
import { SkeletonList } from '../../../components/Loading';
import { ErrorBanner } from '../../../components/ErrorBanner';
import type { User } from '../../../types';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Allow selecting only one user */
  singleSelect?: boolean;
  /** User IDs to hide from the list (e.g. already-members) */
  excludeIds?: string[];
  /**
   * 'allow'  — selected users GAIN access (default, blue tint + ✓)
   * 'deny'   — selected users LOSE access (red tint + ✕)
   */
  selectionMode?: 'allow' | 'deny';
}

function userName(u: User): string {
  const parts = [u.lastName, u.firstName].filter(Boolean);
  return parts.length ? parts.join(' ') : u.email;
}

export const UserPicker: React.FC<Props> = ({
  selectedIds,
  onChange,
  singleSelect = false,
  excludeIds = [],
  selectionMode = 'allow',
}) => {
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useSearchUsersDirectoryQuery(
    search.trim() ? { q: search.trim(), limit: 50 } : { limit: 50 }
  );

  const users = (data?.items ?? []).filter((u) => !excludeIds.includes(u.id));

  const toggle = (userId: string) => {
    if (singleSelect) {
      onChange(selectedIds[0] === userId ? [] : [userId]);
    } else {
      onChange(
        selectedIds.includes(userId)
          ? selectedIds.filter((id) => id !== userId)
          : [...selectedIds, userId]
      );
    }
  };

  const selectedClass =
    selectionMode === 'deny' ? 'user-picker__item--deny' : 'user-picker__item--allow';

  return (
    <div className="user-picker">
      <input
        type="text"
        className="input user-picker__search"
        placeholder="Поиск пользователей..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="user-picker__list">
        {isLoading && <SkeletonList count={5} />}
        {error && <ErrorBanner onRetry={refetch} />}
        {!isLoading && !error && users.length === 0 && (
          <p className="user-picker__empty">Пользователи не найдены</p>
        )}
        {users.map((u) => {
          const name = userName(u);
          const checked = selectedIds.includes(u.id);
          return (
            <label
              key={u.id}
              className={`user-picker__item${checked ? ` ${selectedClass}` : ''}`}
            >
              <input
                type={singleSelect ? 'radio' : 'checkbox'}
                checked={checked}
                onChange={() => toggle(u.id)}
                className="user-picker__check"
              />
              <Avatar src={u.avatarUrl} name={name} email={u.email} size={32} />
              <div className="user-picker__info">
                <span className="user-picker__name">{name}</span>
                <span className="user-picker__email">{u.email}</span>
              </div>
              {checked && (
                <span className="user-picker__badge">
                  {selectionMode === 'deny' ? '✕' : '✓'}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
};
