import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRoom, setSelectedTopic } from '../../../app/slices/uiSlice';
import type { RootState } from '../../../app/store';
import { useCreateRoomMutation, useLazyGetTopicsQuery } from '../../../api/chatApi';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { UserPicker } from './UserPicker';
import { OrgUnitPicker } from './OrgUnitPicker';
import { TagPicker } from './TagPicker';
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
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [orgUnitIds, setOrgUnitIds] = useState<string[]>([]);
  const [orgUnitTagIds, setOrgUnitTagIds] = useState<string[]>([]);
  const [includeSubUnits, setIncludeSubUnits] = useState(false);
  // DIRECT: exactly one selected user ID
  const [directUserIds, setDirectUserIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setType('GROUP');
    setTitle('');
    setDescription('');
    setGroupMemberIds([]);
    setOrgUnitIds([]);
    setOrgUnitTagIds([]);
    setIncludeSubUnits(false);
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
              memberIds: groupMemberIds.length ? groupMemberIds : undefined,
              orgUnitIds: orgUnitIds.length ? orgUnitIds : undefined,
              orgUnitTagIds: orgUnitTagIds.length ? orgUnitTagIds : undefined,
              includeSubUnits,
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
      maxWidth={640}
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
            <div className="create-room-members">
              <div className="create-room-members__header">
                <span>Участники комнаты</span>
                <small>
                  {groupMemberIds.length + orgUnitIds.length + orgUnitTagIds.length} выбрано
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Отдельные пользователи</label>
                <UserPicker
                  selectedIds={groupMemberIds}
                  onChange={setGroupMemberIds}
                  excludeIds={currentUserId ? [currentUserId] : []}
                />
              </div>
              <div className="create-room-members__grid">
                <div className="form-group">
                  <label className="form-label">Подразделения</label>
                  <OrgUnitPicker selectedIds={orgUnitIds} onChange={setOrgUnitIds} />
                  <label className="bulk-add-subunits create-room-members__subunits">
                    <input
                      type="checkbox"
                      checked={includeSubUnits}
                      onChange={(e) => setIncludeSubUnits(e.target.checked)}
                    />
                    Включить дочерние подразделения
                  </label>
                </div>
                <div className="form-group">
                  <label className="form-label">Теги подразделений</label>
                  <TagPicker selectedIds={orgUnitTagIds} onChange={setOrgUnitTagIds} />
                </div>
              </div>
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
