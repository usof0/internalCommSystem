import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../app/store';
import { Loading } from '../../components/Loading';
import { ErrorBanner } from '../../components/ErrorBanner';
import {
  totalVotes,
  winnerOptionId,
} from './features/utils/pollFormatters';
import {
  useDeletePoll,
  useInvitePollParticipants,
  usePollDetailsData,
  usePollInvitableUsers,
  useRemovePollParticipant,
  useRetractPollVote,
  useUpdatePoll,
  useVoteOnPoll,
} from './PollDetailsPage.api';
import type { PollDetailsPageParams } from './PollDetailsPage.types';
import { PollHeader } from './features/PollHeader/PollHeader';
import { PollResults } from './features/PollResults/PollResults';
import { PollSidebar } from './features/PollSidebar/PollSidebar';
import { PollManagementModals } from './features/PollManagementModals/PollManagementModals';
import './PollsPage.css';

export const PollDetailsPage: React.FC = () => {
  const { pollId } = useParams<PollDetailsPageParams>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  const { data: poll, isLoading, error, refetch } = usePollDetailsData(pollId);
  const [vote, { isLoading: voting }] = useVoteOnPoll();
  const [retractVote, { isLoading: retracting }] = useRetractPollVote();
  const [updatePoll, { isLoading: updating }] = useUpdatePoll();
  const [deletePoll, { isLoading: deleting }] = useDeletePoll();
  const [inviteParticipants, { isLoading: inviting }] = useInvitePollParticipants();
  const [removeParticipant] = useRemovePollParticipant();

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedOrgUnitIds, setSelectedOrgUnitIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [includeSubUnits, setIncludeSubUnits] = useState(false);
  const [inviteError, setInviteError] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editAllowVoteChange, setEditAllowVoteChange] = useState(true);
  const [editError, setEditError] = useState('');

  // Delete confirm modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { data: usersResult } = usePollInvitableUsers(showInviteForm, userSearch);

  if (isLoading) return <Loading />;
  if (error) return <ErrorBanner onRetry={refetch} />;
  if (!poll) return null;

  const isCreator = poll.creatorId === user?.id;
  const myParticipation = poll.participants.find((p) => p.userId === user?.id);
  const hasVoted = myParticipation?.done ?? false;
  const myOptionId = myParticipation?.chosenOptionId ?? null;
  const existingParticipantIds = new Set(poll.participants.map((p) => p.userId));

  const total = totalVotes(poll.options);
  const winnerId = winnerOptionId(poll.options);

  const hasAnyVotes = total > 0;
  const canVote = !!myParticipation && (!hasVoted || poll.allowVoteChange);
  const showStats = hasVoted || isCreator;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleVote = async (optionId: string) => {
    if (!canVote || voting || optionId === myOptionId) return;
    try {
      await vote({ pollId: poll.id, body: { optionId } }).unwrap();
    } catch {}
  };

  const handleRetract = async () => {
    if (retracting || !poll.allowVoteChange) return;
    try {
      await retractVote(poll.id).unwrap();
    } catch {}
  };

  const toggleUserSelect = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleInvite = async () => {
    if (selectedUserIds.length === 0 && selectedOrgUnitIds.length === 0 && selectedTagIds.length === 0) {
      setInviteError('Выберите пользователей, подразделения или теги подразделений');
      return;
    }
    try {
      await inviteParticipants({
        pollId: poll.id,
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
      setInviteError('');
    } catch {
      setInviteError('Не удалось пригласить участников');
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    try {
      await removeParticipant({ pollId: poll.id, userId }).unwrap();
    } catch {}
  };

  const openEdit = () => {
    setEditTitle(poll.title);
    setEditDescription(poll.description ?? '');
    setEditAllowVoteChange(poll.allowVoteChange);
    setEditError('');
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editTitle.trim()) {
      setEditError('Введите название опроса');
      return;
    }
    try {
      await updatePoll({
        pollId: poll.id,
        body: {
          title: editTitle.trim(),
          description: editDescription.trim() || undefined,
          allowVoteChange: editAllowVoteChange,
        },
      }).unwrap();
      setShowEditModal(false);
    } catch {
      setEditError('Не удалось обновить опрос');
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    try {
      await deletePoll(poll.id).unwrap();
      navigate('/polls');
    } catch {
      setDeleteError('Не удалось удалить опрос');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="poll-details-page">
      <PollHeader
        poll={poll}
        isCreator={isCreator}
        onBack={() => navigate('/polls')}
        onOpenEdit={openEdit}
        onOpenDelete={() => {
          setDeleteError('');
          setShowDeleteModal(true);
        }}
      />

      <div className="poll-details-layout">
        <PollResults
          poll={poll}
          totalVotes={total}
          winnerOptionId={winnerId}
          myOptionId={myOptionId}
          showStats={showStats}
          canVote={canVote}
          hasAnyVotes={hasAnyVotes}
          onVote={handleVote}
        />

        <PollSidebar
          poll={poll}
          currentUserId={user?.id}
          myOptionId={myOptionId}
          hasVoted={hasVoted}
          isRetracting={retracting}
          isCreator={isCreator}
          isInviteOpen={showInviteForm}
          userSearch={userSearch}
          selectedUserIds={selectedUserIds}
          selectedOrgUnitIds={selectedOrgUnitIds}
          selectedTagIds={selectedTagIds}
          includeSubUnits={includeSubUnits}
          inviteError={inviteError}
          users={usersResult?.items ?? []}
          isInviting={inviting}
          existingParticipantIds={existingParticipantIds}
          onRetractVote={handleRetract}
          onToggleInvite={() => {
            setShowInviteForm((value) => !value);
            setSelectedUserIds([]);
            setSelectedOrgUnitIds([]);
            setSelectedTagIds([]);
            setIncludeSubUnits(false);
            setUserSearch('');
            setInviteError('');
          }}
          onChangeSearch={setUserSearch}
          onToggleUserSelect={toggleUserSelect}
          onChangeOrgUnitSelection={setSelectedOrgUnitIds}
          onChangeTagSelection={setSelectedTagIds}
          onChangeIncludeSubUnits={setIncludeSubUnits}
          onInvite={handleInvite}
          onRemoveParticipant={handleRemoveParticipant}
        />
      </div>

      <PollManagementModals
        pollTitle={poll.title}
        editOpen={showEditModal}
        editTitle={editTitle}
        editDescription={editDescription}
        editAllowVoteChange={editAllowVoteChange}
        editError={editError}
        isUpdating={updating}
        deleteOpen={showDeleteModal}
        deleteError={deleteError}
        isDeleting={deleting}
        onCloseEdit={() => setShowEditModal(false)}
        onChangeEditTitle={setEditTitle}
        onChangeEditDescription={setEditDescription}
        onChangeEditAllowVoteChange={setEditAllowVoteChange}
        onSaveEdit={handleUpdate}
        onCloseDelete={() => setShowDeleteModal(false)}
        onDelete={handleDelete}
      />
    </div>
  );
};
