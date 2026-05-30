import React, { useState } from 'react';
import { useAddRoomMembersMutation, useBulkAddRoomMembersMutation } from '../../../api/chatApi';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { UserPicker } from './UserPicker';
import { OrgUnitPicker } from './OrgUnitPicker';
import { TagPicker } from './TagPicker';

interface Props {
  open: boolean;
  roomId: string;
  /** IDs of users already in the room — excluded from the user picker */
  existingMemberIds: string[];
  onClose: () => void;
}

type Tab = 'users' | 'bulk';

export const AddMembersModal: React.FC<Props> = ({
  open,
  roomId,
  existingMemberIds,
  onClose,
}) => {
  const [tab, setTab] = useState<Tab>('users');

  // Individual tab state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Bulk tab state
  const [orgUnitIds, setOrgUnitIds] = useState<string[]>([]);
  const [orgUnitTagIds, setOrgUnitTagIds] = useState<string[]>([]);
  const [includeSubUnits, setIncludeSubUnits] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [addMembers, { isLoading: adding }] = useAddRoomMembersMutation();
  const [bulkAdd, { isLoading: bulking }] = useBulkAddRoomMembersMutation();
  const isLoading = adding || bulking;

  const switchTab = (t: Tab) => {
    setTab(t);
    setError(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    setSelectedUserIds([]);
    setOrgUnitIds([]);
    setOrgUnitTagIds([]);
    setIncludeSubUnits(false);
    setError(null);
    setSuccessMsg(null);
    setTab('users');
    onClose();
  };

  const handleAddUsers = async () => {
    if (selectedUserIds.length === 0) {
      setError('Выберите хотя бы одного пользователя');
      return;
    }
    setError(null);
    try {
      await addMembers({
        roomId,
        body: { members: selectedUserIds.map((userId) => ({ userId })) },
      }).unwrap();
      setSuccessMsg(`Добавлено участников: ${selectedUserIds.length}`);
      setSelectedUserIds([]);
    } catch {
      setError('Не удалось добавить участников. Попробуйте снова.');
    }
  };

  const handleBulkAdd = async () => {
    if (orgUnitIds.length === 0 && orgUnitTagIds.length === 0) {
      setError('Выберите хотя бы одно подразделение или тег');
      return;
    }
    setError(null);
    try {
      const result = await bulkAdd({
        roomId,
        body: {
          orgUnitIds: orgUnitIds.length ? orgUnitIds : undefined,
          orgUnitTagIds: orgUnitTagIds.length ? orgUnitTagIds : undefined,
          includeSubUnits,
          dryRun: false,
        },
      }).unwrap();
      setSuccessMsg(
        `Добавлено: ${result.addedCount} уч., пропущено: ${result.skippedCount}`
      );
      setOrgUnitIds([]);
      setOrgUnitTagIds([]);
    } catch {
      setError('Не удалось добавить участников. Попробуйте снова.');
    }
  };

  return (
    <Modal
      open={open}
      title={
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
          Добавить участников
        </h3>
      }
      onClose={handleClose}
      maxWidth={520}
      footer={
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button onClick={handleClose} disabled={isLoading}>
            Закрыть
          </Button>
          <Button
            variant="primary"
            onClick={tab === 'users' ? handleAddUsers : handleBulkAdd}
            loading={isLoading}
          >
            Добавить
          </Button>
        </div>
      }
    >
      <div className="add-members-modal">
        {/* Mode tabs */}
        <div className="add-members-tabs">
          <button
            type="button"
            className={`add-members-tab${tab === 'users' ? ' add-members-tab--active' : ''}`}
            onClick={() => switchTab('users')}
          >
            По пользователям
          </button>
          <button
            type="button"
            className={`add-members-tab${tab === 'bulk' ? ' add-members-tab--active' : ''}`}
            onClick={() => switchTab('bulk')}
          >
            По подразделениям / тегам
          </button>
        </div>

        {/* Individual user picker */}
        {tab === 'users' && (
          <UserPicker
            selectedIds={selectedUserIds}
            onChange={setSelectedUserIds}
            excludeIds={existingMemberIds}
          />
        )}

        {/* Bulk by org / tags */}
        {tab === 'bulk' && (
          <div className="bulk-add-form">
            <div className="form-group">
              <label className="form-label">Подразделения</label>
              <OrgUnitPicker
                selectedIds={orgUnitIds}
                onChange={setOrgUnitIds}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Теги подразделений</label>
              <TagPicker
                selectedIds={orgUnitTagIds}
                onChange={setOrgUnitTagIds}
              />
            </div>
            <label className="bulk-add-subunits">
              <input
                type="checkbox"
                checked={includeSubUnits}
                onChange={(e) => setIncludeSubUnits(e.target.checked)}
              />
              Включить дочерние подразделения
            </label>
          </div>
        )}

        {error && <p className="add-members-error">{error}</p>}
        {successMsg && <p className="add-members-success">{successMsg}</p>}
      </div>
    </Modal>
  );
};
