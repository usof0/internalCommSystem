import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRoom, setSelectedTopic } from '../../../app/slices/uiSlice';
import type { RootState } from '../../../app/store';
import { useCreateRoomMutation, useLazyGetTopicsQuery } from '../../../api/chatApi';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { UserPicker } from './UserPicker';
import type { RoomType } from '../../../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CreateRoomModal: React.FC<Props> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const [createRoom, { isLoading }] = useCreateRoomMutation();
  const [loadTopics] = useLazyGetTopicsQuery();

  const [type, setType] = useState<RoomType>('GROUP');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // DIRECT: exactly one selected user ID
  const [directUserIds, setDirectUserIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setType('GROUP');
    setTitle('');
    setDescription('');
    setDirectUserIds([]);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (type === 'GROUP' && !title.trim()) {
      setError('Название обязательно для групповой комнаты');
      return;
    }
    if (type === 'DIRECT' && directUserIds.length === 0) {
      setError('Выберите пользователя для личной переписки');
      return;
    }

    try {
      const room = await createRoom(
        type === 'GROUP'
          ? {
              type: 'GROUP',
              title: title.trim(),
              description: description.trim() || undefined,
            }
          : {
              type: 'DIRECT',
              memberIds: directUserIds,
              // Backend creates this hidden default topic for the DM conversation
              initialTopics: [{ title: 'direct', visibilityScope: { scopeType: 'ALL_MEMBERS' as const } }],
            }
      ).unwrap();

      dispatch(setSelectedRoom(room.id));
      if (room.type === 'DIRECT') {
        const topics = await loadTopics(room.id, true).unwrap().catch(() => []);
        const directTopic = topics[0];
        if (directTopic) {
          dispatch(setSelectedTopic(directTopic.id));
        }
      }
      handleClose();
    } catch {
      setError('Не удалось создать комнату. Попробуйте снова.');
    }
  };

  return (
    <Modal
      open={open}
      title={
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
          Новая комната
        </h3>
      }
      onClose={handleClose}
      maxWidth={480}
      footer={
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={isLoading}>
            Отмена
          </Button>
          <Button variant="primary" onClick={() => handleSubmit()} loading={isLoading}>
            Создать
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="create-room-form">
        {/* Room type selector */}
        <div className="form-group">
          <label className="form-label">Тип комнаты</label>
          <div className="create-room-type-btns">
            <button
              type="button"
              className={`create-room-type-btn${type === 'GROUP' ? ' create-room-type-btn--active' : ''}`}
              onClick={() => { setType('GROUP'); setError(null); }}
            >
              👥 Группа
            </button>
            <button
              type="button"
              className={`create-room-type-btn${type === 'DIRECT' ? ' create-room-type-btn--active' : ''}`}
              onClick={() => { setType('DIRECT'); setError(null); }}
            >
              💬 Личная переписка
            </button>
          </div>
        </div>

        {/* GROUP fields */}
        {type === 'GROUP' && (
          <>
            <div className="form-group">
              <label className="form-label" htmlFor="room-title">
                Название <span className="form-required">*</span>
              </label>
              <input
                id="room-title"
                type="text"
                className="input"
                placeholder="Название комнаты"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                maxLength={100}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="room-desc">
                Описание
              </label>
              <textarea
                id="room-desc"
                className="textarea"
                placeholder="Краткое описание (необязательно)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>
          </>
        )}

        {/* DIRECT: user list picker (single-select) */}
        {type === 'DIRECT' && (
          <div className="form-group">
            <label className="form-label">
              Выберите пользователя <span className="form-required">*</span>
            </label>
            <UserPicker
              selectedIds={directUserIds}
              onChange={setDirectUserIds}
              singleSelect
              excludeIds={currentUserId ? [currentUserId] : []}
            />
          </div>
        )}

        {error && <p className="create-room-error">{error}</p>}
      </form>
    </Modal>
  );
};
