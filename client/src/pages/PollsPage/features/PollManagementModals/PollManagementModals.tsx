import React from 'react';

import { Modal } from '../../../../components/ui/Modal';
import type { PollManagementModalsProps } from './PollManagementModals.types';

const EditIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
  </svg>
);

export const PollManagementModals: React.FC<PollManagementModalsProps> = ({
  pollTitle,
  editOpen,
  editTitle,
  editDescription,
  editAllowVoteChange,
  editError,
  isUpdating,
  deleteOpen,
  deleteError,
  isDeleting,
  onCloseEdit,
  onChangeEditTitle,
  onChangeEditDescription,
  onChangeEditAllowVoteChange,
  onSaveEdit,
  onCloseDelete,
  onDelete,
}) => {
  return (
    <>
      <Modal
        open={editOpen}
        onClose={onCloseEdit}
        title={<div className="poll-modal-title"><EditIcon />Редактировать опрос</div>}
        footer={
          <div className="poll-modal-actions">
            <button className="btn btn-secondary" onClick={onCloseEdit}>
              Отмена
            </button>
            <button className="btn btn-primary" onClick={onSaveEdit} disabled={isUpdating}>
              {isUpdating ? 'Сохранение…' : 'Сохранить'}
            </button>
          </div>
        }
      >
        <div className="form-group">
          <label className="form-label">Название *</label>
          <input
            className="form-control"
            value={editTitle}
            onChange={(event) => onChangeEditTitle(event.target.value)}
            placeholder="Тема опроса"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label">Описание</label>
          <textarea
            className="form-control"
            rows={3}
            value={editDescription}
            onChange={(event) => onChangeEditDescription(event.target.value)}
            placeholder="Дополнительное описание (необязательно)"
          />
        </div>
        <label className="poll-setting-toggle">
          <input
            type="checkbox"
            checked={editAllowVoteChange}
            onChange={(event) => onChangeEditAllowVoteChange(event.target.checked)}
          />
          <span className="poll-setting-toggle__control" aria-hidden="true" />
          <span className="poll-setting-toggle__text">
            <strong>Разрешить изменение голоса</strong>
            <small>
              Если выключено, участник не сможет изменить или отозвать ответ после голосования.
            </small>
          </span>
        </label>
        {editError ? <p className="form-error">{editError}</p> : null}
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={onCloseDelete}
        title={<div className="poll-modal-title poll-modal-title--danger"><DeleteIcon />Удалить опрос</div>}
        footer={
          <div className="poll-modal-actions">
            <button className="btn btn-secondary" onClick={onCloseDelete}>
              Отмена
            </button>
            <button className="btn btn-danger" onClick={onDelete} disabled={isDeleting}>
              {isDeleting ? 'Удаление…' : 'Удалить'}
            </button>
          </div>
        }
      >
        <p>
          Вы уверены, что хотите удалить опрос <strong>«{pollTitle}»</strong>?
          Это действие необратимо.
        </p>
        {deleteError ? <p className="form-error">{deleteError}</p> : null}
      </Modal>
    </>
  );
};
