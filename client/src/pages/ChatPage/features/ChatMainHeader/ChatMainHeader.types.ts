export type ChatMainHeaderProps = {
  title: string;
  subtitle?: string;
  avatarUrl?: string | null;
  avatarName?: string;
  showInfoButton: boolean;
  infoPanelOpen: boolean;
  onToggleInfo: () => void;
  onCloseRoom?: () => void;
  closeButtonLabel?: string;
};
