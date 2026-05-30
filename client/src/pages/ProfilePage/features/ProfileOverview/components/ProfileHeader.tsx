import React from 'react';

import { Button } from '../../../../../components/ui/Button';
import { PageHeader } from '../../../../../components/ui/PageHeader';

type Props = {
  isEditing: boolean;
  isSaving: boolean;
  onStartEdit: () => void;
  onOpenPasswordChange: () => void;
  onCancel: () => void;
  onSave: () => void;
};

export const ProfileHeader: React.FC<Props> = ({
  isEditing,
  isSaving,
  onStartEdit,
  onOpenPasswordChange,
  onCancel,
  onSave,
}) => {
  return (
    <PageHeader
      title="Мой профиль"
      actions={
        !isEditing ? (
          <>
            <Button onClick={onOpenPasswordChange}>
              Изменить пароль
            </Button>
            <Button variant="primary" onClick={onStartEdit}>
              Редактировать
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onCancel} disabled={isSaving}>
              Отмена
            </Button>
            <Button variant="primary" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </>
        )
      }
    />
  );
};
