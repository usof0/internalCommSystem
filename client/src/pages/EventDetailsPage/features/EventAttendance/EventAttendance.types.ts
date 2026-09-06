import type { EventParticipant } from '../../../../types';

export type EventAttendanceProps = {
  participation: EventParticipant;
  isPast: boolean;
  isConfirming: boolean;
  onConfirmAttendance: (confirmed: boolean) => void;
};
