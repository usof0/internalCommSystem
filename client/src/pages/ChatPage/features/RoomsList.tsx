import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedRoom } from '../../../app/slices/uiSlice';
import type { RootState } from '../../../app/store';
import { useGetRoomsQuery } from '../../../api/chatApi';
import { SkeletonList } from '../../../components/Loading';
import { EmptyState } from '../../../components/EmptyState';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { Avatar } from '../../../components/ui/Avatar';
import type { Room } from '../../../types';
import { displayName, formatRoomPreviewTime } from './utils/chatFormatters';

/** Visible name for a room — the other person's name for DMs, room.title for groups. */
function roomLabel(room: Room): string {
  if (room.type === 'DIRECT' && room.directRecipient) {
    return displayName(room.directRecipient);
  }
  return room.title;
}

type RoomsListProps = {
  compact?: boolean;
};

export const RoomsList: React.FC<RoomsListProps> = ({ compact = false }) => {
  const dispatch = useDispatch();
  const selectedRoomId = useSelector((state: RootState) => state.ui.selectedRoomId);
  const [search, setSearch] = useState('');

  const { data: rooms, isLoading, error, refetch } = useGetRoomsQuery();

  if (isLoading) return <SkeletonList count={8} />;
  if (error) return <ErrorBanner onRetry={refetch} />;

  const filtered = (rooms?.items ?? []).filter((r) =>
    roomLabel(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`rooms-list${compact ? ' rooms-list--compact' : ''}`}>
      <div className="rooms-search">
        <input
          type="text"
          className="input rooms-search-input"
          placeholder="Поиск комнат..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="Нет доступных комнат" icon="💬" />
      ) : (
        filtered.map((room: Room) => (
          <RoomItem
            key={room.id}
            room={room}
            isActive={selectedRoomId === room.id}
            compact={compact}
            onSelect={() => dispatch(setSelectedRoom(room.id))}
          />
        ))
      )}
    </div>
  );
};

interface RoomItemProps {
  room: Room;
  isActive: boolean;
  compact?: boolean;
  onSelect: () => void;
}

const RoomItem: React.FC<RoomItemProps> = ({ room, isActive, compact = false, onSelect }) => {
  // For DMs: show the other person's name/avatar; for groups: room title/avatar
  const label = roomLabel(room);
  const avatarSrc =
    room.type === 'DIRECT' && room.directRecipient
      ? room.directRecipient.avatarUrl
      : room.avatarUrl;

  const authorName = room.lastMessage ? displayName(room.lastMessage.author) : null;
  const previewTime = room.lastMessage
    ? formatRoomPreviewTime(room.lastMessage.createdAt)
    : null;

  return (
    <div
      className={`room-item${isActive ? ' room-item--active' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      title={compact ? label : undefined}
      aria-label={label}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
    >
      <Avatar
        src={avatarSrc}
        name={label}
        size={44}
        className="room-item__avatar"
      />

      {!compact && <div className="room-item__body">
        <div className="room-item__top">
          <span className="room-item__title">{label}</span>
          {previewTime && <span className="room-item__time">{previewTime}</span>}
        </div>

        <div className="room-item__bottom">
          {room.lastMessage ? (
            <span className="room-item__preview">
              <span className="room-item__preview-author">{authorName}:</span>{' '}
              {room.lastMessage.content}
            </span>
          ) : (
            <span className="room-item__preview room-item__preview--empty">
              Нет сообщений
            </span>
          )}
          {room.unreadCount > 0 && (
            <span className="room-item__unread">{room.unreadCount}</span>
          )}
        </div>
      </div>}
      {compact && room.unreadCount > 0 && (
        <span className="room-item__unread room-item__unread--compact">{room.unreadCount}</span>
      )}
    </div>
  );
};
