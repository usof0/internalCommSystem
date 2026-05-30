import React from 'react';

import { Button } from '../../../../../components/ui/Button';
import { EmptyState, LoadingState } from '../../../../../components/ui/States';

import { OrgMemberRow } from './components/OrgMemberRow';
import type { OrgMembersSectionProps } from './OrgMembersSection.types';

export const OrgMembersSection: React.FC<OrgMembersSectionProps> = ({
  members,
  positions,
  canManage,
  isLoading,
  onOpenAddMember,
  onAddPosition,
  onRemovePosition,
  onRemoveMember,
}) => {
  return (
    <div className="org-details-section">
      <div className="org-details-section__header">
        <h3 className="org-details-section__title">
          Участники {isLoading ? '' : `(${members.length})`}
        </h3>
        {canManage ? (
          <Button size="sm" variant="primary" onClick={onOpenAddMember}>
            + Добавить участника
          </Button>
        ) : null}
      </div>

      {isLoading ? <LoadingState /> : null}
      {!isLoading && members.length === 0 ? <EmptyState text="Нет участников" /> : null}

      <div className="org-members-list">
        {members.map((member) => (
          <OrgMemberRow
            key={member.userId}
            member={member}
            positions={positions}
            canManage={canManage}
            onAddPosition={onAddPosition}
            onRemovePosition={onRemovePosition}
            onRemoveMember={onRemoveMember}
          />
        ))}
      </div>
    </div>
  );
};
