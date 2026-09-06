export type UserActionsSectionProps = {
  isActive: boolean;
  isBlocked: boolean;
  onConfirmAction: (message: string, fn: () => Promise<unknown>) => void;
  onActivate: () => Promise<unknown>;
  onDeactivate: () => Promise<unknown>;
  onBlock: () => Promise<unknown>;
  onUnblock: () => Promise<unknown>;
  onResetPassword: () => Promise<unknown>;
};
