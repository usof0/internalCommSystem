import React from 'react';
import type { User } from '../../../../types';
import { Avatar } from '../../../../components/ui/Avatar';

type Props = {
  users: User[];
  getFullName: (user: User) => string;
  getStatusText: (user: User) => string;
  getStatusClass: (user: User) => string;
  onClickUser: (userId: string) => void;
  onContextMenuUser: (e: React.MouseEvent, user: User) => void;
};

export const UsersList: React.FC<Props> = ({
  users,
  getFullName,
  getStatusText,
  getStatusClass,
  onClickUser,
  onContextMenuUser,
}) => {
  return (
    <div className="users-list">
      <div className="users-list-header" aria-hidden="true">
        <span>Пользователь</span>
        <span>Статус</span>
      </div>
      {users.map((user) => (
        <div
          key={user.id}
          className="users-list-item"
          role="button"
          tabIndex={0}
          onClick={() => onClickUser(user.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClickUser(user.id);
          }}
          onContextMenu={(e) => onContextMenuUser(e, user)}
        >
          <div className="users-list-left">
            <Avatar
              src={user.avatarUrl}
              name={getFullName(user)}
              email={user.email}
              size={44}
              className={user.avatarUrl ? 'user-avatar-small' : 'user-avatar-placeholder-small'}
            />

            <div className="users-list-text">
              <div className="users-list-name">
                <span>{getFullName(user)}</span>
                {user.displayName ? <em>{user.displayName}</em> : null}
              </div>
              <div className="users-list-email">{user.email}</div>
            </div>
          </div>

          <div className="users-list-right">
            <span className={`status-badge ${getStatusClass(user)}`}>{getStatusText(user)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};
