import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleChatInfoPanel, setSelectedRoom } from '../../../app/slices/uiSlice';
import type { RootState } from '../../../app/store';
import {
  useGetRoomByIdQuery,
  useGetRoomMembersQuery,
  useGetAssignableRoomRolesQuery,
  useGetTopicsQuery,
  useDeleteRoomMutation,
  useRemoveRoomMemberMutation,
  useUpdateRoomMemberMutation,
} from '../../../api/chatApi';
import { Loading } from '../../../components/Loading';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { Avatar } from '../../../components/ui/Avatar';
import { AddMembersModal } from './AddMembersModal';
import { TopicManagementPanel } from './TopicManagementPanel';
import { displayName } from './utils/chatFormatters';

export const ChatInfoPanel: React.FC = () => {
  const dispatch = useDispatch();
  const selectedRoomId = useSelector((state: RootState) => state.ui.selectedRoomId);
  const selectedTopicId = useSelector((state: RootState) => state.ui.selectedTopicId);
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id);
  const isOpen = useSelector((state: RootState) => state.ui.chatInfoPanelOpen);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [deleteRoom, { isLoading: isDeleting }] = useDeleteRoomMutation();
  const [removeRoomMember] = useRemoveRoomMemberMutation();
  const [updateRoomMember] = useUpdateRoomMemberMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const { data: room, isLoading: roomLoading, error: roomError, refetch: refetchRoom } =
    useGetRoomByIdQuery(selectedRoomId!, { skip: !selectedRoomId || !isOpen });

  const { data: members, isLoading: membersLoading } =
    useGetRoomMembersQuery(selectedRoomId!, { skip: !selectedRoomId || !isOpen });
  const { data: topics } = useGetTopicsQuery(selectedRoomId!, { skip: !selectedRoomId || !isOpen });

  const currentMembership = members?.find((member) => member.userId === currentUserId);
  const currentRoomRole = currentMembership?.roomRole.name.toLowerCase();
  const canManageCurrentRoom =
    currentRoomRole === 'owner' || currentRoomRole === 'admin';

  const { data: assignableRoles } = useGetAssignableRoomRolesQuery(selectedRoomId!, {
    skip: !selectedRoomId || !isOpen || !canManageCurrentRoom,
  });

  const handleDelete = async () => {
    if (!selectedRoomId) return;
    try {
      await deleteRoom(selectedRoomId).unwrap();
      dispatch(setSelectedRoom(null));
      dispatch(toggleChatInfoPanel());
    } catch {
      // error visible in UI via button state
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedRoomId) return;
    setRemovingUserId(userId);
    try {
      await removeRoomMember({ roomId: selectedRoomId, userId }).unwrap();
      if (userId === currentUserId) {
        dispatch(setSelectedRoom(null));
        dispatch(toggleChatInfoPanel());
      }
    } catch {
      // silently ignore — member list will not update on failure
    } finally {
      setRemovingUserId(null);
    }
  };

  const handleUpdateRole = async (userId: string, roomRoleId: string) => {
    if (!selectedRoomId) return;
    setUpdatingUserId(userId);
    try {
      await updateRoomMember({
        roomId: selectedRoomId,
        userId,
        body: { roomRoleId },
      }).unwrap();
    } catch {
      // backend keeps the final authority; failed updates keep the current role
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (!isOpen || !selectedRoomId) return null;

  const existingMemberIds = members?.map((m) => m.userId) ?? [];
  const selectedTopic = topics?.find((topic) => topic.id === selectedTopicId);
  const canLeaveCurrentRoom = room?.type === 'GROUP' && currentRoomRole !== 'owner';
  const roleLabels: Record<string, string> = {
    owner: 'Владелец',
    admin: 'Администратор',
    member: 'Участник',
  };
  const getRoleLabel = (roleName: string) => roleLabels[roleName.toLowerCase()] ?? roleName;

  return (
    <>
      <div className="chat-info-panel">
        <div className="chat-info-panel__header">
          <h3 className="chat-info-panel__title">Информация</h3>
          <button
            onClick={() => dispatch(toggleChatInfoPanel())}
            className="btn btn-sm"
            title="Закрыть"
          >
            ✕
          </button>
        </div>

        <div className="chat-info-panel__content">
          {(roomLoading || membersLoading) && <Loading />}
          {roomError && <ErrorBanner onRetry={refetchRoom} />}

          {room && (
            <>
              {room.type === 'GROUP' && selectedTopic && canManageCurrentRoom ? (
                <TopicManagementPanel roomId={room.id} topic={selectedTopic} />
              ) : null}

              <div className="chat-info-section">
                <Avatar
                  src={room.avatarUrl}
                  name={room.title}
                  size={64}
                  className="chat-info-panel__room-avatar"
                />
                <h4 className="chat-info-panel__room-title">{room.title}</h4>
                {room.description && (
                  <p className="chat-info-panel__room-desc">{room.description}</p>
                )}
              </div>

              {room.type === 'GROUP' && (
                <div className="chat-info-section">
                  <div className="chat-info-section__heading-row">
                    <h5 className="chat-info-section__heading">
                      Участники {members ? `(${members.length})` : ''}
                    </h5>
                    {canManageCurrentRoom && (
                      <button
                        className="btn btn-sm"
                        onClick={() => setAddMembersOpen(true)}
                        title="Добавить участников"
                      >
                        + Добавить
                      </button>
                    )}
                  </div>

                  {members && members.length > 0 ? (
                    <ul className="chat-info-members">
                      {members.map((m) => {
                        const memberRoleName = m.roomRole.name.toLowerCase();
                        const isOwner = memberRoleName === 'owner';
                        const isSelf = m.userId === currentUserId;
                        const canChangeRole = canManageCurrentRoom && !isSelf && !isOwner;
                        const canRemoveMember = canManageCurrentRoom && !isSelf && !isOwner;

                        return (
                          <li key={m.userId} className="chat-info-member">
                            <Avatar
                              src={m.user.avatarUrl}
                              name={displayName(m.user)}
                              email={m.user.email}
                              size={32}
                              className="chat-info-member__avatar"
                            />
                            <div className="chat-info-member__info">
                              <span className="chat-info-member__name">
                                {displayName(m.user)}
                              </span>
                              {canChangeRole && assignableRoles?.length ? (
                                <select
                                  className="chat-info-member__role-select"
                                  value={m.roomRoleId}
                                  disabled={updatingUserId === m.userId}
                                  onChange={(event) =>
                                    handleUpdateRole(m.userId, event.target.value)
                                  }
                                  aria-label="Роль участника"
                                >
                                  {assignableRoles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                      {getRoleLabel(role.name)}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="chat-info-member__role">
                                  {getRoleLabel(m.roomRole.name)}
                                </span>
                              )}
                            </div>
                            {canRemoveMember && (
                              <button
                                className="btn btn-sm btn-danger chat-info-member__remove"
                                title="Удалить из комнаты"
                                disabled={removingUserId === m.userId}
                                onClick={() => handleRemoveMember(m.userId)}
                              >
                                {removingUserId === m.userId ? '…' : '✕'}
                              </button>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    !membersLoading && (
                      <p className="info-placeholder">Нет участников</p>
                    )
                  )}
                </div>
              )}

              {(canLeaveCurrentRoom || canManageCurrentRoom) && (
                <div className="chat-info-section chat-info-section--danger">
                  {canLeaveCurrentRoom && currentUserId ? (
                    <button
                      className="btn btn-sm chat-info-leave-btn"
                      onClick={() => handleRemoveMember(currentUserId)}
                      disabled={removingUserId === currentUserId}
                    >
                      {removingUserId === currentUserId ? 'Выход…' : 'Покинуть комнату'}
                    </button>
                  ) : null}

                  {confirmDelete ? (
                    <div className="chat-info-delete-confirm">
                      <p className="chat-info-delete-confirm__text">
                        Удалить {room.type === 'DIRECT' ? 'переписку' : 'комнату'}? Это действие нельзя отменить.
                      </p>
                      <div className="chat-info-delete-confirm__actions">
                        <button
                          className="btn btn-sm"
                          onClick={() => setConfirmDelete(false)}
                          disabled={isDeleting}
                        >
                          Отмена
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Удаление…' : 'Да, удалить'}
                        </button>
                      </div>
                    </div>
                  ) : canManageCurrentRoom ? (
                    <button
                      className="btn btn-sm btn-danger chat-info-delete-btn"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Удалить {room.type === 'DIRECT' ? 'переписку' : 'комнату'}
                    </button>
                  ) : null}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AddMembersModal
        open={addMembersOpen}
        roomId={selectedRoomId}
        existingMemberIds={existingMemberIds}
        onClose={() => setAddMembersOpen(false)}
      />
    </>
  );
};
