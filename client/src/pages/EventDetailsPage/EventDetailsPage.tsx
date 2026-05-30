import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { Loading } from '../../components/Loading';
import { ErrorBanner } from '../../components/ErrorBanner';
import { BackButton } from '../../components/ui/BackButton';
import { displayEventUser, formatDateTime, isEventOngoing, isEventPast } from '../../features/events/utils/eventFormatters';
import {
  useConfirmEventAttendance,
  useEventDetailsData,
  useEventInvitableUsers,
  useInviteEventParticipants,
  useRemoveEventParticipant,
} from './EventDetailsPage.api';
import type { EventDetailsPageParams } from './EventDetailsPage.types';
import { EventOverview } from './features/EventOverview/EventOverview';
import { EventAttendance } from './features/EventAttendance/EventAttendance';
import { EventParticipants } from './features/EventParticipants/EventParticipants';

export const EventDetailsPage: React.FC = () => {
  const { eventId } = useParams<EventDetailsPageParams>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: event, isLoading, error, refetch } = useEventDetailsData(eventId);
  const [confirmAttendance, { isLoading: confirming }] = useConfirmEventAttendance();
  const [inviteParticipants, { isLoading: inviting }] = useInviteEventParticipants();
  const [removeParticipant] = useRemoveEventParticipant();

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [includeSubUnits, setIncludeSubUnits] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const { data: usersResult } = useEventInvitableUsers(showInviteForm, userSearch);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBanner onRetry={refetch} />;
  if (!event) return null;

  const isCreator = event.creatorId === user?.id;
  const myParticipation = event.participants.find((p) => p.userId === user?.id);
  const existingParticipantIds = new Set(event.participants.map((p) => p.userId));
  const past = isEventPast(event.timeEnd);
  const ongoing = isEventOngoing(event.timeStart, event.timeEnd);
  const confirmedCount = event.participants.filter((p) => p.confirmed).length;

  const availableUsers =
    usersResult?.items.filter((u) => !existingParticipantIds.has(u.id)) ?? [];

  const handleConfirm = async (confirmed: boolean) => {
    if (!user) return;
    try {
      await confirmAttendance({ eventId: eventId!, userId: user.id, body: { confirmed } }).unwrap();
    } catch {
      // error handled by RTK
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleInvite = async () => {
    if (selectedUserIds.length === 0 && selectedOrgUnitIds.length === 0 && selectedTagIds.length === 0) {
      setInviteError('Выберите пользователей, подразделения или теги подразделений');
      return;
    }
    setInviteError('');
    try {
      await inviteParticipants({
        eventId: eventId!,
        body: {
          userIds: selectedUserIds,
          orgUnitIds: selectedOrgUnitIds,
          orgUnitTagIds: selectedTagIds,
          includeSubUnits,
        },
      }).unwrap();
      setSelectedUserIds([]);
      setSelectedOrgUnitIds([]);
      setSelectedTagIds([]);
      setIncludeSubUnits(false);
      setUserSearch('');
      setShowInviteForm(false);
    } catch {
      setInviteError('Не удалось пригласить участников');
    }
  };

  const cancelInvite = () => {
    setShowInviteForm(false);
    setSelectedUserIds([]);
    setSelectedOrgUnitIds([]);
    setSelectedTagIds([]);
    setIncludeSubUnits(false);
    setUserSearch('');
    setInviteError('');
  };

  return (
    <div className="event-details-page">
      <div className="event-details-header">
        <BackButton onClick={() => navigate('/events')} label="К событиям" compact />
        <div className="event-details-header__content">
          <div className="event-details-header__topline">
            <span className="event-details-header__eyebrow">Детали события</span>
            {ongoing && <span className="event-badge event-badge--live">Идёт сейчас</span>}
            {past && <span className="event-badge event-badge--past">Завершено</span>}
            {!ongoing && !past ? <span className="event-badge event-badge--upcoming">Запланировано</span> : null}
          </div>
          <h1>{event.title}</h1>
          <div className="event-details-header__meta">
            <span>{displayEventUser(event.creator)}</span>
            <span>{formatDateTime(event.timeStart)}</span>
            <span>{confirmedCount}/{event.participants.length} подтвердили</span>
          </div>
        </div>
      </div>

      <EventOverview event={event} />

      {myParticipation && !isCreator && (
        <EventAttendance
          participation={myParticipation}
          isPast={past}
          isConfirming={confirming}
          onConfirmAttendance={handleConfirm}
        />
      )}

      <EventParticipants
        event={event}
        currentUserId={user?.id}
        isCreator={isCreator}
        isPast={past}
        confirmedCount={confirmedCount}
        isInviteOpen={showInviteForm}
        userSearch={userSearch}
        selectedUserIds={selectedUserIds}
        selectedOrgUnitIds={selectedOrgUnitIds}
        selectedTagIds={selectedTagIds}
        includeSubUnits={includeSubUnits}
        inviteError={inviteError}
        availableUsers={availableUsers}
        isInviting={inviting}
        onToggleInvite={() => (showInviteForm ? cancelInvite() : setShowInviteForm(true))}
        onChangeSearch={setUserSearch}
        onToggleUserSelection={toggleUserSelection}
        onChangeOrgUnitSelection={setSelectedOrgUnitIds}
        onChangeTagSelection={setSelectedTagIds}
        onChangeIncludeSubUnits={setIncludeSubUnits}
        onInvite={handleInvite}
        onCancelInvite={cancelInvite}
        onRemove={(participantUserId) => {
          void removeParticipant({ eventId: eventId!, userId: participantUserId });
        }}
      />
    </div>
  );
};
