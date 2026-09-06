import React from 'react';

import { Avatar } from '../../../../../../components/ui/Avatar';
import { Button } from '../../../../../../components/ui/Button';
import type { Position } from '../../../../../../types';

import type { GroupedOrgMember } from '../../../OrgDetailsPage.types';

type Props = {
  member: GroupedOrgMember;
  positions: Position[];
  canManage: boolean;
  onAddPosition: (userId: string, positionId: string) => void;
  onRemovePosition: (userId: string, positionId: string) => void;
  onRemoveMember: (member: GroupedOrgMember) => void;
};

export const OrgMemberRow: React.FC<Props> = ({
  member,
  positions,
  canManage,
  onAddPosition,
  onRemovePosition,
  onRemoveMember,
}) => {
  const assignedPositionIds = new Set(member.positions.map((position) => position.positionId));
  const availablePositions = positions.filter((position) => !assignedPositionIds.has(position.id));

  return (
    <div className="org-member-row">
      <Avatar
        src={member.avatarUrl}
        name={member.displayName || member.email}
        email={member.email}
        size={36}
        className="org-member-row__avatar"
      />

      <div className="org-member-row__info">
        <span className="org-member-row__name">{member.displayName || member.email}</span>
        <span className="org-member-row__email">{member.email}</span>
      </div>

      <div className="org-member-row__positions">
        {member.positions.map((position) => (
          <span key={position.positionId} className="org-member-position-chip">
            {position.positionName}
            {canManage ? (
              <button
                className="org-member-position-chip__remove"
                title="Убрать должность"
                onClick={() => onRemovePosition(member.userId, position.positionId)}
              >
                ✕
              </button>
            ) : null}
          </span>
        ))}
        {canManage && availablePositions.length > 0 ? (
          <select
            className="select org-member-position-add"
            value=""
            onChange={(event) => event.target.value && onAddPosition(member.userId, event.target.value)}
            title="Добавить должность"
          >
            <option value="">+ Должность</option>
            {availablePositions.map((position) => (
              <option key={position.id} value={position.id}>{position.name}</option>
            ))}
          </select>
        ) : null}
      </div>

      {canManage ? (
        <Button
          size="sm"
          variant="danger"
          onClick={() => onRemoveMember(member)}
          title="Удалить участника из подразделения"
        >
          Удалить
        </Button>
      ) : null}
    </div>
  );
};
