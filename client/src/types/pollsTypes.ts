// Minimal user shape embedded in poll responses
export interface PollUser {
  id: string;
  email: string;
  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

// Poll option — the `chosen` field is a server-maintained vote counter
export interface PollOption {
  id: string;
  pollId: string;
  value: string;  // option text
  chosen: number; // vote count
}

// PollParticipant — composite PK: (userId, pollId)
export interface PollParticipant {
  userId: string;
  pollId: string;
  done: boolean;              // true = has voted
  chosenOptionId?: string | null; // which option they picked (null if not voted)
  user: PollUser;
}

// Light shape for list endpoints (options included for inline stats)
export interface PollSummary {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  allowVoteChange: boolean;
  createdAt: string;
  updatedAt: string;
  creator: PollUser;
  options: PollOption[];
  participantCount: number; // total invited participants
  doneCount: number;        // participants who have voted
  // Present when the current user is a participant (returned by GET /polls/my)
  myParticipation?: PollParticipant | null;
}

// Full shape for GET /polls/:pollId — includes all participants
export interface Poll {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  allowVoteChange: boolean;
  createdAt: string;
  updatedAt: string;
  creator: PollUser;
  options: PollOption[];
  participants: PollParticipant[];
}

// ── Request types ──────────────────────────────────────────────────────────────

export interface CreatePollRequest {
  title: string;
  description?: string;
  options: string[]; // option values (min 2)
  allowVoteChange?: boolean;
}

export interface UpdatePollRequest {
  title?: string;
  description?: string;
  allowVoteChange?: boolean;
}

export interface InvitePollParticipantsRequest {
  userIds?: string[];
  orgUnitIds?: string[];
  orgUnitTagIds?: string[];
  includeSubUnits?: boolean;
}

export interface VoteRequest {
  optionId: string;
}

export interface GetPollsQuery {
  page?: number;
  limit?: number;
  search?: string;
}
