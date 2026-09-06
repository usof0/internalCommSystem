import React from 'react';

import { DonutChart } from '../DonutChart';
import type { DonutSegment } from '../DonutChart';
import {
  optionPct,
  pollOptionColor,
} from '../utils/pollFormatters';
import type { PollResultsProps } from './PollResults.types';

const ResultsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M4 19V5" />
    <path d="M4 19h16" />
    <path d="M8 16v-4" />
    <path d="M12 16V8" />
    <path d="M16 16v-7" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="poll-icon">
    <path d="M16 21v-2a4 4 0 0 0-8 0v2" />
    <circle cx="12" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M2 21v-2a4 4 0 0 1 3-3.87" />
  </svg>
);

export const PollResults: React.FC<PollResultsProps> = ({
  poll,
  totalVotes,
  winnerOptionId,
  myOptionId,
  showStats,
  canVote,
  hasAnyVotes,
  onVote,
}) => {
  const donutSegments: DonutSegment[] = poll.options
    .map((option, index) => ({
      id: option.id,
      value: option.chosen,
      color: pollOptionColor(index),
      label: option.value,
    }))
    .filter((segment) => segment.value > 0);

  const participantCount = poll.participants.length;
  const doneCount = poll.participants.filter((participant) => participant.done).length;
  const participationPct = participantCount > 0 ? Math.round((doneCount / participantCount) * 100) : 0;
  const handleVoteKeyDown = (event: React.KeyboardEvent, optionId: string) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onVote(optionId);
  };

  return (
    <div className="poll-details-stats">
      <div className="poll-participation-section">
        <div className="poll-participation-header">
          <h3><UsersIcon />Явка</h3>
          <span className="poll-participation-count">
            {doneCount} / {participantCount} · {participationPct}%
          </span>
        </div>
        <div className="poll-participation-bar-full">
          <div
            className="poll-participation-bar-full__fill"
            style={{ '--poll-progress': `${participationPct}%` } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="poll-donut-section">
        <h3 className="poll-section-title"><ResultsIcon />Результаты</h3>
        <div className="poll-donut-layout">
          <div className="poll-donut-wrap">
            {hasAnyVotes ? (
              <DonutChart
                segments={donutSegments}
                size={200}
                strokeWidth={26}
                centerLabel={String(totalVotes)}
                centerSub="голосов"
              />
            ) : (
              <DonutChart
                segments={[{ id: 'empty', value: 1, color: 'var(--bg-tertiary)', label: '' }]}
                size={200}
                strokeWidth={26}
                centerLabel="0"
                centerSub="голосов"
              />
            )}
          </div>

          <div className="poll-legend">
            {poll.options.map((option, index) => {
              const color = pollOptionColor(index);
              const pct = optionPct(option, totalVotes);
              const isWinner = hasAnyVotes && option.id === winnerOptionId;
              const isMyVote = myOptionId === option.id;

              return (
                <div
                  key={option.id}
                  className={['poll-legend-item', isWinner ? 'poll-legend-item--winner' : ''].filter(Boolean).join(' ')}
                  style={{ '--option-color': color } as React.CSSProperties}
                >
                  <span className="poll-legend-dot" />
                  <span className="poll-legend-label">
                    {option.value}
                    {isMyVote ? (
                      <span className="poll-option__my-badge">
                        Мой
                      </span>
                    ) : null}
                    {isWinner ? (
                      <span className="poll-option__winner-badge">
                        Лидер
                      </span>
                    ) : null}
                  </span>
                  {showStats ? (
                    <>
                      <span className="poll-legend-votes">{option.chosen}</span>
                      <span className="poll-legend-pct">{pct.toFixed(0)}%</span>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="poll-options-breakdown">
        <h3 className="poll-section-title">Варианты ответа</h3>
        <div className="poll-options-list">
          {poll.options.map((option, index) => {
            const color = pollOptionColor(index);
            const pct = optionPct(option, totalVotes);
            const isWinner = hasAnyVotes && option.id === winnerOptionId;
            const isMyVote = myOptionId === option.id;

            return (
              <div
                key={option.id}
                className={[
                  'poll-option-row',
                  isWinner ? 'poll-option-row--winner' : '',
                  canVote ? 'poll-option-row--clickable' : '',
                  isMyVote ? 'poll-option-row--my-vote' : '',
                ].filter(Boolean).join(' ')}
                style={
                  {
                    '--option-color': color,
                    '--poll-progress': `${pct}%`,
                  } as React.CSSProperties
                }
                onClick={canVote ? () => onVote(option.id) : undefined}
                onKeyDown={canVote ? (event) => handleVoteKeyDown(event, option.id) : undefined}
                role={canVote ? 'button' : undefined}
                tabIndex={canVote ? 0 : undefined}
              >
                <div className="poll-option-row__header">
                  <div className="poll-option-row__main">
                    <span className="poll-option__dot" />
                    <span className="poll-option-row__label">{option.value}</span>
                    {isMyVote ? <span className="poll-option__my-badge">Мой голос</span> : null}
                    {isWinner ? <span className="poll-option__winner-badge">Лидер</span> : null}
                  </div>
                  {showStats ? (
                    <div className="poll-option-row__stats">
                      <span className="poll-option-row__votes">{option.chosen} гол.</span>
                      <span className="poll-option-row__pct">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  ) : null}
                </div>
                {showStats ? (
                  <div className="poll-option__bar-track">
                    <div className="poll-option__bar-fill" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
