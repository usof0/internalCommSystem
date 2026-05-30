import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useVoteMutation, useRetractVoteMutation } from '../../../api/pollsApi';
import type { PollSummary } from '../../../types';
import {
  pollOptionColor,
  totalVotes,
  optionPct,
  winnerOptionId,
  displayPollUser,
  formatPollDate,
} from './utils/pollFormatters';

const VoteIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

interface PollCardProps {
  poll: PollSummary;
  mode: 'mine' | 'created';
}

export const PollCard: React.FC<PollCardProps> = ({ poll, mode }) => {
  const navigate = useNavigate();
  const [vote, { isLoading: voting }] = useVoteMutation();
  const [retractVote, { isLoading: retracting }] = useRetractVoteMutation();

  const myParticipation = poll.myParticipation;
  const hasVoted = myParticipation?.done ?? false;
  const myOptionId = myParticipation?.chosenOptionId ?? null;
  const isCreator = mode === 'created';
  const canChangeVote = poll.allowVoteChange;
  const canVote = mode === 'mine' && (!hasVoted || canChangeVote);
  const showStats = hasVoted || isCreator;

  const total = totalVotes(poll.options);
  const winnerId = winnerOptionId(poll.options);

  const submitVote = async (optionId: string) => {
    if (!canVote || voting || optionId === myOptionId) return;
    try {
      await vote({ pollId: poll.id, body: { optionId } }).unwrap();
    } catch {
      // errors surfaced via RTK Query
    }
  };

  const handleVote = (e: React.MouseEvent, optionId: string) => {
    e.stopPropagation();
    void submitVote(optionId);
  };

  const handleVoteKeyDown = (e: React.KeyboardEvent, optionId: string) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    e.stopPropagation();
    void submitVote(optionId);
  };

  const handleRetract = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (retracting) return;
    try {
      await retractVote(poll.id).unwrap();
    } catch {}
  };

  const participationPct =
    poll.participantCount > 0
      ? Math.round((poll.doneCount / poll.participantCount) * 100)
      : 0;

  return (
    <div
      className="poll-card--enhanced"
      onClick={() => navigate(`/polls/${poll.id}`)}
    >
      <div className="poll-card__header">
        <div className="poll-card__question">
          <span className="poll-card__type">Опрос</span>
          <h3 className="poll-card__title">{poll.title}</h3>
        </div>
        <div className="poll-card__participation">
          <span className="poll-card__participation-text">
            {poll.doneCount} / {poll.participantCount} проголосовали · {participationPct}%
          </span>
          <div className="poll-participation-mini-bar">
            <div
              className="poll-participation-mini-bar__fill"
              style={{ '--poll-progress': `${participationPct}%` } as React.CSSProperties}
            />
          </div>
        </div>
      </div>

      {poll.description && (
        <p className="poll-card__description">{poll.description}</p>
      )}

      <div className="poll-card__options">
        {poll.options.map((option, idx) => {
          const color = pollOptionColor(idx);
          const pct = showStats ? optionPct(option, total) : 0;
          const isMyVote = myOptionId === option.id;
          const isWinner = showStats && total > 0 && option.id === winnerId;

          return (
            <div
              key={option.id}
              className={[
                'poll-option--enhanced',
                isMyVote ? 'poll-option--my-vote' : '',
                isWinner ? 'poll-option--winner' : '',
                canVote ? 'poll-option--clickable' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={
                {
                  '--option-color': color,
                  '--poll-progress': `${pct}%`,
                } as React.CSSProperties
              }
              onClick={canVote ? (e) => handleVote(e, option.id) : undefined}
              onKeyDown={canVote ? (e) => handleVoteKeyDown(e, option.id) : undefined}
              role={canVote ? 'button' : undefined}
              tabIndex={canVote ? 0 : undefined}
            >
              <div className="poll-option__top">
                <span className="poll-option__dot" />
                <span className="poll-option__label">{option.value}</span>
                {isMyVote && (
                  <span className="poll-option__my-badge">Мой голос</span>
                )}
                {isWinner && (
                  <span className="poll-option__winner-badge">Лидер</span>
                )}
                {showStats && (
                  <span className="poll-option__pct">
                    {pct.toFixed(0)}%
                  </span>
                )}
              </div>

              {showStats && (
                <div className="poll-option__bar-track">
                  <div className="poll-option__bar-fill" />
                </div>
              )}

              {showStats && (
                <span className="poll-option__votes">{option.chosen} гол.</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="poll-card__footer">
        <span className="poll-card__meta">
          {displayPollUser(poll.creator)} · {formatPollDate(poll.createdAt)}
        </span>
        <div className="poll-card__footer-right" onClick={(e) => e.stopPropagation()}>
          {hasVoted && myOptionId && (
            canChangeVote ? (
              <button
                className="btn btn-secondary btn-sm poll-card__action"
                onClick={handleRetract}
                disabled={retracting}
              >
                <VoteIcon />
                Отозвать голос
              </button>
            ) : (
              <span className="status-badge status-gray">Голос зафиксирован</span>
            )
          )}
          {mode === 'mine' && !hasVoted && (
            <span className="status-badge status-yellow">Ожидает голоса</span>
          )}
          {isCreator && (
            <span className="status-badge status-blue">Создатель</span>
          )}
        </div>
      </div>
    </div>
  );
};
