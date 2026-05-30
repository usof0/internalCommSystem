import React from 'react';

import { Button } from '../../../../../../components/ui/Button';
import { Modal } from '../../../../../../components/ui/Modal';
import { FormGroup, Select } from '../../../../../../components/ui/Form';

import type { AddMemberModalProps } from '../OrgMembersSection.types';

const getUserName = (user: AddMemberModalProps['users'][number]) => {
  if (user.displayName) return user.displayName;
  const parts = [user.lastName, user.firstName].filter(Boolean);
  return parts.length ? parts.join(' ') : user.email;
};

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
  open,
  users,
  positions,
  selectedUserId,
  selectedPositionId,
  error,
  isLoading,
  onClose,
  onChangeUser,
  onChangePosition,
  onSubmit,
}) => {
  return (
    <Modal
      open={open}
      title={<h3 style={{ margin: 0 }}>Добавить участника</h3>}
      onClose={onClose}
      maxWidth={440}
      footer={
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Отмена</Button>
          <Button
            variant="primary"
            loading={isLoading}
            disabled={!selectedUserId || !selectedPositionId}
            onClick={onSubmit}
          >
            Добавить
          </Button>
        </div>
      }
    >
      <FormGroup label="Пользователь">
        <Select
          value={selectedUserId}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChangeUser(event.target.value)}
        >
          <option value="">Выберите пользователя</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>{getUserName(user)}</option>
          ))}
        </Select>
      </FormGroup>
      <FormGroup label="Должность">
        <Select
          value={selectedPositionId}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChangePosition(event.target.value)}
        >
          <option value="">Выберите должность</option>
          {positions.map((position) => (
            <option key={position.id} value={position.id}>{position.name}</option>
          ))}
        </Select>
      </FormGroup>
      {error ? (
        <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>{error}</p>
      ) : null}
      {users.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Все пользователи уже являются участниками
        </p>
      ) : null}
    </Modal>
  );
};
