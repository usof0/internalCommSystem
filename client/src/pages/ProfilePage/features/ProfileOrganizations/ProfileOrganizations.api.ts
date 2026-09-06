export const getOrganizationCardKey = (membershipId: string, positionId?: string | null) =>
  `profile-org-${membershipId}-${positionId || 'no-position'}`;
