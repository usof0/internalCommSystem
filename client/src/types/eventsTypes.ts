// Minimal user shape embedded in event responses
export interface EventUser {
  id: string;
  email: string;
  firstName?: string | null;
  secondName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}

// EventParticipant — composite PK: (userId, eventId)
// confirmed: false = invited/pending, true = attendance confirmed
export interface EventParticipant {
  userId: string;
  eventId: string;
  participantNumber: number; // sequential per event, assigned by server
  confirmed: boolean;
  user: EventUser;
}

// Light shape returned by list endpoints
export interface EventSummary {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  address: string;
  timeStart: string; // ISO datetime
  timeEnd: string;   // ISO datetime
  createdAt: string;
  updatedAt: string;
  creator: EventUser;
  participantCount: number;  // server-computed total
  confirmedCount: number;    // server-computed confirmed attendees
  // Present when the current user is a participant (returned by GET /events/my)
  myParticipation?: EventParticipant | null;
}

// Full shape returned by GET /events/:eventId
export interface Event {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  address: string;
  timeStart: string;
  timeEnd: string;
  createdAt: string;
  updatedAt: string;
  creator: EventUser;
  participants: EventParticipant[];
}

// ── Request types ──────────────────────────────────────────────────────────────

export interface CreateEventRequest {
  title: string;
  description: string;
  address: string;
  timeStart: string; // ISO datetime string
  timeEnd: string;   // ISO datetime string
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  address?: string;
  timeStart?: string;
  timeEnd?: string;
}

export interface InviteParticipantsRequest {
  userIds?: string[];
  orgUnitIds?: string[];
  orgUnitTagIds?: string[];
  includeSubUnits?: boolean;
}

export interface ConfirmAttendanceRequest {
  confirmed: boolean;
}

export interface GetEventsQuery {
  page?: number;
  limit?: number;
  search?: string;
}
