import React from 'react';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Form';

export type CreateUserFormData = {
  email: string;
  firstName: string;
  secondName: string;
  lastName: string;
  displayName: string;
};

type Props = {
  value: CreateUserFormData;
  onChange: (next: CreateUserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
};

export const CreateUserForm: React.FC<Props> = ({ value, onChange, onSubmit, loading }) => {
  return (
    <form onSubmit={onSubmit} className="create-user-form">
      <div className="create-user-form__header">
        <div>
          <span>Новый пользователь</span>
          <h2>Создание учетной записи</h2>
        </div>
        <p>Будет установлен временный пароль: ChangeMe123!. Пользователь сможет изменить его в профиле.</p>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Email *</label>
          <Input
            type="email"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="user@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label>Отображаемое имя</label>
          <Input
            value={value.displayName}
            onChange={(e) => onChange({ ...value, displayName: e.target.value })}
            placeholder="Как отображать в интерфейсе"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Имя</label>
          <Input
            value={value.firstName}
            onChange={(e) => onChange({ ...value, firstName: e.target.value })}
            placeholder="Имя"
          />
        </div>

        <div className="form-group">
          <label>Отчество</label>
          <Input
            value={value.secondName}
            onChange={(e) => onChange({ ...value, secondName: e.target.value })}
            placeholder="Отчество"
          />
        </div>

        <div className="form-group">
          <label>Фамилия</label>
          <Input
            value={value.lastName}
            onChange={(e) => onChange({ ...value, lastName: e.target.value })}
            placeholder="Фамилия"
          />
        </div>
      </div>

      <div className="create-user-form__actions">
        <Button variant="primary" type="submit" loading={!!loading}>
          Создать пользователя
        </Button>
      </div>
    </form>
  );
};
