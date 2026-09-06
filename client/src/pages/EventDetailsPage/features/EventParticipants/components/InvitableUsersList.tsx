import React from 'react';

import { Avatar } from '../../../../../components/ui/Avatar';
import type { User } from '../../../../../types';

type Props = {
  users: User[];
  selectedUserIds: string[];
  onToggle: (userId: string) => void;
};

const getUserDisplayName = (user: User) =>
  user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

export const InvitableUsersList: React.FC<Props> = ({ users, selectedUserIds, onToggle }) => {
  return (
    <div className="task-user-select-list">
      {users.map((user) => {
        const name = getUserDisplayName(user);
        const isSelected = selectedUserIds.includes(user.id);

        return (
          <div
            key={user.id}
            className={`task-user-select-item${isSelected ? ' selected' : ''}`}
            onClick={() => onToggle(user.id)}
          >
            <Avatar src={user.avatarUrl} name={name} email={user.email} size={32} />
            <div className="task-user-select-info">
              <span className="task-user-select-name">{name}</span>
              <span className="task-user-select-email">{user.email}</span>
            </div>
            {isSelected ? <span className="task-user-select-check">✓</span> : null}
          </div>
        );
      })}
    </div>
  );
};
